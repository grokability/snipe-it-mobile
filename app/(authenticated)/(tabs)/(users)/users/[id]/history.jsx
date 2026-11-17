import { useLayoutEffect } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { decode } from "html-entities";
import { useTranslation } from "react-i18next";
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import ActivityReportList from "@/components/reports/ActivityReportList";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

// The Activity Report, limited to this user's history
export default function UserHistoryScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams();

    // Same query as the User screen, so coming from there the name is already cached
    const userQuery = useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => makeRequest({ url: `/users/${id}`, method: 'get', permissionKey: PERMISSIONS.USERS_VIEW }),
    });

    const firstName = userQuery.data?.first_name || userQuery.data?.name;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: firstName ? t('mobile.user_history', { firstName: decode(firstName) }) : t('general.history'),
        });
    }, [navigation, firstName, t]);

    return <ActivityReportList itemType="user" itemId={id} />;
}
