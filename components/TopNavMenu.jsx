import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ContextMenu } from '@expo/ui/jetpack-compose';

export default function TopNavMenu() {
    return (
        <ContextMenu
            title="Menu"
            items={[
                { text: 'Licenses', onPress: () => router.push('/(authenticated)/licenses') },
                { text: 'Settings', onPress: () => router.push('/(authenticated)/settings') },
            ]}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                style={styles.button}
            >
                <Ionicons name="ellipsis-vertical" size={18} color="#111" />
            </Pressable>
        </ContextMenu>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
});