# Changelog

All notable changes to the **Centra** personal finance and budgeting platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v3.1.3] — 2026-10-31

### 🌟 Latest Release: Locked Sticky Headers, Unified Typography & 60fps Theme Toggle

Centra `v3.1.3` locks all top headers securely in place across Home, Analytics, Goals & Budgets, Settings, Notifications, and Recent Activities. It unifies header height, alignment, back button ergonomics, and title typography (`text-xl sm:text-2xl font-bold tracking-tight`), removes the theme transition lag on the `BDT (৳)` currency button and cards during Dark/Light toggling, and prevents content cards from bleeding above sticky headers during scroll.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.1.3-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.3-debug.apk) (Fallback: [`releases/Centra-v3.1.3-debug.apk?raw=true`](releases/Centra-v3.1.3-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.3-debug.apk)
- **File Size**: `6,542,541 bytes` (6.24 MB)
- **SHA-256 Checksum**:
  ```
  54b3ef348989bcac50ee0ae5f12e38fedf26352422936823ae1c29549d012e4c
  ```

#### 💡 Smart Transaction Display & Relative Dates
- **Smart Primary Titles**: Displays the user's `Note` first (e.g. `"Chanachur"`), then `Paid To / Received From` (e.g. `"Shwapno"`, `"Abbu"`), falling back to the category name only when both are blank.
- **Eliminated Duplicate Category Names**: When both Note and Merchant are empty, the subtitle shows the account name and smart date (`Cash • Today • 9:00 PM`) instead of repeating the category name (`Groceries • Groceries`).
- **Contextual Merchant Subtitles**: When both a custom note and merchant exist, automatically renders `${Category} (${Merchant}) • ${SmartDate}` (e.g., `Groceries (Shwapno) • Today • 9:00 PM`).
- **Smart Relative Calendar Dates**: Formats transaction timestamps as `Today • HH:MM`, `Yesterday • HH:MM`, `N days ago`, `1 week ago`, or concise short month/day across all transaction lists and the analytics calendar.

#### 🎨 Visual Identity & Android Launcher Icon
- **Black App Launcher Icon Background**: Set the adaptive launcher icon background to pure black (`#000000` in `android/app/src/main/res/values/ic_launcher_background.xml` and legacy mipmap icon assets), matching the AMOLED dark UI and OLED system launcher aesthetic.

#### 📌 Header Locking & Unified Alignment
- **Locked Sticky Top Headers on Dashboard**: Added `sticky top-0 z-40` directly to the `<Header>` wrapper in `AppShell.tsx` and unified `<header>` with an opaque solid background (`bg-[#F7F8FA] dark:bg-[#000000]`) and standard `h-14` inner toolbar height.
- **Unified Settings, Notifications & Recent Activities Headers**: Standardized header bars across all three views with identical `h-14` height, 40px circular back button (`w-10 h-10`), mathematically centered `text-xl sm:text-2xl font-bold tracking-tight` titles, and balanced 40px right utility/dummy targets (`w-10 h-10 shrink-0`).
- **Eliminated Scroll Gap & Content Bleed**: Relocated `safe-area-inset-top` padding inside the sticky/fixed header containers rather than outer scroll wrappers, and isolated `NotificationsModal` and `TransactionDrawer` inside separate flex-column layout shells where the header never scrolls and cards cannot bleed through.

#### ⚡ 60fps Dark/Light Mode Frame Consistency
- **Zero Lag on Currency Button & Setting Cards**: Removed mismatched `transition-colors` delays (`150ms–200ms`) from the `BDT (৳)` currency trigger button, user profile card, edit button, and setting cards.
- **Synchronous 60fps Palette Shift**: Retained CSS transition exclusively on the toggle switch thumb (`transition-transform duration-150 ease-out`), guaranteeing that the entire page, buttons, cards, and borders change theme simultaneously on the exact same frame with zero visible delay.

---

## [v3.1.2] — 2026-10-31

### ⚪ Previous Release: System Theme Auto-Detection, Custom Currency Picker & Settings Polish

Centra `v3.1.2` delivers system theme auto-detection on first launch, persistent user sessions across app updates, account balance consistency with transaction activity, onboarding jitter fixes, custom full-featured currency picker modal with real-time search, repaired avatar cropper zoom scaling, cross-platform Android CSV export and sharing, double-back to exit on Android, and updated developer support contacts.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.1.2-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.2-debug.apk) (Fallback: [`releases/Centra-v3.1.2-debug.apk?raw=true`](releases/Centra-v3.1.2-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.2-debug.apk)
- **File Size**: `6,226,714 bytes` (5.94 MB)
- **SHA-256 Checksum**:
  ```
  d8907bd7acccdf702327caff42d679d67ff9a7e9b24b75eb62ab50192b1f1d9d
  ```

#### ⚙️ Settings, Currency & Avatar Improvements
- **Custom Base Currency Picker**: Replaced native browser select with a custom modal featuring real-time currency search, flag emojis, currency symbols, and active lime selection states.
- **Settings Hierarchy & Appearance Label**: Renamed "Dark Mode" row to "Appearance" and established a clean 3-level typographic hierarchy across all setting cards (Section Header: 16px bold; Setting Title: 14px semibold; Subtitle: 11px muted).
- **Repaired Avatar Cropper Scaling**: Fixed excessive 15x zoom in `ImageCropModal` by dynamically measuring image natural dimensions, auto-scaling to fit the 240px circular viewport, and supporting fine-grained `0.8x - 3.0x` zoom adjustment.
- **Direct Developer Email**: Updated in-app legal and support contact to `mdiqbalhasan.dev@gmail.com` with clickable `mailto:` link.
- **Android CSV Export & Sharing**: Enhanced `downloadOrShareCSV` with direct Web Share API file sharing, native text-share fallbacks, and octet-stream triggers for smooth Android downloads.

#### 🚀 System Theming & User Lifecycle
- **System Theme Auto-Detection**: Fresh launches dynamically match the host system's dark/light appearance preferences (`theme: 'system'`).
- **Session Continuity Across App Updates**: App updates safely preserve authenticated credentials without kicking users back to the onboarding screens.
- **Demo Mode Currency Alignment**: Retains the user's selected base currency (e.g. BDT ৳) consistently even when toggling Demo Mode.
- **Account Information Balance Sync**: Guaranteed synchronization between Account Information summary cards and transaction balances.
- **Onboarding Polish**: Fixed header row jumps between "Track Your Daily Expenses" and "One Last Step", enlarged title typography, and defaulted the first transaction type to Income.
- **Double-Back to Exit**: Added standard Android double-back gesture on the Home dashboard with prompt toast to prevent accidental app exits.

---

## [v3.1.1] — 2026-10-31

### ⚪ Previous Release: Instant App Startup, 100% Offline Transactions & Visual Polish

Centra `v3.1.1` delivers synchronous instant app boot for online and offline sessions, 100% functional offline transaction processing with automated background sync on reconnect, cross-platform Google OAuth profile avatar fixes, a sleek redesigned ConfirmModal dialog card, a lag-free 60fps Dark Mode toggle, and updated dark launcher icons and splash screens.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.1.1-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.1-debug.apk) (Fallback: [`releases/Centra-v3.1.1-debug.apk?raw=true`](releases/Centra-v3.1.1-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.1-debug.apk)
- **File Size**: `6,224,806 bytes` (5.94 MB)
- **SHA-256 Checksum**:
  ```
  7242ef498d59d28e4b55aa56308665cbdc235d9743c0bb5ed1697479607a4d01
  ```

#### 🚀 Offline-First & App Boot Performance
- **Instant Synchronous Startup**: Removed the blocking "Starting Centra..." loading screen on startup when a cached session exists; renders the home dashboard immediately.
- **100% Working Offline Transactions**: Local balance updates, outbox queuing, and transaction creations work flawlessly offline and automatically synchronize to Supabase when back online.
- **Background Scroll Locking**: Modal and popup backdrops prevent body and root scroll bleed-through.
- **Fast OAuth Deep Link Transition**: Eliminated 2–3s pause on "One Last Step" after Google sign-in by keeping loader state active until session processing completes.

#### 🎨 Visual Identity & Android Enhancements
- **Google OAuth Profile Avatars**: Added `referrerPolicy="no-referrer"` and `crossOrigin="anonymous"` with automatic uppercase initials fallback to prevent broken profile pictures in Android WebViews.
- **Sleek ConfirmModal Redesign**: Removed oversized dialog warning icon in favor of a sleek, compact Centra dialog card with pill action buttons.
- **60fps Lag-Free Dark Mode Toggle**: Responsive optimistic toggle switch with clean "Switch between Dark and Light mode" copy.
- **Updated Dark Launcher Icons & Splash Screens**: Regenerated all Android `mipmap-*` launcher icons with 22% safe-zone padding and `drawable*` splash screens within 48% bounding box on `#000000` to prevent Android 12 circular mask clipping.
- **Quick Action & Drawer UX**: Form reset on tab switches, custom dropdown selects for Category and Payment Method, docked modal footers, and timestamp precision.

---

## [v3.1.0] — 2026-10-31

### ⚪ Previous Release: Offline-First Reliability, Clean Branding & UX Polish

Centra `v3.1.0` delivers substantial offline-first enhancements, zero-delay launches, dynamic brand logos, white launcher icons, pull-to-dismiss modal ergonomics, and dedicated legal & support centers.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.1.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.0-debug.apk) (Fallback: [`releases/Centra-v3.1.0-debug.apk?raw=true`](releases/Centra-v3.1.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.0-debug.apk)
- **File Size**: `6,036,315 bytes` (5.76 MB)
- **SHA-256 Checksum**:
  ```
  f0f909b678ba8d8a82a4c106bef6c57da4e80f664597ad5a3edfa6e243dacd98
  ```

#### 🚀 Offline-First & Launch Performance
- **Zero-Delay Startup**: Removed the artificial blocking loading screen (`Starting Centra...`) when cached user data or valid session is present.
- **Graceful Offline Routing**: Network drops during session resolution gracefully route to cached state or onboarding wizard instead of halting on a blocking error.
- **4 Standard Account Templates**: Seeded initial setups with Cash (Primary), Card Payment, Mobile Banking, and Bank Transfer with zero initial balance.
- **Demo Data Isolation**: Strictly filters out sample demo IDs (`acc_1`..`acc_4`, `tx_1`..`tx_10`) for real authenticated users during cloud sync.

#### 🎨 Branding & Visual Polish
- **Adaptive Brand Logos**: Integrated official Dark/Light SVG logos across onboarding, lock screen, OTP, auth callback, and sidebar.
- **White Android Launcher Icon**: Replaced old launcher icons with clean white background and official Centra "C" branding across all mipmap densities.
- **Dynamic User Initials**: Clean avatar fallback generating uppercase two-letter initials (e.g. "MI") across headers, sidebars, and profile screens.
- **Contextual Screen Headers**: Dynamic header titles reflecting active tabs (e.g. "Analytics", "Goals & Budgets") and clean demo-only theme toggles.

#### 🛠️ Modal & Navigation Ergonomics
- **Touch Pull-to-Dismiss**: Integrated mobile touch drag-down handle on all bottom-sheet modals with threshold-based snap-to-close.
- **Dedicated Legal & Support Center**: Added full in-app modal covering Privacy Policy, Terms of Service, Support, and Supabase Architecture without external browser hops.
- **Quick Action Modal Refinement**: Equal-width sticky bottom action buttons (`Save Transaction`, `Save Budget`, `Save Goal`), integrated custom date pickers, and Centra Pro preview for multi-account transfers.
- **Enhanced Select Dropdowns**: Standardized custom caret styling (`appearance-none` with `ChevronDown`) across drawers and settings.

---

## [v3.0.0] — 2026-10-30

### 🌟 Latest Release: Full Figma UI Redesign & Polish

Centra `v3.0.0` delivers a complete, production-grade overhaul based on Figma design specifications, elevating the visual identity, touch responsiveness, accessibility, and financial workflow ergonomics.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.0.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.0.0-debug.apk) (Fallback: [`releases/Centra-v3.0.0-debug.apk?raw=true`](releases/Centra-v3.0.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.0.0-debug.apk)
- **File Size**: `6,000,321 bytes` (5.72 MB)
- **SHA-256 Checksum**:
  ```
  a33c368c1a74a0649e4bf1b5e183186a66b87eae24ffdd091c745ac58b1a1530
  ```

#### 🎨 Design System & Theming
- **Dual Visual Identity**:
  - **Dark Mode**: Deep OLED Pure Black (`#000000`), elevated charcoal cards (`#111111`, `#161616`), and crisp high-contrast text.
  - **Light Mode**: Clean soft white canvas (`#F7F8FA`, `#FFFFFF`), muted borders (`#E5E7EB`), and legible charcoal typography.
  - **Brand Accent**: Electric Neon Lime (`#C6FF3D`) serving as primary action accents and active states.
- **Self-Hosted Variable Typography**: Integrated `@fontsource-variable/outfit` ensuring consistent cross-platform rendering, native zero-layout-shift font loading, and full Unicode glyph support including the Bangladeshi Taka symbol (`৳`).

#### ✨ New Features & UI Components
- **Floating Quick Action (`+`) Modal**:
  - Centralized floating action trigger presenting animated entry pathways for **Expense**, **Income**, and protected **Transfer**.
  - Custom expandable Category pickers and Payment Method pickers with brand icons and clean touch feedback.
- **Interactive Analytics Engine**:
  - Custom donut chart breakdown with responsive legend cards.
  - Interactive Spending Calendar displaying day-by-day cashflow intensity.
- **Dedicated Navigation Pages**:
  - Full-screen **Notifications** center with unread badges, mark-all-read capability, and category-filtered alert history.
  - Full-screen **Recent Activities / Transactions** view with search filtering, type filters, and date grouping.
- **Ergonomic Form Controls**:
  - Custom modal date-picker replacing native browser picker quirks.
  - Minor-unit currency input formatting preventing floating-point precision loss.

#### 🔒 Security, Native Auth & Reliability
- **Capacitor 8 Native Deep-Link OAuth**: Fixed native Google OAuth callback routing on Android (`com.centra.app://auth/callback`) with PKCE flow.
- **6-Digit Email OTP Verification**: Improved OTP entry reliability, countdown timers, and seamless resend throttling.
- **Zero Build Warnings**: Full TypeScript compile verification (`tsc -b`), clean ESLint rules, and 274/274 passing automated tests.

---

## [v2.0.0] — 2026-10-26

### 🛡️ Core Architecture, Security Hardening & Offline Sync

Centra `v2.0.0` introduced the offline-first repository engine, client-side cryptography, and strict data protection audit fixes.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v2.0.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v2.0.0-debug.apk) (Fallback: [`releases/Centra-v2.0.0-debug.apk?raw=true`](releases/Centra-v2.0.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v2.0.0-debug.apk)
- **File Size**: `5,700,969 bytes` (5.44 MB)
- **SHA-256 Checksum**:
  ```
  74c75d1314b7b45158045f5158595c3ce54726baab1f8822e8b034cdc9820196
  ```

#### 🚀 Architecture & Offline Engine
- **CentraDB Offline Repository**:
  - Persistent client-side repository engine caching all accounts, categories, transactions, budgets, and goals in local storage.
  - Asynchronous transactional Outbox queue capturing mutations made while disconnected and synchronizing with Supabase upon network re-establishment.
- **Precision Financial Math**:
  - Migrated financial calculations to integer minor units (cents / poisha) to eradicate IEEE-754 floating-point rounding anomalies.
- **Session-Scoped Guest Demo**:
  - Added risk-free offline demo mode isolated strictly to browser `sessionStorage`, ensuring zero mock-data contamination of cloud databases.

#### 🔐 Security & Privacy Hardening
- **WebCrypto PBKDF2 Local App PIN Lock**:
  - Hardware-accelerated local PIN protection utilizing 150,000 PBKDF2 iterations with SHA-256 and cryptographically random salt.
  - Device-only PIN hash storage with zero remote transmission.
- **Comprehensive Row-Level Security (RLS)**:
  - Idempotent PostgreSQL policies across all tables guaranteeing isolation to `auth.uid() = user_id`.
- **Capacitor 8 & Android 16 (SDK 36)**:
  - Upgraded native mobile runtime to Capacitor 8, AGP 8.13.0, and compileSdk 36.
  - Hardened Android manifest: zero cleartext traffic, `allowBackup="false"`, and minimal permission footprint (`INTERNET`, `ACCESS_NETWORK_STATE`).

---

## [v1.0.0] — 2026-09-10

### 🏗️ Initial Foundation

- **Initial Multi-Platform Release**:
  - Cross-platform foundation powered by React 18, TypeScript, Tailwind CSS, Vite, Supabase, Capacitor, and Tauri 2.
  - Core financial tracking models: Accounts, Categories, Transactions, Budgets, and Savings Goals.
  - Basic email magic-link authentication with Supabase GoTrue.
  - Multi-currency support (`USD`, `BDT`, `EUR`, `GBP`, `CAD`, `JPY`).

