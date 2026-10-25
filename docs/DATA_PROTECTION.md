# Centra Data Protection & Security Architecture

## 1. Overview
Centra is a personal finance management application designed for cross-platform usage (Web, Android via Capacitor 8, iOS via Capacitor 8, and Desktop via Tauri 2). This document details how user data is stored, isolated, and protected across client devices and backend infrastructure.

---

## 2. App-Switcher Privacy Option (Android FLAG_SECURE)
On Android, apps can mark their window with `WindowManager.LayoutParams.FLAG_SECURE`:
- **Functionality**: When `FLAG_SECURE` is active, the operating system renders a blank preview or treats the window contents as secure in the system app-switcher ("Recent Apps" overview).
- **Trade-offs**: In addition to obscuring app switcher previews, `FLAG_SECURE` completely blocks user screenshots and screen recording across the entire application.
- **Current Architecture**: Because many users intentionally take screenshots of receipts, transaction confirmations, or reports, `FLAG_SECURE` is **not enabled by default** in Centra.
- **Optional Feature Path**: It can be introduced as an optional user-configurable setting in `SettingsScreen` (e.g. "Privacy Screen / Block Screenshots"). If enabled, native bridge code would dynamically invoke `window.setFlags(FLAG_SECURE, FLAG_SECURE)` on the Android activity.

---

## 3. App Lock & Cover Screen Architecture
- **Synchronous Cover Replacement**: Whenever the application is placed in the background (`visibilitychange` hidden, window blur on desktop, or Capacitor `appStateChange` inactive), the render tree synchronously mounts `<LockCoverScreen />`, completely unmounting financial dashboards and account balances.
- **Configurable Auto-Lock**: On resume, `shouldTriggerResumeLock` evaluates the elapsed duration against the device-local timeout (`centra_autolock_timeout`: Immediately, 1 minute, 5 minutes default, or 15 minutes).
- **Protection Against Memory Leaks & Visual Leaks**: If the timeout has expired, the app transitions directly to `<PinLockScreen />`. At no point is a frame of account balances or financial records exposed before the PIN prompt.

---

## 4. Platform Data Storage Matrix (Preview - Extended in Task 9)
- **Supabase Cloud**: Authenticated database with Row Level Security (RLS) ensuring users only query their own records.
- **Local Storage Cache**: Scoped per-user namespaces (`centra:{userId}:*`) in client storage.
- **Android / iOS Device Backup**: Configured with `android:allowBackup="false"` in `AndroidManifest.xml` to prevent ADB/cloud backup extraction of application storage.
