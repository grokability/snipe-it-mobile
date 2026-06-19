# Release Process

## Branch Flow

```
feature/* → develop → testflight → main
```

| Branch | Channel | What triggers |
|--------|---------|---------------|
| `develop` | internal-testing | EAS workflow auto-builds + OTA on push |
| `testflight` | beta | EAS workflow auto-builds + OTA on push; promotes existing build if fingerprint matches |
| `main` | production | EAS workflow (currently disabled — see below); GitHub Actions auto-tags |

## Version Numbers

- **`expo.version`** in `app.json` — semantic version shown in the App Store and Play Store. Bump this manually before merging to `main`.
- **Build number / versionCode** — managed automatically by EAS remote versioning. Never change these manually.
- **Git tag** — created automatically by GitHub Actions on every push to `main` that contains a new version in `app.json`.

## Day-to-Day Feature / Bug Fix

1. Branch off `develop`: `git checkout -b feature/my-thing develop`
2. Do the work, commit
3. PR → merge to `develop` → EAS workflow runs automatically → verify on internal-testing
4. When ready for beta: merge `develop → testflight` → EAS workflow runs automatically → verify on TestFlight / Play beta

## Cutting a Release

1. Bump `expo.version` in `app.json` on a branch (e.g. `1.0.0 → 1.0.1`)
2. PR → merge to `testflight` → let beta users verify the version bump
3. PR `testflight → main`
4. Merge → GitHub Actions automatically creates git tag `v1.0.1` + GitHub Release draft
5. **While `main.yml` EAS workflow is disabled** (beta period):
   - Run `eas build --profile production --platform all` manually
   - Submit to App Store and Google Play
   - After App Store approval: `eas update --branch production --message "v1.0.1 ($(git rev-parse --short HEAD))"`
6. When `main.yml` is re-enabled: step 5 is fully automated on push to `main`

## Rules

- **A git tag must exist for every build submitted to the App Store or Google Play.** The GitHub Actions workflow handles this automatically — do not skip the `main` merge.
- **Never change `appVersionSource`** in `eas.json` — EAS controls build numbers remotely.
- **Semver convention**: patch bumps (`1.0.x`) for OTA-only releases and hotfixes; minor bumps (`1.x.0`) for feature releases; major bumps for breaking changes.
