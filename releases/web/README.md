# Centra Web & Desktop Releases (Installable PWA)

This directory houses curated production distribution packages for Centra Web and Desktop platforms (macOS, Windows, and Linux). Centra is delivered as a modern, installable Progressive Web Application (PWA) with full offline caching, service worker integration, and local IndexedDB database storage.

---

## 📦 Web & Desktop Version Inventory & Direct Downloads

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v1.0.0`** | 🟢 Latest | [**📲 Download Web Package**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/web/Centra-Web-v1.0.0.zip) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/web/Centra-Web-v1.0.0.zip) | 1.20 MB | Initial official Web & Desktop PWA release — production optimized bundle, offline Service Worker, Web App Manifest, desktop dock/window integration, and local PBKDF2 cryptography |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v1.0.0 (`Centra-Web-v1.0.0.zip`)**: `b2f6aadaa72a73138c478ceb652144242d8893449a00c3a9763df176b39b58ee`

Verify on macOS/Linux (`shasum -a 256 releases/web/Centra-Web-v1.0.0.zip`) or Windows (`CertUtil -hashfile releases\web\Centra-Web-v1.0.0.zip SHA256`).
</details>

---

## 💻 How to Install & Run Centra as a Desktop App (macOS / Windows / Linux)

### Option 1: Browser Desktop Install (One-Click)
1. Open the hosted Centra app in any Chromium browser (**Chrome**, **Edge**, **Brave**) or **Safari** on macOS Sonoma+.
2. Click the **Install** button:
   - **Chrome / Edge / Brave**: Click the **Install icon** in the browser URL bar (top right) or go to **Settings (⋮) > Save and share > Install Centra**.
   - **Safari (macOS Sonoma+)**: Go to **File > Add to Dock...**.
3. Centra will launch in its own dedicated, borderless desktop window with native OS dock / taskbar pinning and full offline capabilities.

### Option 2: Host the Standalone Production Bundle Locally
1. Download and extract [**`Centra-Web-v1.0.0.zip`**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/web/Centra-Web-v1.0.0.zip).
2. Serve the extracted folder with any local static file server:
   ```bash
   npx serve .
   # or with Python
   python3 -m http.server 3000
   ```
3. Open `http://localhost:3000` in your web browser.

---

## 🔒 Verification Instructions

Verify the cryptographic integrity of the downloaded production bundle:

### macOS / Linux:
```bash
shasum -a 256 releases/web/Centra-Web-v1.0.0.zip
```

### Windows (PowerShell / Command Prompt):
```powershell
CertUtil -hashfile releases\web\Centra-Web-v1.0.0.zip SHA256
```

---

## 🚀 Maintainer Guide: How to Publish a New Web Release

1. **Bump Version**: Update `"web"` in [`versions.json`](../../versions.json).
2. **Build Web Production Bundle**:
   ```bash
   npm run build
   ```
3. **Package and Publish**:
   ```bash
   npm run release:web
   ```
