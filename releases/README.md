# Centra Multi-Platform Releases

Welcome to the official multi-platform distribution center for Centra. Centra maintains independent version tracks and specialized distribution packages tailored for **Android**, **iOS**, and **Web / Desktop (macOS, Windows, Linux)**.

---

## 🎯 Platform Release Tracks

| Platform | Current Version | Channel | Package Format | Direct Download / Distribution | Documentation |
|:---|:---|:---|:---|:---|:---|
| **🤖 Android** | **`v4.1.1`** | 🟢 Latest | Standalone APK (`.apk`) | [**📲 Download Android APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.1.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.1.apk) | [Android Releases Guide](android/README.md) |
| **🍏 iOS** | **`v1.0.0`** | 🟢 Latest | Xcode Project & PWA (`.zip`) | [**📲 Download iOS Package**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-iOS-v1.0.0.zip) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-iOS-v1.0.0.zip) | [iOS Releases Guide](ios/README.md) |
| **💻 Web / Desktop** | **`v1.0.0`** | 🟢 Latest | Installable PWA (`.zip`) | [**📲 Download Web Package**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/web/Centra-Web-v1.0.0.zip) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/web/Centra-Web-v1.0.0.zip) | [Web Releases Guide](web/README.md) |

---

## 📂 Release Directory Structure

```text
releases/
├── README.md               # Master multi-platform release index (this file)
├── android/                # Android APK packages and historical release records
│   ├── Centra-v4.1.1.apk   # Latest Android release (6.00 MB)
│   ├── Centra-v4.1.0.apk   # Previous Android release (6.00 MB)
│   └── README.md           # Android release notes, full version table & checksums
├── ios/                    # iOS distribution archives and sideloading packages
│   ├── Centra-iOS-v1.0.0.zip # Synced Xcode workspace & PWA bundle (2.40 MB)
│   └── README.md           # iOS installation guide (Safari PWA & Xcode sideload)
└── web/                    # Standalone Web & Desktop PWA production archives
    ├── Centra-Web-v1.0.0.zip # Production build bundle with offline service worker (1.20 MB)
    └── README.md           # Desktop PWA installation guide (macOS, Windows, Linux)
```

---

## 🔒 Verification & Integrity (SHA-256 Checksums)

Every release artifact is cryptographically hashed with SHA-256 for uncompromising security and verification:

| Platform | File | Size | SHA-256 Checksum |
|:---|:---|:---|:---|
| **Android** | `Centra-v4.1.1.apk` | 6.00 MB | `03cbad9a8fb32593f5c05f76fb6e057eaaec2a92b56b6a3f8eb4ca8d60d6ab80` |
| **Android** | `Centra-v4.1.0.apk` | 6.00 MB | `466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13` |
| **iOS** | `Centra-iOS-v1.0.0.zip` | 2.40 MB | `8a8d489104aa62f050a440e09910d5220b75fc46539b800a4ea46b8854a9b61f` |
| **Web** | `Centra-Web-v1.0.0.zip` | 1.20 MB | `b2f6aadaa72a73138c478ceb652144242d8893449a00c3a9763df176b39b58ee` |

### Verification Command (macOS / Linux):
```bash
shasum -a 256 releases/android/Centra-v4.1.1.apk
shasum -a 256 releases/ios/Centra-iOS-v1.0.0.zip
shasum -a 256 releases/web/Centra-Web-v1.0.0.zip
```

### Verification Command (Windows PowerShell):
```powershell
CertUtil -hashfile releases\android\Centra-v4.1.1.apk SHA256
CertUtil -hashfile releases\web\Centra-Web-v1.0.0.zip SHA256
```

---

## 🚀 Maintainer Quick Commands

To publish an update to any platform track:

```bash
# Android release (bumps android version in versions.json, copies APK, syncs checksums)
npm run release:android [version]

# iOS release (bumps ios version in versions.json, syncs Xcode project & creates zip)
npm run release:ios [version]

# Web / Desktop release (bumps web version in versions.json, builds dist/ & creates zip)
npm run release:web [version]
```
