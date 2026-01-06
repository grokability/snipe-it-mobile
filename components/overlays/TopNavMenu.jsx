import React from 'react';
import {Button, Pressable, StyleSheet, Text} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {ContextMenu, Picker} from '@expo/ui/jetpack-compose';

export default function TopNavMenu() {

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    return (
        <Text>Poop</Text>

        // docs example
    //     <ContextMenu style={{ width: 150, height: 50 }}>
    //         <ContextMenu.Items>
    //             <Button
    //                 title={'Hello'}
    //                 elementColors={{ containerColor: '#0000ff', contentColor: '#00ff00' }}
    //                 onPress={() => console.log('Pressed1')}>
    //                 Hello
    //             </Button>
    //             <Button
    //                 title={'Love it'}
    //                 variant="bordered"
    //                 color="#ff0000"
    //                 onPress={() => console.log('Pressed2')}>
    //                 Love it
    //             </Button>
    //             <Picker
    //                 label="Doggos"
    //                 options={['very', 'veery', 'veeery', 'much']}
    //                 variant="menu"
    //                 selectedIndex={selectedIndex}
    //                 onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}
    //             />
    //         </ContextMenu.Items>
    //         <ContextMenu.Trigger>
    //             <Button title={'Show Menu'} variant="bordered" style={{ width: 150, height: 50 }}>
    //                 Show Menu
    //             </Button>
    //         </ContextMenu.Trigger>
    //     </ContextMenu>

        // old
        // <ContextMenu
        //     title="Menu"
        //     items={[
        //         { text: 'Licenses', onPress: () => router.push('/(authenticated)/licenses') },
        //         { text: 'Settings', onPress: () => router.push('/(authenticated)/settings') },
        //     ]}
        // >
        //     <ContextMenu.Items>
        //         <Button
        //     </ContextMenu.Items>
        //     <Pressable
        //         accessibilityRole="button"
        //         accessibilityLabel="Open menu"
        //         style={styles.button}
        //     >
        //         <Ionicons name="ellipsis-vertical" size={18} color="#111" />
        //     </Pressable>
        // </ContextMenu>
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