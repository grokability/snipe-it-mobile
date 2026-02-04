import axios from 'axios';
import {router} from "expo-router";
import * as SecureStore from 'expo-secure-store';

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

// Add response interceptor for global error handling
[apiInstance, authInstance].forEach(instance => {
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            console.log(error);
            if (error.response?.status === 401) {
                router.replace('/login');
            }
            return Promise.reject(error);
        }
    );
});

export const makeRequest = async ({
                                      domain,
                                      url,
                                      method,
                                      data,
                                      isAuth = false,
                                      headers = {}
                                  }) => {
    const instance = isAuth ? authInstance : apiInstance;

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
    };

    return instance(config)
        .then(response => response.data)
        .catch(error => {
            throw error; // Re-throw for proper handling
        });
};