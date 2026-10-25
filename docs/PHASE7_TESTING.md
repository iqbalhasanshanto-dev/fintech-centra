# Phase 7 Testing Guide

## Android

### Target SDK 36 Runtime Behaviour & Verification
Raising `targetSdkVersion` to 36 (Android 16) introduces platform behavior changes that must be verified on physical Android devices or emulators running Android 14+ / 15 / 16:

1. **Edge-to-Edge Display Enforcement**:
   - Starting with Android 15 (targetSdk 35+), the platform enforces edge-to-edge drawing by default. Status bar and gesture navigation bar areas are transparent/translucent.
   - **Verification**: Test on devices with gesture navigation and 3-button navigation. Verify that top headers and bottom navigation (tabs, floating action buttons, input bars) respect safe-area insets (`env(safe-area-inset-*)` / system window insets) and do not collide with the status bar, notch/camera cutout, or gesture pill.

2. **Predictive Back Navigation**:
   - Android 14+ (targetSdk 34+) enables predictive back animations when `android:enableOnBackInvokedCallback` is enabled.
   - **Verification**: Test the predictive back swipe gesture from the screen edge across all screens and nested UI states:
     - Open overlays/modals (e.g. `AddActionModal`, `AddAccountModal`, `TransactionDrawer`, `DatePicker`, `ConfirmModal`, `SettingsModal`) and verify back gestures dismiss the uppermost overlay first without triggering app exit.
     - On the root view, verify back gesture triggers the root exit confirmation rather than an abrupt kill.

3. **16 KB Page Size Compatibility**:
   - Modern Android 15+ devices support 16 KB page sizes.
   - **Verification**: If any native C/C++ libraries or native dependencies are bundled, verify memory mapping runs without `SIGSEGV` or alignment crashes on a 16 KB page size system image.

4. **Background Execution & Activity Lifecycle**:
   - Android 15/16 applies stricter rules to background operations, app resume, and task switching.
   - **Verification**: Verify that app switching and resume lock (5-minute inactivity timeout in `AuthContext`) operate smoothly without spurious session drops or crashes.
