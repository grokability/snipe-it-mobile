import {View, Text, StyleSheet, Image, RefreshControl, Pressable} from 'react-native';
import {useContext, useState, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {decodeEntity} from "html-entities";
import {FlashList} from "@shopify/flash-list";

export default function AssetsScreen() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [offset, setOffset] = useState(0);

    const getAssets = useCallback(() => {
        setLoading(true);
        return makeRequest({
            url: '/hardware?' +
                'limit=25&' +
                `offset=${offset}&` +
                'sort=created_at&' +
                'order=asc',
            method: 'get'
        })
            .then((res) => {
                setData((existingItems) => {
                    return [...existingItems, ...res.rows]
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [offset]);

    useFocusEffect(
        useCallback(() => {
            getAssets();
        }, [getAssets])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAssets()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getAssets]);

    const loadMore = () => {
        if (loading) return;
        setOffset(offset + 25);
        getAssets();
    }

    const Item = ({id, asset_tag, name, serial, image, checkedOut, status}) => (
        <Pressable
            onPress={() => router.push(`/${id}`)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.imageContainer}>
                <Image style={styles.image} src={image} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.assetTag}>#{asset_tag}</Text>
                <Text style={styles.assetName}>{decodeEntity(name, {level: "xml"})}</Text>
                {checkedOut && (
                    <Text style={styles.checkedOutText}>
                        Checked out to: <Text style={styles.userName}>{checkedOut.name}</Text>
                    </Text>
                )}
                {/* this is only for switching the style, it doesn't really work inline in the style attribute unfortunately */}
                {status.status_type === 'deployable' ?
                    (
                    <Text style={styles.availableText}>{status.name}</Text>
                    ) :
                    <Text style={styles.notAvailableText}>{status.name}</Text>
                }
                <Text style={styles.serialText}>SN: {serial || 'N/A'}</Text>
            </View>
        </Pressable>
    );


    return (
            <SafeAreaProvider>
                <FlashList
                    onEndReached={() => loadMore()}
                    onEndReachedThreshold={0.1}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    style={styles.flatlist}
                    data={data}
                    renderItem={({item}) => <Item
                            id={item.id}
                            asset_tag={item.asset_tag}
                            name={item.model.name}
                            serial={item.serial}
                            image={item.image}
                            checkedOut={item.assigned_to}
                            status={item.status_label}
                        />
                    }
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}  />}

                ></FlashList>
            </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontWeight: FontWeight.bold,
    },
    flatlist: {
        flex: 1,
        padding: 5,
        flexDirection: 'column',
        gap: 5,
        shadowOffset: {
            width: 1,
            height: -1,
        },
        shadowOpacity: 0.10,
        shadowRadius: 20,
    },
    innerText: {
        color: Colors.light.primary,
    },
    itemContainer: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        gap: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemPressed: {
        backgroundColor: Colors.light.backgroundSecondary,
        transform: [{ scale: 0.995 }],
    },
    imageContainer: {
        width: '25%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: BorderRadius.sm,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.sm,
    },
    contentContainer: {
        flex: 1,
        gap: 6,
    },
    assetTag: {
        fontSize: Typography.caption,
        color: Colors.light.textSecondary,
        fontWeight: FontWeight.medium,
    },
    assetName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
    },
    checkedOutText: {
        fontSize: Typography.body,
        color: Colors.light.textSecondary,
    },
    userName: {
        color: Colors.light.primary,
        fontWeight: FontWeight.medium,
    },
    availableText: {
        color: Colors.light.success,
        fontWeight: FontWeight.medium,
    },
    notAvailableText: {
        color: Colors.light.danger,
        fontWeight: FontWeight.medium,
    },
    serialText: {
        fontSize: Typography.caption,
        color: Colors.light.textSecondary,
    },

});
