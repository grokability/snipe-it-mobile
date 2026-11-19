// Stops linking expo-camera's ZXing barcode provider on iOS, so AVFoundation reads Code 39, PDF417
// and Codabar itself. The provider returns those codes with zero-size bounds, which the scanner
// can't draw a tap target for; AVFoundation returns real bounds for all three.
//
// Since SDK 58 the provider is an optional companion pod (ExpoCameraBarcodeScanning) that is linked
// unless this Podfile property is "false", and scanning starts without it. expo-camera's own
// `barcodeScannerEnabled: false` option can't be used: it also sets the Gradle property that drops
// ML Kit on Android, which does all of Android's scanning.
// See node_modules/expo-camera/spm.config.json (autolinkWhen) and ios/Current/BarcodeScanner.swift.
//
// List this plugin BEFORE expo-camera in app.json. expo-camera deletes the property when its own
// option is left on, and mods for the same file run last-listed first, so listed after it this
// plugin's value would be deleted.
const { withPodfileProperties } = require('expo/config-plugins');

const BARCODE_SCANNER_KEY = 'expo.camera.barcode-scanner-enabled';

module.exports = function withoutIosZXingBarcodeProvider(config) {
    return withPodfileProperties(config, (config) => {
        config.modResults[BARCODE_SCANNER_KEY] = 'false';

        return config;
    });
};
