# Google Play Data Safety Form — Savings Tracker

Use these answers when filling in the Data Safety section on Google Play Console.

---

## Does your app collect or share any of the required user data types?

**YES** — The app uses Google AdMob which may collect advertising-related data.

---

## Data Types Collected

### Financial Info
- **Collected:** No  
  *(User enters financial data locally; it is never transmitted to any server)*

### Personal Info
- **Name, Email, Address, Phone:** Not collected

### App Activity
- **App interactions:** May be collected by Google AdMob (ad impressions, clicks)
- **In-app search history:** Not collected
- **Installed apps:** Not collected

### Device or Other IDs
- **Device or other IDs (Advertising ID):** May be collected by Google AdMob

### Location
- **Approximate location:** May be inferred by Google AdMob from IP address
- **Precise location:** Not collected

---

## Data Sharing

| Data Type | Shared With | Purpose |
|---|---|---|
| Device/Advertising ID | Google AdMob and partners | Advertising |
| App interactions (ad-related) | Google AdMob and partners | Advertising |
| Approximate location | Google AdMob and partners | Advertising |

---

## Is the data collected encrypted in transit?
Yes (Google AdMob uses HTTPS)

---

## Can users request data deletion?
Yes — users can:
1. Delete advertising ID via device Settings → Privacy → Ads → Delete advertising ID
2. Uninstall the app to remove all local data
3. Use in-app "Clear All Data" to remove all saved financial data

---

## Data Safety Section Summary for Play Console

**App collects data:** Yes (via Google AdMob SDK)
**App shares data:** Yes (advertising data shared with Google AdMob and partners)
**Data is encrypted in transit:** Yes
**Users can request deletion:** Yes

**Categories to declare:**
- Device or other IDs → Collected, Shared → Advertising
- App activity (ad interactions) → Collected, Shared → Advertising
- Location (approximate) → May be collected by AdMob → Advertising

---

## Notes

The app itself does NOT collect, transmit, or process any user financial data outside the device. The financial data the user enters (goals, debts, amounts) is stored exclusively in Android's local AsyncStorage and is never sent to any external server.

The only external data processing occurs through the Google AdMob SDK for serving and measuring advertisements, as documented in Google's own policies.

Reference: [Google AdMob Data Safety FAQ](https://support.google.com/admob/answer/12176312)
