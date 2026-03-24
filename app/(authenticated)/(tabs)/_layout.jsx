import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useContext} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {DynamicColorIOS, Platform} from 'react-native';
import {NativeTabs} from "expo-router/unstable-native-tabs";
import {useTranslation} from "react-i18next";

export default function TabLayout() {
    const { user } = useContext(AuthContext);
    const { t } = useTranslation();
    return (
            <NativeTabs
                labelStyle={{
                    // For the text color
                    color:
                        Platform.OS === 'ios' &&
                        DynamicColorIOS({
                        dark: 'black',
                        light: 'black',
                    }),
                }}
                iconColor={
                    Platform.OS === 'ios' &&
                    DynamicColorIOS({
                    dark: '#8E8E93',
                    light: '#8E8E93',
                })}
                // For the selected icon color
                tintColor={
                    Platform.OS === 'ios' &&
                    DynamicColorIOS({
                    dark: 'purple',
                    light: 'purple',
                })}
                labelVisibilityMode="labeled"
            >
                <NativeTabs.Trigger name="home">
                    <NativeTabs.Trigger.Label>{t('general.dashboard')}</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={FontAwesome} name="home" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(assets)">
                    <NativeTabs.Trigger.Label>{t('general.assets')}</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={FontAwesome} name="barcode" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(accessories)">
                    <NativeTabs.Trigger.Label>{t('general.accessories')}</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={FontAwesome} name="keyboard-o" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="consumables">
                    <NativeTabs.Trigger.Label>{t('general.consumables')}</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={FontAwesome} name="tint" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(more)">
                    <NativeTabs.Trigger.Label>{t('mobile.more')}</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Icon sf="ellipsis" md="more_horiz" />
                </NativeTabs.Trigger>

            </NativeTabs>
    );
}
