import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {Host, ContextMenu, Button} from '@expo/ui/swift-ui';

export default function TopNavMenu() {
    return (
        <Host>
            <ContextMenu>
                <ContextMenu.Items>
                    <Button
                        variant="bordered"
                        onPress={() => router.push('/(authenticated)/(tabs)/home')}
                    >
                        Home
                    </Button>
                    <Button
                        variant="bordered"
                        onPress={() => router.push('/(authenticated)/licenses')}>
                        Licenses
                    </Button>
                    <Button
                        variant="bordered"
                        onPress={() => router.push('/(authenticated)/settings')}>
                        Settings
                    </Button>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                             <Pressable
                                 accessibilityRole="button"
                                 accessibilityLabel="Open menu"
                                 style={({ pressed }) => [
                                     styles.button,
                                     pressed && {opacity: 0.3}
                             ]}
                             >
                                 <Ionicons name="menu" size={24} color="#111" />
                             </Pressable>
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -8, //
    },
});