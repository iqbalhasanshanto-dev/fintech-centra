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
