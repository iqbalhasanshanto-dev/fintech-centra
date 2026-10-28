# Centra Redesign — Design Tokens (`design/tokens.md`)

This document defines the derived visual design tokens extracted from the Figma redesign frames (`design/frames/dark/`, `design/frames/light/`, and `design/assets/`). These tokens govern the implementation across themes, screen widths (from 360 px up to desktop), and accessibility font scales.

---

## 1. Color System

### 1.1 Brand & Accent Colors
- **Centra Neon Lime (Brand Primary)**: `#C6FF3D` (RGB 198, 255, 61)
  - High-visibility neon lime used on active selection borders, primary CTA fills, and key progress indicators.
  - Hover variant: `#B2E830` (slightly darker shade of #C6FF3D)
  - Pressed variant: `#9ECC27` (active pressed shade of #C6FF3D)
  - Contrast text over neon lime: `#0A0E1A` / `#000000` (bold weight).
- **Brand Secondary Lime Glow**: `rgba(198, 255, 61, 0.15)` (ambient glow, background badge fills).
- **Brand Focus Ring**: `rgba(198, 255, 61, 0.40)`

### 1.2 Dark Theme (`dark`)
- **App Canvas Background**: `#000000` (true deep black for OLED battery efficiency and maximum contrast with neon lime).
- **Secondary Canvas / Grid**: `#0A0A0A` with grid overlay `rgba(255, 255, 255, 0.05)`.
- **Card / Surface Primary**: `#1D1D1D` (primary content containers: Account Balance card, Recent Activity, Expense breakdown).
- **Card / Surface Secondary**: `#262626` (elevated items, nested rows, settings switches).
- **Modal / Bottom Sheet Surface**: `#161616` / `#1D1D1D` with top border `rgba(255, 255, 255, 0.08)`.
- **Input Field Background**: `#2A2A2A` (with border `rgba(255, 255, 255, 0.12)`).
- **Input Field Focus Border**: `#C6FF3D`.
- **Borders & Dividers**: `rgba(255, 255, 255, 0.08)`.
- **Text Tokens**:
  - Primary: `#FFFFFF` (headings, primary numbers, active tab text).
  - Secondary / Muted: `#9CA3AF` / `#A1A1AA` (field labels, subtitles, timestamps).
  - Tertiary / Subtle: `#71717A` (unselected indicators, disabled text).
- **Navigation / Fixed Header**: `#000000` / `#0A0A0A` (with `backdrop-blur-lg bg-black/85` and bottom border `rgba(255, 255, 255, 0.06)`).

### 1.3 Light Theme (`light`)
- **App Canvas Background**: `#F7F8FA` (soft clean light-grey canvas avoiding harsh pure white glare).
- **Card / Surface Primary**: `#FFFFFF` (clean white elevated cards).
- **Card / Surface Secondary**: `#F1F2F4` / `#F4F5F7` (nested containers, inactive pill chips, setting row hover).
- **Modal / Bottom Sheet Surface**: `#FFFFFF` (with subtle top border `rgba(0, 0, 0, 0.06)`).
- **Input Field Background**: `#E8ECEF` / `#EEF1F4` (with border `rgba(0, 0, 0, 0.08)`).
- **Input Field Focus Border**: `#18212F` or `#84CC16`.
- **Borders & Dividers**: `rgba(0, 0, 0, 0.06)` / `#E5E7EB`.
- **Text Tokens**:
  - Primary: `#18212F` / `#0F172A` (deep slate black for crisp contrast).
  - Secondary / Muted: `#667085` / `#64748B` (helper text, metadata).
  - Tertiary / Subtle: `#94A3B8` (unselected tabs, placeholders).
- **Navigation / Fixed Header**: `#FFFFFF` (with `backdrop-blur-lg bg-white/90` and bottom border `rgba(0, 0, 0, 0.06)`).

### 1.4 Financial Flow & Status Semantic Colors
- **Income / Inflow / Positive**:
  - Dark: `#22C55E` (Emerald-500)
  - Light: `#16A34A` (Green-600)
  - Soft background fill (Dark): `rgba(34, 197, 94, 0.12)`
  - Soft background fill (Light): `rgba(22, 163, 74, 0.10)`
- **Expense / Outflow / Negative**:
  - Dark: `#E11D48` / `#F43F5E` (Rose-500)
  - Light: `#BE123C` / `#E11D48` (Rose-700 / Rose-600)
  - Soft background fill (Dark): `rgba(225, 29, 72, 0.12)`
  - Soft background fill (Light): `rgba(190, 18, 60, 0.08)`
- **Warning / Alert / Guest Notice**:
  - Dark & Light: `#F59E0B` (Amber-500)
- **Info / Transfer / Neutral**:
  - Dark: `#38BDF8` (Sky-400)
  - Light: `#0284C7` (Sky-600)

### 1.5 Contrast & Accessibility Rule (Light Theme)
- **WCAG AA Compliance**:
  - Centra Neon Lime `#C6FF3D` has a relative luminance of `0.838`.
  - Dark text `#0A0E1A` has a relative luminance of `0.0043`.
  - Contrast ratio of `#0A0E1A` on `#C6FF3D`: `(0.838 + 0.05) / (0.0043 + 0.05) = 16.35 : 1` (vastly exceeds WCAG AAA 7:1 threshold).
  - Contrast ratio of pure black `#000000` on `#C6FF3D`: `(0.838 + 0.05) / (0.000 + 0.05) = 17.76 : 1` (exceeds WCAG AAA).
  - Contrast ratio of `#C6FF3D` as text/stroke on light canvas `#F7F8FA` (luminance `0.948`): `(0.948 + 0.05) / (0.838 + 0.05) = 1.12 : 1` (fails WCAG AA 4.5:1).
  - **MANDATORY**: `#C6FF3D` must **NEVER** be used as raw text color or standalone icon stroke on light backgrounds.
  - `#C6FF3D` is permitted only as a **fill** (e.g., CTA buttons, selected badges, toggle tracks) with dark text (`#0A0E1A` / `#000000`).
  - For colored accent text on light screens, use dark moss green (`#4D6E18` / `#365314`) or deep slate text (`#18212F`).

---

## 2. Typography

The design uses **Outfit** as the single font family for everything (display headings, hero currency amounts, body, controls, and labels).

- **Font Family**: `'Outfit Variable', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif, 'Noto Sans Bengali'`
- **Glyph Fallback Exception**:
  - The app contains no Bangla UI or language.
  - Outfit natively contains Latin and Latin-ext glyphs, but lacks the Bengali Taka sign `৳` (`U+09F3`, used for BDT currency).
  - To display `৳` correctly without loading Bengali webfont packages, `'Noto Sans Bengali'` is preserved strictly as the last entry in the font stack as a system-installed glyph fallback.
- **Derived Font Weights (Strictly 400, 500, 600, 700 ONLY)**:
  - `400` (`font-normal`): Secondary hints, form placeholder text, terms & policy body.
  - `500` (`font-medium`): Transaction timestamps, category subtitles, navigation item labels.
  - `600` (`font-semibold`): Buttons, card titles, section headers, input values.
  - `700` (`font-bold`): Hero balance amounts (`৳20,000.00`), screen titles (`Good Morning`, `Goals & Budget`), CTA text.
  - *Note*: Weights below 400 or above 700 (thin, extralight, light, extrabold, black) are prohibited and mapped to the nearest of the four weights.

### Fluid Type Scale (Accessibility & Android Large Font Ready)
To ensure components never clip when Android's system font size is set to Large/Largest, text sizes use relative `rem` units with flexible container heights:
- **Hero Display Amount**: `2.0rem - 2.25rem` (32px - 36px), line-height `1.15`, weight `700`.
- **Screen Title (h1)**: `1.5rem` (24px), line-height `1.25`, weight `700`.
- **Section Heading (h2)**: `1.125rem` (18px), line-height `1.35`, weight `600`.
- **Card Subtitle / Form Title**: `1.0rem` (16px), line-height `1.4`, weight `600`.
- **Standard Body**: `0.875rem` (14px), line-height `1.5`, weight `400` / `500`.
- **Caption / Meta**: `0.75rem` (12px), line-height `1.4`, weight `500`.
- **Micro Badge**: `0.625rem` (10px), line-height `1.2`, weight `600`.

---

## 3. Elevation, Radii & Borders

### 3.1 Border Radii
- **Phone Shell Corner Radius**: `46px` (preview shell matching physical device edges).
- **Modals & Bottom Action Sheets**: `32px` on top corners (`rounded-t-[32px]`).
- **Main Cards (Account Information, Analytics, Budget Cards)**: `24px` (`rounded-[24px]`).
- **Secondary Containers & Picker Modals**: `16px` (`rounded-2xl`).
- **Form Input Fields**: `16px` (`rounded-2xl`).
- **Pills, Action Buttons & Category Chips**: `9999px` (`rounded-full`, e.g. "Continue →", "Finish Setup ↗").
- **Avatar Circles**: `9999px` (`rounded-full`).

### 3.2 Shadows & Elevation
- **Dark Theme**: Zero drop-shadows. Elevation is achieved purely through surface contrast (`#000000` canvas -> `#1D1D1D` cards -> `#262626` popups) reinforced by 1px subtle borders (`rgba(255, 255, 255, 0.08)`).
- **Light Theme**: Soft ambient shadows:
  - Card Shadow: `0 4px 20px -2px rgba(16, 24, 40, 0.05)`
  - Elevated Sheet Shadow: `0 12px 32px -4px rgba(16, 24, 40, 0.10)`
  - Floating Button Shadow: `0 8px 16px -2px rgba(16, 24, 40, 0.08)`

### 3.3 Backdrop Blur
- **Confirmation Dialogs & Action Menus**:
  - Dark: `backdrop-blur-md bg-black/60`
  - Light: `backdrop-blur-md bg-slate-900/40`

---

## 4. Layout & Spacing Rules

The redesign is anchored on mobile-first flexibility:

1. **Fixed Header & Bottom Navigation**:
   - **Header**: Top-left greeting ("Good Morning") above username ("Adam James"); top-right notification bell with unread dot, adjacent to avatar with camera/edit badge. Sub-screens show back chevron + screen title.
   - **Bottom Navigation**: Floating pill dock on left/center with 3 icons (Home, Analytics, Budgets) + a distinct circular floating `+` FAB on the right (`#18212F` with white `+` in light mode; light grey `#E5E7EB` with dark `+` in dark mode).
   - Only the middle region scrolls (`overflow-y-auto overscroll-contain`).
2. **Width Responsiveness (360 px to Desktop)**:
   - Phone designs are drawn at 412 px width, but **all layouts must be fluid**:
     - At **360 px wide**: horizontal margins condense to `14px` (`px-3.5`), font sizes adapt without horizontal truncation, buttons wrap content properly.
     - At **412 px wide**: standard `16px - 20px` horizontal margins (`px-4` / `px-5`).
     - On **Desktop / Tablet**: retains Centra's centered container (`max-w-2xl` or responsive grid) with navigation adapted to wide screens, applying the new color and typography tokens cleanly.
3. **Internal Card Spacing**:
   - Card internal padding: `20px` (`p-5`).
   - Vertical gap between cards: `16px` (`space-y-4` / `gap-4`).
   - Action sheet content padding: `24px` (`p-6`).

---

## 5. Component Patterns

### 5.1 The Shared Add Action Modal
- In Figma, there are separate exports for Home (`11-home-add-*`), Analytics (`12-analytics-add-*`), and Budgets (`13-budgets-add-*`).
- **Architecture**: This is **ONE single reusable modal component** (`AddActionModal`).
- The modal contains segmented tabs:
  1. `Spend` (Outflow expense)
  2. `Income` (Inflow deposit)
  3. `Transfer` (**Preserved**; rendered whenever the user has 2 or more accounts, styled identically with amount, from-account, to-account, fee, and note)
  4. `Goal` (Savings target deposit)
  5. `Budget` (Category spending ceiling)
- The different Figma frames merely illustrate the dimming backdrop of whichever screen launched the modal.

### 5.2 Category Pills Selection Pattern
- Category chips (`07-onboarding-categories` and `15-picker-*`) use pill badges:
  - Height: `44px` minimum tap target.
  - Padding: `12px 18px`.
  - Unselected (Dark): `#262626` background, `#FFFFFF` text.
  - Selected (Dark): `#262626` background with `2px solid #C6FF3D` border and neon lime checkmark.
  - Unselected (Light): `#F1F2F4` background, `#18212F` text.
  - Selected (Light): `#FFFFFF` background with `2px solid #18212F` border and subtle shadow.

### 5.3 PIN Lock Screen (`10-pin-lock`)
- Numeric keypad with digits 0-9 and backspace.
- **NO biometric button** (biometrics were deliberately removed from the app).
- 4-dot or 6-dot indicator with active filled states.

### 5.4 Guest Mode & Limits
- **NO guest limit popup**: Guests are not blocked from any feature.
- Only the existing sticky `GuestBanner` ("Guest Mode — data stored locally") and the existing "Create account" prompt are restyled to match the new visual tokens.

### 5.5 Sync Error State
- Keep the existing full-screen `SyncRetryScreen` ("Unable to sync data") with **Retry** and **Sign out** buttons.

### 5.6 Logo Files Specification
- `design/assets/logo-on-dark.svg` and `logo-on-light.svg` are SVG wrappers around embedded PNG bitmaps (`750x750` and `500x500` respectively).
- To preserve maximum sharpness, these assets are rendered at targeted sizes (&le; 180px) and accompanied by native Android 12+ drawables for the system splash.

### 5.7 Unverified Tokens
The following sampled values are noted:
1. `color.wordmark.light`: Sampled `#4D6E18` to `#56791E` (dark olive-lime for light splash wordmark) — **UNVERIFIED**.
2. `glow-corner.svg` and `glow-corner-on-light.svg`: True vector corner light assets provided in `design/assets/` using `#C6FF3D` and Gaussian blur filter. Verified and integrated as `<CornerGlow />` component.
3. `stroke.light-grid`: Subtle grid line stroke on light onboarding canvas (`rgba(0, 0, 0, 0.03)`) — **UNVERIFIED**.

---

## 6. Splash Screen Strategy

### Analysis of Installed Capacitor Splash Screen Plugin
- **Installed Package**: `@capacitor/splash-screen: ^8.0.2`
- **Capacitor Configuration**:
  ```ts
  SplashScreen: {
    launchAutoHide: false,
    launchFadeOutDuration: 250,
    backgroundColor: '#0A0E1A',
  }
  ```
- **Capabilities & Android 12+ API Support**:
  - The Capacitor 8 `SplashScreen` plugin interfaces directly with the Android 12 `SplashScreen` API (`androidx.core:core-splashscreen`).
  - Android 12+ requires splash styling to be declared statically in native XML resources:
    - `values/styles.xml`: `windowSplashScreenBackground` set to `#F7F8FA` (for Light system mode).
    - `values-night/styles.xml`: `windowSplashScreenBackground` set to `#000000` (for Dark system mode).
  - The native splash screen handles the cold OS startup window before JavaScript / WebView initializes.
  - Once the WebView engine boots, `SplashScreen.hide({ fadeOutDuration: 250 })` smoothly cross-fades into the web application.

### Chosen Architecture: Two-Tier Seamless Splash Flow
1. **Tier 1 — Android System Native Splash**:
   - Follows the phone's OS theme (Dark or Light) via `values/styles.xml` and `values-night/styles.xml`.
   - Uses Centra's background color (`#000000` for night, `#F7F8FA` for day) and the Centra icon.
2. **Tier 2 — In-App Animated Web Splash (`01-splash`)**:
   - Evaluates `prefers-color-scheme` if the user is a fresh unauthenticated visitor (defaults to `System`).
   - Displays the SVG logo with smooth pulsing animation against `background.svg` until database hydration and session validation resolve.
   - Hides the native splash via `SplashScreen.hide()` once initial rendering is ready, avoiding any white or black flash.
