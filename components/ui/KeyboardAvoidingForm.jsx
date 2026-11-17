import {KeyboardAvoidingView, StyleSheet} from "react-native";

export function KeyboardAvoidingForm({children}) {
    return (
        <KeyboardAvoidingView style={styles.flex} behavior="height">
            {children}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
