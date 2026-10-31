# Centra Android APK Releases

This directory houses curated and verified Android APK builds for Centra. Every APK can be downloaded directly from GitHub in a single click on both Android devices and desktop browsers.

---

## 📦 Version Inventory & Direct Downloads

| Version | Channel | One-Click Direct Download | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v3.1.3`** | 🟢 Latest | [**📲 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.3-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.3-debug.apk) | 6.24 MB | Locked sticky top headers, black app launcher icon, lag-free 60fps Dark/Light toggle on BDT |
| **`v3.1.2`** | ⚪ Previous | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.2-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.2-debug.apk) | 5.94 MB | System theme auto-detect, custom currency modal, fixed avatar zoom, Android CSV export, double-back exit |
| **`v3.1.1`** | 📦 Archive | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.1-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.1-debug.apk) | 5.94 MB | Instant startup, auto offline background sync, OAuth avatar fix, compact ConfirmModal, 60fps dark toggle |
| **`v3.1.0`** | 📦 Archive | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.0-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.0-debug.apk) | 5.76 MB | Zero-delay offline launch, unified avatar initials, brand logos & white launcher, legal modal, modal touch pull |
| **`v3.0.0`** | 📦 Archive | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.0.0-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.0.0-debug.apk) | 5.74 MB | Figma UI redesign, OLED Dark/Light themes, Analytics calendar, OAuth & OTP fixes |
| **`v2.0.0`** | 📦 Archive | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v2.0.0-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v2.0.0-debug.apk) | 5.44 MB | Offline-first CentraDB sync, PBKDF2 PIN lock, Guest Demo mode, integer money math |
| **`v1.0.0`** | 📦 Archive | [**Source (`57007c7`)**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/57007c7) | — | Initial React 18, Supabase & Capacitor multi-platform prototype |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v3.1.3 (`Centra-v3.1.3-debug.apk`)**: `ed609ba447ec1b5cad0b0b4553d2b82b11f52c66b29ef7515671a38184feee59`
- **v3.1.2 (`Centra-v3.1.2-debug.apk`)**: `d8907bd7acccdf702327caff42d679d67ff9a7e9b24b75eb62ab50192b1f1d9d`
- **v3.1.1 (`Centra-v3.1.1-debug.apk`)**: `7242ef498d59d28e4b55aa56308665cbdc235d9743c0bb5ed1697479607a4d01`
- **v3.1.0 (`Centra-v3.1.0-debug.apk`)**: `f0f909b678ba8d8a82a4c106bef6c57da4e80f664597ad5a3edfa6e243dacd98`
- **v3.0.0 (`Centra-v3.0.0-debug.apk`)**: `2bf9447eac3aeb1ce7c08fff62f2a41d12a2b1108d2955ab6ccf4887390f71a2`
- **v2.0.0 (`Centra-v2.0.0-debug.apk`)**: `74c75d1314b7b45158045f5158595c3ce54726baab1f8822e8b034cdc9820196`

Verify on macOS/Linux (`shasum -a 256 releases/Centra-v3.1.3-debug.apk`) or Windows (`CertUtil -hashfile releases\Centra-v3.1.3-debug.apk SHA256`).
</details>

---

## 🔒 Verification Instructions

Verify the integrity of downloaded APK binaries using the standard SHA-256 cryptographic utility:

### macOS / Linux:
```bash
shasum -a 256 releases/Centra-v3.1.3-debug.apk
```

### Windows (PowerShell / Command Prompt):
```powershell
CertUtil -hashfile releases\Centra-v3.1.3-debug.apk SHA256
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
