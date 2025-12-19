import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {Host, ContextMenu, Button} from '@expo/ui/swift-ui';

export default function TopNavMenu() {
    return (
        <Host style={{ width: 150, height: 50 }}>
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
                    {/*<Picker*/}
                    {/*    label="Doggos"*/}
                    {/*    options={['very', 'veery', 'veeery', 'much']}*/}
                    {/*    variant="menu"*/}
                    {/*    selectedIndex={selectedIndex}*/}
                    {/*    onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}*/}
                    {/*/>*/}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                             <Pressable
                                 accessibilityRole="button"
                                 accessibilityLabel="Open menu"
                                 style={styles.button}
                             >
                                 <Ionicons name="menu" size={20} color="#111" />
                             </Pressable>
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
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