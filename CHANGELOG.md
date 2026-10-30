# Changelog

All notable changes to the **Centra** personal finance and budgeting platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v3.0.0] — 2026-10-30

### 🌟 Latest Release: Full Figma UI Redesign & Polish

Centra `v3.0.0` delivers a complete, production-grade overhaul based on Figma design specifications, elevating the visual identity, touch responsiveness, accessibility, and financial workflow ergonomics.

#### 📥 Direct Downloads & Verification
- **Android APK**: [Download Centra-v3.0.0-debug.apk](https://github.com/iqbalhasanshanto-dev/fintech-centra/releases/download/v3.0.0/Centra-v3.0.0-debug.apk) *(Local in-repo mirror: [`releases/Centra-v3.0.0-debug.apk`](releases/Centra-v3.0.0-debug.apk))*
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
- **Android APK**: [Download Centra-v2.0.0-debug.apk](https://github.com/iqbalhasanshanto-dev/fintech-centra/releases/download/v2.0.0/Centra-v2.0.0-debug.apk) *(Local in-repo mirror: [`releases/Centra-v2.0.0-debug.apk`](releases/Centra-v2.0.0-debug.apk))*
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

