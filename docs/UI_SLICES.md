# UI Redesign — Slices Implementation Plan & Progress (`docs/UI_SLICES.md`)

This document tracks the incremental implementation of the Centra UI redesign across all slices, mapping redesigned screens, shared components, self-designed missing screens, and tokens requiring verification against Figma.

---

## Slice 0: Design Foundation & Shared Building Blocks

### 1. Overview & Scope
- **Font**: Single font family **Outfit** (`@fontsource-variable/outfit`, OFL licensed) for all display headings, hero amounts, body text, inputs, and controls.
- **Taka Glyph Fallback**: System font `'Noto Sans Bengali'` kept strictly as the last entry in the CSS font stack as a glyph fallback for the Bengali Taka sign `৳` (`U+09F3`).
- **Colors**:
  - Dark Canvas: `#000000`, Surface Card: `#1D1D1D`, Elevated/Popup: `#262626`, Borders: `rgba(255, 255, 255, 0.08)`.
  - Light Canvas: `#F7F8FA`, Surface Card: `#FFFFFF`, Elevated/Popup: `#F1F2F4`, Borders: `rgba(0, 0, 0, 0.06)`.
  - Brand Primary: Neon Lime `#C6FF3D` (RGB 198, 255, 61) (fill only with dark `#0A0E1A` text on light backgrounds to meet WCAG AA, hover `#B2E830`, pressed `#9ECC27`).
- **CSP Hardening**: External Google Fonts domains removed; CSP restricted to `font-src 'self' data:`.
- **Protected Features**: 0 changes to `src/utils/financeOperations.ts`, `src/db`, Supabase client, auth logic, or migrations. Transfer feature 100% preserved.

---

### 2. Shared Components Upgraded in Slice 0
| Component | File Path | Redesign Upgrades |
| :--- | :--- | :--- |
| **Button** | `src/components/ui/Button.tsx` | Full-pill (`rounded-full`), `#C6FF3D` primary fill with `#0A0E1A` text (hover `#B2E830`, active `#9ECC27`), min 44px tap targets (`md`/`lg`). |
| **Modal** | `src/components/ui/Modal.tsx` | Bottom sheet `rounded-t-[32px]`, `#1D1D1D` surface (dark) / `#FFFFFF` (light), pull handle, backdrop blur. |
| **ConfirmModal** | `src/components/ui/ConfirmModal.tsx` | Floating card `rounded-[28px]`, `#1D1D1D` surface, circular icon, pill action buttons with 44px min height. |
| **CategoryIcon** | `src/components/ui/CategoryIcon.tsx` | Icon mapping across Lucide primitives for all transaction & transfer categories. |
| **DatePicker** | `src/components/ui/DatePicker.tsx` | Popover calendar `rounded-[28px]`, `#1D1D1D` surface, `#C6FF3D` selected day indicator, pill month/year controls. |
| **Header** | `src/components/layout/Header.tsx` | Dynamic local device time greeting ("Good Morning", "Good Afternoon", "Good Evening") + user name, notification bell (min 44px), avatar button (min 44px, "Open settings"). |
| **BottomNav** | `src/components/layout/BottomNav.tsx` | Floating capsule dock for Home, Analytics, Budgets + separate floating circular `+` FAB. No Settings item. |
| **AddActionModal** | `src/components/modals/AddActionModal.tsx` | Pill segmented control (Spend, Income, Transfer, Goal, Budget), `#1D1D1D` sheet surface, Transfer logic intact. |
| **PinLockScreen** | `src/components/auth/PinLockScreen.tsx` | `#F7F8FA` / `#000000` canvas, `#1D1D1D` card, `#C6FF3D` unlock button, **NO biometric button**. |
| **LockCoverScreen** | `src/components/auth/LockCoverScreen.tsx` | Privacy cover screen with `#F7F8FA` / `#000000` canvas and Centra brand mark. |
| **GuestBanner** | `src/components/layout/GuestBanner.tsx` | Restyled `rounded-2xl` amber warning banner; existing "Create account" confirmation intact. **NO guest limit popup**. |
| **SyncRetryScreen** | `src/components/auth/SyncRetryScreen.tsx` | Full-screen retry screen with `#C6FF3D` Retry Sync button and Sign out button preserved. |
| **LoadingSplashScreen** | `src/components/auth/LoadingSplashScreen.tsx` | In-app splash screen matching `01-splash.png` with `#F7F8FA` / `#000000` canvas, `<CornerGlow />` component, and Centra branding. |
| **CornerGlow** | `src/components/ui/CornerGlow.tsx` | Top-right ambient vector corner light (`glow-corner.svg` / `glow-corner-on-light.svg`), aria-hidden, pointer-events-none, static <img> to avoid scroll jank. |

---

### 3. Native Android 12+ System Splash
- **Capabilities**: Android 12+ enforces static XML declaration via `Theme.SplashScreen` (`androidx.core:core-splashscreen`).
- **Implementation**:
  - `android/app/src/main/res/values/styles.xml`: `windowSplashScreenBackground` = `#F7F8FA` (Light mode), `windowSplashScreenAnimatedIcon` = `@drawable/splash_icon`.
  - `android/app/src/main/res/values-night/styles.xml`: `windowSplashScreenBackground` = `#000000` (Dark mode), `windowSplashScreenAnimatedIcon` = `@drawable/splash_icon`.
  - Density-qualified drawables: `drawable-mdpi`, `drawable-hdpi`, `drawable-xhdpi`, `drawable-xxhdpi`, `drawable-xxxhdpi` (and `drawable-night-*`) containing density-matched downscaled bitmaps (no upscaling beyond source sizes: 750px dark source, 500px light source). Unqualified `drawable/splash_icon.png` removed to prevent mdpi upscaling blur.
  - `capacitor.config.ts`: `backgroundColor` = `#000000`, `launchAutoHide: false` so native splash seamlessly hands off to web app.

---

### 4. Tokens Marked as UNVERIFIED (To Verify in Figma)
The following sampled values could not be definitively extracted from Figma styles and are currently implemented with sampled values:

| Token Name | Sampled Value | Context | Status |
| :--- | :--- | :--- | :--- |
| `color.wordmark.light` | `#4D6E18` to `#56791E` | Centra wordmark color on light splash (`01-splash.png`) | **UNVERIFIED** |
| `stroke.light-grid` | `rgba(0, 0, 0, 0.03)` | Subtle grid overlay stroke on light onboarding canvas | **UNVERIFIED** |

---

### 5. Single-Theme & Missing Frames Inventory
Documented in `design/FRAMES.md`:
- **Dark-only frames (8 screens)**: `02-onboarding-intro--skip-hover.png`, `03-auth--email-filled.png`, `04-verify-code--error.png`, `04-verify-code--filled.png`, `07-onboarding-categories--error.png`, `08-onboarding-goal--error.png`, `11-home-add--open.png`, `14-settings--profile-edit.png`.
- **Light-only frames (2 screens)**: `03-auth--login-mode.png`, `07-onboarding-categories--limit-reached.png`.
- **Self-designed missing screens needed for complete feature parity**:
  1. Add Account modal (`AddAccountModal.tsx`)
  2. Transaction Details / Edit modal (`TransactionDetailModal.tsx`)
  3. Recurring / Subscription manager modal
  4. Currency Selector sheet (`CurrencyPickerModal.tsx`)
  5. Password Reset / Recovery modal
  6. Account Delete & Data Export confirmation dialogs

---

## Slice 1: Auth & Onboarding Redesign

### 1. Overview & Visual Architecture
- **Canvas & Shell**:
  - Dark Canvas: `#000000`, Light Canvas: `#F7F8FA`.
  - Subtle background grid overlay: `.bg-grid-pattern` (`64px 52px` tile matching `background.svg`, `rgba(255, 255, 255, 0.05)` in dark mode, `rgba(0, 0, 0, 0.03)` in light mode).
  - Ambient lighting: Top-right `<CornerGlow />` on all auth and onboarding screens.
- **Brand Mark Positioning**:
  - Top-left Centra mark on `02` (Intro), `06` (Appearance), and `07` (Categories).
  - Top-right Centra mark on `03` (Auth), `04` (OTP verify), and `05` (Profile).
- **Elevated Bottom Sheet Container**:
  - `rounded-t-[32px]` on mobile, `rounded-[32px]` on desktop centered card.
  - Surface fills: `#1D1D1D` in dark mode, `#FFFFFF` in light mode.
  - Top drag handle pill (`w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20`).
  - Subtle top border (`border-black/5 dark:border-white/10`).
- **Typography & Accessible Contrast Rules**:
  - Strictly Outfit weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
  - Accented hero words ("Expenses.", "Last", "Your", "about"): `#C6FF3D` in dark mode, `#4D6E18` in light mode (guaranteeing WCAG AA compliance; neon lime is never used as raw text on light canvases).

---

### 2. Redesigned Screens & Components

| Component | File Path | Reference Frame | Redesign & Behavioral Upgrades |
| :--- | :--- | :--- | :--- |
| **IntroScreen** | `src/components/onboarding/IntroScreen.tsx` | `02-onboarding-intro.png`, `03-auth.png` | Two-state seamless flow: (1) Intro hero display (`"Track Your Daily"` + `"Expenses."`), subtitle, and full-pill `#C6FF3D` `"Get Started"` CTA; (2) Auth bottom sheet (`"One Last Step"`), Sign in / Create account mode toggle, email input (`rounded-2xl`, `#2A2A2A` / `#E8ECEF`), pill submit button (`white` on dark, `#18212F` on light), `"Or"` divider, pill `"Continue with Google"`, conditional Apple button, and pill `"Explore Demo (Local)"` button. Preserves email validator, 2.5s OTP throttle, offline detector, and accessible test tags. |
| **OtpScreen** | `src/components/auth/OtpScreen.tsx` | `04-verify-code.png` | Top canvas hero `"Verify Your Email"` + top-right logo + `<CornerGlow />`. Bottom sheet with 6 circular digit slots (`rounded-2xl`, min 44x44px, `#C6FF3D` focus rings, rose error state), resend cooldown timer, `"Use a different email"` action, full-pill `"Continue →"` button, and terms footer. Supports `one-time-code` autofill and clipboard paste. |
| **ProfileInfoScreen** | `src/components/onboarding/ProfileInfoScreen.tsx` | `05-onboarding-profile.png` | Top canvas hero `"Tell us about Yourself"` + top-right logo + `<CornerGlow />`. Bottom sheet with circular avatar picker, neon-lime camera badge (`#C6FF3D`), and rounded card inputs (`#2A2A2A` / `#E8ECEF`) for Full Name, Date of Birth (DatePicker trigger), Country/Address, and Base Currency dropdown (`SUPPORTED_CURRENCIES`), followed by pill `"Continue →"` button. |
| **ThemeSelectionScreen** | `src/components/onboarding/ThemeSelectionScreen.tsx` | `06-onboarding-appearance*.png` | Top-left Centra mark + `<CornerGlow />`. Bottom sheet with `"Appearance"` heading, `"Mode"` subtitle, and 3-column selector cards (System, Light, Dark) matching active/inactive fills in Figma reference frames, followed by pill `"Continue →"` button. |
| **SpendingCategoriesScreen** | `src/components/onboarding/SpendingCategoriesScreen.tsx` | `07-onboarding-categories*.png` | Top-left Centra mark + `<CornerGlow />`. Bottom sheet with `"Choose spending categories"`, flex-wrap pill chips (min 44px height; unselected `#262626` / `#F1F2F4`, selected white pill with dark text or `#C6FF3D` ring), and full-pill `"Finish Setup ↗"` button. |
| **OnboardingFlow** | `src/components/onboarding/OnboardingFlow.tsx` | *Self-Designed* | Shared layout wrapper with `#000000` / `#F7F8FA` grid background, safe area padding, and unified step navigation. |
| **FirstAccountScreen** | `src/components/onboarding/FirstAccountScreen.tsx` | *Self-Designed* | Bottom-sheet account creation card with currency picker, type tabs, and amount field. |
| **AccountReadyScreen** | `src/components/onboarding/AccountReadyScreen.tsx` | *Self-Designed* | Success completion card with Centra brand mark and full-pill `"Go to Dashboard"` CTA. |
| **AccountIncompleteScreen** | `src/components/onboarding/AccountIncompleteScreen.tsx` | *Self-Designed* | Fallback prompt for incomplete onboarding profile setup. |
| **NoAccountFoundScreen** | `src/components/onboarding/NoAccountFoundScreen.tsx` | *Self-Designed* | Recovery prompt for empty account state with create CTA. |
| **ProfileErrorScreen** | `src/components/onboarding/ProfileErrorScreen.tsx` | *Self-Designed* | Error boundary screen for profile fetch failures with retry and sign-out buttons. |
| **SupabaseConfigErrorScreen** | `src/components/auth/SupabaseConfigErrorScreen.tsx` | *Self-Designed* | Developer configuration guide for missing Supabase environment variables. |
| **AuthCallbackScreen** | `src/components/auth/AuthCallbackScreen.tsx` | *Self-Designed* | Deep-link OAuth redirect handler with loading spinner and error fallback. |
| **CentraLogo** | `src/components/auth/CentraLogo.tsx` | *Brand Mark* | Vector Centra brand mark with `#C6FF3D` accent dot (legacy `teal-400` removed). |

---

### 3. Verification & Compliance
- **Zero Legacy Theme Clutter**: Verified 0 occurrences of `#0A0E1A`, `#0D1220`, `#121A2C`, `#131722`, `teal-*`, or `font-extrabold` in `src/components/onboarding/` and `src/components/auth/`.
- **Protected Features**: Verified `git diff --exit-code src/utils/financeOperations.ts src/db/ supabase/migrations/` is completely empty (0 diff). Transfer feature 100% intact.
- **Quality Gates**:
  - `npm run typecheck`: PASS (0 errors).
  - `npm run lint`: PASS (0 errors, 0 warnings).
  - `npm test`: PASS (274/274 tests across 32 test files).
  - `npm run build`: PASS (clean production bundle generated).

---

## Slice 2: Home Dashboard, Notifications & Transactions Redesign

### 1. Visual Tokens & Surface Architecture
- **Canvas Container**: `#000000` in dark mode, `#F7F8FA` in light mode (`HomeScreen.tsx` mobile container updated from `#FAFAFA` / `#0A0E1A`).
- **Primary Cards**: `rounded-[24px]`, `#1D1D1D` surface in dark mode (`#FFFFFF` in light mode), `1px` subtle border (`rgba(255, 255, 255, 0.08)` in dark mode, `rgba(0, 0, 0, 0.06)` in light mode), internal padding `p-5` (`20px`).
- **Secondary & Nested Surfaces**: `#262626` in dark mode, `#F1F2F4` in light mode.
- **Typography & Font Weights**: Strictly Outfit weights `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold).
- **Accessible Contrast Rules**: Positive/Income values `#22C55E` in dark mode, `#16A34A` in light mode; Negative/Expense values `#F43F5E` in dark mode, `#E11D48` in light mode; Transfer values `#38BDF8` in dark mode, `#0284C7` in light mode; Accent `#C6FF3D` in dark mode, `#4D6E18` in light mode.

---

### 2. Redesigned Screens & Components

| Component | File Path | Reference Frame | Redesign & Behavioral Details |
| :--- | :--- | :--- | :--- |
| **YourMoneySection** | `src/components/home/YourMoneySection.tsx` | `08-home.png`, `08-home--full.png` | Redesigned into the **"Account Information"** hero card (`rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6`). Top row features `"Account Information"` label and `"Details"` analytics navigation button. Hero Balance Row displays large net balance (`text-3xl sm:text-4xl font-bold tabular-nums text-[#18212F] dark:text-white`) with privacy toggle button (`w-10 h-10 rounded-xl bg-[#F1F2F4] dark:bg-[#262626]`, `<Eye />` / `<EyeOff />`). Below the hero balance are two stacked summary rows: (1) Total income with emerald accent bar (`w-1 h-6 rounded-full bg-[#16A34A] dark:bg-[#22C55E]`), formatted amount, and `data-testid="income-change-badge"`; (2) Total expenses with rose accent bar (`w-1 h-6 rounded-full bg-[#E11D48] dark:bg-[#F43F5E]`), formatted amount, and `data-testid="expenses-change-badge"`. 100% test compatibility preserved for all 17 tests in `src/__tests__/periodComparison.test.tsx`. |
| **IncomeExpenseLineChart** | `src/components/home/IncomeExpenseLineChart.tsx` | `08-home.png` | Upgraded to `rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5`. Header features `"Cash Flow Trend"` title and inline dot legend (`● Income` in `#22C55E` / `#16A34A`, `● Expenses` in `#F43F5E` / `#E11D48`). Implemented smooth Recharts `<AreaChart>` with subtle translucent gradient fills under Income and Expenses curves, clean horizontal grid lines, and custom tooltip styled with `#262626` / `#FFFFFF`. Palette tokens in `src/utils/themeColors.ts` updated to match. |
| **TransactionsList** | `src/components/home/TransactionsList.tsx` | `08-home.png`, `08-home--full.png` | Wrapped the entire Recent Activity section into a unified card (`rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5`). Header features `"Recent Activity"` and `"View All"` button (`aria-label="View all transactions"`). Transaction rows styled with tinted icon badges (`w-11 h-11 rounded-2xl`), category title, formatted date/time subtitle, and signed amounts (`+` green, `-` rose, transfer sky-blue). |
| **TransactionDrawer** | `src/components/home/TransactionDrawer.tsx` | `10-transactions-view-all.png` | Redesigned to match `"Recent Activities"` view: top header bar with circular back button (`w-11 h-11 rounded-full border border-black/[0.08] dark:border-white/[0.12]`), centered `"Recent Activities"` heading with `"All Transactions"` accessible context, full-width rounded search bar (`rounded-2xl bg-white dark:bg-[#1D1D1D]`), CSV export button, horizontal filter pills, and unified card holding transaction rows with tinted badges. Retains hardware/swipe back handler via `useBackHandler`. |
| **NotificationsModal** | `src/components/modals/NotificationsModal.tsx` | `09-notifications.png`, `09-notifications--full.png` | Redesigned with top bar circular back button and centered `"Notifications"` heading. Sub-bar features `"Your updates"` label with pill badge (`"2 unread"` in `#4D6E18` light / `#C6FF3D` dark) and `"Mark all as read"` button. Notifications grouped into `"Today"` and `"Earlier"` cards (`rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5`) with tinted icon badges, category overline, unread orange indicator dot (`w-2 h-2 rounded-full bg-[#F97316]`), timestamp, and chevron action links (`"View budget >"`, `"Review session >"`, `"View transaction >"`). |
| **TransactionDetailModal** | `src/components/home/TransactionDetailModal.tsx` | *Self-Designed* | Upgraded to design tokens with `rounded-[28px]`, `#1D1D1D` / `#FFFFFF` surface, tinted icon badge, `#F1F2F4` / `#262626` metadata cells, and `#18212F` / `white` edit and close buttons. |
| **BalanceCard** | `src/components/home/BalanceCard.tsx` | *Self-Designed* | Modernized to `rounded-[24px]` card with `#F1F2F4` / `#262626` quick actions; preserved `onOpenTransfer` and transfer button. |
| **ConnectedAccountsSection** | `src/components/home/ConnectedAccountsSection.tsx` | *Self-Designed* | Desktop connected accounts section updated to `#1D1D1D` cards, `#262626` pills, and design token borders; Transfer and Add Account buttons fully operational. |
| **ConnectedAccountsRow** | `src/components/home/ConnectedAccountsRow.tsx` | *Self-Designed* | Modernized cards to `#1D1D1D` surfaces, `#262626` badges, and preserved account filtering & transfer triggers. |
| **InsightBanner** | `src/components/home/InsightBanner.tsx` | *Self-Designed* | Card updated to `rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08]` with `#C6FF3D` / `#4D6E18` highlight badges. |
| **SpendBreakdownCard** | `src/components/home/SpendBreakdownCard.tsx` | *Self-Designed* | Desktop spend breakdown card upgraded to `rounded-[24px] bg-white dark:bg-[#1D1D1D]`, `#262626` pills, and design token borders. |
| **TotalSpendSummary** | `src/components/home/TotalSpendSummary.tsx` | *Self-Designed* | Modernized to `rounded-[24px] bg-white dark:bg-[#1D1D1D]` card, `#262626` toggle pills, and design token borders. |
| **Sidebar & DesktopDock** | `src/components/layout/Sidebar.tsx`, `DesktopDock.tsx` | *Self-Designed* | Replaced legacy navy/slate fills with `#1D1D1D` surface, `#262626` hover states, `#C6FF3D` active indicators, and token borders. |
| **AppShell, Header & BottomNav** | `src/components/layout/` | *Self-Designed* | Updated AppShell canvas to `#000000` / `#F7F8FA`, Header period dropdown to `#1D1D1D` / `#262626`, and BottomNav dark text on `#C6FF3D` to `#171717`. |
| **AddAccountModal & AddActionModal** | `src/components/modals/` | *Self-Designed* | Modernized input fields, select boxes, and dashed states to `#1D1D1D` / `#262626` / `#F1F2F4` and token borders. |

---

### 3. Verification & Compliance
- **Zero Legacy Theme Clutter**: Verified 0 occurrences of `#0A0E1A`, `#0D1220`, `#121A2C`, `#131722`, `#232C45`, `teal-*`, or `font-extrabold` in `src/components/home/`, `src/components/layout/`, and `src/components/modals/`.
- **Protected Features**: Verified `git diff --exit-code src/utils/financeOperations.ts src/db/ supabase/migrations/` is completely empty (0 diff). Transfer feature and all transfer branches 100% intact.
- **Quality Gates**:
  - `npm run typecheck`: PASS (0 errors).
  - `npm run lint`: PASS (0 errors, 0 warnings).
  - `npm test`: PASS (274/274 tests across 32 test files, including `navigationRoutes.test.tsx`, `periodComparison.test.tsx`, `overlayBackButton.test.tsx`, `confirmModals.test.tsx`).
  - `npm run build`: PASS (clean production bundle generated).


