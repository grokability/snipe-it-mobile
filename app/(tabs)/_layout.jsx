import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import {Platform} from 'react-native';

console.log('tab layout rendered')
export default function TabLayout() {
    return (
            <Tabs screenOptions={{ tabBarActiveTintColor: 'purple',
                headerShown: false,
                // tabBarButton: HapticTab,
                // tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: 'absolute',
                    },
                    default: {},
                }),
            }}>
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="(assets)"
                    options={{
                        title: 'Assets',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="barcode" color={color} />,
                    }}
                />

                <Tabs.Screen
                    name="licenses"
                    options={{
                        title: 'Licenses',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="floppy-o" color={color} />,
                    }}
                    />
                <Tabs.Screen
                    name="accessories"
                    options={{
                        title: 'Accessories',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="keyboard-o" color={color} />,
                    }}
                    />
                <Tabs.Screen
                    name="consumables"
                    options={{
                        title: 'Consumables',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="tint" color={color} />,
                    }}
                    />
                <Tabs.Screen
                    name="components"
                    options={{
                        title: 'Components',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="hdd-o" color={color} />,
                    }}
                    />
                <Tabs.Screen
                    name="settings"
                    options={{
                        // href: null,
                        title: 'Settings',
                        tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} hidden={true}/>,
                    }}
                />
                {/* this is fake and annoying, and i'm confused about why it's necessary, but 🤷‍♂️, it works */}
                <Tabs.Screen
                    name="index"
                    hidden={true}
                    options={{
                       href: null
                    }}
                />
                {/*this one too*/}
                <Tabs.Screen
                    name="(assets)/[id]"
                    hidden={true}
                    options={{
                        href: null
                    }}
                />
            </Tabs>
    );
}