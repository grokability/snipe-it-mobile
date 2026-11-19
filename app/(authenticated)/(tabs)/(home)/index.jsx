import {View, Text, StyleSheet, ScrollView, Platform} from 'react-native';
import React, {useMemo} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import RecentActions from "@/components/misc/RecentActions";
import VersionFooter from "@/components/misc/VersionFooter";
import AuditDashboardCard from "@/components/audit/AuditDashboardCard";
import {useTranslation} from "react-i18next";
import {PermissionGate} from "@/permissions/PermissionGate";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";

export default function HomeScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.scrollContent, {paddingTop: (Platform.OS === 'android' ? insets.top + 56 : 0) + Spacing.lg, paddingBottom: insets.bottom + 100}]}
                showsVerticalScrollIndicator={false}
            >
                <PermissionGate permission={PERMISSIONS.SUPERUSER}>
                    <RecentActions />
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ASSETS_AUDIT}>
                    <AuditDashboardCard />
                </PermissionGate>

                <View style={styles.footer}>
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
    footer: {
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    welcomeText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        textAlign: 'center',
    },
});
