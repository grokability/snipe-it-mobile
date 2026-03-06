module.exports = ({ config }) => {
    return {
        ...config,
        extra: {
            ...config.extra,
            eas: {
                projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || config.extra?.eas?.projectId
            }
        }
    };
};
