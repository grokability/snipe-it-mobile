import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {ContextMenu, Picker, Button, Trigger, Submenu, Switch} from '@expo/ui/jetpack-compose';

export default function TopNavMenu() {

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <Button variant="transparent" leadingIcon={"filled.MoreVert"}> </Button>
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
        width: 40,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'rgba(255,255,255,0.75)',
        backgroundColor: 'red',
        borderWidth: 1,
        borderColor: 'red',
    },
});