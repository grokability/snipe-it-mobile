import { useContext } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';
import { AuthContext } from "@/context/AuthProvider";
import { useTranslation } from "react-i18next";

WebBrowser.maybeCompleteAuthSession();

const BrowserLoginButton = ({ domain, clientId }) => {
    const { oAuthLogin } = useContext(AuthContext);
    const { t } = useTranslation();
    const discovery = {
        authorizationEndpoint: domain + '/oauth/authorize',
        tokenEndpoint: domain + '/oauth/token',
        revocationEndpoint: domain + '/oauth/revoke'
    };

    const redirectUri = makeRedirectUri({
        native: 'com.grokability.snipeitmobile://home'
    });

    const [request, response, promptAsync] = useAuthRequest(
        {
            prompt: 'login consent',
            usePKCE: true,
            responseType: 'code',
            clientId,
            redirectUri,
            extraParams: {
                client: 'snipe-it-mobile',
            }
        },
        discovery
    );

    const handleLogin = async () => {
        const result = await promptAsync()
        if (result?.type === 'success') {
            const { code } = result.params;
            oAuthLogin(domain, code, request.codeVerifier, clientId);
        }
    }

    return (
        <Button
            disabled={!request}
            title={t('general.sign_in')}
            onPress={handleLogin}
        />
    );
}

export default BrowserLoginButton;
