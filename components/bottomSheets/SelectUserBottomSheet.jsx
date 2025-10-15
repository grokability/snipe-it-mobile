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
import {COLORS} from "@/constants/colors";
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
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: COLORS.light.text,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F1F3F5',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E4E7EB',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E7EB',
    },
    itemPressed: {
        backgroundColor: '#F1F3F5',
    },
    imageContainer: {
        marginRight: 12,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    placeholderImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E4E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#687076',
    },
    userInfoContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.light.text,
    },
    userEmail: {
        fontSize: 14,
        color: '#687076',  // Greyed text for email
        marginTop: 2,
    },
    listContent: {
        paddingBottom: 20,
    },
});

export default SelectUserBottomSheet;