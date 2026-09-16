import * as Sentry from '@sentry/react-native';
import { describeDomain, isLikelyCleartextBlocked } from '@/helpers/domainShape';

// Every login failure is reported through here so the tags are consistent across the OAuth
// discovery probe, the OAuth token exchange and bearer-token login. Filtering Sentry by
// login_stage and failure_reason is the point — see discussions #165 and #166, where we had
// no way to tell a TLS rejection from a timeout from a blocked cleartext request.

function classifyFailure(error) {
    if (error?.name === 'AbortError') return 'timeout';
    if (error?.response?.status) return `http-${error.response.status}`;

    switch (error?.code) {
        case 'ECONNABORTED':
            return 'timeout';
        case 'ERR_NETWORK':
            return 'transport-failure';
        case 'ERR_BAD_REQUEST':
            return 'bad-request';
        case 'ERR_BAD_RESPONSE':
            return 'bad-response';
        default:
            break;
    }

    // React Native's fetch collapses TLS rejections, refused connections, DNS misses and App
    // Transport Security blocks into one indistinguishable message. The domain shape sent
    // alongside is what separates them.
    if (/Network request failed/i.test(String(error?.message ?? ''))) return 'transport-failure';
    return 'unknown';
}

function tagsFor(stage, error, shape) {
    return {
        login_stage: stage,
        failure_reason: classifyFailure(error),
        http_status: String(error?.response?.status ?? 'none'),
        domain_scheme: shape.scheme,
        domain_host_type: shape.host_type,
        domain_address_range: shape.address_range,
    };
}

export function reportLoginFailure({ stage, error, domain, level = 'error', extra = {} }) {
    const shape = describeDomain(domain);
    Sentry.captureException(error, {
        level,
        tags: tagsFor(stage, error, shape),
        contexts: { domain_shape: shape },
        extra: {
            axios_code: error?.code ?? null,
            response_status: error?.response?.status ?? null,
            likely_cleartext_blocked: isLikelyCleartextBlocked(shape),
            ...extra,
        },
    });
}

export function reportLoginProblem({ stage, message, domain, reason, level = 'warning', extra = {} }) {
    const shape = describeDomain(domain);
    Sentry.captureMessage(message, {
        level,
        tags: {
            login_stage: stage,
            failure_reason: reason,
            domain_scheme: shape.scheme,
            domain_host_type: shape.host_type,
            domain_address_range: shape.address_range,
        },
        contexts: { domain_shape: shape },
        extra,
    });
}

// Breadcrumbs give the sequence leading to a failure: which domain shape was entered, which
// branch the form took, how long the probe ran. They ride along with whatever is captured next.
export function addLoginBreadcrumb(message, data = {}) {
    Sentry.addBreadcrumb({
        category: 'login',
        level: 'info',
        message,
        data,
    });
}
