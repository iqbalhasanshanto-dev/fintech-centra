# Centra Data Protection & Security Architecture

## 1. Overview
Centra is a personal finance management application designed for cross-platform usage (Web, Android via Capacitor 8, iOS via Capacitor 8, and Desktop via Tauri 2). This document details how user data is stored, isolated, and protected across client devices and backend infrastructure.

Centra uses honest security documentation: we do not claim end-to-end client-side encryption. We rely on transport layer security (TLS 1.3), backend database encryption at rest, PostgreSQL Row Level Security (RLS), operating system sandboxing, and device-local PIN hashing.

---

## 2. Storage Topology: What is Stored Where

| Data Category | Storage Location | Encryption / Protection Mechanism | Sync Behavior |
| :--- | :--- | :--- | :--- |
| **User Financial Records** (Accounts, Transactions, Categories, Budgets, Goals) | Supabase PostgreSQL Database | TLS in transit, AES-256 at rest on Supabase infrastructure; Row Level Security (RLS) ensures users can only read/write their own records (`auth.uid() = user_id`). | Synced bidirectionally via HTTPS when online. |
| **Offline Local Cache** (Accounts, Transactions, Categories, Budgets, Goals, Profiles) | Client WebView `localStorage` (`centra:{userId}:*`) | Plaintext JSON strings scoped by user UUID. Protected at rest by OS application sandbox. | Queued in local outbox when offline; flushed to Supabase on reconnection. |
| **Supabase Auth Session** (Access token JWT, Refresh token) | Client `localStorage` (`sb-<project-ref>-auth-token`) | Plaintext JWT; signed with HMAC/RSA. Protected by OS sandboxing and web origin isolation. | Auto-refreshed via Supabase SDK over TLS. |
| **App Security PIN** | Client `localStorage` (`centra_pin_hash`, `centra_pin_salt`) | PBKDF2-SHA256 with 100,000 iterations and 16-byte random salt. Raw PIN is never stored or transmitted. | **Local device only**. Never synced to Supabase or backed up. |
| **User Preferences** (Theme hint, Auto-lock timeout) | Client `localStorage` (`centra_theme_hint`, `centra_autolock_timeout`) | Plaintext configuration flags. | Local device only. |
| **Guest / Demo Data** | Client `sessionStorage` & `localStorage` (`centra:guest:*`) | Ephemeral demo data stored locally. | **Never synced**. Deleted or overwritten when guest session ends. |

---

## 3. Physical Access & Threat Model Implications

### 3.1 Device-Level Security Boundary
Because local data is cached in the WebView's private storage directory, device-level physical access implications are as follows:
- **Rooted / Jailbroken Devices**: A user or attacker with root privileges on the physical device can inspect the application's private data sandbox (`/data/data/com.centra.app/` on Android, or App Container on iOS) and read `localStorage` databases.
- **Unrooted Devices**: The operating system's kernel-enforced sandboxing isolates Centra's storage from all other installed applications. Other apps cannot read Centra's cache or auth tokens.
- **Device Lock Perimeter**: Centra relies on the user maintaining a secure device passcode / biometrics. Physical access to an unlocked device exposes the application unless the in-app PIN lock is active.

### 3.2 Data Export
When a user chooses "Export JSON" in Settings, data is serialized into a standard, unencrypted `.json` text file and downloaded to the device's downloads or file system. This allows complete user data portability, but the exported file is no longer protected by Centra's application sandbox or PIN lock once saved externally.

---

## 4. Platform Sandboxing & Backup Protection

### 4.1 Android Protection (`allowBackup="false"`)
- Configured with `android:allowBackup="false"` in `android/app/src/main/AndroidManifest.xml`.
- **Mitigation**: Prevents extraction of the app's internal database and `localStorage` using `adb backup` or Google Drive automated cloud backup. Even if a user connects the device to an untrusted workstation via USB debugging, data cannot be extracted via standard backup bridges.

### 4.2 iOS Sandbox
- In iOS, the WKWebView stores data in the sandboxed app container directory (`Library/WebKit/WebsiteData/LocalStorage`).
- Files are protected by iOS Data Protection classes and are inaccessible to other apps.

### 4.3 Desktop (Tauri 2)
- Tauri uses native WebKit (macOS/Linux) or WebView2 (Windows). Data is isolated within the dedicated application data directory for `com.centra.app`.

---

## 5. In-App Lock & Cover Screen Architecture

### 5.1 Synchronous Cover Replacement
Whenever the application transitions into the background (`visibilitychange` hidden, window blur on desktop, or Capacitor `appStateChange` inactive):
- The render tree synchronously mounts `<LockCoverScreen />`, completely unmounting dashboards and hiding sensitive account balances from view.
- This prevents memory leaks or render snapshots of account balances from lingering in the active UI hierarchy.

### 5.2 Auto-Lock Timeout
On resume, `shouldTriggerResumeLock` evaluates the elapsed duration against the device-local timeout (`centra_autolock_timeout`: Immediately, 1 minute, 5 minutes default, or 15 minutes).
- If the timeout has expired, the app transitions directly to `<PinLockScreen />`. At no point is a frame of account balances or financial records exposed before the PIN prompt.

### 5.3 App-Switcher Privacy Option (Android `FLAG_SECURE`)
- On Android, apps can mark their window with `WindowManager.LayoutParams.FLAG_SECURE`.
- **Effect**: Blank/obscured preview in the Android "Recent Apps" switcher and prevention of screen captures.
- **Trade-off**: Blocks legitimate user screenshots of receipts, budget charts, and transaction confirmations.
- **Current Stance**: Default off to support user screenshot convenience; can be surfaced as an opt-in toggle in Settings.

---

## 6. Evaluation of Keychain / Keystore Storage for Sessions

### 6.1 Assessment
We evaluated whether to move the Supabase authentication session token from WebView `localStorage` to Android Keystore and iOS Keychain.

### 6.2 Findings & Trade-offs
1. **Plugin Ecosystem for Capacitor 8**: Community secure storage plugins (`@aparajita/capacitor-secure-storage`, `capacitor-secure-storage-plugin`) have not been updated for Capacitor 8 and introduce build failures with Kotlin/Gradle 8.7+ and SPM under Xcode 16.
2. **Synchronous Auth Client Architecture**: `@supabase/supabase-js` expects a synchronous storage engine by default for session bootstrapping. Asynchronous Keychain bridges require complex custom storage adapters that introduce asynchronous hydration delays and potential race conditions during initial app launch.
3. **OS Sandboxing Parity**: On both modern Android (API 24+) and iOS, WebView `localStorage` is already stored inside the application's encrypted private data sandbox. For apps without multi-user device sharing, the sandbox offers strong isolation against other apps.

### 6.3 Conclusion & Roadmap
For Phase 7, storing the session token in the OS-sandboxed `localStorage` is the standard and robust approach for Capacitor applications. Migration to an asynchronous Keystore/Keychain adapter will be re-evaluated when an official Capacitor 8 first-party secure storage plugin is released.
