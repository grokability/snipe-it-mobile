import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BearerTokenLogin = ({ onLogin, onDomainChange }) => {
    const [domain, setDomain] = useState('https://example.example.com');
    const [token, setToken] = useState('');

    // this doesn't have a dep, but i'm not sure how else to make it work...
    // and i don't know why it's happening here, because it hasn't happened on the other versions of this...
    // useEffect(() => {
    //     const loadDomain = async () => {
    //         const savedDomain = await SecureStore.getItemAsync('domain');
    //         if (savedDomain) {
    //             setDomain(savedDomain);
    //             if (onDomainChange) onDomainChange(savedDomain);
    //         }
    //     };
    //     loadDomain();
    // }, []);

    // same here, not sure what's going on....
    // useEffect(() => {
    //     const savedBearerToken = SecureStore.getItemAsync('bearer_token');
    //     if (savedBearerToken) {
    //         setToken(savedBearerToken);
    //     }
    // }, [token])

    const handleDomainChange = (text) => {
        setDomain(text);
        if (onDomainChange) onDomainChange(text);
    };

    const handleLogin = async () => {
        try {
            await onLogin(domain, token);
        } catch (error) {
            Alert.alert("Login Failed", "Please check your username/password");
        }
    };

    return (
        <>
            <TextInput
                placeholder="Domain"
                onChangeText={handleDomainChange}
                value={domain}
                style={styles.input}
                placeholderTextColor="gray"
                textContentType="URL"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Token"
                onChangeText={setToken}
                value={token}
                style={styles.input}
                placeholderTextColor="gray"
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleLogin}>
                <Text>Login</Text>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        padding: 10,
        width: '100%',
    },
});

export default BearerTokenLogin;
