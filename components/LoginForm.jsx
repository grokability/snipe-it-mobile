import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import BrowserLoginButton from "@/components/BrowserLoginButton";

const LoginForm = ({ onLogin, onDomainChange }) => {
    const [domain, setDomain] = useState('https://example.example.com');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const loadDomain = async () => {
            const savedDomain = await SecureStore.getItemAsync('domain');
            if (savedDomain) {
                setDomain(savedDomain);
                if (onDomainChange) onDomainChange(savedDomain);
            }
        };
        loadDomain();
    }, []);

    const handleDomainChange = (text) => {
        setDomain(text);
        if (onDomainChange) onDomainChange(text);
    };

    const handleLogin = async () => {
        try {
            await onLogin(domain);
        } catch (error) {
            Alert.alert("Login Failed", "Please check your domain");
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
            <TouchableOpacity onPress={handleLogin}>

                <BrowserLoginButton domain={domain} />
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

export default LoginForm;
