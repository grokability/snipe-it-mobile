import { useLayoutEffect } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { decode } from "html-entities";
import { useTranslation } from "react-i18next";
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import AssetList from "@/components/assets/AssetList";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

// The Assets tab's list, limited to the assets checked out to this user
export default function UserAssetsScreen() {
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
            headerTitle: firstName ? t('mobile.user_assets', { firstName: decode(firstName) }) : t('general.assets'),
        });
    }, [navigation, firstName, t]);

    return <AssetList assignedUserId={id} />;
}
