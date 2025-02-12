module.exports = ({ config }) => {
    return {
        ...config,
        extra: {
            ...config.extra,
            eas: {
                projectId: process.env.EXPO_PROJECT_ID
            }
        }
    };
};
