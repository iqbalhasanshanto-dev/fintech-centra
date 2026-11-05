# Centra Multi-Platform Releases

Welcome to the official multi-platform distribution center for Centra. Centra maintains independent version tracks and specialized distribution packages tailored for **Android**, **iOS**, and **Web / Desktop (macOS, Windows, Linux)**.

---

## 🎯 Platform Release Tracks

| Platform | Current Version | Channel | Package Format | Direct Download / Distribution | Documentation |
|:---|:---|:---|:---|:---|:---|
| **🤖 Android** | **`v4.1.3`** | 🟢 Latest | Standalone APK (`.apk`) | [**📲 Download Android APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.3.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.3.apk) | [Android Releases Guide](android/README.md) |
| **🍏 iOS** | **`v1.0.1`** | 🟢 Latest | Standalone IPA (`.ipa`) | [**📲 Download iOS IPA**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.1.ipa) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-v1.0.1.ipa) | [iOS Releases Guide](ios/README.md) |
| **💻 Web / Desktop** | **`v1.0.5`** | 🟢 Latest | Standalone PWA (`Browser Install`) | [**🌐 Install Web App (Zero .zip)**](web/README.md) | [Web Releases Guide](web/README.md) |

---

## 📂 Release Directory Structure

```text
releases/
├── README.md               # Master multi-platform release index (this file)
├── android/                # Android APK packages and historical release records
│   ├── Centra-v4.1.3.apk   # Latest Android release (4.74 MB)
│   ├── Centra-v4.1.0.apk   # Previous Android release (6.00 MB)
│   └── README.md           # Android release notes, full version table & checksums
├── ios/                    # iOS distribution packages and local simulator guide
│   ├── Centra-v1.0.1.ipa   # Latest unsigned Release IPA package (2.46 MB)
│   ├── Centra-v1.0.0.ipa   # Previous unsigned Release IPA package (2.74 MB)
│   └── README.md           # iOS installation guide (IPA sideloading & Xcode Simulator)
└── web/                    # Web & Desktop PWA standalone browser install guide
    └── README.md           # Desktop PWA installation guide (zero .zip archives)
```

---

## 🔒 Verification & Integrity (SHA-256 Checksums)

Every release binary is cryptographically hashed with SHA-256 for uncompromising security and verification:

| Platform | File | Size | SHA-256 Checksum |
|:---|:---|:---|:---|
| **Android** | `Centra-v4.1.3.apk` | 4.74 MB | `01f1c88e8be4e7702608112d00b14af7e8c6ff8db82d973f2e879a05aecf8eab` |
| **Android (Prev)** | `Centra-v4.1.0.apk` | 6.00 MB | `466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13` |
| **iOS** | `Centra-v1.0.1.ipa` | 2.46 MB | `775229a9ab2b60d45f77f510520ee8a74cd37841a11077e1cf38b1849df29b62` |
| **iOS (Prev)** | `Centra-v1.0.0.ipa` | 2.74 MB | `47f7807b7d8f064879f2442a597232bcb3716098996b5fadf63efed80f7838d3` |
| **Web** | Standalone PWA | Direct Browser Install | Native installation from URL bar (Zero `.zip` archives) |

### Verification Command (macOS / Linux):
```bash
shasum -a 256 releases/android/Centra-v4.1.2.apk
shasum -a 256 releases/ios/Centra-v1.0.1.ipa
```

### Verification Command (Windows PowerShell):
```powershell
CertUtil -hashfile releases\android\Centra-v4.1.1.apk SHA256
```

---

## 🚀 Maintainer Quick Commands

To publish an update to any platform track:

```bash
# Android release (bumps android version in versions.json, copies APK, syncs checksums)
npm run release:android [version]

# iOS release (bumps ios version in versions.json, syncs Xcode project & builds Release IPA)
npm run release:ios [version]

# Web / Desktop release (bumps web version in versions.json, builds dist/ without zip files)
npm run release:web [version]
```
