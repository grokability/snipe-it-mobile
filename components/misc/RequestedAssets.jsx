import React, {useEffect} from 'react'
import {Text} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";

export default function RequestedAssets() {

    useEffect(() => {
        getRequestedAssets();
    }, []);

    const getRequestedAssets = () => {
        makeRequest({
            url: '/hardware/requested',
            method: 'GET',
            permissionKey: PERMISSIONS.ASSETS_VIEW_REQUESTABLE,
            silent: true,
        })
    }

  return (
    <Text>RequestedAssets</Text>
  )
}