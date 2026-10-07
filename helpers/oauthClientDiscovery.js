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

// isCurrent reports whether the form still wants this result. A superseded check stops retrying
// and returns quietly, since the form discards it anyway. Aborting `signal` is the user's Cancel,
// which also returns quietly: it is not a failure, so nothing reaches Sentry.
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
                if (!isCurrent()) return null;
            }
        }
    } catch (error) {
        if (abortReason === 'user-cancel') {
            addLoginBreadcrumb('Probe cancelled by the user', { elapsed_ms: Date.now() - startedAt });
            return null;
        }
        reportLoginFailure({
            stage: 'oauth-discovery',
            error,
            domain,
            extra: {
                timeout_ms: DISCOVERY_TIMEOUT_MS,
                elapsed_ms: Date.now() - startedAt,
                attempts,
                abort_reason: abortReason,
            },
        });
        throw new Error('network');
    } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', cancelByUser);
    }

    addLoginBreadcrumb('Probe answered', {
        status: response.status,
        elapsed_ms: Date.now() - startedAt,
    });

    // A 404 is the expected answer from an instance predating the mobile client endpoint, and
    // the caller falls through to token entry. Anything else non-2xx is a server-side problem
    // the user cannot act on, so it is worth seeing.
    if (!response.ok && response.status !== 404) {
        reportLoginProblem({
            stage: 'oauth-discovery',
            message: `OAuth client discovery returned HTTP ${response.status}`,
            domain,
            reason: `http-${response.status}`,
            extra: { elapsed_ms: Date.now() - startedAt },
        });
    }

    if (response.status === 404) return null;
    if (!response.ok) return null;

    try {
        const data = await response.json();
        if (!data?.client_id) {
            reportLoginProblem({
                stage: 'oauth-discovery',
                message: 'OAuth client discovery returned a body without client_id',
                domain,
                reason: 'missing-client-id',
            });
            return null;
        }
        return { clientId: String(data.client_id) };
    } catch (error) {
        // A reverse proxy or captive portal answering with HTML rather than JSON lands here.
        reportLoginFailure({
            stage: 'oauth-discovery',
            error,
            domain,
            level: 'warning',
            extra: { reason_detail: 'response body was not JSON' },
        });
        return null;
    }
}
