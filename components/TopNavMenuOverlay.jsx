import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavMenu from '@/components/TopNavMenu';


console.log('overlay rendered')
export default function TopNavMenuOverlay() {
    const insets = useSafeAreaInsets();

    return (
        <View pointerEvents="box-none" style={styles.overlay}>
            <View
                pointerEvents="box-none"
                style={[styles.topRight, { top: insets.top + 8 }]}
            >
                <TopNavMenu />
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