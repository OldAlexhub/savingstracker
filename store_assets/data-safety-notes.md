# Google Play Data Safety declaration worksheet

Use this as an implementation-aligned worksheet and re-check Google’s current Play Console taxonomy before submission.

## Collection and sharing overview

- App collects data: **Yes**
- App shares data with service providers/advertising partners: **Yes**
- Data encrypted in transit: **Yes**
- User can request deletion: **Yes, inside Settings**
- Collection required: Core anonymous finance/device/activity collection is required; regional AdMob personalization choices remain optional where required.
- Account creation: **No**

## Data types to declare

| Play category | Examples in Savings Tracker | Collected | Shared | Purposes |
|---|---|---:|---:|---|
| Financial info | Goal/debt amounts, balances, APR, payment and contribution records | Yes | Service provider processing | App functionality, analytics, personalization of insights |
| User-generated content / other info | Goal/debt names and notes, uploaded unchanged | Yes | Service provider processing | App functionality, analytics |
| Device or other IDs | Random installation ID; AdMob may process advertising/device IDs | Yes | AdMob/service providers | Functionality, fraud prevention, advertising, analytics |
| App activity | Opens, sessions, screens, feature use, insight/scenario use, ad events | Yes | AdMob for ad-related activity | Analytics, functionality, advertising |
| App info and performance | Sync failures, API errors/latency, compatibility/capability data | Yes | Service providers | Diagnostics, security, analytics |
| Approximate location | May be inferred from IP by AdMob | Possible | AdMob/partners | Advertising, analytics, fraud prevention |

Do not declare precise location, contacts, email, phone, IMEI, serial number, health data, messages, photos, files, audio, or calendar data for the first-party service; the app does not request them.

## Retention and deletion disclosure

- Active finance snapshots: until deletion or 24 months of inactivity.
- Raw events/device snapshots: 13 months.
- Administrative security/export audits: 24 months.
- Non-reversible aggregates/model statistics may remain.
- Settings deletion purges the installation’s raw server records and local encrypted records.
- Uninstall alone removes local data but does not transmit a server-deletion request.

## Security answers

- Local finance state: encrypted MMKV envelope, key protected by Android Keystore.
- In transit: HTTPS.
- Server bearer tokens: keyed hashes.
- Owner portal: Secure/HttpOnly/SameSite cookie, CSRF validation, lockouts, expiry, audit trail.

References: Google Play User Data and Data Safety policies, plus the Google Mobile Ads SDK disclosure guidance. Final answers must match the SDK versions and consent configuration shipped in the AAB.
