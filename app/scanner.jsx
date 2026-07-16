import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
    Alert,
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
import * as SecureStore from 'expo-secure-store';
import BarcodeOverlay from "@/components/camera/BarcodeOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { extractIdFromScannedData, isScannedUrlForCurrentInstance, fetchAssetTagForBarcode } from "@/helpers/scannerUtils";

const BARCODE_STALE_MS = 800; // Drop the overlay if its barcode hasn't been re-detected within this window
const BOUNDS_SMOOTHING_ALPHA = 0.35; // Lower = smoother/more lag, higher = snappier/more jitter

// Detected bounds are noisy frame-to-frame (autofocus, hand tremor, detector variance);
// blend toward the new position instead of snapping to it to keep the highlight box steady.
const smoothBounds = (prevBounds, nextBounds) => ({
    origin: {
        x: prevBounds.origin.x + (nextBounds.origin.x - prevBounds.origin.x) * BOUNDS_SMOOTHING_ALPHA,
        y: prevBounds.origin.y + (nextBounds.origin.y - prevBounds.origin.y) * BOUNDS_SMOOTHING_ALPHA,
    },
    size: {
        width: prevBounds.size.width + (nextBounds.size.width - prevBounds.size.width) * BOUNDS_SMOOTHING_ALPHA,
        height: prevBounds.size.height + (nextBounds.size.height - prevBounds.size.height) * BOUNDS_SMOOTHING_ALPHA,
    },
});

export default function Home() {
    const { mode } = useLocalSearchParams();
    const { t } = useTranslation();
    const isAuditMode = mode === 'audit';
    const [permission] = useCameraPermissions();

    const [barcodes, setBarcodes] = useState([]);
    const [scanningPaused, setScanningPaused] = useState(false);
    const [assetTags, setAssetTags] = useState({});
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();
    const cameraRef = useRef(null);
    const isSelectingRef = useRef(false);
    const domainRef = useRef(null);
    const fetchingAssetTagsRef = useRef(new Set());

    useEffect(() => {
        SecureStore.getItemAsync('domain').then(domain => {
            domainRef.current = domain;
        });
    }, []);

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

    // Drop highlight boxes for barcodes that are no longer visible in-frame
    useEffect(() => {
        if (scanningPaused) return;
        const pruneInterval = setInterval(() => {
            const cutoff = Date.now() - BARCODE_STALE_MS;
            setBarcodes(prevBarcodes => prevBarcodes.filter(barcode => barcode.lastSeenAt >= cutoff));
        }, 300);

        return () => clearInterval(pruneInterval);
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

    // Looks up the asset_tag for a newly-detected barcode so BarcodeOverlay can label it.
    // Caches by scanned data and dedupes in-flight lookups so rapid re-detection of the
    // same barcode doesn't spam the API.
    const fetchAssetTag = useCallback((data) => {
        if (fetchingAssetTagsRef.current.has(data) || assetTags[data] !== undefined) return;

        fetchingAssetTagsRef.current.add(data);
        fetchAssetTagForBarcode(data, domainRef.current)
            .then(assetTag => {
                if (assetTag) {
                    setAssetTags(prev => ({ ...prev, [data]: assetTag }));
                }
            })
            .catch(() => {})
            .finally(() => fetchingAssetTagsRef.current.delete(data));
    }, [assetTags]);

    const handleBarcodeScan = useCallback((barcode) => {
        // pdf417/code39/codabar are decoded by the ZXing fallback provider, which only
        // reports { type, data } — no bounds — so they can't be placed as a highlight box
        // just a weird limitation of a very old barcode, nevertheless while continuous scanning
        // it'll pick up and think it's a possibility sometimes, so we need to include !barcode.bounds here.
        // (including this note on the off chance it ever actually comes up)
        if (scanningPaused || !barcode || !barcode.bounds) return;
        const lastSeenAt = Date.now();
        setBarcodes(prevBarcodes => {
            const existing = prevBarcodes.find(prevBarcode => prevBarcode.data === barcode.data);
            if (!existing) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                fetchAssetTag(barcode.data);
            }
            const bounds = existing ? smoothBounds(existing.bounds, barcode.bounds) : barcode.bounds;
            const otherBarcodes = prevBarcodes.filter(prevBarcode => prevBarcode.data !== barcode.data);
            return [...otherBarcodes, { ...barcode, bounds, lastSeenAt }];
        });
    }, [scanningPaused, fetchAssetTag]);

    const handleBarcodeSelect = async (data) => {
        if (!data) {
            clearBarcodes();
            return;
        }

        // Guard against a second tap (on another still-visible box) firing while this
        // selection is still awaiting the domain check / navigating
        if (isSelectingRef.current) return;
        isSelectingRef.current = true;

        // Pause scanning immediately so the confirmed code isn't re-detected mid-navigation
        setScanningPaused(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        const { id, url } = extractIdFromScannedData(data);
        const storedDomain = await SecureStore.getItemAsync('domain');

        if (!isScannedUrlForCurrentInstance(url, storedDomain)) {
            clearBarcodes();
            Alert.alert(
                t('mobile.scan_domain_mismatch_title'),
                t('mobile.scan_domain_mismatch_message'),
                [{ text: t('general.ok') }]
            );
            return;
        }

        setBarcodes([]);

        if (isAuditMode) {
            router.replace(`/(authenticated)/audit/confirm?asset_id=${encodeURIComponent(id)}&from_scanner=true`);
            return;
        }

        setTimeout(async () => {
            await router.replace(`(tabs)/(assets)/${id}`);
        }, 300);
    };

    const clearBarcodes = () => {
        setBarcodes([]);
        setScanningPaused(false);
        isSelectingRef.current = false;
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
                barcodes={barcodes.map(barcode => ({ ...barcode, assetTag: assetTags[barcode.data] }))}
                onBarcodeSelect={handleBarcodeSelect}
            />

            {!scanningPaused && barcodes.length === 0 && (
                <View style={[styles.hintContainer, { bottom: insets.bottom + 20 }]}>
                    <Text style={styles.hintText}>{t('mobile.scan_hint')}</Text>
                </View>
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
    hintContainer: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    hintText: {
        color: 'white',
        fontSize: 14,
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