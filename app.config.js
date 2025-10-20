module.exports = ({ config }) => {
    return {
        extra: {
            ...config.extra,
            eas: {
                projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID
            }
        },
        ...config
    };
};
