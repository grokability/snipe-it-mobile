// Sentry's organization and project are not secrets, but they are account-specific, so they
// come from the environment rather than being committed. SENTRY_AUTH_TOKEN is read directly
// by sentry-cli during upload and deliberately never appears here — and it must never carry
// the EXPO_PUBLIC_ prefix, which would inline it into the client bundle.
//
// Set SENTRY_ORG and SENTRY_PROJECT in BOTH .env and the EAS environment, with identical
// values. The resolved config feeds the fingerprint runtime version, so a build that sees
// them and an `eas update` that does not would produce different runtime versions, and the
// update would silently never apply.
const SENTRY_PLUGIN = '@sentry/react-native/expo';

module.exports = ({ config }) => {
    const organization = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;
    const hasSentryConfig = Boolean(organization && project);

    if (!hasSentryConfig) {
        console.warn(
            `[sentry] SENTRY_ORG and SENTRY_PROJECT are unset, so ${SENTRY_PLUGIN} is not applied. ` +
            'Source maps will not upload and native crash reporting will not be configured.'
        );
    }

    return {
        ...config,
        plugins: [
            ...(config.plugins ?? []),
            ...(hasSentryConfig ? [[SENTRY_PLUGIN, { organization, project }]] : []),
        ],
        extra: {
            ...config.extra,
            eas: {
                projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || config.extra?.eas?.projectId
            }
        }
    };
};
