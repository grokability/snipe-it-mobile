import React, {createContext, useState, useEffect, useContext} from "react";
import {makeRequest} from "../helpers/axiosConfig";
import * as SecureStore from 'expo-secure-store';
import { PermissionManager } from '../permissions/PermissionManager';
import { deviceName } from "expo-device";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {makeRedirectUri} from "expo-auth-session";
import {reportLoginFailure, addLoginBreadcrumb} from "@/helpers/loginTelemetry";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await SecureStore.getItemAsync("user");
            const storedDomain = await SecureStore.getItemAsync("domain");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
                if (storedDomain) {
                    await PermissionManager.hydrate(storedDomain);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false);
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
                    // Token is not invalidated on logout — see commented block below for full OAuth logout
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
                        const currentDomain = PermissionManager.getCurrentDomain();
                        if (currentDomain) {
                            PermissionManager.reset(currentDomain);
                        }
                        SecureStore.deleteItemAsync('user');
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
                    addLoginBreadcrumb('Bearer login attempt', { has_token: Boolean(token) });
                    makeRequest({
                        domain: domain,
                        url: 'users/me',
                        method: 'GET',
                        isAuth: false, // if true this strips `api/v1` i think
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(response => {
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
                            PermissionManager.initializeFromUsersMe(response.permissions, response.id, domain);
                            PermissionManager.probeViewPermissions(domain, token);
                        })
                        .catch(error => {
                            setUser(null);
                            setIsAuthenticated(false);
                            reportLoginFailure({ stage: 'bearer-login', error, domain });
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                },
                oAuthLogin: (domain, code, codeVerifier, clientId) => {
                   setIsLoading(true);
                   addLoginBreadcrumb('OAuth token exchange attempt', {
                       has_code: Boolean(code),
                       has_client_id: Boolean(clientId),
                   });
                   const redirectUri = makeRedirectUri({
                       scheme: 'com.grokability.snipeitmobile',
                       path: 'home',
                   })
                   // set up url encoding
                    const params = new URLSearchParams();
                    params.append('grant_type', 'authorization_code');
                    params.append('client_id', clientId);
                    params.append('code', code);
                    params.append('code_verifier', codeVerifier);
                    params.append('redirect_uri', redirectUri);
                    params.append('name', deviceName); // hm, this isn't working.

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
                        PermissionManager.initializeFromUsersMe(userData.permissions, userData.id, domain);
                        PermissionManager.probeViewPermissions(domain, accessToken);
                    })
                   .catch(error => {
                       // The OAuth error code says whether this was a bad verifier, an expired
                       // code or a redirect_uri mismatch, and is safe to send: it is a fixed
                       // vocabulary from the spec, not user data.
                       reportLoginFailure({
                           stage: 'oauth-token-exchange',
                           error,
                           domain,
                           extra: { oauth_error: error?.response?.data?.error ?? null },
                       });
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
