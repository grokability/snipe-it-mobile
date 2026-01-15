import {useContext, useEffect} from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';
import {AuthContext, useAuth} from "@/context/AuthProvider";

WebBrowser.maybeCompleteAuthSession();

const BrowserLoginButton = ({ domain }) => {
    const { oAuthLogin } = useContext(AuthContext);
    const discovery = {
        authorizationEndpoint: domain + '/oauth/authorize',
        tokenEndpoint: domain + '/oauth/token',
        revocationEndpoint: domain + '/oauth/revoke'
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
            redirectUri: redirectUri,
            extraParams: {
                client: 'snipe-it-mobile',
            }
        },
        discovery
    );

    const handleLogin = async () => {
        const result = await promptAsync()

        console.log(result);

        if (result?.type === 'success') {
            const { code } = result.params;
            console.log("success result", result)
            oAuthLogin(domain, code, request.codeVerifier);
        }
    }

    return (
        <Button
            disabled={!request}
            title="Login"
            onPress={handleLogin}
        />
    );
}

export default BrowserLoginButton;