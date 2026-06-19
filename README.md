# Snipe-IT Mobile

A React Native mobile app for [Snipe-IT](https://snipeitapp.com), built with Expo.

## Plans
The goal for this mobile app is to be a fully-featured version of the web app. We are fairly early days though 
and are actively working on adding features, so please be patient. If you'd like to give some input on what features
would be most useful and should be higher priorities, please open up a feature request _discussion_ - not an Issue. 

## Roadmap
[Snipe-IT Mobile Roadmap](https://github.com/orgs/grokability/projects/30/views/1)

The roadmap will be updated as we go and priorities evolve.  

## Current Features
- Login via OAuth or Bearer token 
- QR/barcode scanner from the home tab, resolves directly to an asset
- Assets: browse, search, filter, view, create, edit, check out, check in
- Accessories: browse, view, check out, check in
- Consumables: browse, view, edit, check out
- Components: browse and view 
- Licenses: browse and view 
- Audit workflow: session-based scan-and-confirm flow with a home screen dashboard card
- Activity report with details on items
- Recent actions feed card on the home screen (superusers only)
- OTA update checking and install from the home screen

## Reporting Issues
If you think you've found a bug or an issue with the app, please open an [Issue Triage Discussion](https://github.com/grokability/snipe-it-mobile/discussions/categories/issue-triage).

## Contributing
Contributions are welcome! BUT, we'll be using a system called [Vouch](https://github.com/mitchellh/vouch) by Mitchell Hashimoto to manage contributions. 

This means that contributors should default to opening Discussions instead of Issues or PRs, and then a team member will open the issue if need be. 

[Contribution Guidelines](CONTRIBUTING.md) 

Also make sure you check out our [AI Policy](AI_POLICY.md) if you're thinking about contributing.

If you'd like to be vouched, please open a Vouch Request in Discussions.

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
5. Run `npx expo start` to start the dev server and open the app on your device
6. If the app does not automatically find the development server then you can manually connect using your machine's IP address and the port shown in the terminal for "Web" (usually 8081)

Once the dev server is running you can leave it up — a new native build is only needed when a native module is added.

## Enabling OAuth on Your Snipe-IT Instance
As of Snipe IT v8.5, OAuth will automatically work with the mobile application - otherwise you can log in using an API key.

If you'd like to use OAuth with an older version of Snipe IT, you can create an OAuth client manually and input the Client ID into the app. 

Run the following command to generate a new client:
```
php artisan tinker --execute="Laravel\Passport\Client::forceCreate(['id' => 9999, 'name' => 'Snipe-IT Mobile App', 'secret' => '', 'provider' => 'users', 'redirect' => 'com.grokability.snipeitmobile://home', 'personal_access_client' => 0, 'password_client' => 0, 'revoked' => 0]);"
```

## Code Signing (iOS)

Building to a physical iOS device requires Xcode code signing to be configured. See [Expo's Xcode signing guide](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md) for setup instructions.
