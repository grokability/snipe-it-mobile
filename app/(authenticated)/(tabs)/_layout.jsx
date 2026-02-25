import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useContext} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {DynamicColorIOS, Platform} from 'react-native';
import {NativeTabs, Label, Icon, VectorIcon} from "expo-router/unstable-native-tabs";
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
                    <Label>{t('general.dashboard')}</Label>
                    <Icon src={<VectorIcon family={FontAwesome} name="home" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(assets)">
                    <Label>{t('general.assets')}</Label>
                    <Icon src={<VectorIcon family={FontAwesome} name="barcode" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(accessories)">
                    <Label>{t('general.accessories')}</Label>
                    <Icon src={<VectorIcon family={FontAwesome} name="keyboard-o" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="consumables">
                    <Label>{t('general.consumables')}</Label>
                    <Icon src={<VectorIcon family={FontAwesome} name="tint" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="components">
                    <Label>{t('general.components')}</Label>
                    <Icon src={<VectorIcon family={FontAwesome} name="hdd-o" />} />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="search" role="search">
                    <Label>{t('general.search')}</Label>
                </NativeTabs.Trigger>
            </NativeTabs>
    );
}
