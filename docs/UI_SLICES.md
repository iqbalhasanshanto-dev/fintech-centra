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

