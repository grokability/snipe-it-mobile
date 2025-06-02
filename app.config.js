module.exports = ({ config }) => {
    return {
        extra: {
            ...config.extra,
            eas: {
                projectId: process.env.EXPO_PROJECT_ID
            }
        },
        ...config
    };
};
