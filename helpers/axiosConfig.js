import axios from 'axios';
import { Alert } from 'react-native';
import {router} from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { PermissionManager } from '@/permissions/PermissionManager';
import i18n from '@/i18n';

// Create instances without baseURL initially
const apiInstance = axios.create({
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

const authInstance = axios.create({
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

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

// authInstance: redirect on 401 only
authInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            router.replace('/login');
        }
        return Promise.reject(error);
    }
);

// apiInstance: 401 redirect + permission recording
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
            router.replace('/login');
        } else if (error.response?.status === 403) {
            if (error.config?.permissionKey) {
                PermissionManager.recordDeny(error.config.permissionKey);
                if (!error.config.silent) {
                    Alert.alert(
                        i18n.t('mobile.permission_denied'),
                        i18n.t('mobile.permission_denied_message'),
                        [{ text: i18n.t('general.ok') }]
                    );
                }
            } else if (__DEV__) {
                console.warn('[permissions] 403 received but no permissionKey was set on this request.');
            }
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
            router.replace('/login')
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
                return null;
            }
            throw error;
        });
};