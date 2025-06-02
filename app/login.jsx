import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/LoginForm';
import BrowserLoginButton from '@/components/BrowserLoginButton';

console.log('login rendered')
export default function LoginScreen() {
    const { login } = useContext(AuthContext);
    const [domain, setDomain] = useState('https://example.example.com');

    const handleDomainChange = (newDomain) => {
        setDomain(newDomain);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login Screen</Text>
            <LoginForm onLogin={login} onDomainChange={handleDomainChange} />
            <BrowserLoginButton domain={domain} />
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
