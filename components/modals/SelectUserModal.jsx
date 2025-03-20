import {FlatList, Modal, TextInput, View, Text, SafeAreaView, Button} from "react-native";
import {makeRequest} from "@/helpers/axiosConfig";
import {useState} from "react";

export default function SelectUserModal({parentVisible}) {
    const [users, setUsers] = useState([])
    const [visible, setVisible] = useState(false);

    const Item = ({item, name, email}) => {
        return (
            <View>
                <Text>{name}</Text>
                <Text>{email}</Text>
            </View>
        )
    }



    const getUsers = () => {
        makeRequest({
            method: 'get',
            url: '/users',
            headers: {'Authorization': `Bearer ${user.token}`}
        }).then(response => {
            console.log(response);
            setUsers(response.rows)
        }).catch(error => {
            console.log(error);
        })
     }

    return (
        <SafeAreaView>
            <Modal visible={visible || parentVisible} animationType="slide">
                <SafeAreaView>

                    <Button title={'Close'} onPress={setVisible(false)} />
                    <TextInput
                        placeholder="Search"
                        onChangeText={text => {
                            makeRequest({
                                method: 'get',
                                url: `/users?search=${text}`,
                                headers: {'Authorization': `Bearer ${user.token}`}
                            }).then(response => {
                                console.log(response);
                                setUsers(response.rows)
                            })
                        }}
                    />
                    <Text>User Modal</Text>
                    <FlatList data={users} renderItem={({item}) => <Item item={item} name={item.name} email={item.email}/>} keyExtractor={item => item.id}/>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    )
}