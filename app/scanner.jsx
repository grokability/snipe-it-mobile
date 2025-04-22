import { CameraView } from "expo-camera";
import { router, Stack } from "expo-router";
import {
    AppState,
    Platform,
    StatusBar,
    StyleSheet,
    View
} from "react-native";
import { useEffect, useRef, useState } from "react";
import * as Haptics from 'expo-haptics';
import BarcodeOverlay from "@/components/camera/BarcodeOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
    const [barcodes, setBarcodes] = useState([]);
    const [scanningPaused, setScanningPaused] = useState(false);
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();
    const cameraRef = useRef(null);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                // Reset when app comes back to foreground
                clearBarcodes();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // Add a timer to clear barcodes and resume scanning when in paused state
    useEffect(() => {
        let rescanTimer;
        if (scanningPaused) {
            rescanTimer = setTimeout(() => {
                clearBarcodes();
            }, 5000); // 5 seconds timeout for automatic resume
        }
        
        return () => {
            if (rescanTimer) clearTimeout(rescanTimer);
        };
    }, [scanningPaused]);

    const handleBarcodeScan = (barcode) => {
        if (!scanningPaused && barcode) {
            // Add to barcodes if not already included
            setBarcodes(prevBarcodes => {
                // Check if barcode already exists
                const exists = prevBarcodes.some(existing => existing.data === barcode.data);
                if (!exists) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setScanningPaused(true);
                    return [...prevBarcodes, barcode];
                }
                return prevBarcodes;
            });
        }
    };

    const handleBarcodeSelect = (data) => {
        if (data) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
                const parsedUrl = new URL(data);
                const segments = parsedUrl.pathname.split("/");
                const id = segments[segments.length - 1];

                setTimeout(async () => {
                    console.log(id);
                    await router.replace(`(tabs)/(assets)/${id}`);
                }, 300);
            } catch (error) {
                console.log("Invalid URL format:", error);
                // Handle non-URL QR codes if needed
                router.replace(`(tabs)/(assets)/${data}`);
            }
        }
        clearBarcodes();
    };

    const clearBarcodes = () => {
        setBarcodes([]);
        setScanningPaused(false);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Overview",
                    headerShown: false,
                }}
            />
            {Platform.OS === "android" ? <StatusBar hidden /> : null}
            <CameraView
                ref={cameraRef}
                barcodeScannerSettings={{
                    barcodeTypes: ['aztec', 'ean13', 'ean8', 'qr', 'pdf417', 'upc_e', 'datamatrix', 'code39', 'code93', 'itf14', 'codabar', 'code128', 'upc_a'],
                    isHighlightingEnabled: false,
                }}
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanningPaused ? undefined : handleBarcodeScan}
                onCameraReady={() => console.log("Camera ready")}
            />

            {/* Barcode Mask Overlay */}
            <BarcodeOverlay
                barcodes={barcodes}
                onBarcodeSelect={handleBarcodeSelect}
                clearBarcodes={clearBarcodes}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    }
});