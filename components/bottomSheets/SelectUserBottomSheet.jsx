import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    BottomSheetView,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable, View, StyleSheet, Image} from "react-native";
import React, {forwardRef, useContext, useEffect, useMemo, useState, useImperativeHandle} from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {GestureHandlerRootView} from "react-native-gesture-handler";
// export type Ref = BottomSheet;

const CloseBtn = () => {
    const { close } = useBottomSheet();

    return <Button title="Close" onPress={() => close()} />;
};

const SelectUserBottomSheet = forwardRef((props, ref) => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([])
    const [searchText, setSearchText] = useState('')
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    useEffect(() => {
        fetchUsers();
    }, [searchText])

    const fetchUsers = () => {
        makeRequest({
            url: `/users?sort=display_name&order=asc&search=${searchText}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
            .then((res) => {
                setUsers(res.rows)
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                // Hide the loading animation
                // setLoading(false);
            });
    }

    const selectUser = (user) => {
        props.setSelectedUser(user)
        ref.current.close()
    }

    const Item = ({item}) => {
        return (
            <Pressable
                onPress={() => selectUser(item)}
                style={({pressed}) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed
                ]}
            >
                <View style={styles.imageContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.userImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>
                                {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.userInfoContainer}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email || 'No email provided'}</Text>
                </View>
            </Pressable>
        )
    }


    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
        >
            <GestureHandlerRootView style={styles.container}>
                <Text style={styles.title}>{props.title}</Text>
                {/* we use BottomSheetTextInput to make the BottomSheet aware of the keyboard and expand to accommodate it */}
                <View style={styles.searchContainer}>
                <BottomSheetTextInput
                    style={styles.searchInput}
                    label="Search..."
                    placeholder={'Search...'}
                    onChangeText={(text) => {setSearchText(text)}}
                />
                </View>
                {/*  flatlist  */}
                <BottomSheetFlatList
                    data={users}
                    renderItem={({item}) => <Item item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
                <CloseBtn />
            </GestureHandlerRootView>
        </BottomSheetModal>
    )
})

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.lg,
        color: Colors.light.text,
    },
    searchContainer: {
        marginBottom: Spacing.lg,
    },
    searchInput: {
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.light.backgroundTertiary,
        fontSize: Typography.bodyLarge,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    itemPressed: {
        backgroundColor: Colors.light.backgroundTertiary,
    },
    imageContainer: {
        marginRight: Spacing.md,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
    },
    placeholderImage: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.light.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
        color: Colors.light.textMuted,
    },
    userInfoContainer: {
        flex: 1,
    },
    userName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: Colors.light.text,
    },
    userEmail: {
        fontSize: Typography.body,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectUserBottomSheet;
