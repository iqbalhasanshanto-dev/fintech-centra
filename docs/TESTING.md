# Testing & Platform Verification Guide

This document details the configuration, build commands, debugging workflows, and manual QA test matrices for Centra across its supported platforms: **Web**, **Android (Capacitor 8)**, **iOS (Capacitor 8)**, and **Desktop (Tauri 2)**.

---

## 1. Android (Capacitor 8)

### 1.1 Prerequisites & Toolchain
- **Java Development Kit**: JDK 21 is strictly required by Android Gradle Plugin (AGP) 8.13.0 and Gradle 8.14.3.
  ```bash
  export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home')"
  export PATH="$JAVA_HOME/bin:$PATH"
  java -version # Must report openjdk version "21.x.x"
  ```
- **Android SDK**: Android SDK Platform 36 (Android 16 Developer Preview) and build-tools `36.0.0`.
- **NDK**: NDK 27+ if native toolchains are invoked.

### 1.2 Build & Sync Commands
```bash
# 1. Compile web bundle and sync native Android project
npm run build
npx cap sync android

# Shortcut helper
npm run cap:build:android

# 2. Open project in Android Studio
npx cap open android

# 3. Build debug APK directly from command line
cd android
./gradlew assembleDebug
# Generated APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### 1.3 Remote Debugging with Chrome DevTools
Because Centra runs inside a native Android `WebView`, you can inspect and debug running sessions directly from your workstation:
1. Connect physical device via USB debugging or start an Android Emulator (API 34+ recommended).
2. Open Google Chrome on your host machine and navigate to:
   ```
   chrome://inspect/#devices
   ```
3. Locate `com.centra.app` in the device target list and click **inspect**.
4. Use the DevTools console, network panel, and Application tab (`localStorage`, `sessionStorage`) to monitor sync events, network reconnection triggers, and outbox operations in real time.

### 1.4 Deep Link Testing via ADB
Test OAuth callback redirection into the native app using ADB:
```bash
adb shell am start -W \
  -a android.intent.action.VIEW \
  -d "com.centra.app://auth/callback#access_token=test_access_token&refresh_token=test_refresh_token" \
  com.centra.app
```
**Expected Outcome**: The app brings `MainActivity` to the foreground, captures the deep link through `App.addListener('appUrlOpen')`, and transfers tokens to Supabase auth client without opening an external browser tab.

### 1.5 Predictive Back Navigation & Gesture Testing
- Starting with Android 14+ (targetSdk 34+), predictive back gestures are enabled by default.
- **Verification Steps**:
  1. Open an overlay modal (e.g., `AddActionModal`, `DatePicker`, `ConfirmModal`, or `SettingsModal`).
  2. Perform an edge swipe inwards. Verify that the uppermost overlay is dismissed and that the underlying screen stays mounted.
  3. With all modals closed on the root Dashboard, swipe inwards. Verify the exit confirmation dialog triggers rather than killing the process abruptly.

### 1.6 Cold Reset Simulation
To simulate a fresh user installation and verify cold start onboarding:
```bash
adb shell pm clear com.centra.app
```

---

## 2. Web & Desktop (Installable PWA - macOS, Windows, Linux)

### 2.1 Prerequisites & Toolchain
- **Node.js**: v18+ with npm.
- **Modern Browser / PWA Engine**: Chrome, Edge, Safari, Brave, or Firefox.
- **Production Packager**: `npm run release:web` builds `dist/` and archives `Centra-Web-v1.0.0.zip`.

### 2.2 Dev & Build Commands
```bash
# Run web & desktop app in development mode with live HMR
npm run dev

# Build standalone production web & PWA distribution bundle
npm run build

# Package official Web release archive with SHA-256
npm run release:web
```

### 2.3 Window Sizing & Responsive Constraints
- Centra features full responsive layout adaptability:
  - **Mobile Viewport**: Bottom navigation bar, swipeable cards, full-width headers.
  - **Desktop Viewport (1024px+)**: Left persistent sidebar, multi-column dashboard grid, keyboard shortcuts.
  - **Standalone Windowing**: When installed as a PWA, launches in a dedicated window without browser address bars.

### 2.4 Authentication Flow Differences
- On Web & Desktop browsers, users can authenticate via **Email OTP (One-Time Password)** or Google OAuth redirect flows.
- Offline CentraDB IndexedDB cache guarantees full application access even when network disconnects.

---

## 3. iOS (Capacitor 8)

### 3.1 Prerequisites & Toolchain
- **macOS Workstation** with Xcode 16.0+.
- **CocoaPods & Swift Package Manager**: Capacitor 8 utilizes SPM (`CapApp-SPM/Package.swift`) for plugin dependencies.

### 3.2 Build & Sync Commands
```bash
# 1. Compile web bundle and sync native iOS project
npm run build
npx cap sync ios

# Shortcut helper
npm run cap:build:ios

# 2. Open project in Xcode
npx cap open ios
```

### 3.3 Simulator Deep Link Testing via `simctl`
Test OAuth deep link callback on booted iOS Simulator:
```bash
xcrun simctl openurl booted "com.centra.app://auth/callback#access_token=test_access_token&refresh_token=test_refresh_token"
```

### 3.4 Web App Manifest & Asset Catalogs
- `public/manifest.json` and web icons provide Progressive Web App (PWA) fallback.
- For native iOS apps, app launcher icons and launch screens are managed via Xcode Asset Catalogs (`ios/App/App/Assets.xcassets/AppIcon.appiconset`).

---

## 4. Manual Verification Test Matrix

Use this matrix to execute manual test runs across all supported deployment targets. Fill in status (`PASS` / `FAIL` / `N/A`) per platform.

| ID | Test Scenario | Expected Outcome | Web | Android | iOS | Desktop |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **TC-01** | **Cold Start (No Session)** | App launches cleanly to Landing Screen with "Sign in" & "Create account" options. | | | | |
| **TC-02** | **Email OTP Authentication** | User receives 6-digit code via email; verifying OTP successfully navigates to First Account onboarding. | | | | |
| **TC-03** | **Google OAuth Sign In** | Browser opens auth URL; successful redirect returns tokens to app; session restores. | | | | N/A |
| **TC-04** | **Explore Demo Mode** | "Explore Demo (Local Only)" loads instant mock dataset without Supabase requests. | | | | |
| **TC-05** | **Demo Session Scope** | Process restart / cold boot returns to Landing Screen; local demo data stays intact under `centra:guest:*`. | | | | |
| **TC-06** | **Exit Demo Flow** | Clicking "Exit Demo" in Settings presents `ConfirmModal`; confirmation returns to Landing Screen without deleting real data. | | | | |
| **TC-07** | **Safe Area Insets** | Top header avoids notch/status bar; bottom navigation bar avoids home gesture indicator. | | | | |
| **TC-08** | **Hardware / Gesture Back** | Back gesture dismisses active overlay first (`Modal`, `DatePicker`, `Drawer`); root back asks for exit. | N/A | | N/A | N/A |
| **TC-09** | **Background App Cover** | App backgrounding synchronously mounts `<LockCoverScreen />`, hiding account balances. | | | | |
| **TC-10** | **Inactivity Auto-Lock** | Resuming app after configured timeout (e.g. 5m) prompts for PIN; correct PIN unlocks app. | | | | |
| **TC-11** | **Cashflow Period Comparison** | Total Income & Expenses compare against previous equivalent period; badges display truthful delta without NaN. | | | | |
| **TC-12** | **Offline Mode & Sync** | Transactions created offline are queued in outbox; reconnecting automatically flushes queue to Supabase. | | | | |
| **TC-13** | **Data Management Export** | "Export JSON" downloads complete, valid unencrypted `.json` backup file. | | | | |
| **TC-14** | **Theme Switch & Persistence** | Toggling Dark/Light mode immediately updates DOM class and persists `centra_theme_hint` without flash. | | | | |
| **TC-15** | **Lazy Loading Fallback** | Navigating to Report, Plan, or Settings loads chunks smoothly; network drop surfaces retry button. | | | | |
| **TC-16** | **Transfer Feature Integrity** | Transfer tab in Add Action modal allows inter-account transfers with converted amounts intact. | | | | |
