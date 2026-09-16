import * as SecureStore from 'expo-secure-store';

// The reference a user quotes when they open a GitHub discussion or issue.
//
// Recorded only when a report is actually sent, and persisted, so it always points at
// something that exists in Sentry. Reading a live value off the current scope instead would
// hand out a reference belonging to whatever session happens to be running — which, once the
// app has been relaunched, is not the session the problem happened in.

const STORAGE_KEY = 'last_error_report_reference';

// Returns the reference it recorded, or null when there was nothing to record or the write
// failed. Callers that want to show the user what was just sent need the id from here rather
// than from getErrorReportReference(): on a no-op the stored value is the *previous* report's,
// and handing that back would show a reference belonging to a different error.
export function recordErrorReportReference(event) {
    const eventId = event?.event_id;
    if (!eventId) return null;

    try {
        SecureStore.setItem(STORAGE_KEY, JSON.stringify({
            eventId,
            // Not shown to the user, who only needs one string to quote. It is kept so a
            // support conversation can pivot from the single error they cited to everything
            // else reported in the same app run.
            traceId: event.contexts?.trace?.trace_id ?? null,
            sentAt: new Date().toISOString(),
        }));
        return eventId;
    } catch {
        // Losing the reference is not worth failing a send over.
        return null;
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
