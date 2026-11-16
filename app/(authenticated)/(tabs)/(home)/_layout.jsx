import {Stack} from 'expo-router';
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";

export default function HomeLayout() {
    const stackHeaderOptions = useStackHeaderOptions();

    return (
        <Stack screenOptions={stackHeaderOptions} />
    );
}
