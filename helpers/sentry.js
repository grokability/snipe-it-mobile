import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { scrubEvent, scrubBreadcrumb } from '@/helpers/sentryScrub';
import {
    ErrorReportingConsent,
    getErrorReportingConsent,
    setErrorReportingConsent,
} from '@/helpers/errorReportingConsent';
import { queueErrorReport, discardPendingReports } from '@/helpers/pendingErrorReports';
import { recordErrorReportReference, clearErrorReportReference } from '@/helpers/errorReportReference';

// The DSN is embedded in the client bundle by design and is not a secret. The upload
// auth token is, and it never appears here — it lives in EAS/GitHub secrets.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Sentry.close() leaves the closed client on the scope, so getClient() cannot answer whether
// the SDK is currently running. Track it here instead.
let isRunning = false;

// Everything the SDK wants to send passes through here, after scrubEvent has stripped it.
//
// ASK hands the scrubbed event to the pending queue and drops it from this pipeline. The
// prompt re-sends an approved report with client.sendEvent(), which skips beforeSend, so an
// approved report does not arrive back here and get queued a second time.
//
// NEVER cannot reach a live client at launch, because init is skipped outright. It is still
// handled: Settings can switch to NEVER while events are in flight and the client is closing.
function gateEvent(event, hint) {
    const scrubbed = scrubEvent(event);
    if (!scrubbed) return null;

    switch (getErrorReportingConsent()) {
        case ErrorReportingConsent.ALWAYS:
            recordErrorReportReference(scrubbed);
            return scrubbed;
        case ErrorReportingConsent.ASK:
            queueErrorReport(scrubbed, hint);
            return null;
        default:
            return null;
    }
}

export function initSentry() {
    if (!dsn || isRunning) {
        return;
    }

    // NEVER skips init outright rather than setting enabled: false. Sentry's guidance is that
    // enabled: false "doesn't prevent all overhead from Sentry instrumentation", and skipping
    // init also leaves the native SDK uninitialized — which matters, because native crashes
    // never pass through beforeSend and could not otherwise be held back.
    if (getErrorReportingConsent() === ErrorReportingConsent.NEVER) {
        return;
    }

    Sentry.init({
        dsn,
        enabled: !__DEV__ || process.env.EXPO_PUBLIC_SENTRY_DEBUG === 'true',
        environment: Updates.channel || (__DEV__ ? 'development' : 'unknown'),
        sendDefaultPii: false,
        // Tracing and session replay bill as separate quota dimensions and neither helps
        // with the login failures this was added for. Enable them deliberately, not by default.
        tracesSampleRate: 0,
        // Sentry's exception carries only an error's name, message and stack. A native
        // rejection arrives with more: expo-modules-core's CodedError has a `code`, an axios
        // failure has `config` and `response`, and that is usually where the specific cause
        // is. ExtraErrorData copies those properties onto the event, with the `cause` chain,
        // so a login failure does not have to be inferred from its message alone.
        //
        // It captures whatever the error happens to hold, which for an axios failure includes
        // the request that produced it. gateEvent runs scrubEvent over event.contexts after
        // this, so the host and every credential-bearing key are stripped before the event
        // leaves the device.
        integrations: (defaultIntegrations) => [
            ...defaultIntegrations,
            Sentry.extraErrorDataIntegration(),
        ],
        beforeSend: gateEvent,
        beforeBreadcrumb: scrubBreadcrumb,
    });

    isRunning = true;

    // Which JS bundle produced an event. Source maps for OTA updates are matched by debug
    // ID rather than by release, so these tags are how an event gets tied back to an update.
    //
    // updateId and runtimeVersion are both nullable — there is no update id when running the
    // embedded bundle or a Metro dev build. A null reaches Sentry as the literal <invalid>
    // rather than being dropped, so it is coerced to a value that can actually be filtered on.
    Sentry.setTag('expo-update-id', Updates.updateId ?? 'none');
    Sentry.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));
    Sentry.setTag('expo-runtime-version', Updates.runtimeVersion ?? 'none');
}

// Sends a report the user approved. The event has already been through beforeSend, so it goes
// straight to envelope creation and the transport. captureEvent would run the whole pipeline
// a second time and gateEvent would queue it again instead of sending it.
//
// Returns the reference recorded for this report, so a caller can offer the user something to
// do with it while they are still looking at the prompt.
export function sendErrorReport({ event, hint }) {
    Sentry.getClient()?.sendEvent(event, hint);
    return recordErrorReportReference(event);
}

export async function applyErrorReportingConsent(consent) {
    setErrorReportingConsent(consent);

    if (consent === ErrorReportingConsent.NEVER) {
        discardPendingReports();
        await clearErrorReportReference();
        if (isRunning) {
            isRunning = false;
            await Sentry.close();
        }
        return;
    }

    // A no-op unless the app launched under NEVER and nothing is running yet. Breadcrumbs from
    // earlier in the session are gone in that case, which is the cost of not having
    // initialized the SDK at all.
    initSentry();
}
