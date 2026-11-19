import axios from 'axios';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PermissionManager } from '@/permissions/PermissionManager';
import { PERMISSION_LABELS } from '@/permissions/PermissionKeys';
import { PermissionDeniedError } from '@/helpers/errors';
import i18n from '@/i18n';

// Create instances without baseURL initially
const apiInstance = axios.create({
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

const authInstance = axios.create({
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

// AuthProvider registers its logout here. The root stack guards /login while signed in, so
// navigating there on a 401 is refused; clearing the session lets the guard redirect instead.
let sessionExpiredHandler = null;

export const setSessionExpiredHandler = (handler) => {
    sessionExpiredHandler = handler;
};

const expireSession = () => {
    sessionExpiredHandler?.();
};

const SERVER_ERROR_ALERT_INTERVAL_MS = 30_000;
let lastServerErrorAlertAt = 0;

const showServerErrorAlert = (status) => {
    const now = Date.now();

    if (now - lastServerErrorAlertAt < SERVER_ERROR_ALERT_INTERVAL_MS) {
        return;
    }

    lastServerErrorAlertAt = now;
    Alert.alert(
        i18n.t('general.error'),
        i18n.t('mobile.server_error_message', { status }),
        [{ text: i18n.t('mobile.ok') }]
    );
};

// Add request interceptor for automatic token injection
apiInstance.interceptors.request.use(
    async (config) => {
        // Only auto-inject token if Authorization header not already set
        if (!config.headers['Authorization']) {
            const storedUser = await SecureStore.getItemAsync('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                config.headers['Authorization'] = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// authInstance: clear the session on 401 only
authInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            expireSession();
        }
        return Promise.reject(error);
    }
);

// apiInstance: clear the session on 401 + permission recording
apiInstance.interceptors.response.use(
    (response) => {
        const { permissionKey } = response.config;
        if (permissionKey && response.data?.status !== 'error') {
            PermissionManager.recordAllow(permissionKey);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            expireSession();
        } else if (error.response?.status === 403) {
            if (error.config?.permissionKey) {
                const isNewDenial = PermissionManager.recordDeny(error.config.permissionKey);
                if (isNewDenial && !error.config.silent) {
                    const action = PERMISSION_LABELS[error.config.permissionKey];
                    const message = action
                        ? i18n.t('mobile.permission_denied_action', { action })
                        : i18n.t('mobile.permission_denied_message');
                    Alert.alert(
                        i18n.t('mobile.permission_denied'),
                        message,
                        [{ text: i18n.t('mobile.ok') }]
                    );
                }
            } else if (__DEV__) {
                console.warn('[permissions] 403 received but no permissionKey was set on this request.');
            }
        } else if (error.response?.status >= 500 && !error.config?.silent) {
            showServerErrorAlert(error.response.status);
        }
        return Promise.reject(error);
    }
);

export const makeRequest = async ({
                                      domain,
                                      url,
                                      method,
                                      data,
                                      isAuth = false,
                                      headers = {},
                                      permissionKey,
                                      silent = false,
                                  }) => {
    const instance = isAuth ? authInstance : apiInstance;

    if (__DEV__ && !isAuth && !permissionKey) {
        console.warn(`[permissions] makeRequest called without permissionKey: ${method?.toUpperCase()} ${url}`);
    }

    // Determine baseURL for this request
    let baseURL;
    if (domain) {
        baseURL = domain + (isAuth ? '' : '/api/v1');
    } else {
        const storedDomain = await SecureStore.getItemAsync('domain');
        if (!storedDomain) {
            expireSession();
            throw new Error('No domain configured');
        }
        baseURL = storedDomain + (isAuth ? '' : '/api/v1');
    }

    const config = {
        baseURL,
        url,
        method,
        data,
        headers,
        permissionKey,
        silent,
    };

    return instance(config)
        .then(response => response.data)
        .catch(error => {
            if (error?.response?.status === 403 && config.permissionKey) {
                throw new PermissionDeniedError(config.permissionKey, 403);
            }
            throw error;
        });
};