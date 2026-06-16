import React, {useMemo} from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import * as ExpoImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {File} from 'expo-file-system';
import {Ionicons} from '@expo/vector-icons';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';

export default function ImagePicker({image, onImageSelected, onImageRemoved}) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const buildDataUri = (base64, mimeType) => `data:${mimeType};base64,${base64}`;

    const pickFromLibrary = async () => {
        const result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            onImageSelected({
                uri: asset.uri,
                dataUri: buildDataUri(asset.base64, asset.mimeType || 'image/jpeg'),
            });
        }
    };

    const takePhoto = async () => {
        const {granted, canAskAgain} = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
            if (!canAskAgain) Linking.openSettings();
            return;
        }

        const result = await ExpoImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            onImageSelected({
                uri: asset.uri,
                dataUri: buildDataUri(asset.base64, asset.mimeType || 'image/jpeg'),
            });
        }
    };

    const pickFromFiles = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            const file = new File(asset.uri);
            const base64 = await file.base64();
            onImageSelected({
                uri: asset.uri,
                dataUri: buildDataUri(base64, asset.mimeType || 'image/jpeg'),
            });
        }
    };

    if (image) {
        return (
            <View style={styles.previewContainer}>
                <Image
                    source={{uri: image.uri}}
                    style={styles.preview}
                    contentFit="cover"
                />
                <Pressable
                    onPress={onImageRemoved}
                    style={({pressed}) => [styles.removeButton, pressed && {opacity: 0.7}]}
                >
                    <Ionicons name="close-circle" size={28} color={colors.danger} />
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.buttonRow}>
            <Pressable
                onPress={takePhoto}
                style={({pressed}) => [styles.pickerButton, pressed && {opacity: 0.7}]}
            >
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                <Text style={styles.pickerButtonText}>{t('mobile.take_photo')}</Text>
            </Pressable>
            <Pressable
                onPress={pickFromLibrary}
                style={({pressed}) => [styles.pickerButton, pressed && {opacity: 0.7}]}
            >
                <Ionicons name="images-outline" size={24} color={colors.primary} />
                <Text style={styles.pickerButtonText}>{t('mobile.choose_from_library')}</Text>
            </Pressable>
            <Pressable
                onPress={pickFromFiles}
                style={({pressed}) => [styles.pickerButton, pressed && {opacity: 0.7}]}
            >
                <Ionicons name="folder-outline" size={24} color={colors.primary} />
                <Text style={styles.pickerButtonText}>{t('mobile.choose_from_files')}</Text>
            </Pressable>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    pickerButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.md,
        borderStyle: 'dashed',
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
    },
    pickerButtonText: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
    previewContainer: {
        position: 'relative',
        alignSelf: 'center',
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: colors.background,
        borderRadius: 14,
    },
});
