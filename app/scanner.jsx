import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
    AppState,
    Linking,
    Platform,
    StatusBar,
    StyleSheet,
    View,
    Text,
    TouchableOpacity
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from 'expo-haptics';
import BarcodeOverlay from "@/components/camera/BarcodeOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function Home() {
    const { mode } = useLocalSearchParams();
    const { t } = useTranslation();
    const isAuditMode = mode === 'audit';
    const [permission] = useCameraPermissions();

    const [barcodes, setBarcodes] = useState([]);
    const [scanningPaused, setScanningPaused] = useState(false);
    const [scanCount, setScanCount] = useState(0);
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();
    const cameraRef = useRef(null);
    const scanTimerRef = useRef(null);
    const maxBarcodesShown = 8; // Limit the number of barcodes shown at once

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

    // Implement scanning interval to refresh detection
    useEffect(() => {
        // Start a periodic scanning reset timer
        if (!scanningPaused) {
            scanTimerRef.current = setInterval(() => {
                // Clear barcodes periodically to get fresh scans
                setBarcodes([]);
                setScanCount(prev => prev + 1);
            }, 3000); // Reset every 3 seconds
        } else {
            // Clear the timer when scanning is paused
            if (scanTimerRef.current) {
                clearInterval(scanTimerRef.current);
                scanTimerRef.current = null;
            }
        }

        return () => {
            if (scanTimerRef.current) {
                clearInterval(scanTimerRef.current);
                scanTimerRef.current = null;
            }
        };
    }, [scanningPaused]);

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

    const handleBarcodeScan = useCallback((barcode) => {
        if (scanningPaused || !barcode) return;
        setBarcodes(prevBarcodes => {
            const exists = prevBarcodes.some(existing => existing.data === barcode.data);
            if (!exists) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const newBarcodes = [...prevBarcodes, barcode];
                if (newBarcodes.length >= maxBarcodesShown) {
                    setScanningPaused(true);
                }
                return newBarcodes.slice(0, maxBarcodesShown);
            }
            return prevBarcodes;
        });
    }, [scanningPaused]);

    const handleBarcodeSelect = (data) => {
        if (data) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            if (isAuditMode) {
                // In audit mode, extract the asset ID from the scanned value
                let id = data;
                try {
                    const parsedUrl = new URL(data);
                    const segments = parsedUrl.pathname.split("/");
                    id = segments[segments.length - 1];
                } catch {
                    // Not a URL — use raw value as ID
                }
                clearBarcodes();
                router.replace(`/(authenticated)/audit/confirm?asset_id=${encodeURIComponent(id)}&from_scanner=true`);
                return;
            }

            try {
                const parsedUrl = new URL(data);
                const segments = parsedUrl.pathname.split("/");
                const id = segments[segments.length - 1];

                setTimeout(async () => {
                    await router.replace(`(tabs)/(assets)/${id}`);
                }, 300);
            } catch (error) {
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

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.permissionContainer]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.permissionTitle}>{t('mobile.camera_permission_denied')}</Text>
                <Text style={styles.permissionDetail}>{t('mobile.camera_permission_denied_detail')}</Text>
                <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
                    <Text style={styles.settingsButtonText}>{t('mobile.open_settings')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                onBarcodeScanned={handleBarcodeScan}
                onCameraReady={() => {}}
            />

            {/* Close button */}
            <TouchableOpacity
                style={[styles.closeButton, { top: insets.top + 8 }]}
                onPress={() => router.back()}
            >
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Audit mode banner */}
            {isAuditMode && (
                <View style={[styles.auditBanner, { top: insets.top }]}>
                    <Text style={styles.auditBannerText}>{t('mobile.audit_mode')}</Text>
                </View>
            )}

            {/* Barcode Mask Overlay */}
            <BarcodeOverlay
                barcodes={barcodes}
                onBarcodeSelect={handleBarcodeSelect}
                clearBarcodes={clearBarcodes}
            />

            {!scanningPaused && barcodes.length < maxBarcodesShown && (
                <View style={[styles.scanningIndicator, { bottom: insets.bottom + 20 }]}>
                    <Text style={styles.scanningText}>
                        Scanning... ({barcodes.length}/{maxBarcodesShown})
                    </Text>
                </View>
            )}

            {scanningPaused && barcodes.length >= maxBarcodesShown && (
                <TouchableOpacity 
                    style={[styles.rescanButton, { bottom: insets.bottom + 20 }]}
                    onPress={clearBarcodes}
                >
                    <Text style={styles.rescanButtonText}>
                        Rescan ({barcodes.length} found)
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    permissionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    permissionDetail: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    settingsButton: {
        marginTop: 8,
        backgroundColor: 'white',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
    },
    settingsButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '600',
    },
    camera: {
        flex: 1,
    },
    scanningIndicator: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    scanningText: {
        color: 'white',
        fontSize: 14,
    },
    rescanButton: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 150, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    rescanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        left: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    auditBanner: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#6200ee',
        paddingVertical: 8,
        alignItems: 'center',
        zIndex: 10,
    },
    auditBannerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});