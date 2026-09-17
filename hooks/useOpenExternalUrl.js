import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Burnt from 'burnt';
import { useTranslation } from 'react-i18next';

// Linking.openURL rejects when the platform refuses to open a URL. Unhandled, that becomes an
// unhandled promise rejection, so a tap that appears to do nothing quietly files an error
// report of its own. Every link out of the app goes through here instead: the failure is shown,
// and the URL is offered on the clipboard so the user can still reach it in a browser.
export function useOpenExternalUrl() {
    const { t } = useTranslation();

    return useCallback(async (url) => {
        try {
            await Linking.openURL(url);
        } catch {
            const copyUrl = async () => {
                const copied = await Clipboard.setStringAsync(url);
                Burnt.toast({
                    title: copied ? t('mobile.open_link_copied') : t('general.error'),
                    preset: copied ? 'done' : 'error',
                    duration: 1.5,
                });
            };

            // The URL sits in the message rather than only on the clipboard, so the user can
            // read where they were being sent before deciding to copy it.
            Alert.alert(
                t('mobile.open_link_failed_title'),
                `${t('mobile.open_link_failed_message')}\n\n${url}`,
                [
                    { text: t('mobile.open_link_copy'), onPress: () => copyUrl() },
                    { text: t('general.close'), style: 'cancel' },
                ]
            );
        }
    }, [t]);
}
