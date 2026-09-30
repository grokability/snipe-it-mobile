# Snipe-IT Mobile

A React Native mobile app for [Snipe-IT](https://snipeitapp.com), built with Expo.

## Plans
The goal for this mobile app is to be a fully-featured version of the web app. We are fairly early days though 
and are actively working on adding features, so please be patient. If you'd like to give some input on what features
would be most useful and should be higher priorities, please open up a feature request _discussion_ - not an Issue. 

## Roadmap
[Snipe-IT Mobile Roadmap](https://github.com/orgs/grokability/projects/30/views/1)

The roadmap will be updated as we go and priorities evolve.  

## Deployments
[Snipe-IT Mobile Deployments](https://gist.github.com/spencerrlongg/04a4aef25f4763d3a9b7771be6385e32) lists the newest build on each test channel and which update it runs. It is rewritten after every build or update.

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
As of Snipe IT v8.5, OAuth will automatically work with the mobile application - otherwise you can log in [using an API key](https://snipe-it.readme.io/reference/generating-api-tokens).

If you'd like to use OAuth with an older version of Snipe IT, you can create an OAuth client manually and input the Client ID into the app. 

Run the following command to generate a new client:
```
php artisan tinker --execute="echo Laravel\Passport\Client::create(['name' => 'Snipe-IT Mobile App', 'secret' => '', 'provider' => 'users', 'redirect' => 'com.grokability.snipeitmobile://home', 'personal_access_client' => 0, 'password_client' => 0, 'revoked' => 0])->id;"
```

## Code Signing (iOS)

Building to a physical iOS device requires Xcode code signing to be configured. See [Expo's Xcode signing guide](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md) for setup instructions.

## Releasing

Every track runs the same commit and the same update. PRs merge into `develop`, which ships to internal testers. `testflight` (beta) and `main` (production) never take PRs: they are fast-forwarded to a commit that already passed the track before them.

```bash
node scripts/promote.mjs beta [sha]          # develop → testflight
node scripts/promote.mjs production [sha]    # testflight → main
node scripts/promote.mjs beta --dry-run      # run every check; push and publish nothing
node scripts/promote.mjs beta --yes          # skip the confirmation prompt
```

It is deliberately not an npm script. package.json's `scripts` are part of the app's fingerprint (only `android` and `ios` are skipped), so adding one would force new native builds on every track.

Without a sha, the tip of the source branch is promoted. The script:

1. Refuses unless the commit is on the source branch, the push is a fast-forward, the source track's EAS run for that commit succeeded (it waits while that run is going), and no other run is going on either track.
2. Lists the commits the destination gains and asks before pushing.
3. Pushes, waits for the destination's EAS run, and when that succeeds publishes the GitHub Release `v1.0.<n>`: a prerelease for beta, made the Latest release on production. The notes are generated from the titles of the PRs merged since the previous release, so PR titles should make sense to testers.

Running it again after an interruption is safe: an already promoted commit is not pushed again, and an existing release is left alone.

After changing the script, run `node --test scripts/promote-test/promote.test.mjs`. It runs the script against a throwaway origin with fake EAS and `gh` commands and checks, for each refusal, dry run, promotion and re-run, what was pushed and what was published. It needs no logins and touches nothing outside a temporary directory.

### What you need

- Push access to `testflight` and `main`. The `release-branches: admins push` ruleset limits it to repository admins, and `release-branches: fast-forward only` blocks force pushes and deletion for everyone, admins included.
- `gh auth login` as that account. The GitHub Release is created with your own login. No GitHub token is stored in EAS, because it would carry the same push rights to anyone who can run an EAS workflow.
- `npx expo login`.

### Release numbers

`1.0.<n>` is app.json's major.minor plus the number of commits on develop's first-parent history, so each merged PR adds one, and the same commit has the same number on every track. It shows on the app footer's first line (tap to copy), in Sentry as `release` (`snipe-it-mobile@1.0.104`) with the binary in `dist` (`ios-43`), and in the Deployments gist. app.json's `version` is not bumped per release: it is part of the fingerprint, so a change forces native builds. Bump the minor only for store releases.

### Hotfixes

When develop holds something that can't ship yet, branch from `main` (or `testflight`), open a PR into it, and have an admin merge it. Then merge that branch back into `develop` straight away, so each branch is an ancestor of the next again and fast-forward promotion keeps working. The promote script does not handle this path yet.
