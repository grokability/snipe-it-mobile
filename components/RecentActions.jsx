import React, {useCallback, useContext, useMemo, useState} from 'react';
import {Button, FlatList, Pressable, RefreshControl, StyleSheet, Text, View} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";
import {useFocusEffect} from "expo-router";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

const RecentActions = () => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const getRecentActions = useCallback(() => {
        setLoading(true);
        return makeRequest({
            url: '/reports/activity?' +
                'limit=30&' +
                'offset=0&' +
                'sort=created_at&' +
                'order=dsc',
            method: 'get'
        })
            .then(res => {
                setData({
                    actions: res.rows || [],
                });
            })
            .catch(error => {
                console.error('Error fetching recent actions:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            getRecentActions();
        }, [getRecentActions])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getRecentActions()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getRecentActions]);

    const Item = ({id, action_type, created_by }) => (
        <Pressable
            onPress={() => console.log('Pressed:', id)}
            style={styles.item}
        >
            <Text
                adjustsFontSizeToFit={true}
                style={styles.itemText}
            >
                {id} - {action_type} - {created_by}
            </Text>
        </Pressable>
    )

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('recentActions.title')}</Text>
            <FlatList
                data={data.actions?.slice(0, 12)}
                renderItem={({item}) =>
                    <Item
                    id={item.id}
                    action_type={item.action_type}
                    created_by={item.created_by?.name}
                />
                }
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}  />}
                style={styles.list}
                scrollEnabled={true}
                nestedScrollEnabled={true}
            />
            <Button title={t('common.showMore')} onPress={() => console.log('show action log index')} />
        </View>

    )
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        maxHeight: 300,
    },
    title: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        marginBottom: Spacing.sm,
    },
    list: {
        backgroundColor: colors.background,
        flexGrow: 0,
    },
    item: {
        paddingVertical: Spacing.xs,
        backgroundColor: colors.background,
    },
    itemText: {
        fontSize: Typography.body,
        color: colors.text,
    },
});

export default RecentActions;
