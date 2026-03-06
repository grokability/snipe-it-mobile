import React from 'react';
import {StyleSheet, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {Host, Menu, Button} from '@expo/ui/swift-ui';
import {useColors} from "@/hooks/useThemeColors";

export default function TopNavMenu() {
    const colors = useColors();

    const trigger = (
        <View style={styles.button}>
            <View style={styles.iconContainer}>
                <Ionicons name="menu" size={18} color={colors.text} />
            </View>
        </View>
    );

    return (
        <Host matchContents>
            <Menu label={trigger}>
                <Button
                    label="Home"
                    onPress={() => router.push('/(authenticated)/(tabs)/home')}
                />
                <Button
                    label="Licenses"
                    onPress={() => router.push('/(authenticated)/licenses')}
                />
                <Button
                    label="Settings"
                    onPress={() => router.push('/(authenticated)/settings')}
                />
            </Menu>
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
