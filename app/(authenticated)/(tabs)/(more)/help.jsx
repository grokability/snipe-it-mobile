import {View, Text, Pressable, StyleSheet, ScrollView, Linking, Platform} from 'react-native';
import {useMemo} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, Typography, FontWeight, BorderRadius} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';

const REPORT_ITEMS = [
    {
        key: 'report-bug',
        icon: 'bug',
        labelKey: 'mobile.help_report_bug',
        url: 'https://github.com/grokability/snipe-it-mobile/discussions/new?category=issue-triage',
    },
    {
        key: 'request-feature',
        icon: 'lightbulb-o',
        labelKey: 'mobile.help_request_feature',
        url: 'https://github.com/grokability/snipe-it-mobile/discussions/new?category=feature-requests-ideas',
    },
    {
        key: 'ask-question',
        icon: 'question-circle-o',
        labelKey: 'mobile.help_ask_question',
        url: 'https://github.com/grokability/snipe-it-mobile/discussions/new?category=q-a',
    },
    {
        key: 'discord',
        icon: 'comment-o',
        labelKey: 'mobile.help_join_discord',
        url: 'https://discord.gg/yZFtShAcKk',
    },
    {
        key: 'discussions',
        icon: 'comments-o',
        labelKey: 'mobile.help_view_discussions',
        url: 'https://github.com/grokability/snipe-it-mobile/discussions',
    },
    {
        key: 'issues',
        icon: 'exclamation-circle',
        labelKey: 'mobile.help_view_issues',
        url: 'https://github.com/grokability/snipe-it-mobile/issues',
    },
];


export default function HelpScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();

    const openUrl = (url) => Linking.openURL(url);

    return (
        <ScrollView
            style={styles.container}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
        >
            <View style={styles.infoCard}>
                <Text style={styles.infoText}>{t('mobile.help_triage_intro')}</Text>
            </View>

            <Text style={styles.sectionHeader}>{t('mobile.help_section_reporting')}</Text>
            {REPORT_ITEMS.map((item) => (
                <Pressable key={item.key} style={styles.row} onPress={() => openUrl(item.url)}>
                    <FontAwesome name={item.icon} size={20} color={colors.text} style={styles.icon} />
                    <Text style={styles.label}>{t(item.labelKey)}</Text>
                    <FontAwesome name="external-link" size={14} color={colors.textSecondary} />
                </Pressable>
            ))}

        </ScrollView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingBottom: Spacing.xxl,
    },
    infoCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    infoText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    sectionHeader: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
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
