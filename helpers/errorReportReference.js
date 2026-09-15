import * as SecureStore from 'expo-secure-store';

// The reference a user quotes when they open a GitHub discussion or issue.
//
// Recorded only when a report is actually sent, and persisted, so it always points at
// something that exists in Sentry. Reading a live value off the current scope instead would
// hand out a reference belonging to whatever session happens to be running — which, once the
// app has been relaunched, is not the session the problem happened in.

const STORAGE_KEY = 'last_error_report_reference';

export function recordErrorReportReference(event) {
    const eventId = event?.event_id;
    if (!eventId) return;

    try {
        SecureStore.setItem(STORAGE_KEY, JSON.stringify({
            eventId,
            // Not shown to the user, who only needs one string to quote. It is kept so a
            // support conversation can pivot from the single error they cited to everything
            // else reported in the same app run.
            traceId: event.contexts?.trace?.trace_id ?? null,
            sentAt: new Date().toISOString(),
        }));
    } catch {
        // Losing the reference is not worth failing a send over.
    }
}

export function getErrorReportReference() {
    try {
        const stored = SecureStore.getItem(STORAGE_KEY);
        if (!stored) return null;
        const reference = JSON.parse(stored);
        return reference?.eventId ? reference : null;
    } catch {
        return null;
    }
}

// Turning reporting off retracts the reference along with it. Leaving it on screen would point
// at an event the user can no longer add anything to.
export function clearErrorReportReference() {
    return SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
}
