import { useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Burnt from 'burnt';
import { useTranslation } from 'react-i18next';

// Copying the reference is offered in two places — the prompt shown right after a report is
// shared, and the Help screen — and both owe the user the same confirmation. One copy of it
// here keeps the toast from drifting apart between them.
//
// The strings still carry their original `help_` names because that is where this started and
// renaming a key orphans its Crowdin translations.
export function useCopyErrorReportReference() {
    const { t } = useTranslation();

    return useCallback(async (eventId) => {
        const copied = await Clipboard.setStringAsync(eventId);
        Burnt.toast({
            title: copied ? t('mobile.help_error_reference_copied') : t('general.error'),
            preset: copied ? 'done' : 'error',
            duration: 1.5,
        });
    }, [t]);
}
