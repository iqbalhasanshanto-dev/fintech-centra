# Centra iOS Releases

This directory houses curated and verified iOS distribution packages for Centra.

---

## 📦 iOS Version Inventory & Direct Downloads

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v1.0.0`** | 🟢 Latest | [**📲 Download iOS IPA**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.0.ipa) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-v1.0.0.ipa) | 2.74 MB | Initial official iOS release — Unsigned Release IPA for sideloading & Xcode Capacitor 8 native Swift project, pure-black OLED launcher icons & 2732px splash screens, local PBKDF2 PIN lock & offline CentraDB |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v1.0.0 (`Centra-v1.0.0.ipa`)**: `47f7807b7d8f064879f2442a597232bcb3716098996b5fadf63efed80f7838d3`

Verify on macOS:
```bash
shasum -a 256 releases/ios/Centra-v1.0.0.ipa
```
</details>

---

## 📲 How to Install & Run Centra on iOS (iPhone, iPad & Mac Simulator)

### Option 1: Run in Local Xcode iOS Simulator (Fastest Development & Verification)
1. Ensure Xcode is installed on your Mac.
2. In the project root, open the iOS project in Xcode:
   ```bash
   npm run cap:open:ios
   ```
3. In Xcode, select an iOS Simulator from the destination toolbar (e.g., **iPhone 17**, **iPhone 18 Pro**, or **iPad Air**).
4. Press **⌘R** (Run) or click the **Play** button.
5. The application builds and boots inside the simulator with full offline database persistence, 60fps animations, and hardware safe-area compliance.

### Option 2: Sideload `Centra-v1.0.0.ipa` onto a Physical iPhone or iPad
1. Download [**`Centra-v1.0.0.ipa`**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.0.ipa).
2. Sideload the IPA onto your iOS device using your preferred tool:
   - **AltStore / SideStore**: Open the IPA in AltStore on your device.
   - **Sideloadly**: Connect your device to Mac/PC, drag `Centra-v1.0.0.ipa` into Sideloadly, and click Start.
   - **Apple Configurator**: Connect your iPhone to Mac and drag the IPA onto your device.
3. On your device, go to **Settings > General > VPN & Device Management** and trust your developer account.
4. Launch **Centra** from your Home Screen.

### Option 3: Instant Safari Web App (PWA — No Mac or Xcode Required)
1. Open the hosted Centra URL in **Safari** on your iPhone or iPad.
2. Tap the **Share** button (box with upward arrow) in the Safari toolbar.
3. Scroll down and tap **Add to Home Screen** (`+`).
4. Tap **Add** in the top right corner.
5. Launch **Centra** from your Home Screen. It runs as a dedicated, borderless full-screen application with pure-black OLED styling, offline local storage, and high-performance animations.

---

## 🔒 Verification Instructions

Verify the cryptographic integrity of the downloaded archive:

```bash
shasum -a 256 releases/ios/Centra-v1.0.0.ipa
```

---

## 🚀 Maintainer Guide: How to Publish a New iOS Release

1. **Bump Version**: Update `"ios"` in [`versions.json`](../../versions.json).
2. **Compile & Package**:
   ```bash
   npm run release:ios
   ```
   This automatically synchronizes `versions.json`, updates `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`, executes `npm run build && npx cap sync ios`, compiles the unsigned Release iOS app via `xcodebuild`, packages it into `releases/ios/Centra-v<version>.ipa`, and updates SHA-256 checksums in all catalogs.
