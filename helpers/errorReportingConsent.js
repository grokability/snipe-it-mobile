import * as SecureStore from 'expo-secure-store';

// Whether the user has agreed to error reports leaving the device, and on what terms.
//
// Three states rather than a boolean, because "share everything" and "share nothing" do not
// cover the case Spencer asked for: approving each error as it happens. ASK is also what an
// unset value resolves to, so the first error a new install hits doubles as the moment the
// feature introduces itself.
export const ErrorReportingConsent = {
    ALWAYS: 'always',
    ASK: 'ask',
    NEVER: 'never',
};

const STORAGE_KEY = 'error_reporting_consent';
const VALID = new Set(Object.values(ErrorReportingConsent));

// Read synchronously. initSentry() runs at module scope before any provider mounts and decides
// from this value whether to call Sentry.init() at all, so the answer has to be available
// without awaiting. SecureStore is the only synchronous store in the app; AsyncStorage would
// put the decision behind a promise and lose every error thrown while it settled.
export function getErrorReportingConsent() {
    try {
        const stored = SecureStore.getItem(STORAGE_KEY);
        return VALID.has(stored) ? stored : ErrorReportingConsent.ASK;
    } catch {
        // A keychain read can fail while the device is still locked after a reboot. Failing to
        // ASK sends nothing without a prompt, which is the safe direction to fail in.
        return ErrorReportingConsent.ASK;
    }
}

export function setErrorReportingConsent(consent) {
    if (!VALID.has(consent)) {
        throw new Error(`Unknown error reporting consent: ${consent}`);
    }
    SecureStore.setItem(STORAGE_KEY, consent);
}
