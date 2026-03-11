# Snipe-IT Mobile

A React Native mobile app for [Snipe-IT](https://snipeitapp.com), built with Expo.

## Prerequisites

- [Node.js](https://nodejs.org) (LTS)
- [Yarn](https://yarnpkg.com)
- [Xcode](https://developer.apple.com/xcode/) (iOS)
- [Android Studio](https://developer.android.com/studio) (Android)

## Setup

```bash
yarn install
npx expo login
```

## Running the App
**Note:** This is an Expo Dev Build, **not** compatible with Expo Go. 

### Emulator

```bash
npx expo run:ios    # iOS simulator
npx expo run:android  # Android emulator
```

The `--device` flag will sometimes detect a connected physical device, but it's unreliable. But, usually run with the flag anyway to get all of my emulators. 

### Physical Device (iOS)

1. Run `npx expo run:ios` to build the native project
2. Navigate to the `ios/` folder in Finder and open the `.xcworkspace` file in Xcode
3. Select your device in the header toolbar
4. Press `cmd+R` (or the play button)

Once the dev server is running you can leave it up — a new native build is only needed when a native module is added.

## Enabling OAuth on Your Snipe-IT Instance

Run this artisan command on your Snipe-IT instance to register the mobile client:

```bash
php artisan tinker --execute="Laravel\Passport\Client::forceCreate(['id' => 9999, 'name' => 'Snipe-IT Mobile App', 'secret' => '', 'provider' => 'users', 'redirect' => 'com.grokability.snipeitmobile://home', 'personal_access_client' => 0, 'password_client' => 0, 'revoked' => 0]);"
```

## Code Signing (iOS)

Building to a physical iOS device requires Xcode code signing to be configured. See [Expo's Xcode signing guide](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md) for setup instructions.
