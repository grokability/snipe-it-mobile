import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useMemo} from 'react';
import {useRouter} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, Typography, FontWeight, BorderRadius} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';

const REPORT_ITEMS = [
    { key: 'activity-report', icon: 'list-alt', labelKey: 'general.activity_report', route: 'reports/activity-report' },
];

export default function ReportsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View style={styles.container}>
            {REPORT_ITEMS.map((item) => (
                <Pressable
                    key={item.key}
                    style={styles.row}
                    onPress={() => router.push(item.route)}
                >
                    <FontAwesome name={item.icon} size={20} color={colors.text} style={styles.icon} />
                    <Text style={styles.label}>{t(item.labelKey)}</Text>
                    <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
                </Pressable>
            ))}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: colors.backgroundTertiary,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    icon: {
        width: 24,
        textAlign: 'center',
        marginRight: Spacing.md,
    },
    label: {
        flex: 1,
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
});
