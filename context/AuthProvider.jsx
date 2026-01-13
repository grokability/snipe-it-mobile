import React, {createContext, useState, useEffect, useContext} from "react";
import {makeRequest} from "../helpers/axiosConfig";
import * as SecureStore from 'expo-secure-store';
import { deviceName } from "expo-device";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
                // login: (username, password, domain) => {
                //     if(!domain) {
                //         console.log('domain is empty');
                //         setIsLoading(false);
                //         return;
                //     }
                //     SecureStore.deleteItemAsync('user');
                //     setUser(null);
                //     setIsAuthenticated(false);
                //     setIsLoading(true);
                //     makeRequest({
                //         domain: domain,
                //         url: '/mobile/login',
                //         method: 'POST',
                //         isAuth: true,
                //         data: {
                //             username: username,
                //             password: password,
                //             device_name: deviceName,
                //         }
                //     }).then(response => {
                //         console.log(response);
                //         const userResponse = {
                //             token: response.token,
                //             token_id: response.token_id,
                //             id: response.user.id,
                //             first_name: response.user.first_name,
                //             last_name: response.user.last_name,
                //             email: response.user.email,
                //         }
                //         setUser(userResponse);
                //         setIsAuthenticated(true);
                //         console.log(isAuthenticated);
                //         SecureStore.setItemAsync('domain', domain);
                //         SecureStore.setItemAsync('user', JSON.stringify(userResponse));
                //         setIsLoading(false);
                //     }).catch(error => {
                //         setUser(null);
                //         setIsAuthenticated(false);
                //         console.error(error);
                //     });
                // },
                logout: () => {
                    // commenting out most of this to do a regular bearer token logout of the mobile app
                    // this means the token is NOT invalidated when logging out for now.
                    // console.log('logout');
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
                    // THIS IS ALL THAT HAPPENS AT LOGOUT
                        SecureStore.deleteItemAsync('user');
                        setUser(null);
                        setIsAuthenticated(false);
                    //     console.log(response);
                    // }).catch(error => {
                    //     console.log('logout error');
                    //     console.error(error);
                    // });
                },
                // bearerLogin: (domain, token) => {
                //     setIsLoading(true);
                //     if (!token) {
                //         console.log('token is empty');
                //     }
                //     if (!domain) {
                //         console.log('domain is empty');
                //     }
                //     makeRequest({
                //         domain: domain,
                //         url: 'users/me',
                //         method: 'GET',
                //         isAuth: false, // if true this strips `api/v1` i think
                //         headers: { 'Authorization': `Bearer ${token}` }
                //     })
                //         .then(response => {
                //             console.log(response);
                //             setIsAuthenticated(true);
                //             SecureStore.setItemAsync('domain', domain);
                //             const userResponse = {
                //                 token: token,
                //                 id: response.id,
                //                 first_name: response.first_name,
                //                 last_name: response.last_name,
                //                 email: response.email,
                //                 permissions: response.permissions,
                //             }
                //             setUser(userResponse);
                //             SecureStore.setItemAsync('user', JSON.stringify(userResponse));
                //             AsyncStorage.setItem('locale', response.locale || 'en-US')
                //             setIsLoading(false);
                //         })
                //         .catch(error => {
                //             setUser(null);
                //             setIsAuthenticated(false);
                //             console.error(error);
                //             console.error(error.message);
                //         });
                // },
                oAuthLogin: (domain, code, codeVerifier) => {
                   setIsLoading(true);
                   if (!code) {
                       console.log('code is empty');
                   }
                   console.log('code:', code);
                   if (!domain) {
                       console.log('domain is empty');
                   }
                    const params = new URLSearchParams();
                    params.append('grant_type', 'authorization_code');
                    params.append('client_id', '39');
                    params.append('code', code);
                    params.append('code_verifier', codeVerifier);
                    params.append('redirect_uri', 'com.grokability.snipeitmobile://home');
                   // makeRequest({
                   //     domain: domain,
                   //     isAuth: true,
                   //     url: '/oauth/token',
                   //     method: 'POST',
                   //     data: {
                   //         client_id: '34',
                   //         grant_type: 'authorization_code',
                   //         code: code,
                   //         code_verifier: codeVerifier,
                   //         redirect_uri: 'com.grokability.snipeitmobile://home',
                   //     }
                   // })
                    makeRequest({
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        },
                        domain: domain,
                        isAuth: true,
                        url: '/oauth/token',
                        method: 'POST',
                        data: params,
                    })
                    .then(async response => {
                        const accessToken = response.access_token;

                        // 1. Fetch user details using the new token
                        const userData = await makeRequest({
                            domain: domain,
                            url: '/users/me', // or your specific 'me' endpoint
                            method: 'GET',
                            isAuth: false,
                            headers: {'Authorization': `Bearer ${accessToken}`}
                        });

                        // 2. Format the user object for your app state
                        const userResponse = {
                            token: accessToken,
                            id: userData.id,
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            email: userData.email,
                            // add other fields as needed
                        };

                        // 3. Persist and Update State
                        await SecureStore.setItemAsync('domain', domain);
                        await SecureStore.setItemAsync('user', JSON.stringify(userResponse));

                        setUser(userResponse);
                        setIsAuthenticated(true);
                    })
                   .catch(error => {
                       if (error.response && error.response.data) {
                           console.log('Server Error Data:', JSON.stringify(error.response.data, null, 2));
                       }
                       console.log(error);
                       // setUser(null);
                       // setIsAuthenticated(false);
                       // console.error(error);
                   })
                   .finally(() => {
                       setIsLoading(false);
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
