# Centra Android APK Releases

This directory houses curated and verified Android application package (`.apk`) builds for Centra. Every APK can be downloaded directly from GitHub in a single click on both Android devices and desktop browsers.

---

## 📦 Android Version Inventory & Direct Downloads

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v4.1.3`** | 🟢 Latest | [**📲 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.3.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.3.apk) | 4.74 MB | Added automatic in-app update notifications and 1-click updater, comprehensive Legal, License, Privacy Policy, and Support Center, fixed Quick Action picker reset and Settings header layout |
| **`v4.1.2`** | ⚪ Previous | [**📦 Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.1.2) · [Notes](../../CHANGELOG.md) | 4.73 MB | Native touch swipe-to-delete, default system appearance theme, enlarged header greetings & balanced padding, enhanced bottom capsule nav spacing, and expanded recent activity |
| **`v4.1.1`** | ⚪ Previous | [**📦 Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.1.1) · [Notes](../../CHANGELOG.md) | 6.00 MB | Edit transaction date & Figma category picker, 52px input alignment, once-per-month retention notifications, centered toasts, all-categories activity filter, instant home back exit |
| **`v4.1.0`** | ⚪ Previous | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.0.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.0.apk) | 6.00 MB | 5-second Undo Delete, standalone Savings Goals with per-goal History log, native Android Downloads CSV & notifications, back-stack navigation, bottom nav alignment |
| **`v4.0.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.0.0) · [Notes](../../CHANGELOG.md) | 5.98 MB | Spring motion UI animations, swipe-to-delete rows, sliding tab pills, 2-month rolling retention, native phone notifications, immediate PIN lock |
| **`v3.3.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.3.0) · [Notes](../../CHANGELOG.md) | 5.97 MB | Custom payee/source primary titles, Savings Goal fund withdrawals, onboarding minimize persistence, month-end balance carryover |
| **`v3.2.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.2.0) · [Notes](../../CHANGELOG.md) | 5.94 MB | Interactive glowing/dimmed calendar Today button, pinned transactions stick to top with badges across all activity lists |
| **`v3.1.4`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.4) · [Notes](../../CHANGELOG.md) | 5.94 MB | Android safe-area zero top gap, non-wrapping header titles, word-break fix on goal cards, locked main scroll |
| **`v3.1.3`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.3) · [Notes](../../CHANGELOG.md) | 6.24 MB | Smart transaction titles & dates, locked sticky top headers, black app icon, 60fps theme toggle |
| **`v3.1.2`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.2) · [Notes](../../CHANGELOG.md) | 5.94 MB | System theme auto-detect, custom currency modal, fixed avatar zoom, Android CSV export, double-back exit |
| **`v3.1.1`** | 📦 Archive | [**📜 Changelog**](../../CHANGELOG.md) | 5.94 MB | Instant startup, auto offline background sync, OAuth avatar fix, compact ConfirmModal, 60fps dark toggle |
| **`v3.1.0`** | 📦 Archive | [**📜 Changelog**](../../CHANGELOG.md) | 5.76 MB | Zero-delay offline launch, unified avatar initials, brand logos & white launcher, legal modal, modal touch pull |
| **`v3.0.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.0.0) · [Notes](../../CHANGELOG.md) | 5.74 MB | Figma UI redesign, OLED Dark/Light themes, Analytics calendar, OAuth & OTP fixes |
| **`v2.0.0`** | 📦 Archive | [**📜 Changelog**](../../CHANGELOG.md) | 5.44 MB | Offline-first CentraDB sync, PBKDF2 PIN lock, Guest Demo mode, integer money math |
| **`v1.0.0`** | 📦 Archive | [**Source (`57007c7`)**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/57007c7) · [Changelog](../../CHANGELOG.md) | — | Initial React 18, Supabase & Capacitor multi-platform prototype |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v4.1.3 (`Centra-v4.1.3.apk`)**: `fb9cd89716b4e1b4a4fc65f69aaca8952863a08ddfe0454bb51e0f3e98108928`
- **v4.1.2 (`Centra-v4.1.2.apk`)**: `eadd76145f81cb68e4c6ba2a6fc7e45b66a39ba1ca9bf8c9d090aef44baa73e3`
- **v4.1.0 (`Centra-v4.1.0.apk`)**: `466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13`

Verify on macOS/Linux (`shasum -a 256 releases/android/Centra-v4.1.3.apk`) or Windows (`CertUtil -hashfile releases\android\Centra-v4.1.3.apk SHA256`).
</details>

---

## 🔒 Verification Instructions

Verify the integrity of downloaded APK binaries using the standard SHA-256 cryptographic utility:

### macOS / Linux:
```bash
shasum -a 256 releases/android/Centra-v4.1.3.apk
```

### Windows (PowerShell / Command Prompt):
```powershell
CertUtil -hashfile releases\android\Centra-v4.1.3.apk SHA256
```

---

## 🏷️ Release Naming Convention
- **Android APKs**: `Centra-v<Major>.<Minor>.<Patch>.apk`
- Example: `Centra-v4.1.0.apk`, `Centra-v4.1.1.apk`

---

## 🚀 Maintainer Guide: How to Publish a New Android Release

1. **Bump Version**: Update `"android"` in [`versions.json`](../../versions.json).
2. **Build Android APK**:
   ```bash
   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
   ```
3. **Publish to Android Releases**:
   ```bash
   npm run release:android
   ```
