import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';
import { ErrorReportingConsent } from '@/helpers/errorReportingConsent';
import { applyErrorReportingConsent, sendErrorReport } from '@/helpers/sentry';
import {
    getNextPendingReport,
    resolvePendingReport,
    subscribeToPendingReports,
    takeAllPendingReports,
} from '@/helpers/pendingErrorReports';
import { buildErrorReportDiscussionUrl } from '@/helpers/errorReportDiscussion';
import { useCopyErrorReportReference } from '@/hooks/useCopyErrorReportReference';

// Asks before an error report leaves the device, when consent is ASK.
//
// The payload shown under "see exactly what's sent" is the queued event itself, not a
// description of it — scrubEvent has already run, so this is what would go out. Showing the
// real thing is the only version of this prompt worth putting in front of someone.

function summarize(event) {
    const exception = event.exception?.values?.[0];
    if (exception?.type && exception?.value) return `${exception.type}: ${exception.value}`;
    return exception?.type ?? event.message ?? null;
}

export default function ErrorReportConsentPrompt() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const [showPayload, setShowPayload] = useState(false);
    const [sentReference, setSentReference] = useState(null);
    const copyReference = useCopyErrorReportReference();

    const report = useSyncExternalStore(subscribeToPendingReports, getNextPendingReport);

    const payload = useMemo(
        () => (report ? JSON.stringify(report.event, null, 2) : ''),
        [report]
    );

    // Offers the one thing worth doing with a reference, at the moment the user is most likely
    // to do it. Reaching the Help screen for it instead means noticing a card they were not
    // looking for, copying the string, and pasting it into an empty discussion body.
    //
    // Rendered ahead of the `!report` guard below, deliberately. Sharing resolves the pending
    // report, so by the time this state exists `report` is already the next queued report or
    // null — guarding first would unmount the follow-up the instant it appeared.
    if (sentReference) {
        const openDiscussion = () => Linking.openURL(buildErrorReportDiscussionUrl(sentReference));
        // Clearing this lets anything queued behind the shared report raise its own prompt.
        const closeFollowUp = () => setSentReference(null);

        return (
            <Modal visible transparent animationType="fade" onRequestClose={() => closeFollowUp()}>
                <View style={styles.backdrop}>
                    <View style={styles.card}>
                        <Text style={styles.title}>{t('mobile.error_report_sent_title')}</Text>
                        <Text style={styles.message}>{t('mobile.error_report_sent_message')}</Text>

                        <Text style={styles.referenceLabel}>
                            {t('mobile.error_report_sent_reference_label')}
                        </Text>
                        {/* Tap the reference itself to copy it. The icon is what makes that
                            discoverable — a bare monospace string does not read as tappable. */}
                        <Pressable
                            onPress={() => copyReference(sentReference)}
                            style={({ pressed }) => [styles.reference, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`${t('mobile.error_report_sent_reference_label')}: ${sentReference}`}
                            accessibilityHint={t('mobile.error_report_sent_copy_hint')}
                        >
                            <Text style={styles.referenceText}>{sentReference}</Text>
                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                        </Pressable>

                        <View style={styles.actions}>
                            <Pressable
                                onPress={() => openDiscussion()}
                                style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.primaryButtonText}>
                                    {t('mobile.error_report_sent_open_discussion')}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => closeFollowUp()}
                                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                                accessibilityRole="button"
                            >
                                <Text style={styles.plainButtonText}>{t('mobile.error_report_sent_done')}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    if (!report) return null;

    const dismiss = () => {
        setShowPayload(false);
        resolvePendingReport(report.fingerprint);
    };

    const handleShare = () => {
        const eventId = sendErrorReport(report);
        dismiss();
        // No reference means nothing to offer, so the prompt just closes as it did before
        // rather than showing a follow-up the user cannot act on.
        if (eventId) setSentReference(eventId);
    };

    const handleAlwaysShare = async () => {
        setShowPayload(false);
        // Consent first, so anything captured while the queue drains passes the gate rather
        // than being queued straight back up.
        await applyErrorReportingConsent(ErrorReportingConsent.ALWAYS);
        for (const queued of takeAllPendingReports()) {
            sendErrorReport(queued);
        }
    };

    const summary = summarize(report.event);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t('mobile.share_error_report_title')}</Text>
                    <Text style={styles.message}>{t('mobile.share_error_report_message')}</Text>

                    {summary && <Text style={styles.summary} numberOfLines={3}>{summary}</Text>}

                    <Pressable
                        onPress={() => setShowPayload((shown) => !shown)}
                        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
                        accessibilityRole="button"
                    >
                        <Ionicons
                            name={showPayload ? 'chevron-down' : 'chevron-forward'}
                            size={16}
                            color={colors.primary}
                        />
                        <Text style={styles.disclosureText}>
                            {showPayload
                                ? t('mobile.share_error_report_hide_payload')
                                : t('mobile.share_error_report_show_payload')}
                        </Text>
                    </Pressable>

                    {showPayload && (
                        <ScrollView style={styles.payloadScroll} contentContainerStyle={styles.payloadContent}>
                            <Text style={styles.payload} selectable>{payload}</Text>
                        </ScrollView>
                    )}

                    <View style={styles.actions}>
                        <Pressable
                            onPress={handleShare}
                            style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
                            accessibilityRole="button"
                        >
                            <Text style={styles.primaryButtonText}>{t('mobile.share_error_report_share')}</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleAlwaysShare}
                            style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
                            accessibilityRole="button"
                        >
                            <Text style={styles.secondaryButtonText}>{t('mobile.share_error_report_always')}</Text>
                        </Pressable>
                        <Pressable
                            onPress={dismiss}
                            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                            accessibilityRole="button"
                        >
                            <Text style={styles.plainButtonText}>{t('mobile.share_error_report_not_now')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors) => StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.xxl,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        backgroundColor: colors.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    message: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        lineHeight: Typography.body * 1.4,
    },
    summary: {
        fontSize: Typography.caption,
        color: colors.text,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
    },
    referenceLabel: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
        color: colors.textMuted,
    },
    reference: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        minHeight: 44,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    // Monospaced to match how the Help screen presents the same string.
    referenceText: {
        flex: 1,
        fontSize: Typography.body,
        fontFamily: 'Courier',
        color: colors.text,
    },
    disclosure: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        minHeight: 44,
    },
    disclosureText: {
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.primary,
    },
    payloadScroll: {
        maxHeight: 220,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.sm,
    },
    payloadContent: {
        padding: Spacing.md,
    },
    payload: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontFamily: 'Courier',
    },
    actions: {
        gap: Spacing.sm,
    },
    button: {
        minHeight: 44,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    primaryButtonText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.background,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    plainButtonText: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
    },
    pressed: {
        opacity: 0.7,
    },
});
