# Centra Android APK Releases

This directory houses curated and verified Android APK builds for Centra. Every APK can be downloaded directly from GitHub in a single click on both Android devices and desktop browsers.

---

## 📦 Version Inventory & Direct Downloads

| Package | Version | Status | One-Click Direct Download | Direct Mirror (Raw URL) | File Size | SHA-256 Checksum |
|:---|:---|:---|:---|:---|:---|:---|
| **Centra-v3.0.0-debug.apk** | `v3.0.0` | 🟢 **Latest Stable** | [**📲 Download Centra-v3.0.0.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.0.0-debug.apk) <br><sub>*(Fallback: [`Centra-v3.0.0-debug.apk?raw=true`](Centra-v3.0.0-debug.apk?raw=true))*</sub> | [Direct Raw Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.0.0-debug.apk) | **5.72 MB** <br>*(6,000,321 bytes)* | `a33c368c1a74a0649e4bf1b5e183186a66b87eae24ffdd091c745ac58b1a1530` |
| **Centra-v2.0.0-debug.apk** | `v2.0.0` | ⚪ **Previous Release** | [**📦 Download Centra-v2.0.0.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v2.0.0-debug.apk) <br><sub>*(Fallback: [`Centra-v2.0.0-debug.apk?raw=true`](Centra-v2.0.0-debug.apk?raw=true))*</sub> | [Direct Raw Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v2.0.0-debug.apk) | **5.44 MB** <br>*(5,700,969 bytes)* | `74c75d1314b7b45158045f5158595c3ce54726baab1f8822e8b034cdc9820196` |
| **Centra-v1.0.0** | `v1.0.0` | 📦 **Prototype Archive** | [Source Archive (`57007c7`)](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/57007c7) | — | — | `Initial Prototype Scaffold` |

---

## 🔒 Verification Instructions

Verify the integrity of downloaded APK binaries using the standard SHA-256 cryptographic utility:

### macOS / Linux:
```bash
shasum -a 256 releases/Centra-v3.0.0-debug.apk
```

### Windows (PowerShell / Command Prompt):
```powershell
CertUtil -hashfile releases\Centra-v3.0.0-debug.apk SHA256
```

---

## 🏷️ Release Naming Convention
- **Debug / Release APKs**: `Centra-v<Major>.<Minor>.<Patch>[-<channel>].apk`
- Example: `Centra-v3.0.0-debug.apk`, `Centra-v3.1.0-debug.apk`

---

## 🚀 Maintainer Guide: How to Publish a New Version Update

Publishing a new Android release with one-click download links takes 3 simple steps:

1. **Bump Version**: Update `"version"` in [`package.json`](../package.json) (e.g. `"version": "3.1.0"`).
2. **Build Android APK**:
   ```bash
   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
   ```
3. **Publish to Releases**:
   ```bash
   npm run release:apk
   ```
   This automated helper script (`scripts/prepare-release.mjs`) copies `app-debug.apk` to `releases/Centra-v<version>-debug.apk`, computes the exact byte count and SHA-256 checksum, and prints the formatted markdown row ready to paste into `README.md` and this file.
