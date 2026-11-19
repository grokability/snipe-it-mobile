import { useLocalSearchParams } from "expo-router";
import UserItemList from "@/components/users/UserItemList";

export default function UserAccessoriesScreen() {
    const { id } = useLocalSearchParams();

    return <UserItemList userId={id} itemType="accessories" />;
}
