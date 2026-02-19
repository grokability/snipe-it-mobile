import React, {useEffect} from 'react'
import {Text} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";

export default function RequestedAssets() {

    useEffect(() => {
        getRequestedAssets();
    }, []);

    const getRequestedAssets = () => {
        makeRequest({
            url: '/hardware/requested',
            method: 'GET',
        })
    }

  return (
    <Text>RequestedAssets</Text>
  )
}