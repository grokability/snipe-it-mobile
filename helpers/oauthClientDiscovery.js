import { reportLoginFailure, reportLoginProblem, addLoginBreadcrumb } from '@/helpers/loginTelemetry';
import { describeDomain } from '@/helpers/domainShape';

const DISCOVERY_TIMEOUT_MS = 5000;

export async function discoverOAuthClient(domain) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);
    const startedAt = Date.now();

    addLoginBreadcrumb('Probing /api/v1/client', describeDomain(domain));

    let response;
    try {
        response = await fetch(`${domain}/api/v1/client`, {
            signal: controller.signal,
        });
    } catch (error) {
        reportLoginFailure({
            stage: 'oauth-discovery',
            error,
            domain,
            extra: {
                timeout_ms: DISCOVERY_TIMEOUT_MS,
                elapsed_ms: Date.now() - startedAt,
            },
        });
        throw new Error('network');
    } finally {
        clearTimeout(timeoutId);
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
