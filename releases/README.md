# Centra Android APK Releases

This directory houses curated and verified Android APK builds for Centra.

---

## 📦 Version Inventory & Checksums

| Package | Version | Build Type | File Size | SHA-256 Checksum |
|:---|:---|:---|:---|:---|
| **Centra-v3.0.0-debug.apk** | `v3.0.0` (Latest) | Debug APK | `6,000,321 bytes` (5.72 MB) | `a33c368c1a74a0649e4bf1b5e183186a66b87eae24ffdd091c745ac58b1a1530` |
| **Centra-v2.0.0-debug.apk** | `v2.0.0` | Debug APK | `5,700,969 bytes` (5.44 MB) | `74c75d1314b7b45158045f5158595c3ce54726baab1f8822e8b034cdc9820196` |
| **Centra-v1.0.0** | `v1.0.0` | Foundation | — | *(Initial multi-platform scaffold; archived)* |

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
- **Production / Debug Releases**: `Centra-v<Major>.<Minor>.<Patch>[-<channel>].apk`
- Example: `Centra-v3.0.0-debug.apk`, `Centra-v3.0.0.apk`

