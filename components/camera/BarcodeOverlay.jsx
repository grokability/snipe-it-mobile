import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    headerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 15,  // Increased from 10 to 15
        backgroundColor: 'rgba(100, 100, 100, 0.5)',
        borderRadius: 25,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    barcodeHighlight: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#00FF00',
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    barcodeCorner: {
        width: 20,
        height: 20,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        borderTopWidth: 0,
        borderRightWidth: 0,
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

export default BarcodeOverlay;