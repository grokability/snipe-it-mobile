import React, {useContext, useEffect, useState} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/LoginForm';
import BrowserLoginButton from '@/components/BrowserLoginButton';
import BearerTokenLogin from "@/components/BearerTokenLogin";

console.log('login rendered')
export default function LoginScreen() {
    const { login } = useContext(AuthContext);
    const [domain, setDomain] = useState('https://example.example.com');
    const [token, setToken] = useState('');

    const handleDomainChange = (newDomain) => {
        setDomain(newDomain);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login Screen</Text>
            {/* for login via bearer token */}
            <BearerTokenLogin onLogin={login} onDomainChange={handleDomainChange} />
            {/* original form for login */}
            {/*<LoginForm onLogin={login} onDomainChange={handleDomainChange} />*/}
            {/* for oauth flow */}
            {/*<BrowserLoginButton domain={domain} />*/}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        padding: 10,
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
