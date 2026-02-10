import React, {useCallback, useContext, useEffect, useState, useMemo} from 'react';
import {ActivityIndicator, Button, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";


export const unstable_settings = {
    initialRouteName: 'index',
};


export default function AssetScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    const getAsset = useCallback(() => {
        setLoading(true);
        makeRequest({
            url: `/hardware/${id}`,
            method: 'get'
        })
            .then(res => {
                setData({
                    asset: res,
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            getAsset();
        }, [getAsset])
    );

    const DetailRow = ({label, value}) => {
        return (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        )
    }

    if(loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        )
    }

    if(loading || !data.asset) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        )
    }

        return (
            <SafeAreaProvider>
                <View style={styles.container}>
                    <View style={styles.imageContainer}>
                        <Image source={{uri: data.asset.image}} style={styles.image}/>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.assetTitle}>{t('assets.title', { id })}</Text>
                        <View style={styles.detailsContainer}>
                            <DetailRow label={t('assets.age')} value={data.asset?.age || t('common.na')}/>
                            <DetailRow label={t('assets.name')} value={data.asset?.name || t('common.na')}/>
                            <DetailRow label={t('assets.serial')} value={data.asset?.serial || t('common.na')}/>
                        </View>

                        <View style={styles.assignmentContainer}>
                            {data.asset.assigned_to ? (
                                <>
                                    <Text style={styles.assignedText}>
                                        {t('assets.assignedTo')}<Text style={styles.userName}>{data.asset.assigned_to.name}</Text>
                                    </Text>
                                    <Pressable
                                        style={({pressed}) => [styles.button, styles.checkinButton, pressed && styles.buttonPressed]}
                                        onPress={() => router.push(`/(tabs)/(assets)/checkin/${id}`)}
                                    >
                                        <Text style={styles.buttonText}>{t('assets.checkIn')}</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable
                                    style={({pressed}) => [styles.button, styles.checkoutButton, pressed && styles.buttonPressed]}
                                    onPress={() => router.push(`/(tabs)/(assets)/checkout/${id}`)}
                                >
                                    <Text style={styles.buttonText}>{t('assets.checkOut')}</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </SafeAreaProvider>
        );
}

const createStyles = (colors) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: Spacing.lg,
        backgroundColor: colors.background
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: BorderRadius.md
    },
    infoContainer: {
        gap: Spacing.xxl
    },
    assetTitle: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        marginBottom: Spacing.sm
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.md
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    detailLabel: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium
    },
    detailValue: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        fontWeight: FontWeight.semibold
    },
    assignmentContainer: {
        alignItems: 'center',
        gap: Spacing.lg
    },
    assignedText: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary
    },
    userName: {
        color: colors.primary,
        fontWeight: FontWeight.semibold
    },
    button: {
        width: '100%',
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center'
    },
    checkinButton: {
        backgroundColor: colors.danger
    },
    checkoutButton: {
        backgroundColor: colors.success
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}]
    },
    buttonText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold
    }
});
