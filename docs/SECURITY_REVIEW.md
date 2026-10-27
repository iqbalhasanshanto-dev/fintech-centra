# Security Hardening Review & Audit Report

**Target Project:** Centra (React 19, TypeScript, Vite, Supabase RLS, Capacitor 8 Android, Tauri 2 Desktop)  
**Review Type:** READ-ONLY Verification of Security Hardening Changes  
**Baseline Commit:** `0ed0a37` ("Phase 8 done")  
**Review Commit:** `a1b7034` ("feat: added security and rate limiting")  
**Review Date:** October 26, 2026  

---

## 1. Change Inventory

### Working Tree Status
- **`git status`**: Working tree is clean (`nothing to commit, working tree clean`).
- **Context & Audit Trail**: The previous automated "security hardening" session committed its changes directly into `git` as commit `a1b703412ec0596acb789e93275d6be95d39b34c` with the commit message `feat: added security and rate limiting`, based on `0ed0a37` (`Phase 8 done`). All modified and new files are tracked in commit `a1b7034`.

### Diff Summary (`git diff 0ed0a37..HEAD --stat`)
```text
 docs/README.md                                  |   1 +
 docs/SECURITY_AUDIT.md                          | 134 ++++++++++++++++++++++++
 index.html                                      |   3 +
 package-lock.json                               |  42 ++++----
 public/_headers                                 |   9 ++
 src/__tests__/sanitize.test.ts                  |  85 +++++++++++++++
 src/components/home/TransactionDetailModal.tsx  |   5 +-
 src/components/modals/AddAccountModal.tsx       |   8 +-
 src/components/modals/AddActionModal.tsx        |  16 +--
 src/components/onboarding/IntroScreen.tsx       |  15 ++-
 src/components/onboarding/ProfileInfoScreen.tsx |  16 +--
 src/utils/sanitize.ts                           |  82 +++++++++++++++
 vite.config.ts                                  |   1 +
 13 files changed, 376 insertions(+), 41 deletions(-)
```

---

### Grouped Breakdown

#### 1. Dependencies (`package.json`, `package-lock.json`)
- **`package.json`**: **0 changes**. No dependencies were added, removed, or changed.
- **`package-lock.json`**: 7 packages updated via minor/patch bumps:
  - `@capacitor/cli`: `8.5.1` &rarr; `8.5.3` (patch, dev dependency)
  - `brace-expansion`: `5.0.9` &rarr; `5.0.12` (patch, transitive dev)
  - `postcss-selector-parser`: `6.1.4` &rarr; `6.1.5` (patch, transitive dev)
  - `source-map-js`: `1.2.1` &rarr; `1.2.2` (patch, transitive dev)
  - `undici`: `8.11.2` &rarr; `8.12.3` (patch, transitive dev)
  - `vite`: `6.4.3` &rarr; `6.4.5` (patch, dev dependency)
  - `zod`: `4.6.5` &rarr; `4.6.7` (patch, production dependency)
- **Major Version Bumps Check**:
  - `react`: `18.3.1` runtime (`19.2.4` in monorepo tools) (Unchanged)
  - `vite`: `6.4.3` &rarr; `6.4.5` (Patch bump only, no major bump)
  - `@supabase/supabase-js`: `2.112.4` (Unchanged)
  - `@capacitor/*`: `8.5.1` &rarr; `8.5.3` (Patch bump only)
  - `@tauri-apps/*`: (Unchanged)
  - `tailwindcss`: `3.4.19` (Unchanged)
  - `typescript`: `5.7.3` (Unchanged)
  - `eslint`: `10.12.0` (Unchanged)
  - **Verdict**: **No major-version bumps** occurred.

#### 2. Build and Configuration
- **`vite.config.ts`**:
  - Added `sourcemap: false` under `build: { ... }`.
  - Purpose: Prevents emitting TypeScript source maps in production client bundles to avoid leaking component source code and internal logic.
- **`index.html`**:
  - Added 3 security `<meta>` tags:
    - `<meta http-equiv="X-Content-Type-Options" content="nosniff" />` (prevents MIME type sniffing)
    - `<meta name="referrer" content="strict-origin-when-cross-origin" />` (limits referrer leakage on cross-origin requests)
    - `<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />` (restricts browser device APIs)
- **Unchanged Configs**: `tailwind.config.*`, `tsconfig.json`, `tsconfig.app.json`, `capacitor.config.ts`, `src-tauri/tauri.conf.json`, Rust files (`src-tauri/src/`), `android/` and `ios/` native files had zero changes.

#### 3. Hosting & Header Files
- **`public/_headers` (NEW)**:
  - Added header rules for production web hosting (Cloudflare Pages, Netlify):
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `X-XSS-Protection: 1; mode=block`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
    - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: blob: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
- **Other Hosting Configs**: No `vercel.json`, `netlify.toml`, or `nginx` files created or modified.

#### 4. Supabase Files
- **`supabase/` directory**: **0 changes**. No migrations, seed files, or config files were created or modified in `supabase/` during this commit.

#### 5. Source Code (`src/`)
- **`src/utils/sanitize.ts` (NEW, 82 lines)**:
  - Exports `sanitizeText(input, maxLength = 255)`: strips script/style tags, ASCII control characters (null bytes, bell, etc.), HTML tags, `javascript:` / `vbscript:` / `data:` protocols, normalizes Unicode (NFC), and trims.
  - Exports `sanitizeEmail(email)`: normalizes NFC, strips control chars, trims, lowercases, truncates to 254 chars.
  - Exports `sanitizeAmount(value, fallback, maxAmount)`: validates finite non-negative numbers up to 1,000,000,000 and rounds to 2 decimals.
- **`src/components/home/TransactionDetailModal.tsx`**:
  - Sanitizes `merchant` (max 100) and `note` (max 300) with `sanitizeText` before saving edits.
- **`src/components/modals/AddAccountModal.tsx`**:
  - Sanitizes account `name` (max 100) and `bankName` (max 100) with `sanitizeText`.
- **`src/components/modals/AddActionModal.tsx`**:
  - Sanitizes `merchant` (max 100), `note` (max 300), `receiptName` (max 100), `transferNote` (max 200), and `cleanGoalName` (max 100).
- **`src/components/onboarding/IntroScreen.tsx`**:
  - Sanitizes email via `sanitizeEmail(email)` before OTP dispatch.
  - Enforces client-side rate limiting / submit throttle: rejects attempts within 2,500ms using a React `useRef<number>(0)`.
- **`src/components/onboarding/ProfileInfoScreen.tsx`**:
  - Sanitizes `fullName` (max 100), `dob` (max 20), and `address` (max 200) via `sanitizeText`.

#### 6. Tests
- **`src/__tests__/sanitize.test.ts` (NEW, 85 lines)**:
  - 13 test cases covering `sanitizeText` (XSS payloads, control characters, unicode preservation, length enforcement), `sanitizeEmail` (formatting, control chars, RFC 5321 length), and `sanitizeAmount` (valid amounts, NaN, negative, infinity, large numbers, rounding).

#### 7. Documentation
- **`docs/README.md`**: Added a documentation link entry for `SECURITY_AUDIT.md`.
- **`docs/SECURITY_AUDIT.md` (NEW, 134 lines)**: Automated audit report summarizing security findings, implemented protections, CSP, and verification steps.

#### 8. Deleted Files
- **0 files deleted**.

---

## 2. Quality Gates

All 4 quality gates were executed sequentially in read-only mode.

### 1. TypeScript Typecheck (`npm run typecheck`)
- **Command**: `npm run typecheck` (`tsc -b`)
- **Status**: **PASSED** (Exit code: 0)
- **Error Count**: 0 errors.

### 2. ESLint Static Analysis (`npm run lint`)
- **Command**: `npm run lint` (`eslint src`)
- **Status**: **PASSED** (Exit code: 0)
- **Error Count**: 0 errors, 0 warnings.

### 3. Automated Test Suite (`npm test`)
- **Command**: `npm test` (`vitest run`)
- **Status**: **PASSED** (Exit code: 0)
- **Test File Results**: 26 passed of 26 test files (100%)
- **Individual Tests**: **203 passed of 203 tests (100%)**
- **Test Duration**: 3.20 seconds

### 4. Production Application Build (`npm run build`)
- **Command**: `npm run build` (`tsc -b && vite build`)
- **Status**: **PASSED** (Exit code: 0)
- **Build Duration**: 1.85 seconds
- **Production Asset Breakdown**:
  - `dist/index.html`: `1.74 kB` (gzip: `0.78 kB`)
  - `dist/assets/index-B-8mYAnh.css`: `72.33 kB` (gzip: `11.73 kB`)
  - `dist/assets/logo-CiRozO2t.png`: `151.36 kB`
  - `dist/assets/web-C84UYFkp.js`: `0.23 kB` (gzip: `0.18 kB`)
  - `dist/assets/web-BnOhJTsd.js`: `0.49 kB` (gzip: `0.30 kB`)
  - `dist/assets/web-Du4w4rPc.js`: `0.95 kB` (gzip: `0.45 kB`)
  - `dist/assets/web-B17ovlWn.js`: `1.26 kB` (gzip: `0.61 kB`)
  - `dist/assets/PlanScreen-CRtV_tdx.js`: `13.29 kB` (gzip: `3.58 kB`)
  - `dist/assets/ReportScreen-COU6ytj-.js`: `25.38 kB` (gzip: `5.88 kB`)
  - `dist/assets/SettingsScreen-D_phNiq8.js`: `25.57 kB` (gzip: `6.13 kB`)
  - `dist/assets/vendor-react-C81z-g4i.js`: `174.85 kB` (gzip: `52.85 kB`)
  - `dist/assets/vendor-supabase-BnGCNdwk.js`: `220.44 kB` (gzip: `57.59 kB`)
  - `dist/assets/index-D-qKnRpb.js`: `295.26 kB` (gzip: `72.43 kB`)
  - `dist/assets/vendor-charts-BmXSikN7.js`: `421.37 kB` (gzip: `113.13 kB`)

---

## 3. Protected Feature Check

### 1. `src/utils/financeOperations.ts`
- **Diff Check**: `git diff 0ed0a37..HEAD --stat -- src/utils/financeOperations.ts`
- **Result**: **0 changes (clean)**. The file is 100% untouched.

### 2. Transfer Tab in `AddActionModal.tsx`
- **Diff Inspection**:
  - The transfer execution logic (`executeSaveTransfer`) remains identical in structure.
  - Line 276 was updated only to sanitize the optional transfer note:
    ```typescript
    await transferFunds(fromAccountId, toAccountId, parsedAmount, sanitizeText(transferNote || note, 200));
    ```
  - Validation rules (`parsedAmount <= 0`, `accounts.length < 2`, `fromAccountId === toAccountId`), error messaging, and form resetting are completely intact.

### 3. `transferFunds` in `FinanceContext.tsx`
- **Diff Check**: `git diff 0ed0a37..HEAD --stat -- src/context/FinanceContext.tsx`
- **Result**: **0 changes (clean)**. The implementation and context wrappers are 100% untouched.

### 4. Financial & Transfer Unit Tests
- Executed `npx vitest run src/__tests__/finance_phase5.test.ts`.
- **Result**: **All 19 tests passed** (including cross-currency transfer, double-add prevention, exact restoration on deletion, account validation, and category resolution).

---

## 4. Behaviour Risks Analysis

### Feature Compatibility Matrix

| Feature | Status | Analysis |
| :--- | :--- | :--- |
| **Email-Code Sign-In & Create Account** | **SAFE** | `IntroScreen.tsx` adds `sanitizeEmail` and a 2.5s client-side throttle. `sendOtp(cleanEmail, activeTab)` receives the valid trimmed lowercase email. Neither `centra_auth_intent`, OTP verification, nor `onboarding_completed` routing were touched. |
| **Google Sign-In on Android** | **SAFE** | Deep link handler (`com.centra.app://auth/callback`) in `src/utils/authRedirect.ts` and `src/utils/nativeOAuth.ts` has 0 modifications. All 10 tests in `oauth_native.test.ts` pass. |
| **Guest Demo Mode** | **SAFE** | Session-only guest mode in `src/context/AuthContext.tsx` and `src/db/storage.ts` is untouched. Sync retry and outbox skip are preserved. All tests in `session_guest_mode.test.tsx` and `guest_mode_fix.test.tsx` pass. |
| **Offline Outbox Sync** | **SAFE** | `src/db/outbox.ts` and storage sync engine are untouched. All 14 tests in `storage_sync.test.ts` pass. |
| **App Lock** | **SAFE** | PIN hashing, timeout tracking, and cover screen in `src/utils/pinLock.ts` and `src/components/auth/PinLockScreen.tsx` are untouched. All 13 tests in `resumeLock.test.tsx` pass. |
| **Theme Initialization** | **SAFE** | `/theme-init.js` is unchanged. `<script src="/theme-init.js"></script>` in `index.html` loads early as `'self'` without CSP violation. |
| **Safe Areas** | **SAFE** | `viewport-fit=cover` and Tailwind safe area utility classes are untouched in `index.html` and layout components. |
| **Code Splitting** | **SAFE** | `manualChunks` in `vite.config.ts` (`vendor-react`, `vendor-supabase`, `vendor-charts`, `vendor-icons`) and dynamic screen imports are completely preserved. |

### Special Inquiries & Detailed Checks

#### 1. Content Security Policy (CSP) Directives
- **Location**: Defined in `public/_headers` (serving Cloudflare Pages / Netlify).
- **Directives**:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: blob: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  ```
- **Allowlist Verification**:
  - `https://*.supabase.co` & `wss://*.supabase.co`: **ALLOWED** explicitly in `connect-src`.
  - Google profile images: **ALLOWED** via `img-src` (`https:` directive allows `https://lh3.googleusercontent.com/...`).
  - Google Fonts: **ALLOWED** via `style-src https://fonts.googleapis.com` and `font-src data: https://fonts.gstatic.com`.
  - `/theme-init.js`: **ALLOWED** via `script-src 'self'`.
  - Capacitor Android Bridge: WebView on Android loads local bundle (`https://localhost`) and does not read static web hosting headers (`public/_headers`).
  - Tauri Desktop Bridge: Tauri uses its own isolated CSP configured in `src-tauri/tauri.conf.json` (`ipc: http://ipc.localhost`), which was not modified.

#### 2. Input Sanitization & Character Preservation
- Tested `sanitizeText` with:
  - `"Md. Iqbal Hasan"` &rarr; `"Md. Iqbal Hasan"` (**Preserved exactly**, dots and spaces intact).
  - Non-Latin Bangla script `"মোঃ ইকবাল হাসান"` &rarr; `"মোঃ ইকবাল হাসান"` (**Preserved exactly**).
  - Bangla with punctuation `"শামিম - ঢাকা, বাংলাদেশ।"` &rarr; `"শামিম - ঢাকা, বাংলাদেশ।"` (**Preserved exactly**).
  - Emojis `"Coffee ☕ & Tea 🍵"` &rarr; `"Coffee ☕ & Tea 🍵"` (**Preserved exactly**).
- **Potential Edge-Case Risk to Note**:
  - The regular expression `HTML_TAGS_REGEX = /<[^>]*>/g` matches and strips anything between `<` and `>`. If a user enters a note containing both comparison symbols, e.g. `"Balance < $100 and > $50"`, the parser treats `< $100 and >` as an HTML tag and strips it, leaving `"Balance  $50"`. Single symbols like `"Balance < 100"` are unaffected.
  - Because React JSX automatically escapes strings when rendering (preventing XSS), stripping `<...>` is redundant for React HTML rendering, though safe for text that doesn't use `<...>` as brackets.

#### 3. Rate Limiting & Lockout Code
- In `IntroScreen.tsx`, a 2,500ms debounce throttle was added via `useRef<number>(0)`:
  - If the user clicks "Continue" or "Send Code" multiple times within 2.5 seconds, it shows: `"Please wait a moment before trying again."`
  - It does **not** permanently lock the user out; the throttle expires after 2.5 seconds.
- No new database lockouts or account-level lockouts were created.

#### 4. `src/lib/supabaseClient.ts`
- **Diff Check**: `git diff 0ed0a37..HEAD --stat -- src/lib/supabaseClient.ts`
- **Result**: **0 changes (clean)**. The Supabase client instantiation, PKCE auth flow, token auto-refresh, and URL configuration remain untouched.

---

## 5. Secrets Check

### (a) Working Tree Search (Read-Only)
- **`service_role`**:
  - 0 matches in application source.
  - 1 match in `src/components/settings/SettingsScreen.tsx:533` — informational comment describing future Edge Function requirement.
  - 2 documentation references in `docs/PROGRESS.md` and `docs/SECURITY_AUDIT.md`.
- **`sbp_` (Supabase Management Personal Access Tokens)**: **0 matches**.
- **`sk_live` (Stripe/Payment Live Secret Keys)**: **0 matches**.
- **`BEGIN ... PRIVATE KEY` (Private Key PEM blocks)**: **0 matches**.
- **JWT-looking strings (`eyJ...`) outside tests**:
  - **0 matches** in production code, build scripts, or tracked files.
  - 1 match in test code: `src/__tests__/logger.test.ts:29` (dummy mock JWT payload used to verify that the logger automatically masks JWT tokens).

### (b) Git History Search
- **Environment Files History**:
  - `git log --all --oneline -- .env .env.local .env.production`: **0 commits found**. Real `.env` files have **NEVER** been committed to git history.
  - Only `.env.example` (containing dummy placeholder keys) has ever been committed.
- **`service_role` History Search**:
  - `git log --all -S"service_role" --oneline`:
    - `a1b7034`: Documentation additions (`SECURITY_AUDIT.md`).
    - `0ed0a37`: Documentation additions (`PROGRESS.md`).
    - `669ed82`: Informational TODO comment in `SettingsScreen.tsx`.
  - **Verdict**: A real `service_role` secret key **never appeared** in any commit in the git repository.
- **JWT History Search**:
  - `git log --all -E -G"eyJ[a-zA-Z0-9_-]{15,}" --oneline --name-only`:
    - Only `src/__tests__/logger.test.ts` (mock JWT unit test fixture in `0ed0a37`).

### (c) `.gitignore` & Environmental Tracking Hygiene
- Tracked `.env` check: `git ls-files .env .env.local .env.production .env.*` returns only `.env.example`.
- Verified `.gitignore` contains:
  ```gitignore
  # Environment variables & secrets
  .env
  .env.*
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local
  !.env.example
  ```
- **Key Rotation Required?**: **NO**. Neither Supabase `service_role` keys nor database passwords were ever committed to git history.

---

## 6. Supabase Security Check (Read-Only)

All database schema migrations in `supabase/migrations/` were reviewed:
- `supabase/migrations/20261009000000_initial_schema.sql` (Initial core schema)
- `supabase/migrations/20261017000000_transaction_cross_currency_and_goal.sql` (Additive schema update)

### Table & RLS Inventory

| Table Name | RLS Enabled? | `anon` Role Privileges | Policies Scope | Policy Predicate |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = id` (INSERT restricts `is_pro = false` and `plan_expiry IS NULL`) |
| `public.accounts` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.categories` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.transactions` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.goals` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.budgets` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.notifications` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |
| `public.settings` | **YES** | `REVOKE ALL` | `TO authenticated` | `(SELECT auth.uid()) = user_id` |

### Security Gaps Assessment
- **Anon Privileges**: Explicit `REVOKE ALL ON TABLE ... FROM anon` is executed for all 8 tables. The anonymous role cannot read or write any table.
- **Tenant Isolation**: Every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policy strictly isolates rows to `(SELECT auth.uid()) = user_id`.
- **Verdict**: **Zero gaps detected**.

---

## 7. Dependencies Audit

### Production Runtime Dependencies (`npm audit --omit=dev`)
- **Command**: `npm audit --omit=dev`
- **Result**: **0 vulnerabilities found**.
- **Impact**: Zero known security vulnerabilities affect code that ships inside the web, Android, or desktop production bundles.

### Full Dependency Audit (Development & Build Tools)
- **Command**: `npm audit`
- **Result**: 3 moderate severity vulnerabilities found in development tooling:
  - Path: `@capacitor/cli` &rarr; `xcode` &rarr; `uuid` (<11.1.1, missing buffer bounds check).
  - Scope: **Build-time only**. `@capacitor/cli` is a local developer tool for compiling Android/iOS platform projects. It is **never bundled** into the client application.
  - Remediation Note: `npm audit fix --force` would downgrade `@capacitor/cli` to 8.4.3, causing breaking changes with Capacitor 8 configurations. Since it does not ship in production, keeping the pinned `@capacitor/cli@8.5.3` is safe and recommended.

### Upstream Version Status (`npm outdated`)
- Highlights of current vs latest upstream:
  - `@capacitor/*`: `8.5.1` / `8.5.3` (Latest: `8.5.3`)
  - `@supabase/supabase-js`: `2.112.4` (Latest: `2.118.0`)
  - `vite`: `6.4.5` (Latest: `8.3.5`)
  - `react` / `react-dom`: `18.3.1` (Latest: `19.3.1`)
  - `tailwindcss`: `3.4.19` (Latest: `4.3.3`)
- All packages are safely locked in `package-lock.json` and build cleanly.

---

## 8. Verdict Table & Recommendations

### Verdict Table

| Changed File / Group | Purpose | Risk | Recommendation | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `src/utils/sanitize.ts` | Input sanitization helper (`sanitizeText`, `sanitizeEmail`, `sanitizeAmount`) | **LOW** | **KEEP** | Cleanly disarms XSS scripts, null bytes, and control chars. Fully preserves English names (`"Md. Iqbal Hasan"`), non-Latin Unicode (Bangla), punctuation, and emojis. |
| `src/__tests__/sanitize.test.ts` | Unit tests for sanitization functions | **LOW** | **KEEP** | 13 comprehensive unit tests, fully passing. |
| `src/components/onboarding/IntroScreen.tsx` | Sanitizes login email; 2.5s submit debounce | **LOW** | **KEEP** | Prevents rapid accidental double-taps on OTP dispatch; preserves OTP verification flow and auth intents. |
| `src/components/onboarding/ProfileInfoScreen.tsx` | Sanitizes name, DOB, and address on onboarding | **LOW** | **KEEP** | Preserves international names and address characters while disarming markup. |
| `src/components/modals/AddAccountModal.tsx` | Sanitizes account and bank name inputs | **LOW** | **KEEP** | Protects account names from script injection while allowing standard bank names. |
| `src/components/modals/AddActionModal.tsx` | Sanitizes merchant, notes, receipts, and transfer notes | **LOW** | **KEEP** | Transfer tab and `transferFunds` logic remain fully operational and verified by tests. |
| `src/components/home/TransactionDetailModal.tsx` | Sanitizes merchant and note on edit | **LOW** | **KEEP** | Safe input cleaning on transaction update. |
| `vite.config.ts` | Disables production sourcemaps (`sourcemap: false`) | **LOW** | **KEEP** | Standard security practice; prevents leaking proprietary TypeScript source maps in production bundles. |
| `index.html` | Adds `nosniff`, `referrer`, and `Permissions-Policy` | **LOW** | **KEEP** | Browser hardening headers; does not interfere with file uploads (`<input type="file">`). |
| `public/_headers` | Cloudflare/Netlify hosting headers + CSP | **LOW** | **KEEP** | Allows Supabase REST & WebSocket endpoints, Google profile avatars, Google Fonts, and inline theme script. Does not affect native Android or Tauri. |
| `package-lock.json` | Patch bumps for dev tools and `@capacitor/cli` | **LOW** | **KEEP** | 0 production vulnerabilities; all 4 quality gates pass 100%. |
| `docs/README.md` & `docs/SECURITY_AUDIT.md` | Security documentation and audit notes | **LOW** | **KEEP** | Accurate project documentation. |

---

### Manual Verification Checklist

Before releasing to production, perform these targeted manual tests:

#### On Android (Device / Emulator):
1. **Google Sign-In**: Tap "Continue with Google" on `IntroScreen` and confirm the Android browser / Chrome Custom Tab redirects back into Centra via `com.centra.app://auth/callback`.
2. **Email OTP**: Request an email OTP, verify the 2.5s debounce message if tapped twice rapidly, input the code, and confirm dashboard loads.
3. **Receipt Attachment**: In `AddActionModal`, attach a receipt photo via the file picker and ensure the transaction saves with the file name tag.
4. **App Lock / Resume**: Enable PIN lock in Settings, switch apps for >30s, reopen Centra, and verify the PIN cover screen prompts and unlocks correctly.

#### On Web (Browser):
1. **Profile Name Preservation**: Update profile name in Settings to `"Md. Iqbal Hasan"` and test a Bangla name like `"মোঃ ইকবাল হাসান"`. Confirm the name renders correctly on the Dashboard header.
2. **Transfer Funds**: Open `AddActionModal` &rarr; `Transfer` tab, transfer $10 between two accounts with a note, and verify balances update immediately.
3. **CSP Console Audit**: Open DevTools Console on production web hosting; verify zero CSP violation errors for Supabase queries, Realtime subscriptions, or font loading.

---

### Undo Commands (Reference Only — Do NOT Run Unless Desired)

If you ever decide to revert specific changes from commit `a1b7034` back to `0ed0a37`, you can use the following non-destructive commands:

```bash
# To revert only the public/_headers CSP file:
git checkout 0ed0a37 -- public/_headers

# To revert only input sanitization in source files:
git checkout 0ed0a37 -- src/utils/sanitize.ts src/__tests__/sanitize.test.ts src/components/modals/AddActionModal.tsx src/components/modals/AddAccountModal.tsx src/components/home/TransactionDetailModal.tsx src/components/onboarding/IntroScreen.tsx src/components/onboarding/ProfileInfoScreen.tsx

# To revert only the index.html meta tags:
git checkout 0ed0a37 -- index.html

# To revert only vite.config.ts sourcemap change:
git checkout 0ed0a37 -- vite.config.ts
```
*(All changes are currently recommended to be **KEPT**).*
