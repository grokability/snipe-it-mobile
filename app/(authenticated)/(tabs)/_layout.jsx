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
                labelStyle={{
                    // For the text color
                    color: DynamicColorIOS({
                        dark: 'purple',
                        light: 'purple',
                    }),
                }}
                // For the selected icon color
                tintColor={DynamicColorIOS({
                    dark: 'purple',
                    light: 'purple',
                })}
                // screenOptions={{
                // tabBarActiveTintColor: 'purple',
                // headerShown: false,
                // // tabBarButton: HapticTab,
                // // tabBarBackground: TabBarBackground,
                // tabBarStyle: Platform.select({
                //     ios: {
                //         // Use a transparent background on iOS to show the blur effect
                //         position: 'absolute',
                //     },
                //     default: {},
                // }),
                // }}
            >
                <NativeTabs.Trigger
                    name="home"
                    // options={{
                    //     title: 'Home',
                    // }}
                >
                    <Label>Home</Label>
                    <Icon sf="house" />
                    {/*<FontAwesome size={28} name="home" color="purple" />*/}
                </NativeTabs.Trigger>
                <NativeTabs.Trigger
                    name="(assets)"
                    // headerShown={false}
                    // options={{
                    //     title: 'Assets',
                    //     tabBarIcon: ({ color }) => <FontAwesome size={28} name="barcode" color={color} />,
                    // }}
                >
                    <Label>Assets</Label>
                    <Icon sf="barcode" />
                </NativeTabs.Trigger>

                {/*<Tabs.Screen*/}
                {/*    name="licenses"*/}
                {/*    options={{*/}
                {/*        title: 'Licenses',*/}
                {/*        tabBarIcon: ({ color }) => <FontAwesome size={28} name="floppy-o" color={color} />,*/}
                {/*    }}*/}
                {/*    />*/}
                <NativeTabs.Trigger
                    name="accessories"
                    // options={{
                    //     href: user.permissions?.accessories?.view === -1 || user.permissions?.superuser === 1 ? '/accessories' : null,
                    //     title: 'Accessories',
                    //     tabBarIcon: ({ color }) => <FontAwesome size={28} name="keyboard-o" color={color} />,
                    // }}
                >
                    <Label>Accessories</Label>
                    <Icon sf="keyboard" />
                </NativeTabs.Trigger>
                <NativeTabs.Trigger
                    name="consumables"
                    // options={{
                    //     title: 'Consumables',
                    //     tabBarIcon: ({ color }) => <FontAwesome size={28} name="tint" color={color} />,
                    // }}
                    >
                    <Label>Consumables</Label>
                    <Icon sf="cart" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger
                    name="components"
                    // options={{
                    //     title: 'Components',
                    //     tabBarIcon: ({ color }) => <FontAwesome size={28} name="hdd-o" color={color} />,
                    // }}
                    >
                    <Label>Components</Label>
                    <Icon sf="storefront" />
                </NativeTabs.Trigger>
                {/*<Tabs.Screen*/}
                {/*    name="settings"*/}
                {/*    options={{*/}
                {/*        // href: null,*/}
                {/*        title: 'Settings',*/}
                {/*        tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} hidden={true}/>,*/}
                {/*    }}*/}
                {/*/>*/}
                {/* this is fake and annoying, and i'm confused about why it's necessary, but 🤷‍♂️, it works */}
                {/*<Tabs.Screen*/}
                {/*    name="index"*/}
                {/*    hidden={true}*/}
                {/*    options={{*/}
                {/*       href: null*/}
                {/*    }}*/}
                {/*/>*/}
                {/*this one too*/}
                {/*<Tabs.Screen*/}
                {/*    name="(assets)/[id]"*/}
                {/*    hidden={true}*/}
                {/*    options={{*/}
                {/*        href: null*/}
                {/*    }}*/}
                {/*/>*/}
                <NativeTabs.Trigger
                name="search"
                role="search">
                    <Label>Search</Label>
                </NativeTabs.Trigger>
            </NativeTabs>
    );
}