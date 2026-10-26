# Centra

**Centra** is an offline-first personal finance management and budgeting system designed for high usability across Web, Android, iOS, and Desktop. Centra helps users track income, expenses, category budgets, savings goals, and multi-currency accounts with clean aesthetics and privacy controls.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, TypeScript |
| **Build Tool & Bundler** | Vite (optimized code-splitting with manual chunk vendor isolation) |
| **Styling** | Tailwind CSS (Tailwind typography, dark mode, CSS safe-area insets) |
| **Backend & Auth** | Supabase (PostgreSQL, Row-Level Security, PKCE OAuth, 6-digit Email OTP) |
| **Mobile Runtime** | Capacitor 8 (Android SDK 36, AGP 8.13.0, iOS Swift Package Manager) |
| **Desktop Runtime** | Tauri 2 (Rust core, native OS webview engine, strict window constraints) |
| **Charts & Visuals** | Recharts, Lucide Icons, canvas-confetti |
| **Testing** | Vitest, Testing Library (React & DOM), jsdom |

---

## 📁 Project Structure

```
├── android/                 # Capacitor 8 Android native project (AGP 8.13.0, compileSdk 36)
├── docs/                    # Architectural reports, testing guides, and security documentation
│   ├── AUDIT_REPORT.md      # Comprehensive Phase 7 audit and quality findings
│   ├── DATA_PROTECTION.md   # Storage topology, PIN locking design, and security disclosures
│   ├── PHASE7_TESTING.md    # Multi-platform manual testing matrix & guide (Android, iOS, Desktop)
│   ├── PROGRESS.md          # Chronological phase and task progress log
│   └── README.md            # Documentation directory index
├── ios/                     # Capacitor 8 iOS native project (SPM-based)
├── public/                  # Static assets and theme-init.js (flash-prevention script)
├── src-tauri/               # Tauri 2 desktop application source and Cargo configuration
├── src/
│   ├── assets/              # Brand icons, logo images, static graphics
│   ├── components/
│   │   ├── auth/            # Auth screens, OTP entry, PIN lock, and config error fallbacks
│   │   ├── home/            # Dashboard sections (YourMoneySection, LineChart, TransactionsList)
│   │   ├── layout/          # AppShell, Header, Sidebar, BottomNav
│   │   ├── modals/          # AddActionModal (Income/Expense/Transfer), AddAccountModal, Notifications
│   │   ├── onboarding/      # Setup wizard (IntroScreen, ProfileInfo, ThemeSelection)
│   │   ├── plan/            # Budgets and Goals tracking screen
│   │   ├── report/          # Financial analytics, grouped bar chart, calendar breakdown
│   │   ├── settings/        # Account preferences, PIN security, data export, demo exit
│   │   └── ui/              # Reusable UI primitives (Button, Modal, ConfirmModal, DatePicker, etc.)
│   ├── context/             # AuthContext, FinanceContext, ThemeContext
│   ├── db/                  # CentraDB storage engine, offline outbox, dbTypes, seed data
│   ├── lib/                 # Supabase client instantiation and platform auth options
│   ├── types/               # TypeScript interfaces and domain models
│   └── utils/               # Dates, formatters, logger, money, nativeApp, nativeOAuth, networkErrors, pinLock, platform
└── supabase/
    └── migrations/          # Version-controlled idempotent SQL migrations (00001 to 00008)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v22 or newer recommended
- **Package Manager**: `npm`
- **Supabase Account**: A free or paid [Supabase](https://supabase.com) project
- **For Android Development**: Android Studio Ladybug or newer, JDK 21, Android SDK Platform 36
- **For Desktop Development**: Rust and Cargo toolchain (for Tauri 2)

### 1. Clone & Install

```bash
git clone https://github.com/iqbalhasanshanto-dev/fintech-centra.git
cd fintech-centra
npm ci
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase project credentials:

```ini
# Supabase project URL (Project Settings > API > Project URL)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase publishable anonymous key (Project Settings > API > Project API keys > anon public)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Feature flag: Set to 'true' to enable Apple Sign-In button
VITE_ENABLE_APPLE_SIGNIN=false
```

---

## 🗄 Supabase Setup & Email Configuration

### 1. Database Migrations

Apply the migration files in `supabase/migrations/` in numerical order using either the Supabase Dashboard SQL Editor or the Supabase CLI:

1. `00001_initial_schema.sql` — Profiles, accounts, categories, transactions, goals, budgets, notifications, settings tables and Row-Level Security (RLS) policies.
2. `00002_rls_security_hardening.sql` — Strict RLS update policies preventing unauthorized privilege escalation.
3. `00003_finance_integrity.sql` — Positive amount validation and constraints.
4. `00004_auth_trigger.sql` — Database trigger auto-creating profiles on auth signup.
5. `00005_fix_auth_trigger_robustness.sql` — Hardened profile trigger execution.
6. `00006_system_categories.sql` — System categories definitions and transfer category setup.
7. `00007_transfer_support.sql` — Cross-account transfer support, `converted_amount`, and `exchange_rate` fields.
8. `00008_pro_plan_security.sql` — Pro tier policy guardrails.

### 2. Authentication Settings

In your Supabase project under **Authentication > URL Configuration**:

- **Site URL**: `http://localhost:3003` (or your production web domain)
- **Redirect URLs**: Add both of the following:
  - `http://localhost:3003/**`
  - `com.centra.app://auth/callback` (required for native Android/iOS OAuth and magic links)

### 3. Email Provider & Templates (6-Digit OTP)

Under **Authentication > Email Templates**:

Centra uses a 6-digit OTP verification code for secure authentication. You must configure both templates to display the token code rather than a web link:

- **Magic Link Template**:
  ```html
  <h2>Your Centra Login Code</h2>
  <p>Use the following 6-digit code to complete your login:</p>
  <h1 style="letter-spacing: 4px; font-family: monospace;">{{ .Token }}</h1>
  <p>This code expires in 10 minutes.</p>
  ```
- **Confirm Signup Template**:
  ```html
  <h2>Confirm your Centra Account</h2>
  <p>Use the following 6-digit code to activate your account:</p>
  <h1 style="letter-spacing: 4px; font-family: monospace;">{{ .Token }}</h1>
  <p>This code expires in 10 minutes.</p>
  ```

### 4. Custom SMTP Sender

> [!WARNING]
> **Production SMTP Requirement:**
> A personal Gmail account **must NOT** be used as the SMTP sender in production. Google frequently revokes application passwords without notice, which immediately halts all login and signup OTP emails. Before deploying to real users, configure a dedicated transactional email service with verified DKIM/SPF domain records (such as Resend, Postmark, SendGrid, or AWS SES) in Supabase under **Project Settings > Authentication > SMTP Settings**.

---

## 🏃 Running the Application

### Web Development

```bash
npm run dev
```
Open [http://localhost:3003](http://localhost:3003) in your browser.

### Android Native App (Capacitor 8)

Refer to the complete step-by-step setup and ADB verification in [docs/PHASE7_TESTING.md](file:///Users/shanto/Developer/Fintech-Centra/docs/PHASE7_TESTING.md).

```bash
# Build web production bundle and sync Capacitor Android assets
npm run cap:build:android

# Open native Android Studio project (requires JDK 21 and Android SDK 36)
npm run cap:open:android
```

### iOS Native App (Capacitor 8)

```bash
# Build web production bundle and sync Capacitor iOS assets
npm run cap:build:ios

# Open native Xcode project
npm run cap:open:ios
```

### Desktop Application (Tauri 2)

```bash
# Run desktop app in development
npm run tauri:dev

# Build production standalone desktop binary
npm run tauri:build
```

---

## 🧪 Quality Gates & Verification

Run checks individually:

```bash
# Run TypeScript compilation check
npm run typecheck

# Run ESLint validation
npm run lint

# Run Vitest unit & integration test suite
npm test

# Build production bundle with Vite
npm run build
```

---

## ⚠️ Protected Features Note: Transfers

The **Transfer** feature (including the Transfer tab in `AddActionModal.tsx`, `transferFunds`, `applyTransferFunds`, transfer handling branches in `src/utils/financeOperations.ts`, the `'transfer'` system category, and the `converted_amount` / `exchange_rate` database fields) is an active, planned capability designed for multi-account and family financial tracking. 

It is strictly preserved and must not be disabled, renamed, hidden, or refactored during automated cleanups or dead-code elimination passes.

---

## 🛡 Security & Privacy Architecture

Centra maintains honest, transparent security practices:

- **Data Storage Model**: Centra is an offline-first application. User financial data is cached locally in browser `localStorage` and synchronized with Supabase over TLS 1.3 / HTTPS. Centra does **not** claim custom at-rest database encryption on the client device.
- **Device PIN Lock**: The optional PIN protection uses WebCrypto **PBKDF2** (SHA-256 with 150,000 iterations and a cryptographically secure random salt). The PIN hash and salt are stored device-locally only; they are never synced to Supabase or exported in backups.
- **Session-Scoped Guest Mode**: Demo / guest mode is isolated to `sessionStorage`. Closing or killing the browser/app process resets guest state without ever polluting or synchronizing mock data to cloud databases.
- **Sensitive Data Redaction**: The production logger automatically silences debug/info output and redacts all auth tokens, PINs, OTP codes, emails, and financial amounts.

For an exhaustive audit of storage topology, physical access considerations, and platform security capabilities, read [docs/DATA_PROTECTION.md](file:///Users/shanto/Developer/Fintech-Centra/docs/DATA_PROTECTION.md).

---

## 🔧 Troubleshooting

- **"Error sending magic link email" or "Error sending confirmation email"**:
  The SMTP sender credentials were rejected by your mail server. Check the Supabase Dashboard under **Logs > Auth Logs** for error `535 Authentication failed`. Update or regenerate your SMTP sender credentials in **Project Settings > Authentication > SMTP Settings**.
- **"Failed to fetch" or "No internet connection"**:
  The client could not reach the Supabase API. Check your internet connection. If testing in an Android Virtual Device (AVD) emulator, ensure the emulator has DNS access by starting it with custom DNS servers:
  ```bash
  emulator -avd <AVD_NAME> -dns-server 8.8.8.8,1.1.1.1
  ```
- **Blank white screen on load**:
  Verify your `.env` contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables. If unconfigured, Centra will display the `SupabaseConfigErrorScreen` configuration assistant.
