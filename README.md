<div align="center">

<img src="public/logo.png" alt="Centra Logo" width="96" height="96" style="border-radius: 24px;" />

# Centra

*Open-source, offline-first personal finance & budgeting app built with React 18, TypeScript, Supabase RLS, Capacitor 8 (Android/iOS) & Tauri 2 (Desktop).*

<br />

[![MIT License](https://img.shields.io/badge/License-MIT-C6FF3D.svg?style=flat-square&labelColor=000000&color=C6FF3D)](LICENSE)
[![Latest Release v4.1.0](https://img.shields.io/badge/Release-v4.1.0-C6FF3D.svg?style=flat-square&labelColor=000000&color=C6FF3D)](#-releases--version-history-table-download-any-version)
[![337 Passing Tests](https://img.shields.io/badge/Tests-337%20Passing-22c55e.svg?style=flat-square&labelColor=000000)](src/__tests__/)
[![Android SDK 36](https://img.shields.io/badge/Android-SDK%2036-3DDC84.svg?style=flat-square&logo=android&logoColor=white&labelColor=000000)](android/)
[![Capacitor 8.5](https://img.shields.io/badge/Capacitor-8.5-119EFF.svg?style=flat-square&logo=capacitor&logoColor=white&labelColor=000000)](https://capacitorjs.com/)
[![Supabase RLS](https://img.shields.io/badge/Supabase-RLS%20Enforced-3ECF8E.svg?style=flat-square&logo=supabase&logoColor=white&labelColor=000000)](supabase/)

<br /><br />

<!-- Hero Download Action Callout -->
<table>
  <tr>
    <td align="center" style="padding: 18px; background-color: #0d1117; border: 1px solid #30363d; border-radius: 14px;">
      <b>⚡ Instant Direct Downloads (No App Store / Sign-Up Required)</b>
      <br /><br />
      <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.1.0-debug.apk">
        <img src="https://img.shields.io/badge/📲_Download_Android_APK-v4.1.0_(Latest_Stable,_6.00_MB)-C6FF3D?style=for-the-badge&logo=android&logoColor=000000&labelColor=121212" alt="Download Centra v4.1.0 Android APK" />
      </a>
      &nbsp;
      <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.0.0-debug.apk">
        <img src="https://img.shields.io/badge/📦_Download_Android_APK-v4.0.0_(Previous_Release,_5.98_MB)-3B82F6?style=for-the-badge&logo=android&logoColor=ffffff&labelColor=121212" alt="Download Centra v4.0.0 Android APK" />
      </a>
      &nbsp;
      <a href="#-desktop--mobile-installation-guide">
        <img src="https://img.shields.io/badge/💻_Desktop_&_Mobile-Installation_Guide-white?style=for-the-badge&logo=desktop&logoColor=000000&labelColor=121212" alt="Build / Run on Desktop" />
      </a>
      <br /><br />
      <b>👉 Direct One-Click APK Download (Android & Desktop):</b> <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.1.0-debug.apk">Download Centra v4.1.0 APK (6.00 MB)</a> | <a href="https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.0.0-debug.apk">Download Centra v4.0.0 APK (5.98 MB)</a>
    </td>
  </tr>
</table>

<br />

<p align="center">
  <a href="#-releases--version-history-table-download-any-version"><b>Downloads & Releases</b></a> •
  <a href="#-key-features--open-source-privacy-guarantee"><b>Key Features</b></a> •
  <a href="#-open-source-security--privacy-architecture"><b>Open-Source Security</b></a> •
  <a href="#-reproducible-build-from-source--supabase-setup"><b>Build from Source</b></a> •
  <a href="#-supabase-setup"><b>Supabase Setup</b></a> •
  <a href="#-contributing-security-policy--mit-license"><b>Contributing</b></a>
</p>

</div>

---

<a id="releases-table"></a>
## 📲 Releases & Version History Table (Download Any Version)

Download standalone Android application packages directly from GitHub. Every APK is cryptographically fingerprinted with SHA-256 for integrity verification.

| Version | Channel | Download / Release Record | Size | Highlights |
|:---|:---|:---|:---|:---|
| **`v4.1.0`** | 🟢 Latest | [**📲 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.1.0-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v4.1.0-debug.apk) | 6.00 MB | 5-second Undo Delete, standalone Savings Goals with per-goal History log, native Android Downloads CSV & notifications, back-stack navigation, bottom nav alignment |
| **`v4.0.0`** | ⚪ Previous | [**📦 Download APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.0.0-debug.apk) · [Mirror](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v4.0.0-debug.apk) | 5.98 MB | Spring motion UI animations, swipe-to-delete rows, sliding tab pills, 2-month rolling retention, native phone notifications, immediate PIN lock |
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

<details>
<summary><b>🔒 View SHA-256 Checksums & Verification Commands</b></summary>

- **v4.1.0 (`Centra-v4.1.0-debug.apk`)**: `5e59a20f2eab4cfb0f68f9f742120d53de090ceb235a6b7eb152a345b737b329`
- **v4.0.0 (`Centra-v4.0.0-debug.apk`)**: `0bfd170ccefabcd4c15cdb60a01e8b42ccfc4b12240ff500c1a0d8a1f351cd54`

Verify on macOS/Linux (`shasum -a 256 releases/Centra-v4.1.0-debug.apk`) or Windows (`CertUtil -hashfile releases\Centra-v4.1.0-debug.apk SHA256`).
</details>

<details>
<summary><b>🛠️ Maintainer Guide: How to Publish a New Release (<code>v3.3.0</code>, <code>v4.0.0</code>, etc.)</b></summary>

Publishing a new Android release with one-click direct download links takes 3 automated steps:

1. **Bump Version**: Update `"version"` in [`package.json`](package.json) (e.g. `"version": "3.3.0"`).
2. **Compile the APK**:
   ```bash
   npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
   ```
3. **Package & Fingerprint Release**:
   ```bash
   npm run release:apk
   ```
   This automated helper script (`scripts/prepare-release.mjs`):
   - Copies `android/app/build/outputs/apk/debug/app-debug.apk` to `releases/Centra-v<version>-debug.apk`.
   - Computes the exact byte size and SHA-256 cryptographic checksum.
   - Outputs the formatted markdown rows ready to paste into `README.md`, `releases/README.md`, and `CHANGELOG.md`.
   - Preserves all historical versions in `releases/` so users can download any prior release at any time.

</details>

---

<a id="desktop--mobile-installation-guide"></a>
## 💻 Desktop & Mobile Installation Guide

### 📱 Android Phone Installation
1. Tap the [**📲 Download Centra v4.1.0 APK**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.1.0-debug.apk) button above.
2. Once the download finishes, open the `.apk` file from your browser's notification tray or the `Downloads` folder.
3. If Android displays: *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **Allow from this source**.
4. Tap **Install** (or **Update**), then launch **Centra**!

### 💻 Desktop Installation (macOS / Windows / Linux)

#### Option 1: Direct APK on Desktop (Android Studio Emulator, WSA, ADB)
Download the `.apk` directly to your computer using the download buttons or table above:
- **Install via ADB onto Connected Device or Emulator**:
  ```bash
  adb install -r Centra-v4.1.0-debug.apk
  ```
- **Android Studio Virtual Device (AVD)**: Drag and drop the downloaded `.apk` directly onto any running Android emulator window.
- **Windows Subsystem for Android (WSA)**: Install using `adb connect 127.0.0.1:58526 && adb install Centra-v4.1.0-debug.apk`.

#### Option 2: Native Desktop Build via Tauri 2
Centra includes a native Rust-powered desktop bundle for macOS (`.dmg`), Windows (`.msi` / `.exe`), and Linux (`.AppImage` / `.deb`):
```bash
npm run tauri:build
```
Compiled standalone desktop executables are generated in `src-tauri/target/release/bundle/`.

#### Option 3: Local Web App
Centra can be run directly inside any desktop browser:
```bash
npm run dev
```
Navigate to `http://localhost:3003` to use Centra locally.

### 🔍 SHA-256 Checksum Verification
Verify that your downloaded APK is 100% authentic and matches the source code:

- **macOS / Linux**:
  ```bash
  shasum -a 256 releases/Centra-v4.1.0-debug.apk
  ```
- **Windows (PowerShell / Command Prompt)**:
  ```powershell
  CertUtil -hashfile releases\Centra-v4.1.0-debug.apk SHA256
  ```

**Expected SHA-256 Hash for v4.1.0**:
```text
5e59a20f2eab4cfb0f68f9f742120d53de090ceb235a6b7eb152a345b737b329
```

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
| **Desktop Runtime** | Tauri 2 | Ultra-lightweight Rust backend with native operating system webviews |
| **Database & Auth** | Supabase (PostgreSQL 15) | Row-Level Security (RLS), PKCE OAuth, 6-digit passwordless Email OTP |
| **Offline Engine** | CentraDB | Client repository with transactional outbox queue and automatic sync on reconnect |
| **Visualizations & Charts** | Recharts, Lucide Icons | Responsive SVG spending donut charts, category distribution, custom spending calendar |
| **Testing Suite** | Vitest, Testing Library, jsdom | Comprehensive unit and integration test suite with **337 passing tests** |

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
├── releases/                # Active Android APK distributions (Latest & Previous)
│   ├── Centra-v4.1.0-debug.apk
│   ├── Centra-v4.0.0-debug.apk
│   └── README.md
├── scripts/                 # Build and release automation scripts
│   └── prepare-release.mjs  # One-command release packager and SHA-256 calculator
├── src-tauri/               # Tauri 2 desktop application source and Cargo manifest
├── src/
│   ├── __tests__/           # Comprehensive test suite (37 test suites, 337 passing tests)
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

# Run full test suite (337 unit & integration tests)
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
