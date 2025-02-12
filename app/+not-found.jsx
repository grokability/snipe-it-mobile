import { Link, Stack } from 'expo-router';
import {StyleSheet, Text} from 'react-native';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
                <Text type="title">This screen doesn't exist.</Text>
                <Link href="/(tabs)/home" style={styles.link}>
                    <Text type="link">Go to home screen!</Text>
                </Link>
            <Stack.Screen />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
});
