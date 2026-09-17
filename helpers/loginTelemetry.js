import * as Sentry from '@sentry/react-native';
import { describeDomain, isLikelyCleartextBlocked } from '@/helpers/domainShape';

// Every login failure is reported through here so the tags are consistent across the OAuth
// discovery probe, the OAuth token exchange and bearer-token login. Filtering Sentry by
// login_stage and failure_reason is the point — see discussions #165 and #166, where we had
// no way to tell a TLS rejection from a timeout from a blocked cleartext request.

// Sentry's maximum length for a tag value.
const MAX_TAG_LENGTH = 200;

// Wrapper text every expo/fetch rejection carries, and the Expo source location appended to a
// native one. Neither describes the failure, and the location moves between Expo versions,
// which would split a single failure across several tag values. The message reaches Sentry
// untouched on the exception itself either way.
const FETCH_WRAPPER_PREFIX = /^fetch failed:\s*/i;
const NATIVE_SOURCE_SUFFIX = /\s*\(at [^()]+:\d+\)$/;

// The tag is the error's own words — "A TLS error caused the secure connection to fail" —
// rather than a bucket picked from a list.
//
// Global fetch is expo/fetch, not React Native's (expo/src/winter/runtime.native.ts installs
// it unless EXPO_PUBLIC_USE_RN_FETCH is set). It passes the CFNetwork or OkHttp text through
// verbatim instead of collapsing everything into "Network request failed", so a specific
// reason is already there to read. Enumerating the ones we had seen only meant every reason we
// had not — which is most of them, across two platforms and every OS release — arrived as
// `unknown`.
function describeFailure(error) {
    const raw = typeof error === 'string' ? error : error?.message;

    const message = String(raw ?? '')
        .replace(FETCH_WRAPPER_PREFIX, '')
        .replace(NATIVE_SOURCE_SUFFIX, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!message) return error?.name || 'non-error thrown';
    return message.slice(0, MAX_TAG_LENGTH);
}

function tagsFor(stage, error, shape) {
    return {
        login_stage: stage,
        failure_reason: describeFailure(error),
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
            error_name: error?.name ?? null,
            // expo-modules-core's CodedError and axios both put a machine-readable code here.
            // ExtraErrorData copies it onto the event too, but under the error's own `code`
            // key, which the scrub redacts — it cannot tell an error code from the OAuth
            // authorization code of the same name. Under this key it survives.
            error_code: error?.code ?? null,
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
