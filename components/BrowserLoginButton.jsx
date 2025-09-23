// import React, { useState } from 'react';
// import { Button, Text } from 'react-native';
// import * as WebBrowser from "expo-web-browser";
//
// const BrowserLoginButton = ({ domain }) => {
//     const [result, setResult] = useState(null);
//
//     const handleBrowserOpen = async () => {
//         console.log('open browser');
//         let result = await WebBrowser.openAuthSessionAsync(
//             domain + '/login?client=Snipe-IT-Mobile',
//             'com.grokability.snipeitmobile://**'
//         );
//         setResult(result);
//     };
//
//     return (
//         <>
//             <Button title="Open SnipeLogin" onPress={handleBrowserOpen} />
//             <Text>{result && JSON.stringify(result)}</Text>
//         </>
//     );
// };
//
// export default BrowserLoginButton;
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
    authorizationEndpoint: 'https://snipe.ngrok.dev' + '/login?client=Snipe-IT-Mobile&',
    tokenEndpoint: 'https://snipe.ngrok.dev' + '/oauth/token',
    // revocationEndpoint: 'https://github.com/settings/connections/applications/<CLIENT_ID>',
};

const BrowserLoginButton = ({ domain }) => {
    const [request, response, promptAsync] = useAuthRequest(
        {

            clientId: 'CLIENT_ID',
            scopes: ['identity'],
            redirectUri: makeRedirectUri({
                scheme: 'com.grokability.snipeitmobile'
            }),
        },
        discovery
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
        }
    }, [response]);

    return (
        <Button
            disabled={!request}
            title="Web Login"
            onPress={() => {
                promptAsync();
            }}
        />
    );
}

export default BrowserLoginButton;