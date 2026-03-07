import React, {useMemo} from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function EmptyState({title, message, onRetry}) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    return (
        <View style={styles.container}>
            <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.title}>{title || t('mobile.empty_state_title')}</Text>
            <Text style={styles.message}>{message || t('mobile.empty_state_message')}</Text>
            {onRetry && (
                <Pressable
                    onPress={onRetry}
                    style={({pressed}) => [
                        styles.retryButton,
                        pressed && styles.retryButtonPressed,
                    ]}
                >
                    <Ionicons name="refresh" size={18} color={colors.white} />
                    <Text style={styles.retryText}>{t('mobile.retry')}</Text>
                </Pressable>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        textAlign: 'center',
    },
    message: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    retryButtonPressed: {
        opacity: 0.8,
    },
    retryText: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
        color: '#ffffff',
    },
});
