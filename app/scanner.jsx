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
import { useQueries, useQueryClient } from "@tanstack/react-query";
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import BarcodeOverlay from "@/components/camera/BarcodeOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
    classifyBarcodeSymbology,
    resolveScannedAsset,
    scannedItemHref,
    scannedItemQueryOptions,
} from "@/helpers/scannerUtils";
import { assetKeys, scanKeys } from "@/helpers/queryKeys";

const BARCODE_STALE_MS = 800; // Drop the overlay if its barcode hasn't been re-detected within this window
const BOUNDS_SMOOTHING_ALPHA = 0.35; // Lower = smoother/more lag, higher = snappier/more jitter

// expo-camera uses only the wide-angle lens on iOS, so it never switches to macro up close, and on
// Pro iPhones a small label held near the lens stays out of focus. About 1.3-1.7x zoom (iOS maps
// zoom as maxZoom ^ zoom) lets people hold the phone back far enough to focus. Android maps zoom
// linearly to each phone's maximum (8x to 100x), so no fixed value is safe there.
const SCANNER_ZOOM = Platform.OS === 'ios' ? 0.1 : 0;

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

// The overlay names what a code opens: an asset's tag, or an accessory's or consumable's name.
// An item that isn't found comes back as { status: 'error' }, which has no name.
const overlayLabel = (scanResolution) => {
    if (scanResolution?.outcome === 'found') {
        return scanResolution.asset.asset_tag;
    }

    return scanResolution?.item?.name;
};

export default function Home() {
    const { mode } = useLocalSearchParams();
    const { t } = useTranslation();
    const isAuditMode = mode === 'audit';
    // Ask on open: "Scan to Audit" and the audit confirm screen open the scanner without asking first,
    // and iOS lists no Camera switch in Settings until the app has asked once
    const [permission, , getPermission] = useCameraPermissions({ request: true });

    const [barcodes, setBarcodes] = useState([]);
    const [scanningPaused, setScanningPaused] = useState(false);
    const appState = useRef(AppState.currentState);
    const insets = useSafeAreaInsets();
    const cameraRef = useRef(null);
    const isSelectingRef = useRef(false);
    const [domain, setDomain] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        SecureStore.getItemAsync('domain').then((storedDomain) => setDomain(storedDomain));
    }, []);

    // Resolves a barcode, and fills the cache the found asset's (and its deleted matches') or item's
    // detail screen reads, so opening it after a scan needs no second request. storedDomain decides
    // whether a scanned URL belongs to this Snipe-IT instance.
    const scanQueryOptions = (barcode, storedDomain) => {
        const symbology = classifyBarcodeSymbology(barcode.type);

        return {
            queryKey: scanKeys.resolution(symbology, barcode.data),
            queryFn: async () => {
                const scanResolution = await resolveScannedAsset(barcode.data, symbology, storedDomain);

                if (scanResolution.outcome === 'found') {
                    [scanResolution.asset, ...scanResolution.deletedMatches].forEach((asset) => {
                        queryClient.setQueryData(assetKeys.detail(String(asset.id)), asset);
                    });
                }

                const itemQuery = scannedItemQueryOptions(scanResolution);
                // Without the view permission the item goes unnamed; the scan itself still resolved
                const item = itemQuery ? await queryClient.fetchQuery(itemQuery).catch(() => null) : null;

                return { ...scanResolution, item };
            },
        };
    };

    // Resolves each barcode in frame so BarcodeOverlay can label it, once the stored domain is known
    const scanQueries = useQueries({
        queries: barcodes.map((barcode) => ({ ...scanQueryOptions(barcode, domain), enabled: domain !== null })),
    });

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                // Reset when app comes back to foreground
                clearBarcodes();
                // Pick up access granted in Settings. iOS restarts the app when it changes; Android doesn't
                getPermission();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [getPermission]);

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
            }
            const bounds = existing ? smoothBounds(existing.bounds, barcode.bounds) : barcode.bounds;
            const otherBarcodes = prevBarcodes.filter(prevBarcode => prevBarcode.data !== barcode.data);
            return [...otherBarcodes, { ...barcode, bounds, lastSeenAt }];
        });
    }, [scanningPaused]);

    const handleBarcodeSelect = async (barcode) => {
        if (!barcode?.data) {
            clearBarcodes();
            return;
        }

        // Guard against a second tap (on another still-visible box) firing while this
        // selection is still being resolved / navigating
        if (isSelectingRef.current) return;
        isSelectingRef.current = true;

        // Pause scanning immediately so the confirmed code isn't re-detected mid-navigation
        setScanningPaused(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Reuses the overlay's lookup: cached if it landed, awaited if it's still in flight
        let scanResolution;

        try {
            const storedDomain = await SecureStore.getItemAsync('domain');
            scanResolution = await queryClient.fetchQuery(scanQueryOptions(barcode, storedDomain));
        } catch {
            clearBarcodes();
            return;
        }

        if (scanResolution.outcome === 'otherInstance') {
            clearBarcodes();
            Alert.alert(
                t('mobile.scan_domain_mismatch_title'),
                t('mobile.scan_domain_mismatch_message'),
                [{ text: t('mobile.ok') }]
            );
            return;
        }

        const href = scannedItemHref(scanResolution, isAuditMode);

        if (!href) {
            clearBarcodes();
            alertScanNotOpened(scanResolution, barcode.data);
            return;
        }

        setBarcodes([]);

        if (isAuditMode) {
            router.replace(href);
            return;
        }

        setTimeout(async () => {
            await router.replace(href, { withAnchor: true });
        }, 300);
    };

    // Says why a scan didn't open anything. Scanning has already resumed underneath. Outside audit
    // mode, a tag or plain value that found nothing or several assets can be searched for in the
    // asset list, whose search also matches model, manufacturer, location and serial.
    const alertScanNotOpened = (scanResolution, scannedData) => {
        const { outcome, asset, kind, value, matchedBy } = scanResolution;
        const okButton = [{ text: t('mobile.ok') }];
        const canSearchAssets = !isAuditMode && (kind === 'assetTag' || kind === 'ambiguous');
        const searchButtons = canSearchAssets
            ? [
                { text: t('general.cancel'), style: 'cancel' },
                { text: t('mobile.scan_search_assets'), onPress: () => searchAssetsFor(value) },
            ]
            : okButton;

        if (outcome === 'found' && asset.deleted_at) {
            Alert.alert(t('admin.hardware.general.deleted'), undefined, okButton);
            return;
        }

        if (outcome === 'notAsset' && (kind === 'accessoryId' || kind === 'consumableId')) {
            Alert.alert(t('mobile.scan_audit_assets_only'), undefined, okButton);
            return;
        }

        if (outcome === 'notAsset') {
            Alert.alert(t('mobile.scan_not_an_asset'), undefined, okButton);
            return;
        }

        if (outcome === 'multiple') {
            const multipleKey = matchedBy === 'serial' ? 'mobile.scan_multiple_serial' : 'mobile.scan_multiple_tag';
            Alert.alert(t(multipleKey, { value }), undefined, searchButtons);
            return;
        }

        // The scanned value is the title, so people can see what the app read. Android cuts titles
        // off after two lines, too short for the not-found string.
        Alert.alert(
            scannedData,
            t('general.generic_model_not_found', { model: t('general.asset') }),
            searchButtons
        );
    };

    const searchAssetsFor = (value) => {
        setScanningPaused(true);
        setBarcodes([]);
        router.replace(`/(authenticated)/(tabs)/(assets)?search=${encodeURIComponent(value)}`);
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
                zoom={SCANNER_ZOOM}
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
                barcodes={barcodes.map((barcode, index) => ({ ...barcode, label: overlayLabel(scanQueries[index].data) }))}
                onBarcodeSelect={(barcode) => handleBarcodeSelect(barcode)}
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