import {useMemo} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet} from 'react-native';
import {useColors} from '@/hooks/useThemeColors';

export function LoadingScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            scrollEnabled={false}
        >
            <ActivityIndicator size="large" color={colors.primary} />
        </ScrollView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
