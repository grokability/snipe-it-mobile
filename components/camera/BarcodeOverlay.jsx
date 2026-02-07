import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

const BarcodeOverlay = ({ barcodes, onBarcodeSelect, clearBarcodes }) => {
    const insets = useSafeAreaInsets();

    if (barcodes.length === 0) return null;

    return (
        <View style={[
            styles.overlay,
            {
                paddingTop: insets.top
            }
        ]}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Text style={styles.headerText}>Select a QR code</Text>
                <TouchableOpacity
                    onPress={clearBarcodes}
                    style={styles.closeButton}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            {barcodes.map((barcode, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.barcodeHighlight,
                        {
                            left: barcode.bounds.origin.x,
                            top: barcode.bounds.origin.y,
                            width: barcode.bounds.size.width,
                            height: barcode.bounds.size.height,
                        }
                    ]}
                    onPress={() => onBarcodeSelect(barcode.data)}
                >
                    <View style={styles.barcodeCorner} />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerText: {
        color: Colors.light.background,
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
    },
    closeButton: {
        padding: Spacing.lg,
        backgroundColor: 'rgba(100, 100, 100, 0.5)',
        borderRadius: BorderRadius.lg,
    },
    closeButtonText: {
        color: Colors.light.background,
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
    },
    barcodeHighlight: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: Colors.light.success,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    barcodeCorner: {
        width: 20,
        height: 20,
        borderWidth: 3,
        borderColor: Colors.light.background,
        borderTopWidth: 0,
        borderRightWidth: 0,
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

export default BarcodeOverlay;
