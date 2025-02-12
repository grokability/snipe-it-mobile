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

export const makeRequest = async ({
                                      domain,
                                      url,
                                      method,
                                      data,
                                      isAuth = false,
                                      headers = {}
                                  }) => {
    const instance = isAuth ? authInstance : apiInstance;

    // If domain is provided in the request, use it directly
    if (domain) {
        instance.defaults.baseURL = domain + (isAuth ? '' : '/api/v1');
    } else {
        // Otherwise get it from storage
        const storedDomain = await SecureStore.getItemAsync('domain');
        if (!storedDomain) {
            router.replace('/login')
            throw new Error('No domain configured');
        }
        instance.defaults.baseURL = storedDomain + (isAuth ? '' : '/api/v1');
    }

    const config = {
        url,
        method,
        data,
        headers,
    };

    return instance(config)
        .then(response => response.data)
        .catch(error => {
            console.log(error);
            if(error.status === 401) {
                router.replace('/login')
            }
            throw error; // Re-throw the error for proper handling
        });
};