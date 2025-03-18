import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Link} from "expo-router";
import { AuthContext } from "@/context/AuthProvider";
import {useContext} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
    const { logout } = useContext(AuthContext);
    return (
        <SafeAreaView style={styles.container}>
            <Text>Your domain is set as {SecureStore.getItem('domain')}</Text>
            <Text style={{paddingBottom: 20}}>Settings</Text>
                <TouchableOpacity onPress={logout}>
                   <Text>Logout</Text>
                </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});