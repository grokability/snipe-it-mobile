import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Link} from "expo-router";
import { AuthContext } from "@/context/AuthProvider";
import {useContext, useMemo} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import * as SecureStore from 'expo-secure-store';
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";

export default function SettingsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { logout } = useContext(AuthContext);
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Your domain is set as {SecureStore.getItem('domain')}</Text>
            <Text style={[styles.text, {paddingBottom: Spacing.lg}]}>Settings</Text>
                <TouchableOpacity onPress={logout}>
                   <Text style={styles.text}>Logout</Text>
                </TouchableOpacity>
        </SafeAreaView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    text: {
        color: colors.text,
        fontSize: Typography.body,
    },
});