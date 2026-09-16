// Sentry's wrapper around Expo's default Metro config. It adds the debug-ID plugin
// that lets uploaded source maps be matched back to a bundle, so it has to replace
// getDefaultConfig rather than sit alongside it.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
