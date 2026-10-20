# Savings Tracker Android

Savings Tracker is an Android-only, offline-first savings-goal and debt-payoff app. Package identity remains `com.oldalexhub.savingstracker`; no iOS release, user login, bank connection, budgeting module, or LLM is included.

## Product architecture

- React Native 0.86 / TypeScript, Android API 24+
- Five destinations: Home, Goals, Debt, Insights, Settings
- One versioned AES-256 MMKV envelope for normalized finance state and the idempotent sync outbox
- MMKV key and anonymous installation bearer token protected by Android Keystore
- Reversible migration checkpoint from the previous AsyncStorage v1 keys
- Core CRUD, calculations, histories, exports, and deterministic insight fallback work offline
- Required anonymous synchronization to `https://tracking.server.oldalexhub.com` when connectivity is available
- No server restore or cross-device recovery

The mobile client sends the app-generated installation ID, the disclosed device snapshot, whitelisted analytics, and exact finance snapshots (including names/notes). It does not request contacts, precise GPS, IMEI, serial number, email, phone, or first-party access to the Advertising ID.

## Development

Requirements: Node.js 22.11+, JDK 17/Android Studio JBR, Android SDK 36.

```powershell
npm install
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npm run android
```

The debug build uses `com.oldalexhub.savingstracker.debug` and the label “Savings Tracker Dev”, allowing it to coexist with a signed production install. Release builds retain the original package.

## Android behavior

- Window insets are applied to the bottom tabs, ads, sheets, snackbars, scrolling content, sticky actions, and keyboard forms.
- Hardware/predictive Back closes overlays or navigates the stack; dirty forms require confirmation.
- Back on a non-Home tab returns to Home. Back at root Home is consumed and does not exit.
- Notification permission is requested only when the user enables a reminder.
- Native Android date pickers are used for finance dates.

## Ads and consent

Google UMP runs after the required data-collection disclosure is accepted. Legally required regional ad choices are honored; declined personalization can fall back to eligible limited/non-personalized ads.

- Adaptive banners: appropriate overview/list surfaces
- Native ad: clearly labeled educational Insights surface
- Interstitial: contribution/payment completion only, minimum 10-minute gap, maximum 3/session and 5/day
- Core tracking and baseline insights do not depend on an ad view

## Server and force updates

The typed v1 client surface is committed in `src/services/generated/trackingApi.ts`. The app reads remote config from the server. Keep the server’s `ANDROID_MIN_SUPPORTED_VERSION_CODE=1` until version code 2 is visible in Google Play, then set it to `2`; older builds show a non-dismissible Play Store update gate.

If the server is unavailable, the release remains usable offline and the outbox retries with exponential backoff. The default bundled config never force-updates version code 1 before the server operator enables it.

## Release

Before a final release, increment `versionCode` exactly once, then build both artifacts:

```powershell
cd android
./gradlew assembleRelease bundleRelease
```

Release signing reads `android/keystore.properties`, which is excluded from version control. Do not distribute a build signed with the debug fallback. Store artwork is in `store_assets/`; current generated assets end with `-2027`.

Privacy and Play declarations are documented in [PRIVACYPOLICY.md](PRIVACYPOLICY.md) and [store_assets/data-safety-notes.md](store_assets/data-safety-notes.md).
