// Error reports that beforeSend held back because consent is ASK.
//
// Sentry has already run each event through its full processing pipeline and through
// scrubEvent by the time it lands here, so what is queued is what would have been sent, byte
// for byte. That is what lets the prompt show the user the actual payload rather than a
// description of it.

const pending = [];
const settled = new Set();
const listeners = new Set();

// Identifies an error by its shape rather than its text, so a login that fails the same way
// on every retry asks once instead of once per attempt. The tags come from loginTelemetry,
// which is where the useful distinctions live — a TLS rejection and a timeout are both
// "Network request failed" until failure_reason separates them.
function fingerprintOf(event) {
    const exception = event.exception?.values?.[0];
    return [
        event.level ?? 'error',
        exception?.type ?? '',
        exception?.value ?? event.message ?? '',
        event.tags?.login_stage ?? '',
        event.tags?.failure_reason ?? '',
    ].join('|');
}

function notify() {
    for (const listener of listeners) listener();
}

// Returns whether the report was queued. A signature the user has already answered for this
// session is dropped rather than queued again.
export function queueErrorReport(event, hint) {
    const fingerprint = fingerprintOf(event);
    if (settled.has(fingerprint)) return false;
    if (pending.some((entry) => entry.fingerprint === fingerprint)) return false;

    pending.push({ event, hint, fingerprint });
    notify();
    return true;
}

// One prompt at a time. Returning the head entry rather than the array keeps the reference
// stable between notifications, which is what useSyncExternalStore needs to avoid re-rendering
// on every unrelated change.
export function getNextPendingReport() {
    return pending[0] ?? null;
}

export function subscribeToPendingReports(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Answering settles the signature for the rest of the session either way. Declining and then
// being asked again on the next retry would defeat the point, and a recurrence of an error the
// user already shared is the same error — sending it again without asking would be a send they
// did not agree to.
//
// Deliberately not persisted. "Not now" is a lighter commitment than silencing an error
// forever; Settings is where that heavier choice belongs.
export function resolvePendingReport(fingerprint) {
    settled.add(fingerprint);
    const index = pending.findIndex((entry) => entry.fingerprint === fingerprint);
    if (index !== -1) pending.splice(index, 1);
    notify();
}

// Used when the user chooses "Always share" from the prompt, so the reports that accumulated
// while they were deciding are covered by the choice they just made.
export function takeAllPendingReports() {
    const taken = pending.splice(0, pending.length);
    for (const entry of taken) settled.add(entry.fingerprint);
    notify();
    return taken;
}

export function discardPendingReports() {
    pending.splice(0, pending.length);
    notify();
}
