# Centra Full Security Audit & Hardening Report

**Project**: Centra Personal Finance Management Application  
**Audit Date**: October 26, 2026  
**Auditor**: Antigravity Security Agent  
**Status**: PASSED (All Quality Gates Clean, 0 Vulnerabilities in Production Runtime, 0 Leaked Secrets, 203/203 Tests Passing)

---

## 🛡️ Executive Summary

This comprehensive security audit and hardening phase addresses all security domains required to protect Centra from unauthorized access, account takeover, data leaks, cross-site scripting (XSS), brute-force attempts, and injection attacks.

Because Centra is built on an offline-first client-side architecture (React 18 + Vite + TypeScript + Capacitor 8 + Tauri 2) backed by Supabase Backend-as-a-Service (PostgreSQL 15 + GoTrue Auth + PostgREST), security enforcement operates at both the **database/engine layer** (Row Level Security & SQL triggers) and the **client layer** (WebCrypto PBKDF2, input sanitization, sensitive logging redaction, and security headers).

---

## 📋 Comprehensive Domain Audit

### 1. API Keys & Environmental Variables
- **Architecture**: In Supabase client applications, `VITE_SUPABASE_ANON_KEY` is a public anonymous client key designed to identify requests and enforce Postgres Row Level Security (RLS). The `service_role` key is the administrative bypass key and MUST NEVER be present in client code or environment files.
- **Verification**:
  - Audited `.env` and `.env.example`: Only contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and feature flags (`VITE_ENABLE_APPLE_SIGNIN`).
  - Audited codebase: **0 `service_role` keys** in `src/`, `.env`, or build scripts.
  - Runtime validation in `src/lib/supabaseClient.ts`: `isSupabaseConfigured()` validates that environment variables are non-empty and non-placeholder before issuing requests; otherwise falls back gracefully to a non-functional development error screen (`SupabaseConfigErrorScreen.tsx`).

### 2. Admin Routes & Privilege Escalation Protection
- **No Client Admin Surface**: Centra is a single-user personal finance tool with no public `/admin` routes.
- **Database Privilege Protection**:
  - In `profiles`, sensitive entitlement columns (`is_pro`, `plan_expiry`) are protected by a PostgreSQL `BEFORE UPDATE` trigger (`protect_profiles_columns()` with `SECURITY INVOKER` and `SET search_path = ''`).
  - If any client role (`authenticated` or `anon`) attempts to modify `is_pro` or `plan_expiry`, PostgreSQL raises an uncatchable exception: `'Clients are not permitted to modify is_pro.'`
  - Account deletion is protected from direct client manipulation; Supabase RLS prevents authenticated users from deleting directly from `auth.users`.

### 3. Authentication & Data Isolation (Row Level Security)
- **Auth Flow**: Uses Supabase GoTrue Auth with Passwordless Email OTP (6 digits) and OAuth (Google / Apple) using PKCE (`flowType: 'pkce'`). Session tokens are stored in secure browser storage / Capacitor preferences, with automatic token refresh (`autoRefreshToken: true`).
- **Row Level Security (RLS)**:
  - Enabled on **all 8 application tables**: `profiles`, `accounts`, `categories`, `transactions`, `goals`, `budgets`, `notifications`, `settings`.
  - Every table enforces strict policies on `SELECT`, `INSERT`, `UPDATE`, and `DELETE` requiring `(SELECT auth.uid()) = user_id` (or `id` on profiles).
  - Users can only ever query, insert, modify, or delete records belonging to their own authenticated session.
- **Guest Mode Isolation**:
  - Guest mode is stored exclusively in session memory (`sessionStorage: centra_is_guest_session`).
  - Demo data is isolated under device-local keys (`centra:guest:*`) and is completely prevented from syncing to remote Supabase tables (`isGuestUser` guards in `src/db/storage.ts`).

### 4. Form Sanitization & XSS Defense
- **Zero Raw Sinks**: Codebase audit confirmed **0 instances** of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, or `eval()` in `src/`.
- **Automatic JSX Escaping**: All rendered strings in React are escaped as text nodes by default.
- **Input Sanitization Utility (`src/utils/sanitize.ts`)**:
  - `sanitizeText(input, maxLength)`: Strips `<script>`, `<style>`, and HTML tags, removes ASCII control characters and null bytes (`\x00`), disarms `javascript:` pseudo-protocols, normalizes Unicode (NFC), trims whitespace, and caps length.
  - Applied across:
    - `AddAccountModal.tsx`: Account name and bank name sanitization.
    - `AddActionModal.tsx`: Transaction merchant, note, receipt attachment, goal name, and transfer note sanitization.
    - `TransactionDetailModal.tsx`: Edit merchant and note sanitization.
    - `ProfileInfoScreen.tsx`: Full name, date of birth, and address sanitization.
    - `IntroScreen.tsx`: RFC 5321 email sanitization (`sanitizeEmail`).

### 5. Rate Limiting & Brute-Force Protection
- **Device PIN Lockout (`src/utils/pinLock.ts`)**:
  - 5 consecutive failed PIN attempts triggers a **30-second lockout delay**.
  - 10 consecutive failed PIN attempts immediately clears the device PIN and forces session logout.
- **OTP Resend Cooldown (`src/components/auth/OtpScreen.tsx`)**:
  - Enforces a **60-second cooldown timer** between OTP resend requests.
- **Auth Submission Debounce (`src/components/onboarding/IntroScreen.tsx`)**:
  - Added a client-side submission timestamp check enforcing a minimum 2.5-second cooldown between email submission attempts, preventing request flooding.
- **Server-Side Rate Limiting**:
  - Supabase GoTrue Auth enforces server-side rate limits (default 30 OTP requests/hour, 30 sign-in attempts/minute per IP).

### 6. API Endpoints & CORS Settings
- **Direct Supabase BaaS Architecture**: All communication routes through PostgREST HTTPS endpoints (`/rest/v1/*`) and GoTrue Auth (`/auth/v1/*`).
- **Recommended Supabase Dashboard CORS Configuration**:
  - In Supabase Dashboard > **Project Settings > API > Additional Allowed Origins (CORS)**, configure:
    - Web domain: `https://your-production-domain.com`
    - Native mobile (Capacitor Android): `https://com.centra.app` (or `http://localhost`)
    - Native mobile (Capacitor iOS): `capacitor://localhost`
    - Desktop (Tauri 2): `tauri://localhost` (or `http://ipc.localhost`)

### 7. Security Headers & Content Security Policy (CSP)
- **HTML Meta Security Headers (`index.html`)**:
  - `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage on third-party links.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`: Completely denies unused browser hardware APIs.
- **Web Deployment Headers (`public/_headers`)**:
  - Automatically copied to `dist/_headers` on build for static hosts (Cloudflare Pages, Netlify). Includes:
    - `X-Frame-Options: DENY` (Anti-clickjacking)
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS)
    - Full `Content-Security-Policy` restricting script, style, font, connect, and image sources.
- **Desktop CSP**: `src-tauri/tauri.conf.json` defines strict CSP policies for Tauri production and development builds.

### 8. Debug Mode & Production Hardening
- **Logger Silencing (`src/utils/logger.ts`)**:
  - `logger.debug` and `logger.info` return immediately in production (`import.meta.env.PROD === true`).
  - `logger.warn` and `logger.error` recursively redact sensitive keys (tokens, PINs, passwords, OTPs, financial amounts, email addresses).
- **Sourcemap Disabling (`vite.config.ts`)**:
  - `build.sourcemap: false` is explicitly configured; zero `.map` files are generated in production bundles.
- **Native Android Hardening (`AndroidManifest.xml`)**:
  - `android:allowBackup="false"`: Disables ADB backup extraction of local databases.
  - `android:usesCleartextTraffic="false"`: Blocks insecure HTTP traffic.
  - Deep links strictly scoped to `com.centra.app://auth/callback`.

### 9. Dependency & Supply Chain Auditing
- **Production Vulnerabilities**: `npm audit --omit=dev` reports **0 vulnerabilities**.
- **Development Tool Fixes**: Executed `npm audit fix`, resolving high/critical vulnerabilities in `vite`, `brace-expansion`, `source-map-js`, `undici`, and `zod`.
- The remaining 6 moderate alerts are confined to developer tooling (`tailwindcss 3.4` and `@capacitor/cli` build scripts on the developer machine), not client bundle code.

### 10. Exposed Files & Repository Hygiene
- **Git Tracking Cleanliness**: Verified with `git ls-files` that zero `.env`, credentials, keystores, or build artifacts are tracked.
- **Ignored Patterns (`.gitignore`)**: Enforces comprehensive exclusions for `.env*`, `dist/`, `node_modules/`, `*.tsbuildinfo`, `.DS_Store`, `android/.gradle/`, `android/build/`, `ios/App/build/`, and `src-tauri/target/`.
- Local `.DS_Store` files cleared.

### 11. Database Hardening & Schema Integrity
- Schema uses strict typing, NOT NULL constraints, check constraints on amounts, and foreign key cascades.
- All RLS policies require explicit authenticated session ownership (`auth.uid() = user_id`).
- Verification script available in `supabase/verify_schema.sql`.

### 12. Password & PIN Hashing
- **Passwordless Security**: Centra does not store user passwords in its database, eliminating the risk of password database breaches and credential stuffing.
- **PIN Security (`src/utils/pinLock.ts`)**:
  - Device-local PIN is derived using **WebCrypto PBKDF2 (SHA-256, 150,000 iterations, random 16-byte salt)**.
  - PIN hash and salt are stored device-locally only, NEVER synced to Supabase or exported in backups.

### 13. Git History Secret Leak Scan
- Scanned entire git commit history across all commits, branches, and tags.
- Verified **0 leaked private keys**, **0 AWS keys**, **0 GitHub tokens**, **0 Stripe secrets**, **0 Supabase service role keys**, and **0 committed `.env` files** in repository history.

---

## 🔒 Verification & Quality Gates

| Verification Gate | Result | Notes |
|:---|:---:|:---|
| `npm run typecheck` | **PASS (0 errors)** | Full TypeScript compilation clean |
| `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean ESLint verification across `src/` |
| `npm test` | **PASS (26 suites, 203 tests)** | 100% test pass rate including sanitization and auth tests |
| `npm run build` | **PASS (Clean bundle)** | Optimized chunk split, 0 sourcemaps, `dist/_headers` present |
| Transfer Feature Invariant | **PASS (Untouched)** | `src/utils/financeOperations.ts` git diff is 0 lines |
