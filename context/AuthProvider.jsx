import React, {createContext, useState, useEffect, useContext} from "react";
import {makeRequest} from "../helpers/axiosConfig";
import * as SecureStore from 'expo-secure-store';
import { deviceName } from "expo-device";
import {useRouter} from "expo-router";

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
                login: (username, password, domain) => {
                    if(!domain) {
                        console.log('domain is empty');
                        setIsLoading(false);
                        return;
                    }
                    SecureStore.deleteItemAsync('user');
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsLoading(true);
                    makeRequest({
                        domain: domain,
                        url: '/mobile/login',
                        method: 'POST',
                        isAuth: true,
                        data: {
                            username: username,
                            password: password,
                            device_name: deviceName,
                        }
                    }).then(response => {
                        console.log(response);
                        const userReponse = {
                            token: response.token,
                            token_id: response.token_id,
                            id: response.user.id,
                            first_name: response.user.first_name,
                            last_name: response.user.last_name,
                            email: response.user.email,
                        }
                        setUser(userReponse);
                        setIsAuthenticated(true);
                        console.log(isAuthenticated);
                        SecureStore.setItemAsync('domain', domain);
                        SecureStore.setItemAsync('user', JSON.stringify(userReponse));
                        setIsLoading(false);
                    }).catch(error => {
                        setUser(null);
                        setIsAuthenticated(false);
                        console.error(error);
                    });
                },
                logout: () => {
                    console.log('logout');
                    return makeRequest({
                        url: '/mobile/logout',
                        method: 'POST',
                        isAuth: true,
                        data: {
                            token_id: user.token_id,
                        },
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    }).then(response => {
                        console.log('logout response');
                        SecureStore.deleteItemAsync('user');
                        setUser(null);
                        setIsAuthenticated(false);
                        console.log(response);
                    }).catch(error => {
                        console.log('logout error');
                        console.error(error);
                    });
                },
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
