# Release Process

## Branch Flow

```
feature/* → develop → testflight → main
```

| Branch | Channel | What triggers |
|--------|---------|---------------|
| `develop` | internal-testing | EAS workflow auto-builds + OTA on push |
| `testflight` | beta | EAS workflow auto-builds + OTA on push; promotes existing build if fingerprint matches |
| `main` | production | EAS workflow (currently disabled — see below) |

## Store Destinations

Google Play's API track ids do not match the labels in the Play Console. `beta` is Open
testing, not the closed track — a profile aimed at `alpha` leaves Open testing without builds.

| Branch | iOS | Play track id | Play Console label |
|--------|-----|---------------|--------------------|
| `develop` | TestFlight (no group) | `internal` | Internal testing |
| `testflight` | TestFlight → Initial Group | `beta` | Open testing |
| `main` | App Store | `production` | Production |

Closed testing (`alpha`) is deliberately unused.

## Version Numbers

- **`expo.version`** in `app.json` — semantic version shown in the App Store and Play Store. Bump the minor (or major) in the last PR of a release. Its patch digit is ignored.
- **Release number** — app.json's major.minor plus a count of develop's first-parent commits since that major.minor was set, computed by `scripts/release-number.mjs`. The merge that bumps app.json is `.0`, and each merged PR after it adds one. See "Release numbers" in the README.
- **Build number / versionCode** — managed automatically by EAS remote versioning. Never change these manually.
- **Git tag** — `v<release number>`, created by `scripts/promote.mjs` with the GitHub Release once a promotion's EAS run succeeds.

## Day-to-Day Feature / Bug Fix

1. Branch off `develop`: `git checkout -b feature/my-thing develop`
2. Do the work, commit
3. PR → merge to `develop` (as a merge commit; the repository allows no other kind) → EAS workflow runs automatically → verify on internal-testing
4. When ready for beta: `node scripts/promote.mjs beta` fast-forwards `testflight` to develop's tip → EAS workflow runs automatically → verify on TestFlight / Play open testing

## Cutting a Release

1. Bump `expo.version` in `app.json` in the last PR of the release (e.g. `1.0.0 → 1.1.0`). Its merge into `develop` is release `1.1.0`.
2. `node scripts/promote.mjs beta` → let beta users verify. The first TestFlight build of a new version goes through Beta App Review for the external group.
3. `node scripts/promote.mjs production` fast-forwards `main` to the same commit and makes the GitHub Release `v1.1.0` the Latest release
4. **While `main.yml` EAS workflow is disabled** (beta period):
   - Run `eas build --profile production --platform all` manually
   - Submit to App Store and Google Play
   - After App Store approval: `eas update --branch production --message "$(node scripts/release-number.mjs) ($(git rev-parse --short HEAD))"`
5. When `main.yml` is re-enabled: step 4 is fully automated on push to `main`

## Rules

- **A git tag must exist for every build submitted to the App Store or Google Play.** `promote.mjs production` creates it. The hotfix path in the README doesn't yet, so tag a hotfix by hand.
- **Never change `appVersionSource`** in `eas.json` — EAS controls build numbers remotely.
- **Semver convention**: minor bumps (`1.x.0`) for feature releases; major bumps for breaking changes. Never bump the patch by hand: the release number's patch counts merged PRs, and app.json's patch digit is ignored.
