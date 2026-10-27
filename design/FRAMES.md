# Centra Redesign — Frames Inventory (`design/FRAMES.md`)

This document registers every visual screen frame exported from Figma for the Centra redesign in both dark and light modes, along with structural categorisation, dimension anomalies, theme parity analysis, and the inventory of missing UI frames required by the application.

---

## 1. Directory & Theme Overview

- **Dark Frames**: `design/frames/dark/` (39 files, 13.1 MB)
- **Light Frames**: `design/frames/light/` (33 files, 11.2 MB)
- **Vector & Brand Assets**: `design/assets/` (3 files: `background.svg`, `logo-on-dark.svg`, `logo-on-light.svg`, 247 KB)
- **Total Design Directory Size**: **24.0 MB** (24,809,472 bytes) — **Well under the 100 MB threshold**.
- **Base Phone Viewport**: 412 × 917 px (phone design @1x). Assets are exported at `@2x` resolution (824 × 1834 px) for high-density mobile displays.

---

## 2. Frame Master Inventory

| New Name | Original Name (Dark / Light) | Resolution & Sizes | Theme Parity | Frame Category |
| :--- | :--- | :--- | :---: | :--- |
| `01-splash.png` | Dark: `01. Splash-page.png`<br>Light: `Splash — Light.png` | 824 × 1834<br>(D: 431.6 KB, L: 90.0 KB) | Both | Phone Frame (412 @1x / 824 @2x) |
| `02-onboarding-intro.png` | Dark: `02. Onbording-page.png`<br>Light: `Onboarding — Light.png` | 824 × 1834<br>(D: 605.1 KB, L: 232.5 KB) | Both | Phone Frame (412 @1x / 824 @2x) |
| `03-auth.png` | Dark: `03. Authentication-page.png`<br>Light: `Authentication — Light.png` | 824 × 1834<br>(D: 582.1 KB, L: 239.9 KB) | Both | Phone Frame (412 @1x / 824 @2x) |
| `04-verify-code.png` | Dark: `04. Verification-page.png`<br>Light: `Verification — Light.png` | 824 × 1834<br>(D: 515.7 KB, L: 229.8 KB) | Both | Phone Frame (412 @1x / 824 @2x) |
| `05-onboarding-profile.png` | Dark: `05. Personal-Details.png`<br>Light: `Choosing options — Light.png` *(misnamed in Figma)* | 824 × 1834<br>(D: 563.6 KB, L: 382.8 KB) | Both | Phone Frame (412 @1x / 824 @2x) |
| `06-onboarding-appearance.png` | Dark: `06. Appearance-page.png`<br>Light: `Appearance — Light-1.png` | 824 × 1834<br>(D: 561.4 KB, L: 269.1 KB) | Both | Phone Frame *(System Mode selected)* |
| `06-onboarding-appearance--dark-selected.png` | Dark: `07. Appearance-Dark.png`<br>Light: `Appearance — Light.png` | 824 × 1834<br>(D: 561.5 KB, L: 269.2 KB) | Both | Phone Frame *(D: Dark active / L: Light active)* |
| `07-onboarding-categories.png` | Dark: `08. Choosing-options.png`<br>Light: `Choosing options — Light-1.png` | 824 × 1834<br>(D: 577.3 KB, L: 291.9 KB) | Both | Phone Frame *(Category pills unselected)* |
| `07-onboarding-categories--selected.png` | Dark: `08.5 Choosing-options-after-select.png`<br>Light: *(None)* | 824 × 1834<br>(Dark: 576.1 KB) | Dark only | Phone Frame *(Category pills selected)* |
| `08-home.png` | Dark: `09. Dashboard.png`<br>Light: `Home — Light.png` | 824 × 1834<br>(D: 376.7 KB, L: 197.7 KB) | Both | Phone Frame (Home Dashboard) |
| `08-home--full.png` | Dark: `Home full screen.png`<br>Light: *(In `FULL SCREEN — Light.png`)* | 824 × 1858<br>(Dark: 350.0 KB) | Dark only | Full-Page Frame (Complete scrolling area) |
| `09-notifications.png` | Dark: `10. Notifications.png`<br>Light: `Notifications — Light.png` | 824 × 1834<br>(D: 298.4 KB, L: 150.4 KB) | Both | Phone Frame (Notifications) |
| `09-notifications--full.png` | Dark: `Notifications full page.png`<br>Light: *(In `FULL SCREEN — Light.png`)* | 824 × 1906<br>(Dark: 304.5 KB) | Dark only | Full-Page Frame (Complete scrolling area) |
| `10-transactions-view-all.png` | Dark: `11. View All.png`<br>Light: `View All — Light.png` | 824 × 1834<br>(D: 257.3 KB, L: 91.4 KB) | Both | Phone Frame (All Transactions) |
| `11-home-add-menu.png` | Dark: `12. Popup Home.png`<br>Light: `Popup Home — Light.png` | 824 × 1834<br>(D: 420.3 KB, L: 741.6 KB) | Both | Popup (Action sheet menu over Home) |
| `11-home-add-spend.png` | Dark: `14. Home Spend popup.png`<br>Light: `Home Spend popup — Light.png` | 824 × 1834<br>(D: 118.6 KB, L: 241.1 KB) | Both | Popup (Add Spend sheet over Home) |
| `11-home-add-income.png` | Dark: `13. Home Income popup.png`<br>Light: `Home Income popup — Light.png` | 824 × 1834<br>(D: 119.5 KB, L: 240.8 KB) | Both | Popup (Add Income sheet over Home) |
| `11-home-add-goal.png` | Dark: `15. Home Goals popup.png`<br>Light: `Home Goals popup — Light.png` | 824 × 1834<br>(D: 184.5 KB, L: 485.5 KB) | Both | Popup (Add Goal sheet over Home) |
| `11-home-add-budget.png` | Dark: `16. Home Budget popup.png`<br>Light: `Home Budget popup — Light.png` | 824 × 1834<br>(D: 152.7 KB, L: 408.9 KB) | Both | Popup (Add Budget sheet over Home) |
| `12-analytics.png` | Dark: `17. Analysis.png`<br>Light: `Analysis — Light.png` | 824 × 1834<br>(D: 333.5 KB, L: 177.5 KB) | Both | Phone Frame (Analytics overview) |
| `12-analytics--full.png` | Dark: `Analysis full page.png`<br>Light: *(In `FULL SCREEN — Light.png`)* | 800 × 2272<br>(Dark: 421.1 KB) | Dark only | Full-Page Frame (Complete scrolling area) |
| `12-analytics-add-menu.png` | Dark: `Popup Analysis.png`<br>Light: `Popup Analysis — Light.png` | 824 × 1834<br>(D: 386.4 KB, L: 691.6 KB) | Both | Popup (Action sheet menu over Analytics) |
| `12-analytics-add-spend.png` | Dark: `Analysis spend popup.png`<br>Light: `Analysis spend popup — Light.png` | 824 × 1834<br>(D: 169.4 KB, L: 240.4 KB) | Both | Popup (Add Spend sheet over Analytics) |
| `12-analytics-add-income.png` | Dark: `Analysis income popup.png`<br>Light: `Analysis income popup — Light.png` | 824 × 1834<br>(D: 170.7 KB, L: 242.4 KB) | Both | Popup (Add Income sheet over Analytics) |
| `12-analytics-add-goal.png` | Dark: `Analysis goals popup.png`<br>Light: `Analysis goals popup — Light.png` | 824 × 1834<br>(D: 280.4 KB, L: 468.1 KB) | Both | Popup (Add Goal sheet over Analytics) |
| `12-analytics-add-budget.png` | Dark: `Analysis budhet popup.png`<br>Light: `Analysis budhet popup — Light.png` | 824 × 1834<br>(D: 262.2 KB, L: 417.5 KB) | Both | Popup (Add Budget sheet over Analytics) |
| `13-budgets.png` | Dark: `18. Goals & Budget.png`<br>Light: `Goals & Budget — Light.png` | 824 × 1834<br>(D: 372.5 KB, L: 220.4 KB) | Both | Phone Frame (Goals & Budgets) |
| `13-budgets--full.png` | Dark: `Goals & Budget full page.png`<br>Light: *(In `FULL SCREEN — Light.png`)* | 800 × 2162<br>(Dark: 429.7 KB) | Dark only | Full-Page Frame (Complete scrolling area) |
| `13-budgets-add-menu.png` | Dark: `Popup Budget.png`<br>Light: `Popup Budget — Light.png` | 824 × 1834<br>(D: 417.7 KB, L: 752.8 KB) | Both | Popup (Action sheet menu over Budgets) |
| `13-budgets-add-spend.png` | Dark: `Budget spend popup.png`<br>Light: `Budget spend popup — Light.png` | 824 × 1834<br>(D: 170.2 KB, L: 257.2 KB) | Both | Popup (Add Spend sheet over Budgets) |
| `13-budgets-add-income.png` | Dark: `Budget income popup.png`<br>Light: `Budget income popup — Light.png` | 824 × 1834<br>(D: 171.0 KB, L: 258.6 KB) | Both | Popup (Add Income sheet over Budgets) |
| `13-budgets-add-goal.png` | Dark: `Budget goals popup.png`<br>Light: `Budget goals popup — Light.png` | 824 × 1834<br>(D: 276.3 KB, L: 487.4 KB) | Both | Popup (Add Goal sheet over Budgets) |
| `13-budgets-add-budget.png` | Dark: `Budget budget popup.png`<br>Light: `Budget budget popup — Light.png` | 824 × 1834<br>(D: 246.9 KB, L: 425.6 KB) | Both | Popup (Add Budget sheet over Budgets) |
| `14-settings.png` | Dark: `19. Settings.png`<br>Light: `Settings — Light.png` | 824 × 1834<br>(D: 330.5 KB, L: 160.9 KB) | Both | Phone Frame (Settings main view) |
| `14-settings--full.png` | Dark: `Settings full page.png`<br>Light: *(In `FULL SCREEN — Light.png`)* | 800 × 2180<br>(Dark: 394.8 KB) | Dark only | Full-Page Frame (Complete scrolling area) |
| `14-settings-logout-row.png` | Dark: `LOGOUT.png`<br>Light: *(None)* | 824 × 1834<br>(Dark: 347.5 KB) | Dark only | Phone Frame / Scrolled Overlay |
| `15-picker-income-category.png` | Dark: `Income category options.png`<br>Light: `Income category options — Light.png` | 800 × 768<br>(D: 180.1 KB, L: 199.4 KB) | Both | Picker (Category selection dropdown) |
| `15-picker-payment-method.png` | Dark: `Payment method options.png`<br>Light: `Payment method options — Light.png` | 800 × 708<br>(D: 161.1 KB, L: 138.8 KB) | Both | Picker (Account/method dropdown) |
| `15-picker-budget.png` | Dark: `Spend and Budget category options.png`<br>Light: `Spend and Budget category options — Light.png` | 800 × 1320<br>(D: 275.3 KB, L: 243.8 KB) | Both | Picker (Budget category options) |
| `FULL SCREEN — Light.png` | Dark: *(None)*<br>Light: `FULL SCREEN — Light.png` | 4376 × 2272<br>(Light: 1041.6 KB) | Light only | Composite Artboard (5 full-page screens) |

---

## 3. Discrepancy & Dimension Reports

### Frames Present in Only One Theme
1. **Present in `dark/` only (7 frames)**:
   - `07-onboarding-categories--selected.png` (824 × 1834): Demonstrates category pills selected state with lime borders.
   - `08-home--full.png` (824 × 1858): Home scrolling content without viewport cutoff.
   - `09-notifications--full.png` (824 × 1906): Notifications scrolling content without viewport cutoff.
   - `12-analytics--full.png` (800 × 2272): Analytics full scrolling content.
   - `13-budgets--full.png` (800 × 2162): Goals & Budgets full scrolling content.
   - `14-settings--full.png` (800 × 2180): Settings full scrolling content.
   - `14-settings-logout-row.png` (824 × 1834): Bottom scroll position of Settings revealing the Logout row.
2. **Present in `light/` only (1 frame)**:
   - `FULL SCREEN — Light.png` (4376 × 2272): Composite Figma artboard containing all 5 Light full-page screens (`Home`, `Notifications`, `Analytics`, `Goals & Budget`, `Settings`) arranged side-by-side.

### Frames Whose Width is Not 412 px (at @1x) / 824 px (at @2x)
Standard phone frames are exported at `@2x` resolution (824 px wide). The following frames deviate:
- `12-analytics--full.png`: **800 px** wide (cropped artboard width in Figma).
- `13-budgets--full.png`: **800 px** wide (cropped artboard width in Figma).
- `14-settings--full.png`: **800 px** wide (cropped artboard width in Figma).
- `15-picker-income-category.png`: **800 px** wide (standalone modal component width).
- `15-picker-payment-method.png`: **800 px** wide (standalone modal component width).
- `15-picker-budget.png`: **800 px** wide (standalone modal component width).
- `FULL SCREEN — Light.png`: **4376 px** wide (multi-screen composite artboard).

### Frames Taller Than 3000 px
- **None**: No frame exceeds 3000 px. The tallest individual frame is `12-analytics--full.png` at 2272 px, and the composite artboard `FULL SCREEN — Light.png` is also 2272 px high.

### Total Size of `design/`
- **Total size**: **24 MB** (24,809,472 bytes).
- **Threshold Check**: **Well below 100 MB** (approx. 24% of the 100 MB ceiling).

---

## 4. MISSING FRAMES

The following required screens, states, and components exist in the production application (`src/components/`) but were **not included in the Figma design exports**. These must be designed and styled in the exact Centra redesign visual language and documented in `docs/UI_SLICES.md`:

1. **Guest-Mode Banner & Guest-Mode Limit Popup**:
   - Amber/card warning banner on Home & Settings indicating read-only or unpersisted guest session.
   - Modal popup prompting guest to authenticate via email/OTP or Google OAuth to save data.
2. **Confirmation Dialogs with Blurred Backdrop**:
   - Backdrop: Heavy glassmorphism blur (`backdrop-blur-md bg-black/60`).
   - Logout confirmation dialog ("Are you sure you want to log out?").
   - Delete Account destructive confirmation ("Permanently delete your account and profile?").
   - Delete Data destructive confirmation ("Clear all transactions, budgets, and goals?").
   - Exit App confirmation dialog (Android back navigation confirmation).
3. **First-Account Onboarding Step**:
   - Screen following profile completion: prompts user to name their first account (e.g., "Cash Wallet", "Checking Account"), pick an initial balance, and choose currency.
4. **Account-Ready Onboarding Step**:
   - Final onboarding success transition card with checkmark animation and "Enter Dashboard" CTA before routing into Home.
5. **PIN Lock Screen & Biometric Auth Overlay**:
   - 4-digit PIN keypad screen with blurred glass backdrop, numeric key buttons, biometric trigger icon (Fingerprint / Face ID), and lockout error messaging.
6. **Sync-Error Screen & Offline Retry Banner**:
   - Persistent banner when offline or when Supabase sync fails, with retry indicator and cache notice.
7. **Add Account Modal / Popup**:
   - Modal to create a new financial account (Bank, Card, Wallet, Cash), with color/icon picker, initial balance, and currency.
8. **Transaction Detail Modal**:
   - Full transaction inspection modal with merchant details, category badge, amount, date/time, linked account pill, receipt preview/zoom, and Edit/Delete action buttons.
9. **Date Picker Modal**:
   - Wheel / calendar sheet matching the Centra dark/light theme for selecting transaction and goal target dates.
10. **Empty States**:
    - Zero transactions in Home and `10-transactions-view-all`.
    - Zero budgets configured in `13-budgets`.
    - Zero savings goals created in `13-budgets`.
    - Zero notifications in `09-notifications`.
11. **Transfer Tab in Shared Add Popup**:
    - The shared Add popup (`11-home-add-menu`, `12-analytics-add-menu`, `13-budgets-add-menu`) must retain the **Transfer** tab between accounts when the user has 2 or more active accounts, styled identically to Spend, Income, Goal, and Budget tabs.
