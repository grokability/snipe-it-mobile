import {View, Text, StyleSheet, Image, RefreshControl, Pressable} from 'react-native';
import {useContext, useState, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";
import {COLORS} from "@/constants/colors";
import {decodeEntity} from "html-entities";
import LottieView from "lottie-react-native";
import {FlashList} from "@shopify/flash-list";

export default function AssetsScreen() {
    const { user } = useContext(AuthContext);
    // console.log(JSON.parse(user));
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [offset, setOffset] = useState(0);

    const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(true);

    const onRefresh = useCallback(async() => {
            setRefreshing(true);
        try {
            await getAssets();
        } finally {
            setRefreshing(false);
        }
    }, [loading]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            setRefreshing(true);
            // hm, just playing around with async stuff
            // to see if i could get the refreshing indicator
            // to show during the useFocusEffect event
            async function test(){
                await getAssets();
            }
            test();
            setRefreshing(false);
        }, [])
    )

    const getAssets = async () => {
        makeRequest({
            url: '/hardware?' +
                'limit=100&' +
                `offset=${offset}&` +
                'sort=created_at&' +
                'order=asc', //this will turn into a builder function
            // to build up the query string
            method: 'get',
            headers: {'Authorization': `Bearer ${user.token}`}
        }).then(res => {
            setData({
                ...data,
                assets: res.rows,
                count: res.total
            });
        }).catch(err => {
            console.log(err);
        })
    }

    const loadMore = async () => {
        console.log("loading more");
        setOffset(offset + 100);
        await getAssets();
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
                    contentContainerStyle={{ paddingBottom: 80 }}
                    style={styles.flatlist}
                    data={data.assets}
                    renderItem={({item}) => <Item
                            id={item.id}
                            asset_tag={item.asset_tag}
                            name={item.model.name}
                            serial={item.serial}
                            image={item.image}
                            checkedOut={item.assigned_to}
                            status={item.status_label}
                            // onEndReached={loadMore()}
                            initialNumToRender={100}
                            onEndReachedThreshold={0.1}
                            onMomentumScrollBegin = {() => {setOnEndReachedCalledDuringMomentum(false)}}
                            onEndReached = {() => {
                                if (onEndReachedCalledDuringMomentum) {
                                    loadMore();    // LOAD MORE DATA
                                    setOnEndReachedCalledDuringMomentum(true);
                                }
                            }
                            }
                        />
                    }
                    keyExtractor={item => item.id}
                    // refreshControl={<LottieView
                    //     source={require('@/assets/spinning_star_eye.json')}
                    //     refreshing={refreshing}
                    //     onRefresh={onRefresh}
                    //     style={{width: "50%", height: "50%"}}
                    //     autoPlay
                    //     loop  />}
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
        fontWeight: 'bold',
    },
    flatlist: {
        flex: 1,
        padding: 5,
        // paddingBottom: 80,
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
        color: COLORS.light.primary,
    },
    itemContainer: {
        width: '100%',
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemPressed: {
        backgroundColor: '#f8f4ff',
        transform: [{ scale: 0.995 }],
    },
    imageContainer: {
        width: '25%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f4ff',
        borderRadius: 8,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    contentContainer: {
        flex: 1,
        gap: 6,
    },
    assetTag: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    assetName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    checkedOutText: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        color: '#6200ee',
        fontWeight: '500',
    },
    availableText: {
        color: '#4CAF50',
        fontWeight: '500',
    },
    notAvailableText: {
        color: '#FF5252',
        fontWeight: '500'
    },
    serialText: {
        fontSize: 12,
        color: '#555',
    },

});