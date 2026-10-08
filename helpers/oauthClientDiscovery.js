import { Platform } from 'react-native';
import { reportLoginFailure, reportLoginProblem, addLoginBreadcrumb } from '@/helpers/loginTelemetry';
import { addressGroup, describeDomain } from '@/helpers/domainShape';

const DISCOVERY_TIMEOUT_MS = 15000;

// While iOS's local network prompt is still open, it rejects the connection it asked about
// (47 ms after Continue on an iPhone running iOS 27), with the same localized "offline" text it
// uses after the user declines. Apple's TN3179 recommends retrying until the user answers.
const LOCAL_NETWORK_RETRY_INTERVAL_MS = 1000;

// iOS asks before connecting to an address on the phone's own subnet or a .local name. The
// `local` group is wider, since it includes private addresses reached through a router, which
// need no permission; for those a retry only delays a genuine failure. Nothing tells the app
// which subnet the phone is on, or whether the user declined.
export function mayNeedLocalNetworkPermission(domain) {
    return Platform.OS === 'ios' && addressGroup(describeDomain(domain)) === 'local';
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// On Android, expo/fetch rejects with the OkHttp exception's toString(), so the message starts
// with its Java class name: "fetch failed: java.net.UnknownHostException: Unable to resolve…".
// Class names are not localized.
const LEADING_JAVA_CLASS = /^fetch failed: ([\w.$]+)/;

// Android's fixed text for a certificate that chains to no trusted CA (self-signed, or issued by a
// CA the device does not have). An expired certificate reads "Unacceptable certificate" instead,
// and installing a CA would not fix it.
const UNTRUSTED_CERTIFICATE = 'java.security.cert.CertPathValidatorException: Trust anchor for certification path not found';

// iOS gives no structured distinction at all: every rejection is the same error type carrying
// only the localized NSURLError text, so DNS, TLS and a declined local network prompt share one
// code there.
function transportFailureCode(error) {
    if (Platform.OS !== 'android') return 'transport-security';

    const message = String(error?.message ?? '');
    const javaClass = message.match(LEADING_JAVA_CLASS)?.[1];
    if (javaClass === 'java.net.UnknownHostException') return 'host-not-found';
    if (javaClass?.startsWith('javax.net.ssl.')) {
        return message.includes(UNTRUSTED_CERTIFICATE) ? 'certificate-untrusted' : 'tls';
    }
    return 'transport';
}

// Resolves to one of:
// - { outcome: 'oauth', clientId }
// - { outcome: 'no-oauth' }: no mobile OAuth client, so the form falls through to token entry.
// - { outcome: 'superseded' }: isCurrent() turned false while retrying; the form discards it.
// - { outcome: 'failure', code }: code is http-<status>, invalid-response, timeout, cancel, or for
//   a rejected request host-not-found, tls, certificate-untrusted or transport on Android and
//   transport-security on iOS. Aborting `signal` is the user's Cancel, which yields `cancel` without reporting
//   anything to Sentry, since the instance did nothing wrong.
export async function discoverOAuthClient(domain, { isCurrent = () => true, signal } = {}) {
    const controller = new AbortController();
    // The app's own record of why it aborted. The rejection itself reads differently per platform
    // and language ("Fetch request has been canceled" on Android), and does not say who aborted.
    let abortReason = null;
    const abortWith = (reason) => {
        if (!abortReason) abortReason = reason;
        controller.abort();
    };
    const cancelByUser = () => abortWith('user-cancel');
    const timeoutId = setTimeout(() => abortWith('timeout'), DISCOVERY_TIMEOUT_MS);
    signal?.addEventListener('abort', cancelByUser);
    const startedAt = Date.now();
    const retriesWhileAsking = mayNeedLocalNetworkPermission(domain);
    let attempts = 0;

    addLoginBreadcrumb('Probing /api/v1/client', describeDomain(domain));

    let response;
    try {
        while (!response) {
            attempts++;
            try {
                response = await fetch(`${domain}/api/v1/client`, {
                    // Without it, an instance that predates the endpoint redirects to its login
                    // page, and fetch follows that to a 200 HTML body. See the 401 check below.
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
            } catch (error) {
                // A rejected fetch never had a response, so this reads only structured signals: the
                // platform, the target group and the app's own timeout, never the error text.
                const hasTimeForRetry = Date.now() + LOCAL_NETWORK_RETRY_INTERVAL_MS < startedAt + DISCOVERY_TIMEOUT_MS;
                if (!retriesWhileAsking || controller.signal.aborted || !hasTimeForRetry) throw error;

                addLoginBreadcrumb('Retrying probe while the local network prompt may be open', {
                    attempt: attempts,
                    elapsed_ms: Date.now() - startedAt,
                });
                await wait(LOCAL_NETWORK_RETRY_INTERVAL_MS);
                if (!isCurrent()) return { outcome: 'superseded' };
            }
        }
    } catch (error) {
        if (abortReason === 'user-cancel') {
            addLoginBreadcrumb('Probe cancelled by the user', { elapsed_ms: Date.now() - startedAt });
            return { outcome: 'failure', code: 'cancel' };
        }
        const code = abortReason === 'timeout' ? 'timeout' : transportFailureCode(error);
        reportLoginFailure({
            stage: 'oauth-discovery',
            error,
            domain,
            code,
            extra: {
                timeout_ms: DISCOVERY_TIMEOUT_MS,
                elapsed_ms: Date.now() - startedAt,
                attempts,
                abort_reason: abortReason,
            },
        });
        return { outcome: 'failure', code };
    } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', cancelByUser);
    }

    addLoginBreadcrumb('Probe answered', {
        status: response.status,
        elapsed_ms: Date.now() - startedAt,
    });

    // An instance older than Snipe-IT v8.5.0 has no /api/v1/client. The request falls to the API's
    // catch-all route, which sits behind auth:api, so it answers 401 rather than 404. Either way
    // the caller falls through to token entry.
    if (response.status === 401 || response.status === 404) return { outcome: 'no-oauth' };

    // Anything else non-2xx is a server-side problem, and token entry against the same server
    // would fail too.
    if (!response.ok) {
        const code = `http-${response.status}`;
        reportLoginProblem({
            stage: 'oauth-discovery',
            message: `OAuth client discovery returned HTTP ${response.status}`,
            domain,
            reason: code,
            extra: { elapsed_ms: Date.now() - startedAt },
        });
        return { outcome: 'failure', code };
    }

    try {
        const data = await response.json();
        if (!data?.client_id) {
            reportLoginProblem({
                stage: 'oauth-discovery',
                message: 'OAuth client discovery returned a body without client_id',
                domain,
                reason: 'missing-client-id',
            });
            return { outcome: 'no-oauth' };
        }
        return { outcome: 'oauth', clientId: String(data.client_id) };
    } catch (error) {
        // A 2xx that is not JSON: a wrong URL whose host answers every path with a page, or a
        // reverse proxy or captive portal. Token entry would send the token to the same place.
        reportLoginFailure({
            stage: 'oauth-discovery',
            error,
            domain,
            code: 'invalid-response',
            level: 'warning',
            extra: { reason_detail: 'response body was not JSON' },
        });
        return { outcome: 'failure', code: 'invalid-response' };
    }
}
