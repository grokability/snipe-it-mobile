import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius} from "@/constants/sizes";

const BearerTokenLogin = ({ onLogin, onDomainChange }) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
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
                placeholderTextColor={colors.textMuted}
                textContentType="URL"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Token"
                onChangeText={setToken}
                value={token}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </>
    );
};

const createStyles = (colors) => StyleSheet.create({
    input: {
        height: 40,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
        padding: Spacing.sm,
        width: '100%',
        color: colors.text,
        backgroundColor: colors.background,
    },
    buttonText: {
        color: colors.primary,
    },
});

export default BearerTokenLogin;
