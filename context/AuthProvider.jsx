import React, {createContext, useState, useEffect, useContext} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import * as SecureStore from 'expo-secure-store';
import { deviceName } from "expo-device";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {makeRedirectUri} from "expo-auth-session";
import {clearAllData} from "@/helpers/db/database";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await SecureStore.getItemAsync("user"); // Check if token exists
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false); // Stop showing the loading state after checking
        };

        loadUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                setUser,
                logout: () => {
                    // commenting out most of this to do a regular bearer token logout of the mobile app
                    // this means the token is NOT invalidated when logging out for now.
                    console.log('logout');
                    // return makeRequest({
                    //     url: '/mobile/logout',
                    //     method: 'POST',
                    //     isAuth: true,
                    //     data: {
                    //         token_id: user.token_id,
                    //     },
                    //     headers: { 'Authorization': `Bearer ${user.token}` }
                    // }).then(response => {
                    //     console.log('logout response');
                        SecureStore.deleteItemAsync('user');
                        clearAllData().catch(() => {});
                        setUser(null);
                        setIsAuthenticated(false);
                    //     console.log(response);
                    // }).catch(error => {
                    //     console.log('logout error');
                    //     console.error(error);
                    // });
                },
                // leaving this here for now, may serve as a backup login method
                bearerLogin: (domain, token) => {
                    setIsLoading(true);
                    if (!token) {
                        console.log('token is empty');
                    }
                    if (!domain) {
                        console.log('domain is empty');
                    }
                    makeRequest({
                        domain: domain,
                        url: 'users/me',
                        method: 'GET',
                        isAuth: false, // if true this strips `api/v1` i think
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(response => {
                            console.log(response);
                            setIsAuthenticated(true);
                            SecureStore.setItemAsync('domain', domain);
                            const userResponse = {
                                token: token,
                                id: response.id,
                                first_name: response.first_name,
                                last_name: response.last_name,
                                email: response.email,
                                permissions: response.permissions,
                            };
                            setUser(userResponse);
                            SecureStore.setItemAsync('user', JSON.stringify(userResponse));
                            AsyncStorage.setItem('locale', response.locale || 'en-US');
                        })
                        .catch(error => {
                            setUser(null);
                            setIsAuthenticated(false);
                            console.error(error);
                            console.error(error.message);
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                },
                oAuthLogin: (domain, code, codeVerifier) => {
                    console.log('oAuthLogin');
                   setIsLoading(true);
                   if (!code) {
                       console.log('code is empty');
                   }
                   console.log('code:', code);
                   if (!domain) {
                       console.log('domain is empty');
                   }
                   const redirectUri = makeRedirectUri({
                       scheme: 'com.grokability.snipeitmobile',
                       path: 'home',
                   })
                   // set up url encoding
                    const params = new URLSearchParams();
                    params.append('grant_type', 'authorization_code');
                    params.append('client_id', '9999');
                    params.append('code', code);
                    params.append('code_verifier', codeVerifier);
                    params.append('redirect_uri', redirectUri);
                    params.append('name', deviceName); // hm, this isn't working.
                    console.log('params:', params);

                    // make the actual token request
                    makeRequest({
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        },
                        domain: domain,
                        isAuth: true,
                        url: '/oauth/token',
                        method: 'POST',
                        data: params.toString(),
                    })
                    // take response and set up the user object
                    .then(async response => {
                        const accessToken = response.access_token;

                        const userData = await makeRequest({
                            domain: domain,
                            url: '/users/me',
                            method: 'GET',
                            isAuth: false,
                            headers: {'Authorization': `Bearer ${accessToken}`} // i think we might be able to use `state` now instead?
                        });

                        const userResponse = {
                            token: accessToken,
                            token_id: response.id,
                            id: userData.id,
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            email: userData.email,
                            permissions: userData.permissions,
                        };

                        await SecureStore.setItemAsync('domain', domain);
                        await SecureStore.setItemAsync('user', JSON.stringify(userResponse));

                        setUser(userResponse);
                        setIsAuthenticated(true);
                        console.log('user:', userResponse);
                    })
                   .catch(error => {
                       if (error.response && error.response.data) {
                           console.log('Server Error Data:', JSON.stringify(error.response.data, null, 2));
                       }
                       console.log(error);
                       setUser(null);
                       setIsAuthenticated(false);
                   })
                   .finally(() => {
                       setIsLoading(false);
                       router.replace('/home');
                   });
                }
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
