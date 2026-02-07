import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {Host, ContextMenu, Button} from '@expo/ui/swift-ui';
import {Colors} from "@/constants/colors";
import {Spacing} from "@/constants/sizes";

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
                        <View style={styles.iconContainer}>
                            <Ionicons name="menu" size={18} color={Colors.light.text} />
                        </View>
                    </Pressable>
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
        paddingVertical: 6,
    },
    iconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        left: 5,
    },
});
