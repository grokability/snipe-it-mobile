import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {Ionicons} from "@expo/vector-icons";


console.log('overlay rendered')
export default function BackButtonOverlay() {
    const insets = useSafeAreaInsets();

    return (
        <View pointerEvents="box-none" style={styles.overlay}>
            <View
                pointerEvents="box-none"
                style={[styles.topRight, { top: insets.top + 8 }]}
            >
                <Pressable onPress={() => console.log('back button pressed')}>
                    <Ionicons name={"arrow-back"} size={24} color={"white"} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    topRight: {
        position: 'absolute',
        left: 12,
        width: 40,
        // height: 40,
        zIndex: 9999,
        elevation: 9999,
    },
});