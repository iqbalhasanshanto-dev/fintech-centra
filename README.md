<div align="center">

<img src="public/logo.png" alt="Centra Logo" width="96" height="96" style="border-radius: 24px;" />

# Centra

*Open-source, offline-first personal finance & budgeting app built with React 18, TypeScript, Supabase RLS, Capacitor 8 (Android/iOS) & Progressive Web App (macOS, Windows, Linux).*

<br />

[![MIT License](https://img.shields.io/badge/License-MIT-C6FF3D.svg?style=flat-square&labelColor=000000&color=C6FF3D)](LICENSE)
[![Android v4.1.3](https://img.shields.io/badge/Android-v4.1.3-C6FF3D.svg?style=flat-square&logo=android&logoColor=000000&labelColor=000000)](#-android-releases-v413)
[![iOS v1.0.1](https://img.shields.io/badge/iOS-v1.0.1-119EFF.svg?style=flat-square&logo=apple&logoColor=white&labelColor=000000)](#-ios-releases-v101)
[![Web / Desktop v1.0.5](https://img.shields.io/badge/Web_/_Desktop-v1.0.5-38BDF8.svg?style=flat-square&logo=pwa&logoColor=white&labelColor=000000)](#-web--desktop-releases-v105)
[![390 Passing Tests](https://img.shields.io/badge/Tests-390%20Passing-22c55e.svg?style=flat-square&labelColor=000000)](src/__tests__/)
[![Android SDK 36](https://img.shields.io/badge/Android-SDK%2036-3DDC84.svg?style=flat-square&logo=android&logoColor=white&labelColor=000000)](android/)
[![Capacitor 8.5](https://img.shields.io/badge/Capacitor-8.5-119EFF.svg?style=flat-square&logo=capacitor&logoColor=white&labelColor=000000)](https://capacitorjs.com/)
[![Supabase RLS](https://img.shields.io/badge/Supabase-RLS%20Enforced-3ECF8E.svg?style=flat-square&logo=supabase&logoColor=white&labelColor=000000)](supabase/)

<br /><br />

<!-- Hero Download Action Callout -->
<table>
  <tr>
    <td align="center" style="padding: 18px; background-color: #0d1117; border: 1px solid #30363d; border-radius: 14px;">
      <b>⚡ Instant Multi-Platform Direct Access (No App Store / Sign-Up Required)</b>
      <br /><br />
      <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.3.apk">
        <img src="https://img.shields.io/badge/🤖_Download_Android_APK-v4.1.3_(Latest_Stable,_4.74_MB)-C6FF3D?style=for-the-badge&logo=android&logoColor=000000&labelColor=121212" alt="Download Centra v4.1.3 Android APK" />
      </a>
      &nbsp;
      <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.1.ipa">
        <img src="https://img.shields.io/badge/🍏_Download_iOS_IPA-v1.0.1_(Latest_Stable,_2.46_MB)-119EFF?style=for-the-badge&logo=apple&logoColor=ffffff&labelColor=121212" alt="Download Centra v1.0.1 iOS IPA" />
      </a>
      &nbsp;
      <a href="releases/web/README.md">
        <img src="https://img.shields.io/badge/💻_Install_Web_App-v1.0.5_(Direct_Browser_Install)-38BDF8?style=for-the-badge&logo=pwa&logoColor=ffffff&labelColor=121212" alt="Install Centra v1.0.5 Web / Desktop App" />
      </a>
      <br /><br />
      <b>👉 Direct One-Click Access:</b> <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.3.apk">Android APK v4.1.3 (4.74 MB)</a> | <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.1.ipa">iOS IPA v1.0.1 (2.46 MB)</a> | <a href="releases/web/README.md">Web Standalone App (Browser Install)</a>
    </td>
  </tr>
</table>

<br />

<p align="center">
  <a href="#-releases--version-history"><b>Downloads & Releases</b></a> •
  <a href="#-key-features--open-source-privacy-guarantee"><b>Key Features</b></a> •
  <a href="#-open-source-security--privacy-architecture"><b>Open-Source Security</b></a> •
  <a href="#-reproducible-build-from-source--supabase-setup"><b>Build from Source</b></a> •
  <a href="#-supabase-setup"><b>Supabase Setup</b></a> •
  <a href="#-contributing-security-policy--mit-license"><b>Contributing</b></a>
</p>

</div>

---

<a id="releases--version-history"></a>
## 📲 Releases & Version History

Centra provides three independent release tracks: **Android**, **iOS**, and **Web / Desktop (PWA)**. Every package is cryptographically fingerprinted with SHA-256 for integrity verification.

### 🤖 Android Releases (`v4.1.3`)

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v4.1.3`** | 🟢 Latest | [**📲 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.3.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.3.apk) | 4.74 MB | Added automatic in-app update notifications and 1-click updater, comprehensive Legal, License, Privacy Policy, and Support Center, fixed Quick Action picker reset and Settings header layout |
| **`v4.1.2`** | ⚪ Previous | [**📦 Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.1.2) · [Notes](CHANGELOG.md) | 4.73 MB | Native touch swipe-to-delete, default system appearance theme, enlarged header greetings & balanced padding, enhanced bottom capsule nav spacing, and expanded recent activity |
| **`v4.1.1`** | ⚪ Previous | [**📦 Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.1.1) · [Notes](CHANGELOG.md) | 6.00 MB | Edit transaction date & Figma category picker, 52px input alignment, once-per-month retention notifications, centered toasts, all-categories activity filter, instant home back exit |
| **`v4.1.0`** | ⚪ Previous | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.0.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.0.apk) | 6.00 MB | 5-second Undo Delete, standalone Savings Goals with per-goal History log, native Android Downloads CSV & notifications, back-stack navigation, bottom nav alignment |
| **`v4.0.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v4.0.0) · [Notes](CHANGELOG.md) | 5.98 MB | Spring motion UI animations, swipe-to-delete rows, sliding tab pills, 2-month rolling retention, native phone notifications, immediate PIN lock |
| **`v3.3.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.3.0) · [Notes](CHANGELOG.md) | 5.97 MB | Custom payee/source primary titles, Savings Goal fund withdrawals, onboarding minimize persistence, month-end balance carryover |
| **`v3.2.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.2.0) · [Notes](CHANGELOG.md) | 5.94 MB | Interactive glowing/dimmed calendar Today button, pinned transactions stick to top with badges across all activity lists |
| **`v3.1.4`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.4) · [Notes](CHANGELOG.md) | 5.94 MB | Android safe-area zero top gap, non-wrapping header titles, word-break fix on goal cards, locked main scroll |
| **`v3.1.3`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.3) · [Notes](CHANGELOG.md) | 6.24 MB | Smart transaction titles & dates, locked sticky top headers, black app icon, 60fps theme toggle |
| **`v3.1.2`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.1.2) · [Notes](CHANGELOG.md) | 5.94 MB | System theme auto-detect, custom currency modal, fixed avatar zoom, Android CSV export, double-back exit |
| **`v3.1.1`** | 📦 Archive | [**📜 Changelog**](CHANGELOG.md) | 5.94 MB | Instant startup, auto offline background sync, OAuth avatar fix, compact ConfirmModal, 60fps dark toggle |
| **`v3.1.0`** | 📦 Archive | [**📜 Changelog**](CHANGELOG.md) | 5.76 MB | Zero-delay offline launch, unified avatar initials, brand logos & white launcher, legal modal, modal touch pull |
| **`v3.0.0`** | 📦 Archive | [**🏷️ Source Tag**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/v3.0.0) · [Notes](CHANGELOG.md) | 5.74 MB | Figma UI redesign, OLED Dark/Light themes, Analytics calendar, OAuth & OTP fixes |
| **`v2.0.0`** | 📦 Archive | [**📜 Changelog**](CHANGELOG.md) | 5.44 MB | Offline-first CentraDB sync, PBKDF2 PIN lock, Guest Demo mode, integer money math |
| **`v1.0.0`** | 📦 Archive | [**Source (`57007c7`)**](https://github.com/iqbalhasanshanto-dev/fintech-centra/tree/57007c7) · [Changelog](CHANGELOG.md) | — | Initial React 18, Supabase & Capacitor multi-platform prototype |

### 🍏 iOS Releases (`v1.0.1`)

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v1.0.1`** | 🟢 Latest | [**📲 Download iOS IPA**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.1.ipa) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-v1.0.1.ipa) | 2.46 MB | Fixed bottom navigation bar safe-area gap on iPhone screens, edge-to-edge WKWebView layout |
| **`v1.0.0`** | ⚪ Previous | [**📦 Download iOS IPA**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.0.ipa) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/ios/Centra-v1.0.0.ipa) | 2.74 MB | Initial official iOS release — Unsigned Release IPA for sideloading & Xcode Capacitor 8 native Swift project (with local Xcode Simulator testing via `npm run cap:open:ios`), pure-black OLED launcher icons & 2732px splash screens, local PBKDF2 PIN lock & offline CentraDB |

### 💻 Web & Desktop Releases (`v1.0.5` — macOS, Windows, Linux)

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v1.0.5`** | 🟢 Latest | [**🌐 Install Web App (Zero .zip)**](releases/web/README.md) | Direct Browser Install | Added automatic in-app update detector and 1-click zero-data-loss updater, comprehensive Legal, License, Privacy Policy, and Support Center |
| **`v1.0.4`** | ⚪ Previous | [**🌐 Release Notes**](releases/web/README.md) | Direct Browser Install | Web-only static rows with 1-click delete buttons, desktop centered Notifications modal card, enlarged header greeting & balanced padding, expanded Recent Activity box, default system appearance theme, descriptive tab title, and Network-First PWA caching |
| **`v1.0.2`** | ⚪ Previous | [**🌐 Release Notes**](releases/web/README.md) | Direct Browser Install | Unified floating bottom capsule navigation on desktop & mobile, side-by-side Account Information & Cash Flow Trend dashboard, permanent standalone PWA title bar, Google account chooser support |

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **Android v4.1.3 (`Centra-v4.1.3.apk`)**: `e426bbde3b2eef4feaef713f5d7e38c5024eacf47adda2ab6595022f3d9f9e88`
- **Android v4.1.2 (`Centra-v4.1.2.apk`)**: `eadd76145f81cb68e4c6ba2a6fc7e45b66a39ba1ca9bf8c9d090aef44baa73e3`
- **Android v4.1.0 (`Centra-v4.1.0.apk`)**: `466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13`
- **iOS v1.0.1 (`Centra-v1.0.1.ipa`)**: `775229a9ab2b60d45f77f510520ee8a74cd37841a11077e1cf38b1849df29b62`
- **iOS v1.0.0 (`Centra-v1.0.0.ipa`)**: `47f7807b7d8f064879f2442a597232bcb3716098996b5fadf63efed80f7838d3`

Verify on macOS/Linux:
```bash
shasum -a 256 releases/android/Centra-v4.1.3.apk
shasum -a 256 releases/ios/Centra-v1.0.1.ipa
shasum -a 256 releases/ios/Centra-v1.0.0.ipa
```
</details>

<details>
<summary><b>🛠️ Maintainer Guide: How to Publish Platform Releases</b></summary>

Publishing a new release for any platform track takes simple automated commands:

1. **Android Release**:
   ```bash
   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
   npm run release:android [version]
   ```
2. **iOS Release**:
   ```bash
   npm run release:ios [version]
   ```
   (Automatically runs `npm run build && npx cap sync ios`, compiles the unsigned Release iOS app via `xcodebuild`, packages `releases/ios/Centra-v<version>.ipa`, and updates checksums).
3. **Web / Desktop PWA Release**:
   ```bash
   npm run release:web [version]
   ```
   (Compiles the production bundle and updates documentation — zero `.zip` files generated).

The automated script (`scripts/prepare-release.mjs`) synchronizes `versions.json`, native project manifests, packages distribution files, calculates SHA-256 fingerprints, and updates release catalogs.

</details>

---

<a id="desktop--mobile-installation-guide"></a>
## 💻 Desktop & Mobile Installation Guide

### 📱 Android Phone Installation
1. Tap the [**📲 Download Centra v4.1.1 APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.1.apk) button above.
2. Once the download finishes, open the `.apk` file from your browser's notification tray or the `Downloads` folder.
3. If Android displays: *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **Allow from this source**.
4. Tap **Install** (or **Update**), then launch **Centra**!

### 🍏 iOS Installation (iPhone, iPad & Mac Simulator)

#### Option 1: Run in Local Xcode iOS Simulator
1. Ensure Xcode is installed on your Mac.
2. In the project root, open the iOS workspace:
   ```bash
   npm run cap:open:ios
   ```
3. Select an iOS Simulator from the destination toolbar (e.g., iPhone 17 or iPhone 18 Pro) and press **⌘R**.
4. The app boots immediately with full offline CentraDB persistence and hardware safe-area compliance.

#### Option 2: Sideload `Centra-v1.0.1.ipa` (Physical Device)
1. Download [**`Centra-v1.0.1.ipa`**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-v1.0.1.ipa).
2. Install via **AltStore**, **Sideloadly**, or **Apple Configurator**.
3. On your device, navigate to **Settings > General > VPN & Device Management** and trust your developer certificate.

#### Option 3: Instant Safari Web App (Recommended — Zero Setup)
1. Open Centra in **Safari** on your iOS device.
2. Tap the **Share** button (box with an upward arrow) in the bottom navigation toolbar.
3. Scroll down and tap **Add to Home Screen** (`+`).
4. Tap **Add** in the top right. Centra will install with its pure-black OLED icon and run in borderless standalone full-screen mode with offline data persistence.

### 💻 Desktop Installation (macOS / Windows / Linux)

#### Native Desktop PWA Install (Chrome, Edge, Brave, Safari)
Centra is a certified Progressive Web App with dedicated desktop windowing (zero `.zip` archives needed):
- **Chrome / Edge / Brave**: Click the **Install** button in the URL address bar (top right, just like YouTube) or click **Install App** in Centra's header.
- **Safari (macOS Sonoma+)**: Go to **File > Add to Dock...**.
- Centra runs in an isolated borderless window with native OS dock / taskbar pinning and offline caching.

#### Direct APK on Desktop (Android Studio Emulator, WSA, ADB)
- **Install via ADB onto Connected Device or Emulator**:
  ```bash
  adb install -r releases/android/Centra-v4.1.1.apk
  ```
- **Android Studio Virtual Device (AVD)**: Drag and drop `Centra-v4.1.1.apk` directly onto any running Android emulator window.
- **Windows Subsystem for Android (WSA)**: Install using `adb connect 127.0.0.1:58526 && adb install releases/android/Centra-v4.1.1.apk`.

### 🔍 SHA-256 Checksum Verification
Verify that your downloaded packages are 100% authentic and unaltered:

- **macOS / Linux**:
  ```bash
  shasum -a 256 releases/android/Centra-v4.1.1.apk
  shasum -a 256 releases/ios/Centra-v1.0.1.ipa
  shasum -a 256 releases/ios/Centra-v1.0.0.ipa
  ```
- **Windows (PowerShell / Command Prompt)**:
  ```powershell
  CertUtil -hashfile releases\android\Centra-v4.1.1.apk SHA256
  ```

| Platform Track | Release Package | Expected SHA-256 Hash |
|:---|:---|:---|
| **Android** | `Centra-v4.1.3.apk` | `e426bbde3b2eef4feaef713f5d7e38c5024eacf47adda2ab6595022f3d9f9e88` |
| **Android (Prev)** | `Centra-v4.1.0.apk` | `466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13` |
| **iOS** | `Centra-v1.0.1.ipa` | `775229a9ab2b60d45f77f510520ee8a74cd37841a11077e1cf38b1849df29b62` |
| **iOS (Prev)** | `Centra-v1.0.0.ipa` | `47f7807b7d8f064879f2442a597232bcb3716098996b5fadf63efed80f7838d3` |
| **Web / Desktop** | Standalone PWA | Direct Browser Install (Zero `.zip` archives) |

---

<a id="key-features"></a>
## ✨ Key Features & Open-Source Privacy Guarantee

Your financial records are deeply personal. Unlike commercial banking applications that collect behavioral telemetry, sell aggregate transaction statistics, or embed invasive trackers, Centra is completely open-source and built around strict privacy guarantees:

1. **Zero Ad Trackers & Zero Behavioral Telemetry**:
   Centra contains **no Google Firebase Analytics, no Facebook SDK, no advertising identifiers, and no third-party tracking scripts**. Your device makes network connections exclusively to your configured Supabase backend.
2. **Minimal Android Permission Footprint**:
   Inspect [`android/app/src/main/AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml). Centra only requests:
   - `android.permission.INTERNET` (to communicate with your private Supabase database)
   - `android.permission.ACCESS_NETWORK_STATE` (to detect online/offline connectivity status)
   - `android.permission.POST_NOTIFICATIONS` (for opt-in system notification tray alerts on budget overruns and monthly data rollover reminders)
   - **Zero Invasive Permissions**: No contact list access, no background location tracking, no camera/microphone permissions, and no reading of SMS messages or financial notifications.
3. **Local-Only WebCrypto PBKDF2 PIN Lock**:
   Your 4-digit app lock PIN is hashed locally using standard browser **WebCrypto PBKDF2** (SHA-256 with 150,000 iterations and a cryptographically secure random salt). The PIN hash and salt remain strictly in your device's local storage; they are **never uploaded to Supabase or included in cloud backups**.
4. **Strict PostgreSQL Row-Level Security (RLS)**:
   Every database query is gated at the database engine level with Supabase RLS. Every table enforces `auth.uid() = user_id`. Even with authenticated database access, no user or third party can read or mutate another user's accounts, transactions, or budgets.
5. **Exact Minor-Unit Integer Currency Math**:
   Centra eliminates IEEE-754 floating-point rounding errors by storing and calculating all balances, transactions, and budgets as integers in minor currency units (e.g., cents, poisha). Full native support for Bangladeshi Taka (`৳` BDT), US Dollar (`$` USD), Euro (`€` EUR), British Pound (`£` GBP), Japanese Yen (`¥` JPY), and Indian Rupee (`₹` INR).
6. **Offline-First Outbox Synchronization**:
   CentraDB caches all financial data locally. If you create or update transactions while offline, mutations are queued in a transactional Outbox and automatically synced to Supabase when connectivity returns.
7. **Session-Scoped Guest Demo Mode**:
   Test-drive Centra completely offline without creating an account. The guest session stores mock data inside browser `sessionStorage`, automatically purging when closed and never sending a single byte to any remote server.
8. **Air-Gap Data Protection**:
   `android:allowBackup="false"` is enforced in `AndroidManifest.xml` to prevent unencrypted cloud backups of local database caches to third-party Android backup services.

For a comprehensive technical review of storage topology, physical device access considerations, and security boundaries, read [**`docs/DATA_PROTECTION.md`**](docs/DATA_PROTECTION.md) and [**`docs/SECURITY_AUDIT.md`**](docs/SECURITY_AUDIT.md).

---

<a id="tech-stack"></a>
## 🛠 Tech Stack & 📁 Repository Architecture Tree

### Core Technologies

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend Framework** | React 18, TypeScript | Strongly typed user interface with declarative state management |
| **Styling & Design System** | Tailwind CSS, Outfit Variable Font | Custom OLED Pure Black (`#000000`) & Neon Lime (`#C6FF3D`) design tokens |
| **Mobile Runtime** | Capacitor 8 | Native Android (SDK 36, AGP 8.13.0) and iOS runtime with deep link handling |
| **Desktop & Web** | Progressive Web App (PWA) | Installable desktop app (macOS, Windows, Linux) with service worker offline caching |
| **Database & Auth** | Supabase (PostgreSQL 15) | Row-Level Security (RLS), PKCE OAuth, 6-digit passwordless Email OTP |
| **Offline Engine** | CentraDB | Client repository with transactional outbox queue and automatic sync on reconnect |
| **Visualizations & Charts** | Recharts, Lucide Icons | Responsive SVG spending donut charts, category distribution, custom spending calendar |
| **Testing Suite** | Vitest, Testing Library, jsdom | Comprehensive unit and integration test suite with **347 passing tests** |

### Repository Architecture Tree

```text
fintech-centra/
├── android/                 # Capacitor 8 Android native project (compileSdk 36, AGP 8.13.0)
├── docs/                    # Curated open-source documentation
│   ├── DATA_PROTECTION.md   # Storage topology, client caching, and privacy guarantees
│   ├── INPUT_RULES.md       # Input validation inventory, Unicode normalization, and length caps
│   ├── README.md            # Documentation directory index
│   ├── SECURITY_AUDIT.md    # Full 13-point security audit and hardening report
│   └── TESTING.md           # Multi-platform QA matrix (Android, iOS, Desktop)
├── ios/                     # Capacitor 8 iOS native project (Swift Package Manager)
├── public/                  # Static web assets, logos, and theme-init flash prevention script
├── releases/                # Multi-platform release distribution packages
│   ├── README.md            # Master multi-platform release catalog & verification guide
│   ├── android/             # Android APK packages (v4.1.1 Latest, v4.1.0 Previous)
│   ├── ios/                 # iOS distribution bundle (v1.0.0 Latest)
│   └── web/                 # Web & Desktop PWA production bundle (v1.0.0 Latest)
├── scripts/                 # Build and release automation scripts
│   ├── generate-launcher-icons.mjs # Multi-platform pure-black icon & splash generator
│   └── prepare-release.mjs  # Multi-platform release packager and SHA-256 calculator
├── src/
│   ├── __tests__/           # Comprehensive test suite (39 test suites, 347 passing tests)
│   ├── assets/              # Brand icons, logo images, and vector artwork
│   ├── components/
│   │   ├── auth/            # Sign-in, sign-up, 6-digit OTP verification, PIN lock screens
│   │   ├── home/            # Home dashboard, balance summary, quick actions, transaction feed
│   │   ├── layout/          # AppShell, responsive Header, Sidebar, BottomNav
│   │   ├── modals/          # AddActionModal (Spend/Income/Transfer), Category & Account pickers
│   │   ├── onboarding/      # Welcome intro, profile setup, theme selection
│   │   ├── plan/            # Budgets progress bars and savings goals tracking
│   │   ├── report/          # Analytics donut chart, period filters, spending calendar
│   │   ├── settings/        # Currency preferences, PIN management, data export, demo exit
│   │   └── ui/              # Accessible UI primitives (Button, Modal, ConfirmModal, DatePicker)
│   ├── context/             # AuthContext, FinanceContext, ThemeContext
│   ├── db/                  # CentraDB offline repository, outbox sync queue, schema types
│   ├── lib/                 # Supabase client instantiation and platform auth adapters
│   ├── types/               # TypeScript domain interfaces and type definitions
│   └── utils/               # Currency math, sanitizers, logger, native OAuth, PBKDF2 cryptography
└── supabase/
    └── migrations/          # Version-controlled idempotent SQL migrations (00001 to 00008)
```

> 🔒 **Protected Features Note (Transfers)**:
> The **Transfer** capability (including the Transfer tab in `AddActionModal.tsx`, `transferFunds`, `applyTransferFunds`, transfer branches in `src/utils/financeOperations.ts`, the `'transfer'` system category, and the `converted_amount` / `exchange_rate` database columns) is an active, protected core feature designed for multi-account management and cross-wallet rebalancing. It is strictly preserved and must not be deleted or disabled.

---

<a id="build-from-source"></a>
## 🚀 Reproducible Build from Source & 🗄 Supabase Setup

Centra is 100% reproducible. Anyone can verify and compile Centra directly from source code on their own machine.

### Prerequisites
- **Node.js**: v20 or newer (`node -v`)
- **JDK**: Java Development Kit 21 (`java -version`)
- **Android Studio**: Android Studio Ladybug (or newer) with Android SDK Platform 36 installed
- **Git**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/iqbalhasanshanto-dev/fintech-centra.git
cd fintech-centra
npm ci
```

### 2. Configure Environment Variables
Create your local `.env` file from the provided template:
```bash
cp .env.example .env
```

Open `.env` and configure your Supabase project parameters:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
VITE_ENABLE_APPLE_SIGNIN=false
```

> 🔒 **Security Notice**: `.env` is strictly ignored by Git (`.gitignore`). Never commit production secrets.

### 3. Verify Code Quality & Test Suite
Run the automated quality assurance pipeline:
```bash
# Verify TypeScript compilation (0 errors)
npm run typecheck

# Verify ESLint rules (0 errors, 0 warnings)
npm run lint

# Run full test suite (341 unit & integration tests)
npm test
```

### 4. Compile the Android APK
Build the web assets, synchronize the native Capacitor Android bridge, and compile the debug APK via Gradle:
```bash
# 1. Build production web bundle
npm run build

# 2. Sync web bundle to Android native project
npx cap sync android

# 3. Compile Android debug APK with Gradle
cd android
./gradlew assembleDebug
cd ..
```

The compiled APK will be output to:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install directly onto any connected Android device or emulator with ADB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

<a id="supabase-setup"></a>
### 🗄 Supabase Setup

Centra uses Supabase for database storage, Row-Level Security, and authentication.

#### 1. Apply Database Migrations
Apply the SQL migration files in [`supabase/migrations/`](supabase/migrations/) in sequential order via the Supabase SQL Editor or with the Supabase CLI (`supabase db push`):

1. `20261009000000_initial_schema.sql` — Complete idempotent production schema, triggers, and strict Row-Level Security (`RLS`) policies.
2. `20261017000000_transaction_cross_currency_and_goal.sql` — Cross-currency transfer fields and goal linkage.
3. `20261027000000_input_constraints.sql` — Server-side `CHECK` length constraints on user-facing text columns.

#### 2. Configure Auth Redirect URLs
In your Supabase Dashboard under **Authentication > URL Configuration**:
- **Site URL**: `http://localhost:3003` (or your deployed web URL)
- **Redirect URLs**: Add both of the following:
  - `http://localhost:3003/**`
  - `com.centra.app://auth/callback` *(required for native Android/iOS Google OAuth and deep links)*

#### 3. Configure 6-Digit Email OTP Verification
Centra uses a 6-digit OTP code for instant, passwordless email authentication. Under **Authentication > Email Templates**, edit both **Magic Link** and **Confirm Signup** templates to output the numeric token:

```html
<h2>Your Centra Verification Code</h2>
<p>Enter the following 6-digit code in Centra to proceed:</p>
<h1 style="letter-spacing: 6px; font-family: monospace; font-size: 32px; font-weight: bold;">{{ .Token }}</h1>
<p>This verification code will expire in 10 minutes.</p>
```

> ⚠️ **Production SMTP Note**: Do not use a personal Gmail account for production OTP dispatch. Configure a dedicated transactional email service (e.g., Resend, Postmark, AWS SES, SendGrid) under **Project Settings > Authentication > SMTP Settings**.

---

<a id="contributing"></a>
## 🤝 Contributing, Security Policy & MIT License

Contributions, bug reports, and suggestions from the open-source community are warmly welcomed!

### Contribution Workflow
1. Fork the repository on GitHub.
2. Create a descriptive feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes with clear commit messages (`git commit -m 'feat: add amazing feature'`).
4. Ensure all quality checks and tests pass:
   ```bash
   npm run typecheck && npm run lint && npm test && npm run build
   ```
5. Push to your branch (`git push origin feature/amazing-feature`) and open a Pull Request.

### Security Policy & Audits
- See [**`docs/SECURITY_AUDIT.md`**](docs/SECURITY_AUDIT.md) for our 13-point security audit report and vulnerability disclosure protocol.
- See [**`docs/DATA_PROTECTION.md`**](docs/DATA_PROTECTION.md) for data isolation and storage architecture.
- Track all version updates and migrations in [**`CHANGELOG.md`**](CHANGELOG.md).

### License
This project is licensed under the **MIT License** — see the [**`LICENSE`**](LICENSE) file for complete details.

**Copyright (c) 2026 Md. Iqbal Hasan Shanto**
