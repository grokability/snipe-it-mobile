import React from 'react';
import {StyleSheet, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {ContextMenu, Button} from '@expo/ui/jetpack-compose';

export default function TopNavMenu() {
    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <Button variant={'default'} systemImage={"filled.MoreVert"} />
            </ContextMenu.Trigger>
            <ContextMenu.Items>
                <Button
                    onPress={() => router.push('/(authenticated)/(tabs)/home')}
                >
                    Home
                </Button>
                <Button
                    onPress={() => router.push('/(authenticated)/licenses')}
                >
                    License
                </Button>
                <Button
                    onPress={() => router.push('/(authenticated)/settings')}
                >
                    Settings
                </Button>
            </ContextMenu.Items>
        </ContextMenu>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        elevation: 2,
    },
});