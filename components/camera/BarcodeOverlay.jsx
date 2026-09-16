import React, {useMemo} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {useColors} from "@/hooks/useThemeColors";
import {BorderRadius, Spacing, Typography, FontWeight} from "@/constants/sizes";

const BarcodeOverlay = ({ barcodes, onBarcodeSelect }) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    if (barcodes.length === 0) return null;

    return barcodes.map((barcode) => (
        <TouchableOpacity
            key={barcode.data}
            testID={`barcode-highlight-${barcode.data}`}
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
            {barcode.assetTag && (
                <View style={styles.tagLabel}>
                    <Text style={styles.tagLabelText} numberOfLines={1} ellipsizeMode="tail">
                        {barcode.assetTag}
                    </Text>
                </View>
            )}
            <View style={styles.tapBadge}>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </View>
        </TouchableOpacity>
    ));
};

const createStyles = (colors) => StyleSheet.create({
    barcodeHighlight: {
        position: 'absolute',
        zIndex: 10,
        borderWidth: 2,
        borderRadius: BorderRadius.md,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '1F',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    tagLabel: {
        position: 'absolute',
        top: -28,
        left: 0,
        maxWidth: 160,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
    },
    tagLabelText: {
        color: '#ffffff',
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
    tapBadge: {
        position: 'absolute',
        bottom: -12,
        right: -12,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
    },
});

export default BarcodeOverlay;
