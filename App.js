import React from "react";
import {Text, View} from "react-native";


import { registerRootComponent } from "expo";

function App() {
    return (
    <View>
    <Text>Hello World</Text>
    </View>)
}

// Ensure the app is properly registered
registerRootComponent(App);

export default App;


// export default function App() {
//     return (
//         // <AuthProvider>
//         //     <ExpoRouter />
//         // </AuthProvider>
//         <View>
//             <Text>Hello World</Text>
//         </View>
//     );
// }
