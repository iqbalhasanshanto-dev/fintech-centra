# Centra Phase 7 Native & Desktop Platform Audit Report

**Date:** 2026-10-23  
**Note:** In Part 1, the only code changes made were fixing the `PluginListenerHandle` type imports in `src/utils/nativeApp.ts` and `src/utils/nativeOAuth.ts`. All other source, test, config, and native files remain strictly unmodified.

---

## SECTION 1 - STATE OF THE REPOSITORY

### a) Git Status & History
- **`git status -s`**:
  ```text
  M docs/PROGRESS.md
  M src/utils/nativeApp.ts
  M src/utils/nativeOAuth.ts
  ```
  *(Note: `nativeApp.ts` and `nativeOAuth.ts` contain only the type-import fix from Part 1; `docs/PROGRESS.md` records the step).*

- **Last 15 commits (`git log --oneline -15`)**:
  ```text
  de8a41c WIP Phase 7 (before audit)
  b0d5b60 Phase 6 done
  8acf47d WIP Phase 6 fixes (quota ran out)
  ba00a1a feat: Phase 6  done
  ce9180a WIP Phase 6 (partial, quota ran out)
  bb17b79 feat: Phase 5 done
  669ed82 fix: follow up for phase 3
  1d8ffc4 fix: Phase 3 done
  049b349 fix: follow-up for Phase 4
  d8ac235 fix: Phase 4 done
  298aa49 fix: follow-up for Phase 1
  ea6b41e fix: Phase 1 done
  b095df5 fix: Phase 0 done
  d2a23b8 fix: port nd some minor bugs
  d9c5f24 feat: added features, make file for ios android and other devices
  ```

- **Files changed since "Phase 6 done" (`b0d5b60`)**:
  - **Deleted**: `repomix-output.xml`, `tsconfig.tsbuildinfo`
  - **Added**:
    - `src-tauri/Cargo.lock`
    - `src/__tests__/authRedirect.test.ts`
    - `src/__tests__/backButton.test.ts`
    - `src/__tests__/nativeApp.test.ts`
    - `src/__tests__/oauth_native.test.ts`
    - `src/__tests__/platform.test.ts`
    - `src/__tests__/resumeLock.test.ts`
    - `src/__tests__/supabaseClient.test.ts`
    - `src/utils/authRedirect.ts`
    - `src/utils/backButton.ts`
    - `src/utils/nativeOAuth.ts`
    - `src/utils/platform.ts`
  - **Modified**:
    - `.gitignore`
    - `android/app/capacitor.build.gradle`
    - `android/app/src/main/AndroidManifest.xml`
    - `android/capacitor.settings.gradle`
    - `capacitor.config.ts`
    - `docs/PROGRESS.md`
    - `ios/App/App/AppDelegate.swift`
    - `ios/App/CapApp-SPM/Package.swift`
    - `package-lock.json`, `package.json`
    - `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`
    - `src/components/home/TransactionDetailModal.tsx`
    - `src/components/layout/AppShell.tsx`
    - `src/components/modals/AddAccountModal.tsx`
    - `src/components/modals/AddActionModal.tsx`
    - `src/components/modals/NotificationsModal.tsx`
    - `src/components/onboarding/IntroScreen.tsx`
    - `src/components/onboarding/OnboardingFlow.tsx`
    - `src/components/ui/ConfirmModal.tsx`
    - `src/context/AuthContext.tsx`
    - `src/context/ThemeContext.tsx`
    - `src/lib/supabaseClient.ts`
    - `src/utils/nativeApp.ts`

### b) Quality Gates Verification Results
- **`npm run typecheck` (`tsc -b`)**: **PASS** (0 errors).
- **`npm run lint` (`eslint .`)**: **FAIL** (6 errors, 163 warnings).
  - *Error 1 & 2*: `src/__tests__/nativeApp.test.ts:13:35` and `16:56` — `@typescript-eslint/no-unsafe-function-type` (The `Function` type accepts any function-like value).
  - *Error 3*: `src/__tests__/resumeLock.test.ts:18:9` — `no-useless-assignment` (The value assigned to 'hiddenTimestamp' is not used in subsequent statements).
  - *Error 4*: `src/__tests__/resumeLock.test.ts:54:9` — `prefer-const` ('hiddenTimestamp' is never reassigned. Use 'const' instead).
  - *Error 5*: `src/components/onboarding/OnboardingFlow.tsx:46:7` — `react-hooks/immutability` (`goToStep` is accessed before it is declared).
  - *Error 6*: `src/utils/backButton.ts:101:3` — `react-hooks/refs` (`Cannot update ref during render`: `onCloseRef.current = onClose`).
- **`npm test` (`vitest run`)**: **PASS** (16 test files passed, 109 tests passed, 0 failed).
- **`npm run build` (`vite build`)**: **PASS** (exited 0).
  - Bundle chunk sizes:
    - `dist/index.html`: 1.11 kB (gzip: 0.59 kB)
    - `dist/assets/logo-CiRozO2t.png`: 151.36 kB
    - `dist/assets/index-M5iMWKyt.css`: 71.34 kB (gzip: 11.60 kB)
    - `dist/assets/web-Y2w9Si68.js`: 0.12 kB (gzip: 0.12 kB)
    - `dist/assets/web-BkyHhEbG.js`: 0.38 kB (gzip: 0.25 kB)
    - `dist/assets/web-Bqwl7Dbe.js`: 0.84 kB (gzip: 0.40 kB)
    - `dist/assets/index-CuuPopCn.js`: **1,160.07 kB** (gzip: 304.89 kB)
  - Vite warning: Chunk `dist/assets/index-CuuPopCn.js` is 1,160.07 kB (> 500 kB limit). Code splitting via `React.lazy` or `manualChunks` has not been implemented.

### c) Forbidden Tracked Files Check
Executed `git ls-files` search for: `.env`, `dist/`, `node_modules/`, `android/.gradle`, `android/app/build`, `android/build`, `android/local.properties`, `ios/App/Pods`, `ios/App/build`, `DerivedData`, `src-tauri/target`, `tsconfig.tsbuildinfo`, `repomix-output.xml`.
- **Offenders tracked**: **NONE** (0 files tracked).
- **Commands required**: None (`git rm --cached` not needed).
- **`.gitignore` status**: All patterns listed above are explicitly covered in `.gitignore`.

### d) Leftover Half-Written, Empty, or Unreferenced Files
- **Empty files**: No empty source files in `src/`. Only standard build cache/lock/cordova placeholder files exist in `android/`, `ios/`, and `src-tauri/target/`.
- **Unused exports / dead variables detected**:
  - `src/utils/authRedirect.ts:1:20`: `'isTauri'` is imported from `./platform` but never used.
  - `src/utils/nativeOAuth.ts:4:30`: `'NATIVE_REDIRECT_SCHEME'` is imported but never referenced in `nativeOAuth.ts`.
- **All created utility and test files** are actively referenced and imported across the test suite and context providers.

---

## SECTION 2 - PHASE 7 TASK-BY-TASK AUDIT

### Task T1: Platform Detection Helper (`src/utils/platform.ts`)
- **Status:** **DONE**
- **Evidence:**
  - File: `src/utils/platform.ts` (lines 9–44)
  - Excerpt:
    ```typescript
    export const isNative = (): boolean => Capacitor.isNativePlatform();
    export const getNativePlatform = (): NativePlatform => {
      const platform = Capacitor.getPlatform();
      return platform === 'android' || platform === 'ios' ? platform : 'web';
    };
    export const isTauri = (): boolean => {
      if (typeof window === 'undefined') return false;
      return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
    };
    ```
  - Test coverage: `src/__tests__/platform.test.ts` (5 tests passing: detects native android, ios, tauri `__TAURI_INTERNALS__`, `__TAURI__`, and web default).
- **Grep verification:** 0 stray `Capacitor.isNativePlatform`, 0 stray `__TAURI__`/`__TAURI_INTERNALS__`, and 0 `navigator.userAgent` checks found in `src/` outside `platform.ts` and its test.
- **What is missing:** None.
- **Risk:** Low.

---

### Task T2: Auth Redirect URL Helper (`src/utils/authRedirect.ts`)
- **Status:** **DONE**
- **Evidence:**
  - File: `src/utils/authRedirect.ts` (lines 11–22)
  - Excerpt:
    ```typescript
    export const getAuthRedirectUrl = (): string => {
      if (isNative()) {
        return NATIVE_REDIRECT_SCHEME; // 'com.centra.app://auth/callback'
      }
      if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/auth/callback`;
      }
      return 'http://localhost:3003/auth/callback';
    };
    ```
  - Test coverage: `src/__tests__/authRedirect.test.ts` (3 tests passing: native scheme, web origin, and desktop localhost fallback).
- **Grep verification:** All `redirectTo` usages in `AuthContext.tsx:452` and `nativeOAuth.ts:122` route through `getAuthRedirectUrl()`. No stray `window.location.origin` concatenations exist.
- **Tauri behavior:** Documented in doc comment (Desktop relies on email OTP; OAuth is hidden on desktop). However, unused import `isTauri` triggers an ESLint warning in `authRedirect.ts:1:20`.
- **What is missing:** Clean up unused `isTauri` import.
- **Risk:** Low.

---

### Task T3: Supabase Client Auth Options (`src/lib/supabaseClient.ts`)
- **Status:** **DONE**
- **Evidence:**
  - File: `src/lib/supabaseClient.ts` (lines 21–28)
  - Excerpt:
    ```typescript
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: !isNative(),
        persistSession: true,
        autoRefreshToken: true,
      },
    }
    ```
  - Test coverage: `src/__tests__/supabaseClient.test.ts` (passes, but test only asserts client is defined); `src/__tests__/oauth_native.test.ts` tests PKCE code exchange guard.
- **Double exchangeCodeForSession analysis:**
  - On web: `detectSessionInUrl: true` automatically processes the URL query parameters; `handleNativeDeepLink` is never called.
  - On native: `detectSessionInUrl: false`, so Supabase JS does NOT attempt automatic URL exchange. `handleNativeDeepLink` processes `com.centra.app://auth/callback` and maintains an internal `processedCodes` `Set<string>` duplicate guard.
  - No code path exists where both or duplicate handlers execute for the same PKCE code.
- **What is missing:** Unit test in `supabaseClient.test.ts` could explicitly assert configuration properties rather than simple defined checks.
- **Risk:** Low.

---

### Task T4: Native Bootstrap (`src/utils/nativeApp.ts`)
- **Status:** **NEEDS DEVICE TEST**
- **Evidence:**
  - File: `src/utils/nativeApp.ts` (lines 18–120), `capacitor.config.ts` (lines 11–16)
  - Excerpt:
    ```typescript
    export const initNativeApp = async (handlers?: NativeAppHandlers) => {
      if (!isNative()) return async () => {};
      if (isInitialized) return cleanupNativeApp;
      isInitialized = true;
      await hideSplashScreen();
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      await updateNativeStatusBar(isDark);
      // Registers appUrlOpen, appStateChange, backButton, and handles getLaunchUrl()
    ```
  - `capacitor.config.ts` sets `plugins.SplashScreen.launchAutoHide = false` with `launchFadeOutDuration: 250`.
  - Test coverage: `src/__tests__/nativeApp.test.ts` (5 tests passing: idempotency, splash hiding, status bar theme sync, listeners registration, cold start launch URL).
- **What is missing:**
  - `@capacitor/network` is NOT installed in `package.json`. The app uses web `window.addEventListener('online')` in `src/db/storage.ts:1948` and `FinanceContext.tsx:261`, which is notoriously unreliable in backgrounded Android WebViews.
  - Real device test is required to confirm hardware back button interception, splash fade without flicker, status bar edge-to-edge icon contrast, and cold start deep-link launch handling.
- **Risk:** Medium (network sync unreliability on mobile devices without native network listener).

---

### Task T5: Native Google OAuth (`src/utils/nativeOAuth.ts`)
- **Status:** **NEEDS DEVICE TEST**
- **Evidence:**
  - File: `src/utils/nativeOAuth.ts` (lines 19–150), `package.json` (line 30), `package-lock.json` (line 470)
  - Excerpt:
    ```typescript
    export const startNativeOAuth = async (provider: 'google' | 'apple', mode: AuthMode = 'signin') => {
      localStorage.setItem(INTENT_STORAGE_KEY, mode);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getAuthRedirectUrl(), skipBrowserRedirect: true },
      });
      browserFinishedListener = await Browser.addListener('browserFinished', () => { ... });
      await Browser.open({ url: data.url, windowName: '_self' });
    };
    ```
  - Test coverage: `src/__tests__/oauth_native.test.ts` (5 tests passing: unrelated URL ignored, PKCE exchange executed once, duplicate URL ignored, error parameters handled, intent saved and Browser opened).
- **Web flow comparison:** Web OAuth remains completely unchanged via standard `supabase.auth.signInWithOAuth` redirect (`AuthContext.tsx:449`).
- **Gaps discovered:**
  - In `AuthContext.tsx:442`, `signInWithOAuth` calls `startNativeOAuth(provider, currentMode)` without passing `options` (`onCancel`, `onError`).
  - In `IntroScreen.tsx:54`, `oauthLoading` is set to `'google'`, but `startNativeOAuth` returns immediately after `Browser.open`. When the user cancels or closes the Chrome Custom Tab, the `browserFinished` event has no cancel callback connected, leaving `IntroScreen` in a permanent disabled/spinner state until the app restarts.
  - Requires physical Android/iOS device or simulator to test Google OAuth consent page and custom scheme return.
- **Risk:** High (OAuth cancel leaves button permanently spinning on native).

---

### Task T6: Back-Button Mechanism & App-Resume Lock
- **Status:** **PARTIAL**
- **Evidence:**
  - File: `src/utils/backButton.ts` (lines 11–114), `src/context/AuthContext.tsx` (lines 530–560), `AppShell.tsx` (lines 25–34)
  - Excerpt:
    ```typescript
    export function useBackHandler(isOpen: boolean, onClose: () => void, priority = 0): void {
      const onCloseRef = useRef(onClose);
      onCloseRef.current = onClose;
      useEffect(() => {
        if (!isOpen) return;
        return BackButtonManager.register(() => { onCloseRef.current(); }, priority);
      }, [isOpen, priority]);
    }
    ```
  - Test coverage: `src/__tests__/backButton.test.ts` (5 tests: LIFO order, priority, unregistering, root handler fallback), `src/__tests__/resumeLock.test.ts` (2 tests: 5-minute timeout calculation, disabled user check).
- **Overlay adoption breakdown:**
  - **Uses `useBackHandler`:** `AddActionModal`, `AddAccountModal` (priority 2), `ConfirmModal` (priority 10), `TransactionDetailModal`, `NotificationsModal`, `OnboardingFlow` (priority step navigation), `AppShell` (root exit confirmation dialog).
  - **Does NOT use `useBackHandler`:** `TransactionDrawer.tsx`, `DatePicker.tsx`, and all `SettingsScreen` sub-modals (Profile info, Security PIN setup, Preferences, Reset/Export confirmation sub-views).
- **App-resume lock:**
  - Reuses Phase 2 `lockApp()`: YES.
  - Timeout: Hardcoded to `5 * 60 * 1000` (5 minutes); not user-configurable.
  - Race condition: `checkAndTriggerLock()` is invoked synchronously on resume/visibility, but because React state updates are asynchronous, there is a potential 1-frame flash of balances before `PinLockScreen` mounts.
- **Privacy & FLAG_SECURE:**
  - `FLAG_SECURE` is NOT enabled in Android (`MainActivity.java`).
  - App-switcher privacy option is NOT documented anywhere in `docs/` or settings.
- **Linter errors found:**
  - `src/utils/backButton.ts:101:3`: Updating `onCloseRef.current = onClose` during render violates `react-hooks/refs`.
  - `src/components/onboarding/OnboardingFlow.tsx:46:7`: `goToStep` accessed before declaration violates `react-hooks/immutability`.
  - `src/__tests__/resumeLock.test.ts:18:9` & `54:9`: ESLint assignment warnings.
- **Risk:** Medium (unhandled overlays close entire app or fail to intercept back button; linter errors in backButton hook).

---

### Task T7: Native Project Configuration
- **Status:** **NEEDS DEVICE TEST**
- **Evidence:**
  - Android Manifest (`android/app/src/main/AndroidManifest.xml`):
    - `android:allowBackup="false"` (line 5)
    - `android:usesCleartextTraffic="false"` (line 6)
    - `android:launchMode="singleTask"` (line 18)
    - Intent filter (lines 26–31):
      ```xml
      <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="com.centra.app" android:host="auth" android:pathPrefix="/callback" />
      </intent-filter>
      ```
    - Permissions: `INTERNET`, `ACCESS_NETWORK_STATE`.
  - Android SDK Versions (`android/variables.gradle`):
    - `compileSdkVersion = 35`
    - `targetSdkVersion = 35`
    - `minSdkVersion = 24`
    - `androidxActivityVersion = '1.11.0'`, `androidxCoreVersion = '1.17.0'`, `androidxFragmentVersion = '1.8.9'`
    - *Explanation of "Gradle: Build Error":* Capacitor 8 Android default is `compileSdkVersion = 36` (Android 16 Baklava) with Java 21. When plugins or AndroidX components depend on SDK 36 APIs while `variables.gradle` pins `35`, Gradle throws dependency resolution/compileSdk mismatch errors unless SDK 36 is configured or Gradle flags are adjusted.
  - iOS Configuration (`ios/App/App/Info.plist`, `ios/App/App/AppDelegate.swift`):
    - `CFBundleURLTypes` (lines 69–79): Scheme `com.centra.app`, Name `com.centra.app`.
    - `AppDelegate.swift` (lines 45–51): Forwards `open url` and `continue userActivity` to `ApplicationDelegateProxy.shared`.
  - Bundle ID, Signing, Targets:
    - `ios/App/App.xcodeproj/project.pbxproj` and `android/app/build.gradle` have NOT been modified since Phase 6. Bundle ID remains `com.centra.app`.
- **What is missing:** Testing Gradle assemble on a machine with Android SDK 35/36 installed; testing Xcode build.
- **Risk:** Medium (Gradle build error on Android due to SDK 35 vs Capacitor 8 default 36).

---

### Task T8: Tauri Desktop Configuration
- **Status:** **NEEDS DEVICE TEST**
- **Evidence:**
  - File: `src-tauri/tauri.conf.json` (lines 12–29)
  - CSP Directives found:
    - Production `csp`: `"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co ipc: http://ipc.localhost; img-src 'self' data: blob: https:;"`
    - Development `devCsp`: `"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3003; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co ipc: http://ipc.localhost ws://localhost:3003 http://localhost:3003; img-src 'self' data: blob: https:;"`
  - Coverage: Covers Google Fonts stylesheets (`fonts.googleapis.com`), font files (`fonts.gstatic.com`), Supabase REST (`https://*.supabase.co`) and WebSockets (`wss://*.supabase.co`), Tauri IPC (`ipc:`, `http://ipc.localhost`), Vite HMR (`ws://localhost:3003`, `http://localhost:3003`), and avatar images (`img-src https: data: blob:`).
  - Capabilities (`src-tauri/capabilities/default.json`): Minimal `"core:default"` only; no over-broad permissions.
  - Window dimensions: `width: 1280`, `height: 850`, `minWidth: 420`, `minHeight: 650`.
  - OAuth button hiding: Verified in `IntroScreen.tsx:242`: `{isTauri() ? <div>Use email sign-in on desktop</div> : <OAuthButtons />}`.
  - Window blur/minimization lock: Verified in `AuthContext.tsx:552-559` (`handleWindowBlur` sets `hiddenTimestamp`; `handleWindowFocus` checks 5-min timeout and triggers `lockApp()`).
- **What is missing:** Physical desktop verification on macOS/Windows/Linux running `npm run tauri dev`.
- **Risk:** Low.

---

### Task T9: Viewport and Mobile UI Integration
- **Status:** **BROKEN**
- **Evidence:**
  - File: `index.html` (lines 6–7)
  - Excerpt:
    ```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#0A0E1A" />
    ```
  - Keyboard handling: `inputMode="decimal"` on amount inputs (`AddActionModal.tsx:510`), `inputMode="numeric"` on OTP (`OtpScreen.tsx:242`) and PIN inputs (`PinLockScreen.tsx:59`, `SettingsScreen.tsx:711`).
  - Safe-area insets: Present only in `Header.tsx` (`pt-[env(safe-area-inset-top,0px)]`) and `BottomNav.tsx` (`paddingBottom: calc(0.375rem + env(safe-area-inset-bottom, 0px))`).
- **What is broken / missing:**
  1. `index.html:6` still contains `maximum-scale=1.0, user-scalable=no`, directly violating WCAG 2.1 accessibility criteria (1.4.4 Resize text) and preventing mobile pinch-to-zoom.
  2. `public/theme-init.js` is completely missing. On cold starts in dark mode, the page flashes light because theme class injection only runs inside `ThemeContext` React effect after hydration.
  3. Modals (`AddActionModal`, `AddAccountModal`, `NotificationsModal`, `ConfirmModal`), bottom drawers (`TransactionDrawer`), and `PinLockScreen` lack `env(safe-area-inset-*)` padding for notches and gesture pills.
  4. Only a single static dark `<meta name="theme-color" content="#0A0E1A" />` is declared without light-theme alternative or dynamic update.
- **Risk:** High (accessibility failure; visible light/dark theme flash on app startup; layout clipping under notch/home indicator).

---

### Task T10: Code Splitting & Bundle Optimization
- **Status:** **NOT DONE**
- **Evidence:**
  - File: `vite.config.ts`, `dist/assets/index-CuuPopCn.js`
  - Build output:
    ```text
    dist/assets/index-CuuPopCn.js   1,160.07 kB │ gzip: 304.89 kB
    (!) Some chunks are larger than 500 kB after minification.
    ```
  - Grep search for `React.lazy` or `lazy(` across `src/`: 0 occurrences.
  - `vite.config.ts` contains only basic `plugins: [react()]` and no `build.rollupOptions.output.manualChunks`.
- **What is missing:**
  - `React.lazy` and `<Suspense>` wrappers for `ReportScreen`, `PlanScreen`, `SettingsScreen`, and chart-heavy modals (`Recharts` is bundled directly into the main entry).
  - Manual vendor chunking in `vite.config.ts` (e.g. `vendor-react`, `vendor-charts`, `vendor-supabase`).
  - Chunk loading error boundary / retry UI for mobile users who experience network drops while fetching dynamic chunks.
- **Risk:** High (1.16 MB monolithic JavaScript bundle causes slow TTI and high memory overhead on low-end mobile devices).

---

### Task T11: Session & Local Data Protection
- **Status:** **NOT DONE**
- **Evidence:**
  - Grep search for "encrypt" across `src/`:
    - `src/components/onboarding/IntroScreen.tsx:153`: Displays `<Shield /> Encrypted` badge in intro screen.
    - `src/components/settings/SettingsScreen.tsx:203`: Claims *"Create a free account to enable encrypted cloud backup"*.
    - `src/components/settings/SettingsScreen.tsx:623`: Claims *"download your complete encrypted local database"* (JSON export is unencrypted plain text).
    - `src/utils/secureStorage.ts:2`: Claims *"Provides an encrypted/obfuscated storage layer for browsers & desktop"* using standard `btoa(encodeURIComponent(...))`.
  - `docs/`: No written assessment for session and local data protection exists.
  - Native secure-storage adapter (`@capacitor/preferences` or `@aparajita/capacitor-secure-storage`): NOT installed or implemented.
- **What is missing:**
  - Honest copy in `IntroScreen.tsx` and `SettingsScreen.tsx` removing false claims of client-side encryption.
  - Removal or honest documentation of `src/utils/secureStorage.ts`.
  - Written data protection assessment in `docs/` detailing local storage security boundaries on web, iOS, Android, and Tauri desktop.
- **Risk:** High (misleading security claims and compliance risk; sensitive data stored in plaintext localStorage without documented risk acceptance).

---

### Task T12: Test Suite Verification
- **Status:** **PARTIAL**
- **Evidence:**
  - Existing Phase 7 tests (all passing):
    - `src/__tests__/platform.test.ts` (5 tests): Helper platform detection.
    - `src/__tests__/authRedirect.test.ts` (3 tests): Redirect URL resolution.
    - `src/__tests__/supabaseClient.test.ts` (1 test): Supabase client defined.
    - `src/__tests__/nativeApp.test.ts` (5 tests): Native bootstrap idempotency, splash, status bar, listeners, cold start.
    - `src/__tests__/oauth_native.test.ts` (5 tests): `appUrlOpen` valid, duplicate, error, unrelated, and browser launch.
    - `src/__tests__/backButton.test.ts` (5 tests): LIFO stack, priorities, unregistration, root handler fallback.
    - `src/__tests__/resumeLock.test.ts` (2 tests): 5-minute timeout calculation, disabled user check.
- **What is missing:**
  - `src/__tests__/supabaseClient.test.ts` is a shallow check that does not verify `flowType: 'pkce'` or `detectSessionInUrl: !isNative()`.
  - `src/__tests__/resumeLock.test.ts` tests mock logic inline rather than testing `AuthContext`'s actual resume handler.
  - **NO tests exist** for:
    - Lazy chunk load failure and retry UI (feature not implemented).
    - Theme hint reading/writing before React mount (`theme-init.js` not implemented).
    - Back-button behavior inside `TransactionDrawer`, `DatePicker`, or `SettingsScreen` sub-views.
- **Risk:** Medium.

---

### Task T13: Platform Testing Documentation
- **Status:** **NOT DONE**
- **Evidence:**
  - `docs/PHASE7_TESTING.md`: Does **NOT** exist (directory contains only `AUDIT_REPORT.md` and `PROGRESS.md`).
  - `README.md`: Contains **NO** "Mobile and desktop" section (lines 1–120 describe only web setup).
- **What is missing:**
  - `docs/PHASE7_TESTING.md` with:
    - Android build and run commands (`npx cap run android`, Gradle requirements, Java 21).
    - ADB deep-link test command: `adb shell am start -W -a android.intent.action.VIEW -d "com.centra.app://auth/callback?code=test"`
    - iOS build and simulator run commands (`npx cap run ios`).
    - Simulator deep-link test command: `xcrun simctl openurl booted "com.centra.app://auth/callback?code=test"`
    - Desktop Tauri run commands (`npm run tauri dev`, `npm run tauri build`).
    - Manual test table for touch targets, keyboard push, safe areas, back button, and offline sync.
  - Dedicated "Mobile & Desktop Apps" section in `README.md`.
- **Risk:** Medium (no repeatable instructions for mobile/desktop manual validation).

---

## SECTION 3 - PROBLEM CHECKLIST P1 TO P10

| Problem | Original Issue | Status | One-line Reason & Pointer |
|---|---|---|---|
| **P1** | nativeApp never initialized | **NEEDS DEVICE TEST** | `initNativeApp` is called in `AuthContext.tsx:568`, but splash hide, status bar sync, and listener registration require real device verification (see Task T4). |
| **P2** | Google blocks OAuth in embedded WebViews | **NEEDS DEVICE TEST** | Handled via `@capacitor/browser` in `startNativeOAuth`, but system browser return and cancel spinner reset need device verification (see Task T5). |
| **P3** | `redirectTo` built from `window.location.origin` | **FIXED** | All redirect URLs are centralized through `getAuthRedirectUrl()`, returning `com.centra.app://auth/callback` on native (see Task T2). |
| **P4** | Default Supabase auth flow (needs PKCE & no auto URL detect on native) | **FIXED** | Configured `flowType: 'pkce'`, `detectSessionInUrl: !isNative()`, with single-exchange duplicate guard (see Task T3). |
| **P5** | No URL scheme registered on Android and iOS | **NEEDS DEVICE TEST** | Registered in `AndroidManifest.xml` and iOS `Info.plist`, but intent launching requires adb/simctl device test (see Task T7). |
| **P6** | `android:allowBackup` not false | **FIXED** | `android/app/src/main/AndroidManifest.xml` explicitly sets `android:allowBackup="false"` (see Task T7). |
| **P7** | Tauri CSP null | **FIXED** | Full strict CSP and devCsp configured in `src-tauri/tauri.conf.json` covering Google Fonts, Supabase, IPC, and Vite HMR (see Task T8). |
| **P8** | Pinch zoom disabled and possible theme flash | **NOT FIXED** | `index.html` still contains `maximum-scale=1.0, user-scalable=no`, and `public/theme-init.js` is missing (see Task T9). |
| **P9** | One 1.1 MB JS bundle | **NOT FIXED** | Production bundle is 1,160.07 kB monolithic entry without `React.lazy`, `Suspense`, or `manualChunks` (see Task T10). |
| **P10** | Back button and app-resume lock not handled | **PARTIALLY FIXED** | Back button stack and 5-min resume lock exist, but `TransactionDrawer`, `DatePicker`, and Settings sub-modals do not use it (see Task T6). |

---

## SECTION 4 - REGRESSION SPOT CHECK OF PHASES 0 TO 6

| Check | Requirement | Result | Evidence |
|---|---|---|---|
| **R0** | Production build succeeds; Capacitor packages declared in `package.json` and `package-lock.json` | **PASS** | `npm run build` exited with code 0 (`vite v6.4.3`). `package.json` declares `@capacitor/app: ^8.0.0`, `@capacitor/browser: ^8.0.5`, `@capacitor/splash-screen: ^8.0.0`, `@capacitor/status-bar: ^8.0.0`; all 4 are locked in `package-lock.json`. |
| **R1** | No password input or password parameter in auth code; no fake 2FA or biometric verification bypass | **PASS** | `grep -rniE "type=\"password\"" src` matches only `PinLockScreen.tsx:58` and `SettingsScreen.tsx:710, 724, 779` for 4-digit numeric PIN setup/unlock. Zero password parameters in `AuthContext.tsx` (passwordless email OTP only). `biometricEnabled` setting toggles UI preference but does not bypass PIN unlock. |
| **R2** | No '1234' PIN default and no `pinCode` field in AppSettings, seed data, exports or synced settings | **PASS** | Grep for `1234` returns only masked account numbers (`•••• 1234`) and numerical test fixtures (`1234.56`). Grep for `pinCode` returns 0 results across `src/`. |
| **R3** | Real deletes exist (`.delete()`) and Supabase calls check `error` | **PASS** | Real `.delete()` calls verified across all 6 entities in `src/db/storage.ts`: `accounts` (line 584), `categories` (line 644), `transactions` (line 798), `goals` (line 857), `budgets` (line 916), `notifications` (line 975, 1001), outbox queue (line 1133), and full reset (line 1417). All check `const { error } = await supabase...`. |
| **R4** | IDs use `crypto.randomUUID()` with no hard-coded prefix constants outside seeds/tests | **PASS** | `crypto.randomUUID()` used in `storage.ts:669, 1635, 1828`, `outbox.ts:46, 67, 73`, `FirstAccountScreen.tsx:91`, `financeOperations.ts:235, 579, 708`, and `FinanceContext.tsx:567, 636, 693, 763`. No static string constants like `'cat_'` or `'acc_'` used for active user data. |
| **R5** | Zero remaining `window.confirm` or `alert` calls | **PASS** | Grep `window\.confirm|[^a-zA-Z.]alert\(` returns 0 occurrences across all application source files in `src/` (matches only test suite title in `src/__tests__/confirmModals.test.tsx:95`). |
| **R6** | Guest data is never uploaded; "Create account" from guest triggers `ConfirmModal` | **PASS** | `isGuestUser()` strictly guards every single database push, sync, outbox flush, and polling handler in `src/db/storage.ts` (lines 180, 548, 578, 611, 638, 690, 765, 792, 824, 851, 883, 910, 942, 969, 995, 1020, 1049, 1111, 1201, 1406, 1822, 1951, 1963). `GuestBanner.tsx:58` and `Sidebar.tsx:162` both invoke `ConfirmModal` before starting account creation. |
| **R7** | Phase 1 routing intact: neutral message on unknown signin, OAuth intent handling, onboarding completed routing | **PASS** | In `AuthContext.tsx:360-373`, unknown emails on signin return neutral `{ ok: true }` without revealing account existence. OAuth intent is saved to `localStorage` before redirect and consumed in `handleSession` (lines 111-180), correctly routing existing accounts, new users, and `onboarding_completed` flags. Covered by 16 passing tests in `src/__tests__/auth.test.tsx`. |
| **R8** | Migration files present; storage mapper columns exist | **PASS** | `supabase/migrations/` contains: `20261009000000_initial_schema.sql` and `20261017000000_transaction_cross_currency_and_goal.sql`. Columns `converted_amount`, `exchange_rate`, and `goal_id` are defined in lines 7–10 of `20261017000000_transaction_cross_currency_and_goal.sql`. **Action for user:** Confirm in Supabase SQL Editor that both migrations are applied to the live database. |

---

## SECTION 5 - FINDINGS

### High Severity
1. **`src/components/onboarding/IntroScreen.tsx:54` & `src/context/AuthContext.tsx:442` — Unhandled Native OAuth Cancel Leaves Infinite Spinner**
   - *What is wrong:* When native OAuth begins, `IntroScreen` activates `oauthLoading('google')`, but `startNativeOAuth` returns immediately after opening `@capacitor/browser`. Neither `onCancel` nor `onError` callbacks are passed from `AuthContext` or `IntroScreen`.
   - *Why it matters:* If a user cancels Google login or closes the Chrome Custom Tab / SFSafariViewController, `oauthLoading` is never reset to `null`. The Google button remains permanently disabled with a spinner until the application is killed.
   - *Suggested fix:* Pass `onCancel: () => setOauthLoading(null)` and `onError` through `signInWithOAuth` to `startNativeOAuth`, connecting it to the `browserFinished` listener.

2. **`index.html:6` — Non-Compliant Viewport Meta Disabling Pinch-to-Zoom**
   - *What is wrong:* `index.html` defines `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`.
   - *Why it matters:* Violates WCAG 2.1 Success Criterion 1.4.4 (Resize Text), prevents pinch zooming for visually impaired users on mobile browsers and WebViews, and triggers automated accessibility audit failures.
   - *Suggested fix:* Change to `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`.

3. **`public/theme-init.js` (Missing) & `index.html` — Missing Theme Pre-Render Script Causing Dark-Mode Flash**
   - *What is wrong:* `public/theme-init.js` does not exist, and `index.html` has no pre-render script to read `centra_theme_hint` before React mounts.
   - *Why it matters:* On cold launch of the mobile/desktop application in dark mode, the document defaults to a white background for 100–300ms until React and `ThemeContext` mount, creating a jarring white flashbang on every cold start.
   - *Suggested fix:* Create `public/theme-init.js` reading `centra_theme_hint` and setting `dark` on `document.documentElement`, and include `<script src="/theme-init.js"></script>` in `index.html` `<head>`.

4. **`vite.config.ts` & `src/components/layout/AppShell.tsx` — 1.16 MB Monolithic Production Bundle Without Code Splitting**
   - *What is wrong:* The application builds into a single 1,160.07 kB JavaScript chunk (`dist/assets/index-CuuPopCn.js`). `React.lazy`, `<Suspense>`, and `build.rollupOptions.output.manualChunks` are completely absent.
   - *Why it matters:* Large monolithic bundle causes slow parse/compile times and high initial memory usage inside mobile WebViews, triggering Vite's chunk size warning (> 500 kB).
   - *Suggested fix:* Split `ReportScreen`, `PlanScreen`, `SettingsScreen`, and chart-heavy modals using `React.lazy()` and configure vendor manual chunks in `vite.config.ts`.

5. **`src/components/onboarding/IntroScreen.tsx:153`, `src/components/settings/SettingsScreen.tsx:203, 623`, `src/utils/secureStorage.ts` — False Client-Side Encryption Claims**
   - *What is wrong:* UI badges display `<Shield /> Encrypted`, settings text claims cloud backup is "encrypted", JSON export claims to be an "encrypted local database", and `secureStorage.ts` claims to provide an "encrypted/obfuscated storage layer" using basic base64 `btoa(...)`.
   - *Why it matters:* Untruthful security claims mislead users regarding data privacy at rest, violating `CENTRA_FIX_PLAN.md` instructions against claiming non-existent encryption.
   - *Suggested fix:* Replace "Encrypted" with "Secure Backup" and "Local JSON export" across the UI, and remove or document `secureStorage.ts` as non-encrypted base64 serialization.

### Medium Severity
6. **`android/variables.gradle:3` vs `@capacitor/android` v8 — Android SDK 35 vs 36 Compilation Mismatch**
   - *What is wrong:* `android/variables.gradle` pins `compileSdkVersion = 35` and `targetSdkVersion = 35`, whereas Capacitor 8 defaults to `compileSdkVersion = 36` (Android 16 Baklava) with Java 21.
   - *Why it matters:* Root cause of "Gradle: Build Error" in the IDE status bar; Capacitor 8 plugins compiled against SDK 36 fail dependency resolution if SDK 35 is forced without matching libraries.
   - *Suggested fix:* Bump `compileSdkVersion = 36` and `targetSdkVersion = 36` in `android/variables.gradle` once Android SDK 36 platform is configured.

7. **`package.json`, `src/db/storage.ts:1948`, `src/context/FinanceContext.tsx:261` — Missing `@capacitor/network` Plugin**
   - *What is wrong:* `@capacitor/network` is not installed; offline/online reconnect sync relies solely on web `window.addEventListener('online')`.
   - *Why it matters:* In Android WebViews, `window.ononline` is notoriously unreliable when returning from background or changing networks, causing pending outbox transactions to remain un-synced.
   - *Suggested fix:* Install `@capacitor/network` and bind `Network.addListener('networkStatusChange', ...)` to trigger outbox flush.

8. **`src/utils/backButton.ts:101:3` & `src/components/onboarding/OnboardingFlow.tsx:46:7` — React Hook & Immutability Linter Violations**
   - *What is wrong:* ESLint reports 6 errors: `onCloseRef.current = onClose` during render violates `react-hooks/refs`, and `goToStep` accessed before declaration violates `react-hooks/immutability`.
   - *Why it matters:* Causes `npm run lint` to fail and risks stale callbacks in back-button overlay disposal.
   - *Suggested fix:* Move `onCloseRef.current = onClose` inside a `useEffect` in `backButton.ts`, and declare `goToStep` above `useBackHandler` in `OnboardingFlow.tsx`.

9. **`src/components/home/TransactionDrawer.tsx`, `src/components/ui/DatePicker.tsx`, `src/components/settings/SettingsScreen.tsx` — Missing Hardware Back-Button Handling**
   - *What is wrong:* These overlays and sub-views do not call `useBackHandler`.
   - *Why it matters:* Pressing hardware back on Android while the transaction drawer or settings sub-views are open pops the entire screen or prompts to exit the app instead of closing the active overlay.
   - *Suggested fix:* Add `useBackHandler(isOpen, onClose)` to `TransactionDrawer`, `DatePicker`, and Settings sub-modals.

10. **`src/components/layout/Header.tsx`, `src/components/layout/BottomNav.tsx`, modals, and `PinLockScreen.tsx` — Incomplete Safe-Area Inset Support**
    - *What is wrong:* Safe-area insets (`env(safe-area-inset-*)`) are applied only to `Header.tsx` and `BottomNav.tsx`. Modals, bottom sheets, and `PinLockScreen` lack safe-area padding.
    - *Why it matters:* On iPhone and Android devices with notches, camera islands, or bottom gesture bars, close buttons and input controls can be obscured by system status or navigation bars.
    - *Suggested fix:* Add `pt-[env(safe-area-inset-top,0px)]` and `pb-[env(safe-area-inset-bottom,0px)]` to full-screen modals, bottom sheets, and `PinLockScreen.tsx`.

### Low Severity
11. **`docs/PHASE7_TESTING.md` (Missing) & `README.md` — Missing Platform Test Guide and Documentation**
    - *What is wrong:* No test guide exists for deep-link adb/xcrun testing, and `README.md` does not describe mobile or desktop builds.
    - *Why it matters:* Difficult to consistently test and reproduce native and desktop behaviors across machines.
    - *Suggested fix:* Create `docs/PHASE7_TESTING.md` with deep-link commands and manual test matrices, and update `README.md`.

12. **`src/utils/authRedirect.ts:1:20` & `src/utils/nativeOAuth.ts:4:30` — Dead Variable Imports**
    - *What is wrong:* Unused imports (`isTauri` and `NATIVE_REDIRECT_SCHEME`) generate ESLint warnings.
    - *Why it matters:* Minor code hygiene issue.
    - *Suggested fix:* Remove the two unused imports.

---

## SECTION 6 - SUMMARY TABLES AND NEXT STEPS

### a) Phase 7 Task Summary Table (T1 to T13)

| Task | Status | One-line Reason |
|---|---|---|
| **T1** | **DONE** | Centralized platform checks in `src/utils/platform.ts` with 0 stray checks and 5 passing unit tests. |
| **T2** | **DONE** | Centralized auth redirect in `src/utils/authRedirect.ts` with native scheme and web/desktop fallback (3 passing unit tests). |
| **T3** | **DONE** | PKCE flow and `detectSessionInUrl: !isNative()` configured in `supabaseClient.ts` with duplicate code exchange guard. |
| **T4** | **NEEDS DEVICE TEST** | Native bootstrap implemented in `nativeApp.ts` with splash hide and status bar sync, but requires physical device to verify. |
| **T5** | **NEEDS DEVICE TEST** | `@capacitor/browser` OAuth flow implemented in `nativeOAuth.ts`, but browser close cancel spinner and deep link return need device test. |
| **T6** | **PARTIAL** | Back-button stack and 5-min resume lock implemented, but `TransactionDrawer`, `DatePicker`, and Settings sub-modals do not use it. |
| **T7** | **NEEDS DEVICE TEST** | AndroidManifest and iOS Info.plist configured with `com.centra.app` scheme; compileSdk 35 vs 36 needs device build test. |
| **T8** | **NEEDS DEVICE TEST** | Strict CSP and devCsp set in `tauri.conf.json`, OAuth buttons hidden on desktop, and blur lock implemented; requires desktop test. |
| **T9** | **BROKEN** | `index.html` still disables pinch zoom (`maximum-scale=1.0, user-scalable=no`), and `public/theme-init.js` is missing. |
| **T10** | **NOT DONE** | Production bundle is a single monolithic 1.16 MB JS file without `React.lazy`, `<Suspense>`, or `manualChunks`. |
| **T11** | **NOT DONE** | No written data protection assessment; UI text contains false "encrypted" claims; `secureStorage.ts` uses base64 obfuscation. |
| **T12** | **PARTIAL** | Core helper and bootstrap tests pass (23 tests), but no tests exist for lazy-load retries, theme hint, or drawer back-handling. |
| **T13** | **NOT DONE** | `docs/PHASE7_TESTING.md` does not exist, and `README.md` lacks a "Mobile and desktop" section. |

### b) Completion Metrics
- **DONE or NEEDS DEVICE TEST:** **7 / 13 tasks (53.8%)**  *(DONE: 3, NEEDS DEVICE TEST: 4)*
- **PARTIAL, NOT DONE, or BROKEN:** **6 / 13 tasks (46.2%)**  *(PARTIAL: 2, NOT DONE: 3, BROKEN: 1)*

### c) Ready-to-Paste Follow-Up Prompt for "Finish Phase 7" Session

```text
You are continuing Phase 7 implementation on the Centra project (React 18 + TypeScript + Vite, Supabase, Capacitor 8, Tauri 2).
Phases 0 to 6 are done. A read-only audit completed in the previous session identified exactly 6 tasks that are PARTIAL, NOT DONE, or BROKEN. Do NOT re-audit; implement the fixes below directly.

GLOBAL RULES:
- Do not run anything against my Supabase database. No schema changes, no new migrations.
- Do not read, print, edit or commit .env or any secret.
- Do not launch emulators, simulators or devices.
- Do not run git commit, git push or any history-rewriting git command.
- Work in small steps with targeted greps and small reads. Append one line to docs/PROGRESS.md after completing each task.
- Run typecheck, lint, test, and build after each task to ensure quality gates pass cleanly (0 errors).

TASK LIST TO COMPLETE:

1. [BROKEN - T9] Viewport & Mobile UI:
   - File: index.html
     Change viewport meta to: <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
     Add: <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAFAFA" />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0A0E1A" />
     Add external script in <head>: <script src="/theme-init.js"></script>
   - File: public/theme-init.js (new file)
     Synchronously check localStorage.getItem('centra_theme_hint') or window.matchMedia('(prefers-color-scheme: dark)') and add/remove 'dark' class on document.documentElement.
   - File: src/components/home/TransactionDrawer.tsx, src/components/ui/DatePicker.tsx, src/components/auth/PinLockScreen.tsx, and modals:
     Add env(safe-area-inset-top) and env(safe-area-inset-bottom) padding.

2. [PARTIAL - T6] Back-Button Integration & ESLint Fixes:
   - File: src/utils/backButton.ts
     Fix line 101 react-hooks/refs error: move `onCloseRef.current = onClose;` inside `useEffect` (or update ref via layoutEffect).
   - File: src/components/onboarding/OnboardingFlow.tsx
     Fix line 46 react-hooks/immutability error: move `const goToStep = ...` definition above `useBackHandler`.
   - File: src/__tests__/resumeLock.test.ts
     Fix lines 18 and 54 ESLint warnings (unused assignment, prefer-const).
   - Wire `useBackHandler(isOpen, onClose)` into:
     - src/components/home/TransactionDrawer.tsx
     - src/components/ui/DatePicker.tsx
     - Sub-modals in src/components/settings/SettingsScreen.tsx
   - In src/components/onboarding/IntroScreen.tsx & src/context/AuthContext.tsx:
     Connect `onCancel: () => setOauthLoading(null)` and `onError` so cancelling Google OAuth resets the button loading state.

3. [NOT DONE - T10] Code Splitting & Bundle Optimization:
   - File: src/components/layout/AppShell.tsx
     Use `React.lazy()` and `<Suspense>` to lazy-load ReportScreen, PlanScreen, and SettingsScreen. Add a retry boundary for chunk fetch errors.
   - File: vite.config.ts
     Configure `build.rollupOptions.output.manualChunks`:
       - `vendor-react`: ['react', 'react-dom']
       - `vendor-supabase`: ['@supabase/supabase-js']
       - `vendor-charts`: ['recharts']
       - `vendor-icons`: ['lucide-react']
     Verify `npm run build` generates chunks under 500 kB with no Vite size warnings.

4. [NOT DONE - T11] Session & Data Protection Copy Cleanup:
   - File: src/components/onboarding/IntroScreen.tsx
     Replace "<Shield /> Encrypted" badge with honest copy ("Secure Sync" or "Cloud Synced").
   - File: src/components/settings/SettingsScreen.tsx
     Replace "encrypted cloud backup" and "encrypted local database" with honest descriptions of standard cloud sync and unencrypted JSON export.
   - File: src/utils/secureStorage.ts
     Delete this unused file or replace misleading "encrypted storage layer" docstring with honest base64 serialization note.
   - File: docs/DATA_PROTECTION.md (new file)
     Document local data storage mechanisms, security boundaries on Web / Android / iOS / Tauri desktop, and PIN lock verification.

5. [PARTIAL - T12] Unit Test Expansion:
   - File: src/__tests__/supabaseClient.test.ts
     Assert that `supabase` client was created with `flowType: 'pkce'` and `detectSessionInUrl: !isNative()`.
   - Add unit tests for:
     - `public/theme-init.js` logic (mocking localStorage and classList)
     - Lazy chunk error retry boundary
     - `TransactionDrawer` back-button registration

6. [NOT DONE - T13] Platform Documentation:
   - File: docs/PHASE7_TESTING.md (new file)
     Document commands for Android (`npx cap run android`, Gradle JDK 21 notes), iOS (`npx cap run ios`), and Desktop (`npm run tauri dev`). Include exact deep link test commands (`adb shell am start ...` and `xcrun simctl openurl ...`) and a manual test matrix.
   - File: README.md
     Add a "Mobile and Desktop" section explaining Capacitor and Tauri builds.
```

### d) What Must Be Tested by Hand (NEEDS DEVICE TEST Items)

#### 1. Android Device / Emulator
- **Compile & Build:** Run `./gradlew assembleDebug` in `android/` with JDK 21 to verify if `compileSdkVersion 35` vs Capacitor 8 default `36` builds successfully or requires bumping to 36.
- **Splash Screen:** Cold-boot app on Android; confirm splash screen displays `#0A0E1A` background and smoothly fades out (250ms) without white flicker.
- **Hardware Back Button:**
  - Open `AddActionModal`, press back button -> modal should close.
  - Open `AddAccountModal`, press back button -> modal should close.
  - From `home` tab with no modal open, press back button -> exit confirmation `ConfirmModal` should appear. Confirming should call `App.exitApp()`.
- **Deep-Link Launch (Cold & Warm):**
  - Execute: `adb shell am start -W -a android.intent.action.VIEW -d "com.centra.app://auth/callback?code=test_auth_code"`
  - Verify app launches and deep link handler receives URL without crashing.
- **Google OAuth Consent Flow:** Tap "Google" button, verify Chrome Custom Tab opens, complete Google login, and confirm redirect returns to the app and routes into authenticated state.

#### 2. Tauri Desktop Window (macOS / Linux / Windows)
- **Launch & Minimum Size:** Run `npm run tauri dev`. Confirm minimum window resize stops at `420 x 650` and layout does not break or overflow.
- **OAuth Buttons Hidden:** Navigate to Welcome screen; verify Google and Apple buttons are hidden and replaced with "Use email sign-in on desktop".
- **CSP Compliance:** Open Tauri DevTools console; verify no CSP violation warnings appear for Google Fonts, Supabase API calls, Supabase Realtime WebSockets, or Tauri IPC.
- **Window Minimization Lock:** Minimize or unfocus Centra desktop window for > 5 minutes with PIN lock enabled; re-focus and verify `PinLockScreen` appears before balances become interactive.

#### 3. iOS iPhone Device / Simulator
- **Deep-Link Launch:**
  - Execute: `xcrun simctl openurl booted "com.centra.app://auth/callback?code=test_auth_code"`
  - Verify `AppDelegate.swift` forwards URL to Capacitor and `appUrlOpen` fires.
- **Status Bar & Safe Areas:** Test in light and dark mode; verify status bar icons toggle between dark and light, and header/bottom nav respect notch and bottom home indicator.
- **SFSafariViewController OAuth:** Verify Google OAuth opens system safari controller and returns auth token via `com.centra.app://auth/callback`.



