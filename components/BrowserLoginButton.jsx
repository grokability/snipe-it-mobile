import {useContext, useEffect} from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';
import {AuthContext, useAuth} from "@/context/AuthProvider";

WebBrowser.maybeCompleteAuthSession();

// Endpoint
// const discovery = {
//     authorizationEndpoint: 'https://snipe.ngrok.dev' + '/oauth/authorize',
//     tokenEndpoint: 'https://snipe.ngrok.dev' + '/oauth/token', //maybe change this to /oauth/token/refresh ?? // probably not, that probably goes in AuthProvider
//     revocationEndpoint: 'https://snipe.ngrok.dev' + '/oauth/revoke' //+ id, //will have to get the id back later
//
//     // revocationEndpoint: 'https://github.com/settings/connections/applications/<CLIENT_ID>',
// };

const BrowserLoginButton = ({ domain }) => {
    const { oAuthLogin } = useContext(AuthContext);
    // Endpoint
    const discovery = {
        authorizationEndpoint: domain + '/oauth/authorize',
        tokenEndpoint: domain + '/oauth/token', //maybe change this to /oauth/token/refresh ?? // probably not, that probably goes in AuthProvider
        revocationEndpoint: domain + '/oauth/revoke' //+ id, //will have to get the id back later

        // revocationEndpoint: 'https://github.com/settings/connections/applications/<CLIENT_ID>',
    };

    const redirectUri = makeRedirectUri({
        native: 'com.grokability.snipeitmobile://home'
    })

    const [request, response, promptAsync] = useAuthRequest(
        {
            prompt: 'login',
            usePKCE: true,
            responseType: 'code',
            clientId: '9999',
            redirectUri: redirectUri
        },
        discovery
    );

    const handleLogin = async () => {


        const result = await promptAsync()

        console.log("manual prompt", result);

        if (result?.type === 'success') {
            const { code } = result.params;
            console.log("success result", result)
            oAuthLogin(domain, code, request.codeVerifier);
        }
    }

    // const redirectUri = makeRedirectUri({
    //     scheme: 'com.grokability.snipeitmobile',
    //     path: 'home',
    // })



    // console.log("generated redirect uri", redirectUri);




    // useEffect(() => {
    //     console.log(response);
    //     if (response?.type === 'success') {
    //         const { code } = response.params;
    //         console.log(response)
    //         oAuthLogin(domain, code, request.codeVerifier);
    //     }
    // }, [response]);

    return (
        <Button
            disabled={!request}
            title="Login"
            // onPress={() => {
            //     promptAsync();
            // }}
            onPress={handleLogin}
        />
    );
}

export default BrowserLoginButton;