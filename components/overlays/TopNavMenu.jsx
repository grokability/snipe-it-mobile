import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {ContextMenu, Button} from '@expo/ui/jetpack-compose';
import {useColors} from "@/hooks/useThemeColors";
import {BorderRadius} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export default function TopNavMenu() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    return (
        <ContextMenu>
            <ContextMenu.Trigger>
                <Button
                    variant={'default'}
                    systemImage={"filled.MoreVert"}
                    elementColors={{ contentColor: colors.text }}
                />
            </ContextMenu.Trigger>
            <ContextMenu.Items>
                <Button
                    onPress={() => router.push('/(authenticated)/(tabs)/home')}
                    elementColors={{ contentColor: colors.text }}
                >
                    {t('nav.home')}
                </Button>
                <Button
                    onPress={() => router.push('/(authenticated)/licenses')}
                    elementColors={{ contentColor: colors.text }}
                >
                    {t('nav.license')}
                </Button>
                <Button
                    onPress={() => router.push('/(authenticated)/settings')}
                    elementColors={{ contentColor: colors.text }}
                >
                    {t('nav.settings')}
                </Button>
            </ContextMenu.Items>
        </ContextMenu>
    );
}

const createStyles = (colors) => StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        textColor: colors.text,
        elevation: 2,
    },
});
