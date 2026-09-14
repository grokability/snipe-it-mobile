import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

// The DSN is embedded in the client bundle by design and is not a secret. The upload
// auth token is, and it never appears here — it lives in EAS/GitHub secrets.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
    if (!dsn) {
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
    });

    // Which JS bundle produced an event. Source maps for OTA updates are matched by debug
    // ID rather than by release, so these tags are how an event gets tied back to an update.
    Sentry.setTag('expo-update-id', Updates.updateId);
    Sentry.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));
    Sentry.setTag('expo-runtime-version', Updates.runtimeVersion);
}
