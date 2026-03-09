import React from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {ContextMenu, Button, Host} from '@expo/ui/jetpack-compose';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function TopNavMenu() {
    const colors = useColors();
    const { t } = useTranslation();

    return (
        <Host matchContents>
            <ContextMenu>
                <ContextMenu.Trigger>
                    <Ionicons name="menu" size={24} color={colors.text} />
                </ContextMenu.Trigger>
                <ContextMenu.Items>
                    <Button
                        onPress={() => router.push('/(authenticated)/(tabs)/home')}
                        elementColors={{ contentColor: colors.text }}
                    >
                        {t('general.dashboard')}
                    </Button>
                    <Button
                        onPress={() => router.push('/(authenticated)/licenses')}
                        elementColors={{ contentColor: colors.text }}
                    >
                        {t('general.license')}
                    </Button>
                    <Button
                        onPress={() => router.push('/(authenticated)/settings')}
                        elementColors={{ contentColor: colors.text }}
                    >
                        {t('general.settings')}
                    </Button>
                </ContextMenu.Items>
            </ContextMenu>
        </Host>
    );
}
