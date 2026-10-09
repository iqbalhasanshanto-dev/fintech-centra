# CENTRA — FULL FIX PLAN (React 18 + TS + Vite + Tailwind + Supabase; Capacitor Android/iOS; Tauri desktop)

## ROLE AND RULES
You are a senior full-stack engineer fixing an audited personal-finance app (BDT-first). Work in phases, in order. After each phase: run `npm run build` and the tests, fix failures, and show me a summary of changed files. NEVER start the next phase until I say so.
- Do not touch `.env`. Do not invent Supabase credentials. If Supabase is not configured, show a clear "configuration missing" screen instead of silently entering demo mode.
- Prefer small, reviewable changes. No unrelated refactors or restyling. Keep the existing visual design.
- Never swallow errors. Every Supabase call must check the returned `{ data, error }`, because the SDK does NOT throw on API errors.
- Never claim features that don't exist (the Help FAQ currently says data is "encrypted", which is false).
- For every fix, add or update a test where practical (Vitest). At the end, give a report mapping each problem below to the files you changed.

## KNOWN PROBLEMS (verified by code audit; fix all)

### AUTH / SECURITY
A1. `loginWithBiometrics()` only checks WebAuthn availability and then sets the user authenticated. It never prompts for biometrics.
A2. `verify2FA()` accepts any 6 characters, and the UI displays "Demo: 123456". Default settings have `twoFactorEnabled: true`, and `login()` checks that local flag BEFORE calling Supabase, so on a fresh browser the password is never verified.
A3. `lockApp()` is never called, so the PIN lock never activates. The PIN defaults to '1234', is stored in plaintext in `settings.security.pinCode`, syncs to Supabase and is included in the JSON export.
A4. `SecureStorage` (base64) is never used and is not encryption.
A5. Logout does not clear local financial data (localStorage + in-memory cache). Local keys are not namespaced per user.
A6. `register()` falls back to the password 'Password123!'. Demo mode accepts any credentials. `CentraDB.authToken` defaults to `true`.
A7. `onAuthStateChange` handler awaits other Supabase calls inside the callback (known deadlock risk) and re-runs a full sync on every SIGNED_IN/TOKEN_REFRESHED.
A8. `AuthCallbackScreen` manually calls `exchangeCodeForSession`, which can race with supabase-js's automatic `detectSessionInUrl` handling and report a false "link already used".
A9. `authView` starts as 'intro' on every load, so signed-in users see a flash of the landing screen.

### DATA / SYNC (data-loss risks)
B1. `storage.ts` try/catch blocks never catch API failures. Sync failures are silent and the next sync can overwrite local data with stale server data.
B2. `syncFromSupabase`: if the profile query errors or returns nothing, it calls `createBlankUserData`, which wipes the local cache and overwrites the real profile/settings rows.
B3. No `.delete()` call exists anywhere. Deleted transactions/accounts/goals/budgets/categories/notifications reappear after sync.
B4. Every `saveX` upserts the ENTIRE array, and all persistence effects fire on mount, so the whole dataset is re-uploaded on every launch. Multi-device edits cause last-write-wins corruption.
B5. Module-level cache falls back to demo seed data (INITIAL_*), so real users can briefly see or upload demo data.
B6. `FinanceProvider` reads the cache once via `useState` initializers and never re-hydrates after sync. The OAuth path sets authView='app' BEFORE sync completes.
B7. DB primary keys are global TEXT ids. Fixed ids such as `cat_salary`, `cat_transfer`, `cat_invest_inc` collide across users, and the RLS UPDATE policy then makes the second user's whole upsert batch fail.
B8. `supabase/migrations/20260824000000_initial_schema.sql` lacks `profiles.onboarding_completed`, while `schema.sql` has it. The two files have drifted.
B9. `resetToSeedData`/`seedUserData` upsert demo data into a REAL user's account.
B10. Schema: `profiles.is_pro DEFAULT TRUE` and the profile UPDATE policy lets users edit it; hotlinked Unsplash default avatar; default `settings.security` JSON contains PIN '1234', 2FA on, fake phone number; no CHECK `amount > 0`; `CREATE POLICY` statements are not re-runnable.

### FINANCE LOGIC (`FinanceContext.tsx`, `formatters.ts`, `AddActionModal.tsx`)
C1. `addTransaction` computes balances from a stale closure and then sets absolute values, so two quick actions lose one update.
C2. `updateTransaction` does not adjust account balances or budgets.
C3. Budget `spentAmount` is only updated when `settings.notifications.budgetOverruns` is on; it never resets per period; it ignores currency; it is not decreased on delete/edit. Budget period ('monthly' | 'weekly') is never applied.
C4. Deleting a cross-currency transfer subtracts the unconverted amount. `transferFunds` has no insufficient-funds check and stores no converted amount.
C5. `contributeToGoal` deducts account balance with no transaction record, no funds check and no currency conversion. It calls `addNotification` inside a `setGoals` updater, which is a side effect in a reducer (double-fires under StrictMode). `updateSettings` also calls `CentraDB.saveSettings` inside a state updater.
C6. 129 currencies are selectable but only 13 have exchange rates. Unknown currencies silently convert at 1.0 to USD. `baseCurrency` falls back to 'USD'. Notifications hardcode `$` in many messages.
C7. Fabricated analytics: hard-coded `trendPercentage` (8.2 / 14.5 / -5.0 keyed on 'cat_dining'/'cat_entertainment'), fake `previousPeriodTotal`, "saving higher than 84% of Centra users", hard-coded "Dream Apartment goal", "boost your savings rate to 35%".
C8. `previousPeriodBalanceDelta` is net-savings delta but is labeled as balance. For the 'all' filter it compares against last year. `savingsRate` clamps negatives to 0, hiding overspending.
C9. Money uses floating-point numbers without rounding.
C10. Default date in AddActionModal uses `new Date().toISOString().split('T')[0]` (UTC date), which is wrong after midnight for UTC+ users. Date handling is inconsistent across files (date-only vs full ISO).
C11. Amount inputs convert the first comma to '.', so "1,500" becomes 1.5. `deleteAccount` leaves orphan transactions/goals.
C12. CSV export is vulnerable to formula injection and leaves some fields unquoted.

### GUEST vs REAL ACCOUNT UI BUG (user-reported: "the where/how I spent money selector pop-up works in guest but not on the main account")
Root cause found:
- `AddActionModal` initializes `useState(categories[0]?.id || 'cat_dining')` and `useState(accounts[0]?.id || 'acc_checking')` once. Those fallbacks exist only in demo seed data, which is why guest mode works.
- Real users start with ZERO accounts (`createBlankUserData` sets accounts=[]), so the account select is empty, `accountId` is '' or a stale id, balances never update and the account name falls back to 'Primary Account'. Transfers need 2 accounts.
- The category list is not filtered by the active tab (spend/income); onboarding categories get index-based ids (`cat_x_0`); default selection ['Shopping','Entertainment'] and a user can finish with none.
- There may be other handlers depending on seeded ids. Grep for hard-coded `'cat_` and `'acc_` literals across `src/` and fix every one.

### BUILD / PLATFORM / HYGIENE
D1. `npm run build` fails on a clean install: `src/utils/nativeApp.ts` imports `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, which are NOT in package.json/lockfile.
D2. `nativeApp.ts` is never imported/initialized, so native deep links, back button and status bar are dead. `ErrorBoundary` is never mounted.
D3. `redirectTo` uses `window.location.origin`, which is wrong in Capacitor/Tauri.
D4. Tauri CSP is `null`; `index.html` has `maximum-scale=1.0, user-scalable=no` (accessibility); the 1 MB single JS bundle is not code-split; no ESLint, no tests; ~28 `any` uses; 23 console calls.

---

## PHASE 0 — Make it build and set up guard-rails
1. Install and declare the missing Capacitor plugins (`npm i @capacitor/app @capacitor/status-bar @capacitor/splash-screen`) and commit the lockfile. Confirm `npm ci && npm run build` passes on a clean clone.
2. Add ESLint (typescript-eslint + react-hooks), Vitest + Testing Library, and npm scripts `lint`, `test`, `typecheck`.
3. Mount `ErrorBoundary` at the root in `main.tsx` and remove its false "securely preserved" claim.
4. Confirm `.env` is git-ignored and `.env.example` documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
Acceptance: clean install builds, lint and tests run.

## PHASE 1 — Passwordless authentication (email OTP + Google/Apple), no passwords anywhere
Product decision (final): there is NO password anywhere in the app. Three entry methods only: (1) Continue with email via OTP, (2) Continue with Google, (3) Continue with Apple. Guest mode stays as a clearly labelled local-only demo.

Flow:
1. Landing (`IntroScreen`): buttons "Continue with Google", "Continue with Apple", and an email field + "Continue". No separate "Sign up" vs "Sign in". One flow serves both.
2. Email entry: trim, lowercase, validate. Call `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`. Show a generic message ("If this email is valid, we sent a code"), with no account-enumeration hints.
3. OTP screen: a single `OTP_LENGTH = 6` constant (match the Supabase setting); numeric input with paste support and autofill (`autoComplete="one-time-code"`); verify with `supabase.auth.verifyOtp({ email, token, type: 'email' })`. Remove the old 'signup' type and fallback logic. Show clear errors for wrong/expired codes. Resend with a 60-second cooldown; "Use a different email" link; disable the button while loading.
4. After a session exists (from OTP or OAuth), fetch the profile ONCE:
   - no profile row OR `onboarding_completed = false` → onboarding (profile info, currency, theme, categories, first account; see Phase 5/6);
   - `onboarding_completed = true` → straight into the app.
   Name is collected during onboarding, not at sign-up.
5. Remove everything password-related: password fields in `AuthScreen`, `SignInModal`, `CreateAccountScreen`; the `pass` parameters of `login()`/`register()`; the 'Password123!' fallback; `CheckEmailScreen`/magic-link verification screens; `VerifyEmailScreen` becomes the OTP screen. Delete dead views from `AuthView`.
6. Rebuild auth as one explicit state machine: `loading | signedOut | otp | onboarding | locked | app | guest`. On cold start stay in `loading` (splash) until `supabase.auth.getSession()` resolves, so no landing-page flash. Authentication is derived ONLY from the Supabase session (or the explicit guest flag). Delete the `authToken` boolean (`saveAuthSession`/`getAuthSession`).
7. `onAuthStateChange`: do NOT await Supabase calls inside the callback. Hand off with `setTimeout(() => ..., 0)` or an effect. Ignore redundant SIGNED_IN events for the same user id (no repeated full syncs on tab focus/token refresh).
8. OAuth return: let supabase-js handle the `?code=` automatically (`detectSessionInUrl`). `AuthCallbackScreen` must only WAIT for the session (via `onAuthStateChange`/`getSession`) and must not call `exchangeCodeForSession` itself. Use an env-aware `redirectTo` (web origin on web; custom scheme such as `com.centra.app://auth/callback` on native; see Phase 7).
9. Verify that automatic identity linking means one email = one profile when the same address is used via OTP and Google/Apple.
10. Remove demo-mode auth. If `isSupabaseConfigured()` is false, show a configuration-error screen. Optionally allow a demo mode only behind `import.meta.env.DEV`.
11. Remove fake 2FA completely: `verify2FA`, `pending2FA`, `cancel2FA`, the 2FA toggles in Settings, `twoFactor*` in types/settings/seed data. (Email OTP is the login factor.)
12. Logout (and user change): sign out of Supabase, clear ALL `centra_*` localStorage keys and in-memory cache, reset to the landing screen.
Acceptance: unit tests for the state machine; manual flow works for new email, returning email, Google, Apple (where configured), wrong code, expired code and resend cooldown. No password field exists in the codebase (grep proves it).

## PHASE 2 — Real App Lock (PIN + biometrics), separated from login
Rule: PIN/biometrics are ONLY a local app-lock on top of a valid Supabase session. They NEVER create or replace a session.
1. User chooses a 4–6 digit PIN in Settings. There is NO default PIN. Hash it with PBKDF2 (WebCrypto, random salt, ≥150k iterations). Store hash+salt on-device only. NEVER send it to Supabase, never include it in exports, and remove `pinCode` from `AppSettings.security` and the DB.
2. Throttle attempts: after 5 failures use escalating lockouts; after 10, force sign-out and clear local data.
3. Lock triggers: cold start when a session exists and lock is enabled; app backgrounded longer than a configurable timeout (Capacitor `appStateChange` on native, `visibilitychange` on web); manual "Lock now" in Settings. Actually call `lockApp()` from these triggers.
4. Biometrics: native only, via a maintained Capacitor biometric plugin (e.g. `@aparajita/capacitor-biometric-auth`; verify Capacitor 8 compatibility before installing). It only unlocks the app lock. Hide the biometric option on web. Remove `loginWithBiometrics`, the biometric buttons on sign-in screens, and the fake `checkBiometricsAvailable` logic.
5. Delete `SecureStorage` (or reimplement honestly); do not describe base64 as encryption anywhere.
Acceptance: tests for hashing/verification/throttling; lock triggers verified manually.

## PHASE 3 — Data layer and sync rewrite
1. Namespace local storage per user (`centra:{userId}:…`) with a separate `guest` namespace. Guest data is NEVER uploaded. Real users start empty (no INITIAL_* seed fallbacks anywhere in the real-user path). On user change/logout clear everything.
2. Introduce a repository layer returning `{ data, error }` for every entity. Check `error` on every Supabase call. Surface sync status (synced / syncing / offline / error) in a small unobtrusive indicator.
3. Sync rules: never overwrite local with remote when the remote fetch errored; never treat an error as "profile doesn't exist". Replace client-side `createBlankUserData` server writes with a DB trigger (Phase 4).
4. Mutations are per-record (upsert only the changed row; `.delete().eq('id', id)` for removals). Add a small persisted outbox queue so failed or offline writes are retried on reconnect; local UI stays optimistic.
5. Do not push everything on mount. Remove the mount-time persistence effects; persist on explicit mutations only.
6. `FinanceProvider`: remount with `key={userId}`, load from the repository, and render AppShell only after initial hydration finishes (loading state). It must re-hydrate after sync.
7. IDs: generate with `crypto.randomUUID()` for all entities. Categories that the app logic needs (transfer, goal contribution, uncategorized) get a stable `system_key` column instead of fixed ids.
8. Remove `resetToSeedData` for real accounts. Replace it with "Delete all my data" (real DELETEs scoped to the user, with confirmation). Keep "reset to demo" for guest only.
9. Date handling: add `src/utils/dates.ts` with `todayLocalDateKey()`, `toLocalDateKey()` and helpers; use them everywhere (default date, grouping, period filters, calendar).
10. "Delete my account": add an in-app flow backed by a Supabase Edge Function using the service role (clients cannot delete auth users). Required by the App Store if accounts can be created in-app.
Acceptance: tests simulating failed fetch (no data wipe), failed write (queued and retried), delete persistence, user switch isolation.

## PHASE 4 — Database migration (non-destructive)
Create ONE new migration file (do not edit the old one). Make `supabase/migrations/` the single source of truth and regenerate or delete `schema.sql`. Everything idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`).
1. Add `profiles.onboarding_completed` if missing.
2. Change primary keys of accounts, categories, transactions, goals, budgets, notifications, settings to composite `(user_id, id)` so ids can never collide across users. Client upserts use `onConflict: 'user_id,id'`. Keep existing data intact.
3. Add `system_key TEXT` to categories (+ unique `(user_id, system_key)` where not null).
4. Add a `handle_new_user()` SECURITY DEFINER trigger on `auth.users` that creates the profile and default settings rows.
5. `is_pro` default FALSE; prevent client updates of `is_pro`/`plan_expiry` (trigger or column privileges). Remove the hotlinked default avatar (NULL default).
6. Strip `pinCode`, `twoFactor*`, `biometricEnabled` and the fake phone number from existing `settings.security` JSON and from the column default.
7. Add CHECK constraints (`amount > 0` on transactions, valid `period`, `alert_threshold` 1–100); add the missing DELETE policy on settings; add indexes on `(user_id, date)`.
8. Add `updated_at` + trigger on all synced tables. Keep RLS enabled everywhere; add a test script or SQL comments that prove user A cannot read or write user B's rows.
Acceptance: migration runs twice with no errors; RLS check documented.

## PHASE 5 — Finance logic and correctness
1. Create `src/utils/money.ts`: do arithmetic in integer minor units (respect currency decimals; JPY=0), round after every operation, never accumulate float drift.
2. Replace ad-hoc state mutations with pure functions + functional `setState` (no stale closures), e.g. `applyTransaction`, `revertTransaction`, `editTransaction`. Edit = revert old effect + apply new. Delete = revert. No side effects inside updaters; fire notifications in effects/after the state commit.
3. Budgets: DERIVE `spentAmount` from transactions for the current period (monthly/weekly with proper period boundaries, currency-converted, expenses only). Remove manual `spentAmount` mutation. Alerts trigger once per threshold per period, independent of whether notifications are enabled (the toggle only controls notification display).
4. Transfers: validate different accounts and sufficient funds (credit accounts may go up to their credit limit); store both the source amount and the converted amount (+ rate used) so deletion/reversal is exact.
5. Goal contributions: create a real transaction (system category "Goal contribution", `goalId` link), validate funds, convert currency, make deletion reversible. Mark the goal completed from derived progress.
6. Account deletion: if the account has transactions, require explicit choice (delete with its transactions, or block). Unlink related goals/budgets. No orphans.
7. Currency: restrict the selectable currency list to currencies that have rates (or add rates for all), show "rates last updated <date>" in the UI, remove the silent 1.0 fallback (throw/flag instead), require base currency in onboarding (no 'USD' default), and use `formatCurrency` for ALL notification/insight messages (no hard-coded `$`).
8. Amount input: accept only digits and one '.' decimal; strip thousands separators (",") rather than treating a comma as a decimal; max sensible length; consistent between all modals.
9. Insights/analytics: remove all fabricated stats (84% users, hard-coded trends, "Dream Apartment", "35%" and the fake Pro upsell). Compute real previous-period comparisons from data, and hide trend UI when there is no previous data. Rename or fix `previousPeriodBalanceDelta` so labels are truthful; disable comparison for the 'all' filter; show negative savings rate honestly.
10. CSV export: quote all fields, neutralize formula injection (prefix cells starting with `=`, `+`, `-`, `@`, tab or CR with a single quote), never include secrets. Fix the Help text (the JSON export is plain, unencrypted).
Acceptance: Vitest cases for add/edit/delete transaction, same- and cross-currency transfer and reversal, budget periods, goal contributions, rounding, and rapid double-add.

## PHASE 6 — Fix guest-vs-real-account UI bug and audit every control
1. `AddActionModal`: remove the hard-coded 'cat_dining'/'acc_checking' fallbacks. Initialize/reset selected ids in an effect whenever the modal opens or the data lists change, and validate that the selected ids still exist. Filter categories by active tab type (expense categories for Spend, income for Income).
2. Empty states: if there are no accounts, the Spend/Income/Transfer tabs show a clear "Add an account first" call to action that opens add-account. Transfer requires ≥ 2 accounts and says so.
3. Onboarding: add a "first account" step (name, type, opening balance, in the base currency), and if the user skips it, auto-create a default "Cash" account (balance 0, primary) so a new real user can record spending immediately. Seed a sensible default expense category set if the user selected none, and always ensure system categories exist (stable `system_key`, UUID ids). Category ids must no longer be index-based.
4. Grep `src/` for every hard-coded `'cat_`, `'acc_`, `'goal_`, `'bud_` literal and remove the dependency on seeded ids.
5. Systematic control audit: for EVERY screen and modal (Home, Plan, Report, Settings, Notifications panel, TransactionDrawer, TransactionDetailModal, AddActionModal, onboarding screens, DatePicker, ConfirmModal), list every interactive element and verify its handler works in BOTH guest mode and a brand-new real account. Fix or remove any control that does nothing. Write the results to `docs/QA_CHECKLIST.md` (control, expected, guest result, real-account result, fixed?).
6. Guest mode: label it clearly as a local-only demo, never upload its data, and offer "Create account" with a choice to discard the demo data (default).
7. Replace `alert()` calls with the app's existing modal/toast pattern.
Acceptance: a brand-new real account can add an account, record an expense and an income, make a transfer, create a goal and a budget, with correct balances. Use the browser tool to run this scenario and attach screenshots.

## PHASE 7 — Native and desktop
1. Initialize `nativeApp.ts` once at startup (splash hide, status bar theme, back button, appStateChange feeding the app lock).
2. Deep links: custom scheme `com.centra.app://auth/callback` for OAuth. Configure the Android intent filter and iOS URL types, add the scheme to Supabase redirect URLs, and make `redirectTo` environment-aware (web / Capacitor / Tauri). Email OTP needs no deep link.
3. Set a real Tauri CSP (allow only self, the Supabase project URL and the font hosts), and review `capabilities/default.json`.
4. `index.html`: remove `maximum-scale=1.0, user-scalable=no`. Self-host or preload fonts; ensure the theme class is applied before first paint to avoid a flash.
5. Code-split heavy screens with `React.lazy` (Report/Plan/Settings, charts) and aim for an initial JS chunk well below the current ~1 MB.
Acceptance: `npx cap sync` succeeds; Android/iOS OAuth returns to the app; back button behaves.

## PHASE 8 — Hygiene
Replace `any` with proper types where practical, route console output through a small logger (silent in production), remove dead code (`checkBiometricsAvailable`, unused views, `INITIAL_*` for real users), and delete `repomix-output.xml` and `tsconfig.tsbuildinfo` from the repo (git-ignore them). Update the README: setup, Supabase steps (OTP templates with `{{ .Token }}`, SMTP, redirect URLs), migration instructions, and the new auth flow.

## DEFINITION OF DONE
- `npm ci && npm run lint && npm run typecheck && npm test && npm run build` all pass on a clean clone.
- No password input exists anywhere; sign-in works via email OTP, Google, Apple, plus guest.
- No fake security (2FA/biometrics/PIN) remains; the app lock is real and local.
- Sync never silently fails or wipes data; deletes persist; user data is isolated per user and per device.
- Balances, budgets, transfers and goals stay correct under edit, delete, rapid actions and multi-currency.
- A new real account has the same working UI as guest.
- Final report lists every problem (A1–D4) with the fix and the files changed, plus anything you could not fix and why.