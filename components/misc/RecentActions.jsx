import React, {useCallback, useMemo, useState} from 'react';
import {Button, Pressable, StyleSheet, Text, View} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";
import {useFocusEffect} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

const RecentActions = () => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const [data, setData] = useState({})
    const [loading, setLoading] = useState(true);
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
            <Text style={styles.title}>{t('mobile.recent_actions')}</Text>
            <View style={styles.list}>
                {data.actions?.slice(0, 5).map((item) => (
                    <Item
                        key={item.id}
                        id={item.id}
                        action_type={item.action_type}
                        created_by={item.created_by?.name}
                    />
                ))}
            </View>
            <Button title={t('mobile.show_more')} onPress={() => console.log('show action log index')} />
        </View>

    )
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
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
