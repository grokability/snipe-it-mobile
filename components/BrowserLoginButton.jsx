import React, { useState } from 'react';
import { Button, Text } from 'react-native';
import * as WebBrowser from "expo-web-browser";

const BrowserLoginButton = ({ domain }) => {
    const [result, setResult] = useState(null);

    const handleBrowserOpen = async () => {
        console.log('open browser');
        let result = await WebBrowser.openAuthSessionAsync(domain + '/login', domain + '/login');
        setResult(result);
    };

    return (
        <>
            <Button title="Open SnipeLogin" onPress={handleBrowserOpen} />
            <Text>{result && JSON.stringify(result)}</Text>
        </>
    );
};

export default BrowserLoginButton;