import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useContext} from "react";
import {AuthContext} from "@/context/AuthProvider";
import { DynamicColorIOS } from 'react-native';
import {NativeTabs, Label, Icon} from "expo-router/unstable-native-tabs";

console.log('TAB LAYOUT MOUNTED')
export default function TabLayout() {
    const { user } = useContext(AuthContext);
    return (
            <NativeTabs
                // labelStyle={{
                //     // For the text color
                //     color: DynamicColorIOS({
                //         dark: 'purple',
                //         light: 'purple',
                //     }),
                // }}
                // // For the selected icon color
                // tintColor={DynamicColorIOS({
                //     dark: 'purple',
                //     light: 'purple',
                // })}
            >
                <NativeTabs.Trigger name="home">
                    <Label>Home</Label>
                    <Icon sf="house" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="(assets)">
                    <Label>Assets</Label>
                    <Icon sf="barcode" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="accessories">
                    <Label>Accessories</Label>
                    <Icon sf="keyboard" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="consumables">
                    <Label>Consumables</Label>
                    <Icon sf="cart" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="components">
                    <Label>Components</Label>
                    <Icon sf="storefront" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="search" role="search">
                    <Label>Search</Label>
                </NativeTabs.Trigger>
            </NativeTabs>
    );
}