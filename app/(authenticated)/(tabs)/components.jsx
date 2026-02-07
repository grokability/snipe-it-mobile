import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {getComponentIds} from "expo-router/build/rsc/router/common";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

export default function ComponentsScreen() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getComponents = useCallback(() => {
        setLoading(true);
        return makeRequest({
            method: 'get',
            url: '/components'
        })
            .then(res => {
                setData({
                    components: res.rows,
                    count: res.total
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getComponents()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getComponents]);

    useEffect(() => {
        getComponents();
    }, []);

    const Item = ({image, name, qty}) => (
        <View style={styles.itemContainer}>
            <Image style={styles.image} src={image} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.name}>Qty: {qty}</Text>
        </View>
    );




    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Components Index</Text>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    {data.count > 0 &&
                        <FlatList
                            data={data.components}
                            renderItem={({item}) => <Item
                                image={item.image}
                                name={item.name}
                                qty={item.qty}
                            />}
                            keyExtractor={item => item.id}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ></FlatList>
                    }
                    {data.count === 0 &&
                        <Text style={styles.emptyText}>No components found</Text>
                    }
                </SafeAreaView>
            </SafeAreaProvider>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    itemContainer: {
        padding: Spacing.md,
        marginVertical: Spacing.sm,
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    image: {
        width: 100,
        height: 100,
    },
    name: {
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    emptyText: {
        color: Colors.light.textSecondary,
        fontSize: Typography.body,
    },
});
