# Centra iOS Releases

This directory houses curated and verified iOS distribution packages for Centra.

---

## 📦 iOS Version Inventory & Direct Downloads

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v1.0.0`** | 🟢 Latest | [**📲 Download iOS Package**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-iOS-v1.0.0.zip) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-iOS-v1.0.0.zip) | 2.40 MB | Initial official iOS release — Capacitor 8 native Swift project, pure-black OLED launcher icons & 2732px splash screens, standalone Safari PWA support, local PBKDF2 PIN lock & offline CentraDB |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v1.0.0 (`Centra-iOS-v1.0.0.zip`)**: `8a8d489104aa62f050a440e09910d5220b75fc46539b800a4ea46b8854a9b61f`

Verify on macOS (`shasum -a 256 releases/ios/Centra-iOS-v1.0.0.zip`).
</details>

---

## 📲 How to Install & Run Centra on iOS (iPhone & iPad)

### Option 1: Instant Safari Web App (Recommended — No Mac or Xcode Required)
1. Open the hosted Centra URL in **Safari** on your iPhone or iPad.
2. Tap the **Share** button (box with an upward arrow) in the Safari bottom bar.
3. Scroll down and tap **Add to Home Screen** (`+`).
4. Tap **Add** in the top right corner.
5. Launch **Centra** from your Home Screen. It runs as a dedicated, borderless full-screen application with pure-black OLED styling, offline local storage, and high-performance animations.

### Option 2: Sideloading via Xcode (macOS)
1. Download [**`Centra-iOS-v1.0.0.zip`**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-iOS-v1.0.0.zip).
2. Unzip the package into your development directory.
3. Open `ios/App/App.xcworkspace` in **Xcode**.
4. Connect your iPhone via USB / Wi-Fi and select it as the run target.
5. In Xcode, configure your Apple ID under **Signing & Capabilities**.
6. Press **⌘R** (Run) to compile and install Centra directly onto your device.

---

## 🔒 Verification Instructions

Verify the cryptographic integrity of the downloaded archive:

```bash
shasum -a 256 releases/ios/Centra-iOS-v1.0.0.zip
```

---

## 🚀 Maintainer Guide: How to Publish a New iOS Release

1. **Bump Version**: Update `"ios"` in [`versions.json`](../../versions.json).
2. **Build and Sync**:
   ```bash
   npm run build && npx cap sync ios
   ```
3. **Package and Publish**:
   ```bash
   npm run release:ios
   ```
