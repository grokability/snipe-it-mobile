import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {router} from "expo-router";
import React, {useMemo} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import {Ionicons} from "@expo/vector-icons";
import RecentActions from "@/components/misc/RecentActions";
import VersionFooter from "@/components/misc/VersionFooter";
import AuditDashboardCard from "@/components/audit/AuditDashboardCard";
import {useTranslation} from "react-i18next";
import {PermissionGate} from "@/permissions/PermissionGate";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing, BorderRadius} from "@/constants/sizes";

export default function HomeScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100}]}
                showsVerticalScrollIndicator={false}
            >
                <PermissionGate permission={PERMISSIONS.SUPERUSER}>
                    <RecentActions />
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ASSETS_AUDIT}>
                    <AuditDashboardCard />
                </PermissionGate>

                <View style={styles.scannerSection}>
                    <Pressable
                        testID="open-scanner-button"
                        onPress={() => router.push('/scanner')}
                        style={({pressed}) => [styles.scanButton, pressed && styles.scanButtonPressed]}
                    >
                        <Ionicons name="scan" size={22} color="#fff" />
                        <Text style={styles.scanButtonText}>{t('mobile.open_scanner')}</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <LottieView
                        source={require('@/assets/spinning_star_eye.json')}
                        style={styles.lottie}
                        autoPlay
                        loop
                    />
                    <Text style={styles.welcomeText}>{t('mobile.welcome')}</Text>
                    <VersionFooter />
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
    },
    scannerSection: {
        alignItems: 'center',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        alignSelf: 'stretch',
        backgroundColor: colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    scanButtonPressed: {
        opacity: 0.85,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
    },
    footer: {
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    lottie: {
        width: 150,
        height: 150,
    },
    welcomeText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        textAlign: 'center',
    },
});
