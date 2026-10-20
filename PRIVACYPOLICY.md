# Privacy Policy — Savings Tracker

Effective: October 19, 2026  
Developer: Old Alex Hub  
Android package: `com.oldalexhub.savingstracker`  
Contact: Info@oldalexhub.com

Savings Tracker is an Android savings-goal and debt-payoff tracker. It works offline, has no user account, does not connect to a bank, and does not move money. When a connection is available, it sends the anonymous data described below to `https://tracking.server.oldalexhub.com`. This collection is required to use the app.

## Data we process

The app creates a random installation ID and an authentication token. They identify one installation, not a named person. We do not ask for or intentionally collect a name, email address, phone number, contact list, precise GPS location, IMEI, hardware serial number, or first-party access to the Android Advertising ID.

We collect:

- Financial records entered in the app: savings and debt names, notes, target and starting amounts, balances, APRs, minimum payments, dates, strategies, reminders, contributions, and payment histories. Names and notes are uploaded unchanged. Do not enter a person’s name, an account number, or other personal information in free-text fields; arbitrary text cannot be guaranteed anonymous.
- App activity: onboarding completion, app/session opens, screen and feature use, record lifecycle events, insight and scenario use, reminder events, export completion, ad lifecycle events, and synchronization failures. Analytics properties are whitelisted and do not include raw financial payloads.
- Device and diagnostics: manufacturer, model, Android/API version, app version, locale, timezone, screen-size class, capability flags, service error and latency information, and synchronization status.
- Advertising data processed by Google AdMob and its partners, which may include device or advertising identifiers, ad interactions, diagnostics, and approximate location inferred from network information, subject to regional consent choices.

## Why we use it

We use this information to synchronize the anonymous dataset, provide deterministic forecasts and explainable model-assisted estimates, detect inactivity and data-quality risks, rank next actions, evaluate temporary what-if scenarios, improve features and reliability, measure anonymous retention and use cases, run experiments, prevent abuse, and operate advertising and revenue reporting.

Device characteristics are used for product analytics and compatibility only. They are excluded from financial recommendations. The service does not use large language models and does not generate financial advice.

## Storage, security, and sharing

Local finance data and the synchronization queue are stored in one encrypted, versioned MMKV envelope. Its key and the installation credential are protected by Android Keystore. Network traffic uses HTTPS. Server installation tokens are stored as keyed hashes. Administrative access is limited to the owner portal and is audited.

We use service providers only to operate the product, including hosting infrastructure and Google AdMob. AdMob’s handling is governed by Google’s policies and the choices offered through its certified consent flow. We do not sell financial records or use them for targeted advertising.

## Retention

- The active finance snapshot is kept until deletion or up to 24 months after the installation becomes inactive.
- Raw analytics events and device snapshots are kept for up to 13 months.
- Administrative security and export audit records are kept for up to 24 months.
- Non-reversible aggregate statistics and model-quality measurements may be retained after raw records expire.
- Encrypted operational backups rotate separately and age out under the server backup schedule.

## Deletion and device loss

Settings provides **Delete local and server data**. The app first requests deletion of the current installation’s server records, then removes the local encrypted data and credential. Keep the app online until the deletion succeeds. A new dataset and installation ID are created if the app is used again.

There is no server restore, account recovery, or cross-device recovery. Uninstalling removes the local identity and records, but cannot by itself send a final deletion request to the server. Use the in-app deletion control before uninstalling if server deletion is wanted.

## Advertising choices

Google’s User Messaging Platform is used where consent or privacy choices are legally required. Declining personalized ads does not block core tracking or baseline insights; eligible limited or non-personalized ads may still be shown. Advertising privacy options remain available in Settings when Google requires them.

## Children

Savings Tracker is not directed to children under 13 and is not designed for child-directed use. Contact us if you believe a child submitted personal information in a free-text field.

## Changes and contact

We may update this policy as the service changes. Material collection changes will be disclosed in the app and Play listing. Questions and privacy requests may be sent to Info@oldalexhub.com.
