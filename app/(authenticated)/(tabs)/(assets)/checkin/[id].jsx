import React, {useContext, useMemo} from 'react';
import {Text, Button, StyleSheet} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export default function CheckinScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    function checkin() {
        console.log('checkin');
        makeRequest({
            url: `/hardware/${id}/checkin`,
            method: 'POST',
            data: {
                status_id: 1,
            }
        })
            .then(res => {
                console.log(res);
                router.replace(`/(tabs)/(assets)/${id}`)
            })
            .catch(err => {
                console.log(err);
            });
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <Text style={styles.title}>{t('checkin.title', { id })}</Text>
            <Button title={t('common.checkin')} onPress={() => checkin()} />
        </SafeAreaProvider>
    )
}
const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        color: colors.text,
        marginBottom: Spacing.lg,
    },
})
