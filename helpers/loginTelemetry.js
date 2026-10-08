import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { addressGroup, describeDomain, parseHost } from '@/helpers/domainShape';
import { stripKnownHost } from '@/helpers/sentryScrub';

// Every login failure is reported through here so the tags are consistent across the OAuth
// discovery probe, the OAuth token exchange and bearer-token login. Filtering Sentry by
// login_stage and failure_reason is the point — see discussions #165 and #166, where we had
// no way to tell a TLS rejection from a timeout from a blocked cleartext request.

// failure_reason is always a code from a fixed list, never the error's own text. The native
// message is localized, so one failure became one issue per device language (SNIPE-IT-MOBILE-E
// and -P are the same DNS failure, one of them in Chinese), and it can name the host. It still
// reaches Sentry on the exception value, which scrubEvent scrubs. The codes:
// - discovery (oauthClientDiscovery.js): timeout, invalid-response, host-not-found, tls,
//   certificate-untrusted and transport on Android, transport-security on iOS;
//   captureLoginMessage adds http-<status> and missing-client-id.
// - bearer login and the token exchange (axiosFailureCode below): an RFC 6749 token error,
//   http-<status>, network or unexpected.

// The token endpoint error codes from RFC 6749 §5.2. A response's `error` field becomes the code
// only when it is one of these, so a proxy's own JSON cannot put arbitrary text into a tag.
const OAUTH_TOKEN_ERRORS = new Set([
    'invalid_request',
    'invalid_client',
    'invalid_grant',
    'unauthorized_client',
    'unsupported_grant_type',
    'invalid_scope',
]);

// A fixed code for a login request that went through axios: bearer login and the OAuth token
// exchange. axios runs on React Native's XMLHttpRequest, which reports every transport failure as
// ERR_NETWORK "Network Error" with no native detail, so `network` is as fine as it gets.
// `unexpected` is an error thrown by the app's own code after the request succeeded.
export function axiosFailureCode(error) {
    if (!error?.isAxiosError) return 'unexpected';
    if (!error.response) return 'network';
    const oauthError = error.response.data?.error;
    if (OAUTH_TOKEN_ERRORS.has(oauthError)) return oauthError;
    return `http-${error.response.status}`;
}

function tagsFor(stage, error, shape, code) {
    return {
        login_stage: stage,
        failure_reason: code,
        http_status: String(error?.response?.status ?? 'none'),
        domain_scheme: shape.scheme,
        domain_host_type: shape.host_type,
        domain_address_range: shape.address_range,
    };
}

// Sentry groups a login failure into an issue by its stage, its code and the platform, not by its
// message and stack. The message is localized, and every fetch rejection carries the same stack,
// from where expo/fetch builds the error, so the default grouping split one failure across device
// languages and merged unrelated ones into one issue (SNIPE-IT-MOBILE-M). The platform keeps iOS's broad transport-security code, which holds
// DNS, TLS and a declined local network prompt together, apart from Android's narrower codes.
function fingerprintFor(stage, code) {
    return ['login-failure', stage, code, Platform.OS];
}

// The generic scrub in beforeSend cannot recognise a hostname in free text, so each report
// carries the one host it is about. The processor lives on a scope forked for this capture
// alone: two failures for different instances in flight together each scrub only their own
// host, and the raw host is never stored anywhere the event can reach. Sentry runs scope
// processors after its integrations, so what those add is covered too.
function captureForDomain(domain, capture) {
    const host = parseHost(domain);
    Sentry.withScope((scope) => {
        scope.addEventProcessor((event) => stripKnownHost(event, host));
        capture();
    });
}

export function captureLoginException({ stage, error, domain, code, level = 'error', extra = {} }) {
    const shape = describeDomain(domain);
    captureForDomain(domain, () => Sentry.captureException(error, {
        level,
        fingerprint: fingerprintFor(stage, code),
        tags: tagsFor(stage, error, shape, code),
        contexts: { domain_shape: shape },
        extra: {
            error_name: error?.name ?? null,
            // expo-modules-core's CodedError and axios both put a machine-readable code here.
            // Sentry's exception carries only the error's name, message and stack, so fields
            // like this one reach the event only by being copied here explicitly.
            error_code: error?.code ?? null,
            response_status: error?.response?.status ?? null,
            address_group: addressGroup(shape),
            ...extra,
        },
    }));
}

export function captureLoginMessage({ stage, message, domain, reason, level = 'warning', extra = {} }) {
    const shape = describeDomain(domain);
    captureForDomain(domain, () => Sentry.captureMessage(message, {
        level,
        fingerprint: fingerprintFor(stage, reason),
        tags: {
            login_stage: stage,
            failure_reason: reason,
            domain_scheme: shape.scheme,
            domain_host_type: shape.host_type,
            domain_address_range: shape.address_range,
        },
        contexts: { domain_shape: shape },
        extra,
    }));
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
