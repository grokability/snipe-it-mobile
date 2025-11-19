import React, {useCallback, useContext, useState} from 'react';
import {Button, FlatList, Pressable, RefreshControl, Text} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";
import {useFocusEffect} from "expo-router";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";

const RecentActions = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const getRecentActions = async () => {
        setLoading(true);
        try {
            const res = await makeRequest({
                url: '/reports/activity?' +
                    'limit=30&' +
                    'offset=0&' +
                    'sort=created_at&' +
                    'order=dsc',
                method: 'get',
                headers: {'Authorization': `Bearer ${user.token}`}
            });
            setData({
                actions: res.rows || [],
            });
        } catch (error) {
            console.error('Error fetching recent actions:', error);
        } finally {
            setLoading(false);
            console.log(data);
        }
    }

    useFocusEffect(
        useCallback(() => {
            getRecentActions();
        }, [user?.token])
    );

    const onRefresh = useCallback(async() => {
        setRefreshing(true);
        try {
            await getRecentActions();
        } finally {
            setRefreshing(false);
        }
    }, [loading]);

    const Item = ({id, action_type, created_by }) => (
        <Pressable
            onPress={() => console.log('Pressed:', id)}
        >
            <Text
                adjustsFontSizeToFit={true}
            >
                {id} - {action_type} - {created_by}
            </Text>
        </Pressable>
    )

    return (
        <SafeAreaProvider>
            <Text>Recent Actions</Text>
            <FlatList
                data={data.actions}
                renderItem={({item}) =>
                    <Item
                    id={item.id}
                    action_type={item.action_type}
                    created_by={item.created_by?.name}
                />
                }
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}  />}
            />
            <Button title='Show More' onPress={() => console.log('show action log index')} />
        </SafeAreaProvider>

    )
}

export default RecentActions;