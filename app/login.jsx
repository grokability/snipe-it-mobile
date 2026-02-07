import React, {useContext, useEffect, useState} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/LoginForm';
import BrowserLoginButton from '@/components/BrowserLoginButton';
import BearerTokenLogin from "@/components/BearerTokenLogin";
import {Colors} from "@/constants/colors";
import {Spacing, Typography, FontWeight} from "@/constants/sizes";

console.log('login rendered')
export default function LoginScreen() {
    const { login, bearerLogin } = useContext(AuthContext);
    const [domain, setDomain] = useState('https://example.example.com');
    const [token, setToken] = useState('');

    const handleDomainChange = (newDomain) => {
        setDomain(newDomain);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login Screen</Text>
            {/* for login via bearer token */}
            {/*<BearerTokenLogin onLogin={bearerLogin} onDomainChange={handleDomainChange} />*/}
            {/* original form for login */}
            <LoginForm onLogin={login} onDomainChange={handleDomainChange} />
            {/* for oauth flow */}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: Colors.light.background,
    },
    input: {
        height: 40,
        borderColor: Colors.light.textSecondary,
        borderWidth: 1,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        width: '100%',
    },
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xl,
    },
});
