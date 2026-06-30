# Savings Tracker

**Developer:** Old Alex Hub  
**Package:** `com.oldalexhub.savingstracker`  
**Platform:** Android  
**Framework:** Bare React Native 0.86.0  
**Version:** 1.0.0

---

## Overview

Savings Tracker is a local finance planning utility that helps users manually track savings goals, compare saving strategies, track debts, and compare debt payoff methods. The app works entirely offline — all data is stored locally on the device using AsyncStorage.

**This app is not a financial advisor.** All calculations are educational estimates based on user-entered data. No bank connections, no money movement, no account linking.

---

## Features

### Savings
- Create, edit, archive, complete, and delete savings goals
- 10 built-in saving strategies (educational planning methods)
- Contribution history per goal
- Progress tracking with estimated completion dates
- 52-week challenge schedule
- CSV and JSON export

### Debt
- Manually add, edit, track, and delete debts
- 5 debt repayment strategies (Avalanche, Snowball, Hybrid, Equal Extra, Custom)
- Payment history per debt
- Estimated payoff dates and interest calculations
- Warnings when APR or minimum payment data is missing

### Dashboard
- Total saved, total targets, active goals count
- Total debt tracked, debt progress
- Recent activity feed
- Quick action buttons

### Insights
- Weekly/monthly savings summary
- Debt payoff timeline estimates
- Strategy comparison notes
- Goal completion estimates

### Settings
- Currency selection (USD, EUR, GBP, CAD, AUD, JPY, INR)
- Export all data (JSON, CSV, text summary)
- Clear all local data
- Privacy policy and ads disclosure

---

## Local Storage

All data is stored locally using `@react-native-async-storage/async-storage`. No backend, no cloud sync, no login required.

Data keys stored in AsyncStorage:
- `@savings_tracker/goals` — savings goals array
- `@savings_tracker/contributions` — contribution history
- `@savings_tracker/debts` — debt accounts
- `@savings_tracker/payments` — debt payment history
- `@savings_tracker/preferences` — user preferences
- `@savings_tracker/adState` — ad frequency state
- `@savings_tracker/exports` — export records

---

## Ads Setup

This app uses Google AdMob for monetization (free app with ads).

**AdMob App ID:** `ca-app-pub-7831002909037560~5086040793`  
Set in `android/app/src/main/AndroidManifest.xml` as `<meta-data>`.

**Ad Unit IDs** (defined in `src/theme/index.ts`):
```
BANNER:        ca-app-pub-7831002909037560/7254294744
INTERSTITIAL:  ca-app-pub-7831002909037560/5286606952
NATIVE:        ca-app-pub-7831002909037560/1118875629
```

Ad placement policy:
- **Banner ads:** Dashboard, Savings list, Debt list, Insights (above fold, never blocking UI)
- **Interstitial ads:** after goal creation, debt creation, goal completion, debt payoff, export completion
- **Frequency cap:** 5-minute minimum gap between interstitials, max 10 per session
- **Native ads:** strategy library cards only (educational content areas)
- **Ads never appear:** during forms, on privacy screens, during delete/reset flows, on app launch

---

## Safe Area & Android Navigation

This app fully handles safe area for all Android edge cases (status bar, camera cutouts, gesture nav, 3-button nav, keyboard, bottom tabs).

### Layout Components
- **AppShell** — root wrapper with SafeAreaProvider and StatusBar
- **ScreenContainer** — base screen wrapper
- **SafeScrollView** — scroll with automatic bottom padding for tab bar + safe area
- **KeyboardSafeScreen** — KeyboardAvoidingView for forms
- **SafeBottomBar** — fills Android navigation bar space  
- **SafeAdContainer** — wraps banner ads above Android navigation bar
- **StickyActionBar** — fixed action buttons offset by `insets.bottom`

### Android Navigation Bar Notes
- `useSafeAreaInsets()` provides bottom inset at runtime
- Tab bar height: `60 + insets.bottom`
- Banner ad container: `paddingBottom: insets.bottom`
- Sticky buttons: `bottom: insets.bottom` (never hardcoded `bottom: 0`)
- Scroll content: `paddingBottom: insets.bottom + 100`

---

## Build Instructions

### Prerequisites
- Node.js >= 22.11.0
- Java 17+ (Android Studio JBR recommended)
- Android SDK 36
- Android Studio (recommended)

### Install Dependencies
```bash
cd savingstracker
npm install
```

### Debug Build
```bash
npx react-native run-android
```

### Release Build (manual)
```bash
cd android
./gradlew bundleRelease    # AAB for Play Store
./gradlew assembleRelease  # APK for sideload
```

---

## Release Script (release.py)

The `release.py` script at project root automates the full Windows release process.

### Features
- Auto-detects JAVA_HOME (Android Studio JBR, system Java)
- Auto-detects Android SDK from common Windows paths
- Writes `android/local.properties` with `sdk.dir`
- Generates release keystore and local signing passwords if missing (never overwrites existing)
- Adds keystore and local.properties to `.gitignore`
- Builds release APK and AAB via Gradle
- Organizes outputs in `../releases/` (outside app directory)
- Captures ADB screenshots from connected emulator
- Copies store assets, README, privacy policy to release folder

### Usage
```bash
python release.py                 # Full release build
python release.py --check-env     # Diagnose environment only
python release.py --generate-key-only  # Create keystore, no build
python release.py --skip-build    # Skip Gradle, just organize files
python release.py --skip-screenshots   # Build without screenshots
python release.py --screenshots-only   # Capture screenshots only
python release.py --clean         # Clean build cache first
python release.py --no-clean      # Skip clean step
```

### Release Output Structure
```
../releases/
├── builds/       APK and AAB files
├── screenshots/  ADB screenshots from emulator
├── branding/     App icon, logo assets
├── store-assets/ Play Store listing content
├── docs/         README, privacy policy, signing notes
└── signing-info/ Keystore location info (not the keystore itself)
```

---

## Google Play Upload

1. Run `python release.py` to build the AAB
2. Sign into Google Play Console
3. Create a new app (package: `com.oldalexhub.savingstracker`)
4. Upload AAB from `releases/builds/app-release.aab`
5. Fill in store listing from `releases/store-assets/`
6. Set content rating (Everyone / Finance)
7. Complete data safety form (see `store_assets/data-safety-notes.md`)
8. Submit for review

---

## Troubleshooting

**"JAVA_HOME not set"** — Run `python release.py --check-env`. Script auto-detects Android Studio JBR at `C:\Program Files\Android\Android Studio\jbr`.

**"SDK not found"** — Set `ANDROID_HOME` or let the script auto-detect from `%LOCALAPPDATA%\Android\Sdk`.

**"Keystore missing"** — Run `python release.py --generate-key-only`. Back up `android/app/savings_tracker_release.keystore` and `android/keystore.properties`; you cannot update your Play Store app without both files.

**"Gradle build failed"** — Check `android/local.properties` has correct `sdk.dir`. Run `cd android && gradlew.bat clean` then retry.

**"AdMob ads not showing"** — Normal in debug builds. Ads require internet. App works fully offline without ads.

**"Safe area overlap"** — Ensure `SafeAreaProvider` wraps root (App.tsx). All screens use `SafeScrollView` or `KeyboardSafeScreen`.

---

## Compliance Notes

This app is an educational planning and tracking tool. It does not:
- Connect to banks or financial accounts
- Move money or initiate transactions
- Pull credit reports
- Offer investment advice
- Claim guaranteed financial results

All on-screen calculations use wording like "estimated," "based on your entries," and "educational method."

---

*Savings Tracker is a planning and tracking tool, not financial advice. Always consult a qualified financial professional before making financial decisions.*  
*Developed by Old Alex Hub.*
