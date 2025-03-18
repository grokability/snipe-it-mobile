import React, { useState, useContext } from 'react';
import {StyleSheet, TextInput, View, Text, TouchableOpacity, Alert} from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import * as SecureStore from 'expo-secure-store';

 console.log('login rendered')
export default function LoginScreen() {
    const [domain, setDomain] = useState(SecureStore.getItem('domain') || 'https://example.example.com');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        try {
            await login(username, password); // Call the login function
        } catch (error) {
            Alert.alert("Login Failed", "Please check your username/password");
        }
    };



    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login Screen</Text>
            <TextInput
                placeholder="Domain"
                onChangeText={setDomain}
                value={domain}
                style={styles.input}
                placeholderTextColor="gray"
                textContentType="URL"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Username"
                onChangeText={setUsername}
                value={username}
                style={styles.input}
                textContentType="username"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete={"username"}
            />
            <TextInput
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                style={styles.input}
                textContentType="password"
                autoCapitalize="none"
                secureTextEntry={true}
            />
            <TouchableOpacity onPress={() => login(username, password, domain)}>
                <Text>Login</Text>
            </TouchableOpacity>
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