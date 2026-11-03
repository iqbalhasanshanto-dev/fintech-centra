# Changelog

All notable changes to the **Centra** personal finance and budgeting platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Web 1.0.2] - 2026-03-30

### 💻 Web App & UI Overhaul (Unified Bottom Nav, Side-by-Side Dashboard & PWA Polish)
- **Google Account Chooser (`prompt: 'select_account'`)**: Configured OAuth parameters on Web and Native so users can select between multiple logged-in Google accounts on every sign-in or sign-up.
- **Unified Floating Bottom Capsule Navigation**: Removed the desktop left sidebar and enabled the floating capsule navigation dock (`Home`, `Analytics`, `Budgets` + circular `#C6FF3D` `+` action button) on all screen sizes (mobile, tablet, desktop Web). On tablet and desktop, tab items display icon-left and label-right horizontally (`Home`, `Analytics`, `Budgets`).
- **Side-by-Side Desktop Dashboard**: Placed `Account Information` (`YourMoneySection`) and `Cash Flow Trend` (`IncomeExpenseLineChart`) side-by-side in a responsive 12-column grid (`lg:col-span-5` + `lg:col-span-7`), stretching to matching row height with `Recent Activity` full-width below. Removed `InsightBanner` ("Outstanding Savings Rate") for a clean, streamlined dashboard.
- **Permanent PWA Title Bar & Centra App Name**: Updated `public/manifest.json` and `index.html` to pure `"Centra"`, removing `window-controls-overlay` so the macOS/Windows Chrome standalone title bar is permanent with no collapsible chevron overlaying app content.
- **Desktop Mouse Swipe & 1-Click Goal History Deletion**: Added mouse drag support (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`) to `SwipeableRow` and added a visible subtle trash icon button to Goal History entries. Automatically seeds an initial `GoalHistoryEntry` for goals with balances so history entries can always be deleted and rebalanced.
- **Native Install Prompt Streamlining**: Removed custom instructions modal and uninstall button states from `Header.tsx`. Only prompts native browser install when available and not in standalone/native mode.

---

## [iOS 1.0.1] - 2026-04-12

### 📱 iOS Bug Fixes & Layout Optimization
- **Bottom Navigation Bar Safe-Area Gap**: Resolved excessive 46px bottom gap on iPhones (`env(safe-area-inset-bottom)`) by scaling dock padding dynamically to `max(0.35rem, calc(env(safe-area-inset-bottom, 0px) * 0.35))` exclusively on iOS devices and Simulators.
- **Edge-to-Edge WKWebView Layout**: Configured `ios: { contentInset: 'never', backgroundColor: '#000000' }` in `capacitor.config.ts` to prevent iOS WKWebView scroll-view insetting.
- **Version Tracking**: Bumped iOS release track to `v1.0.1` (`CURRENT_PROJECT_VERSION = 2`) while keeping Android at `v4.1.1` and Web at `v1.0.0`.

---

## [v4.1.1] — 2026-11-02

### 🚀 Release: Multi-Platform Release Tracks (Android v4.1.1, iOS v1.0.0, Web & Desktop v1.0.0)

Centra transitions to independent multi-platform version tracking and separate release directories:
- **Android (`v4.1.1`)**: Standalone APK distribution with full Swipe-to-Delete Undo on Goals and History, Figma category picker, and Android Downloads CSV integration.
- **iOS (`v1.0.0`)**: Initial official iOS release with Capacitor 8 Swift SPM project, pure-black OLED launcher icons & 2732px splash screens, standalone Safari PWA support, local PBKDF2 PIN lock, and offline CentraDB.
- **Web & Desktop (`v1.0.0`)**: Modern installable Progressive Web Application (PWA) with dedicated desktop windowing (macOS, Windows, Linux), offline Service Worker (`public/sw.js`), Web App Manifest, and removal of Tauri dependency bloat.

#### 📥 Multi-Platform Direct Downloads & Verification
- **Android APK**: [**Centra-v4.1.1.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.1.apk) (6.00 MB)
  - SHA-256: `03cbad9a8fb32593f5c05f76fb6e057eaaec2a92b56b6a3f8eb4ca8d60d6ab80`
- **iOS Package**: [**Centra-iOS-v1.0.0.zip**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/ios/Centra-iOS-v1.0.0.zip) (2.40 MB)
  - SHA-256: `8a8d489104aa62f050a440e09910d5220b75fc46539b800a4ea46b8854a9b61f`
- **Web & Desktop PWA Bundle**: [**Centra-Web-v1.0.0.zip**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/web/Centra-Web-v1.0.0.zip) (1.20 MB)
  - SHA-256: `b2f6aadaa72a73138c478ceb652144242d8893449a00c3a9763df176b39b58ee`

#### ↔️ Swipe-to-Delete & 5-Second Undo on Goals, History & Budgets
- **Per-Goal History Deletion & Rebalance**: Wrapped chronological Goal History entries in `<SwipeableRow>` with automatic balance reversal and chronological recalculation of `balanceAfter` across all remaining entries.
- **Milestone Goals & Budgets Swiping**: Wrapped all Savings Goal milestone cards and Category Budget cards in `<SwipeableRow>` with 5-second deferred deletion and instantaneous in-memory reversal upon tapping **UNDO**.
- **Undo Toast Layering**: Elevated Undo Toast container to `z-[220]` above modal overlays (`z-[110]`), ensuring the floating Undo bar is clearly visible and actionable directly within the Goal History modal.

#### ✏️ Edit Transaction Modal Overhaul
- **Full Date Editing**: Integrated custom interactive `DatePicker` modal allowing users to adjust transaction dates seamlessly.
- **Custom Figma Category Selector**: Replaced native HTML `<select>` with a custom collapsible picker matching Quick Action styling, complete with category icons, checkmark badges, and merged default categories.
- **Dynamic Category Persistence**: Automatically upserts default categories into `CentraDB` upon selection if not already persisted.
- **Pixel-Perfect Input Alignment**: Normalized input heights to `52px` across Merchant, Date, and Category selectors for consistent UI rhythm.

#### 🔔 2-Month Rolling Retention Notification Polish
- **Monthly Notification Guard**: Throttled system tray notifications for the 2-Month Data Retention reminder to once per calendar month using `localStorage` key `centra_retention_notified_${yyyyMm}`.
- **Notification Read Fix**: Fixed notification pipeline so marking reminders or alerts as read never retriggers Android status-bar popups (`notificationsToEmit: []`).
- **Clean Reminder Cards**: Removed non-functional `View details >` link from the pinned retention card in Notifications modal and prevented erroneous Quick Action modal openings on tap.

#### 🎯 Goal Modal Polish & Title Flash Prevention
- **Stable Modal Titles**: Preserved `lastGoalNameRef` in `PlanScreen` so goal fund modals retain their title (e.g. `"Add Funds to Car"`) smoothly throughout the exit animation without flashing `"undefined"`.

#### 🍞 Centered Toasts & Modern Dot Indicators
- **Horizontal Centering Containers**: Replaced `left-1/2 -translate-x-1/2` with full-width flex containers (`fixed inset-x-4 flex justify-center pointer-events-none`) across Settings and Recent Activities toasts, ensuring toasts never get clipped on mobile screens.
- **Minimalist Status Badges**: Removed `✓` / `✅` tick marks in favor of a clean, glowing neon-lime dot indicator (`w-2 h-2 rounded-full bg-[#C6FF3D]`).

#### 🔍 Recent Activities Filter & Home Navigation
- **All Categories Available**: Merged all 11 default categories into the Recent Activities filter list with multi-property matching (`id` and lowercase `name`).
- **Instant Home Back Exit**: Android hardware Back gesture on the root Home tab immediately presents the exit toast without cycling through redundant history entries.

---

## [v4.1.0] — 2026-11-01

### 🚀 Release: 5-Second Undo Delete, Standalone Savings Goals with Per-Goal History, Native Android Downloads & Status-Bar Notifications

Centra `v4.1.0` introduces a 5-second Undo Delete safety system with delayed server deletion, standalone Savings Goal accounting with a dedicated chronological History modal log, native Android MediaStore Downloads folder CSV integration, real-time Android system notification tray alerts, comprehensive All-Data CSV backup, bottom navbar sliding pill alignment and inactive Settings state, smooth 45-degree `+` to `×` rotation, tab back-history navigation, and red swipe bleed elimination.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v4.1.0.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/android/Centra-v4.1.0.apk) (Fallback: [`releases/android/Centra-v4.1.0.apk?raw=true`](releases/android/Centra-v4.1.0.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/android/Centra-v4.1.0.apk)
- **File Size**: `6,275,302 bytes` (6.00 MB)
- **SHA-256 Checksum**:
  ```
  466f385d5110c3d6c41d51ff40fe90faab7f3357d23542f016ba1886e7a8fe13
  ```

#### ↩️ 5-Second "Undo Delete" System with Deferred Remote Deletion
- **Immediate Local UI Deletion with Delayed Commit**: Deleting transactions or goals immediately reverses account balances and updates the UI while deferring Supabase and outbox deletion for 5000ms.
- **Floating Undo Toast Bar**: Displays a dark charcoal pill above the bottom navbar with a 5-second shrinking neon-lime progress line (`animate-undo-progress`). Tapping **UNDO** immediately cancels the timer, restores the deleted item, accounts, and goal history, and cancels server deletion.

#### 🎯 Standalone Savings Goals & Dedicated History Log
- **Decoupled Financial Tracking**: Savings Goals now act as independent savings trackers decoupled from regular bank accounts and transaction feeds.
- **Dedicated History Modal**: Tapping **History** in the streamlined 2-item (`History`, `Delete`) goal menu opens a full-screen history modal displaying target progress and a chronological log of all initial deposits, contributions, and withdrawals with timestamps and notes.
- **Per-Goal History Persistence**: All actions are logged as `GoalHistoryEntry` records and persisted in local storage (`centra_goal_history`).

#### 📥 Native Android Downloads Folder Bridge & Status-Bar Notifications
- **Direct Downloads Folder Saving**: Built a native Android `CentraNativeBridge` connecting Capacitor WebView to `MediaStore.Downloads` on Android 10+ (`Build.VERSION.SDK_INT >= 29`) and public download directory on older versions. CSV exports are immediately saved to the phone's physical **Downloads** folder.
- **Native Status-Bar Notifications**: Automatically posts an Android system notification (`NotificationCompat.Builder` on channel `centra_alerts`) upon download completion (`"Download Complete" — "Saved <filename> to Downloads"`) and for all in-app financial alerts.
- **Runtime Notification Permissions**: Automatically requests `android.permission.POST_NOTIFICATIONS` at runtime on Android 13+ (`SDK 33+`).

#### 📊 Distinct CSV Exports: Recent Activities vs All-Data Backup
- **Recent Activities Transaction CSV**: Generates `centra_transactions_YYYY-MM-DD.csv` containing date, payee/merchant, category, account, amount, and notes.
- **Comprehensive All-Data CSV**: In Settings -> "Download your data", generates `centra_all_data_YYYY-MM-DD.csv` containing metadata, account details, financial summaries, full transactions, active savings goals, per-goal history logs, and monthly budgets.

#### 🧭 Navigation, Navbar Polish & UI Refinements
- **Bottom Navbar Alignment & Inactive Settings State**: The sliding active pill hides completely when viewing Settings (`activeTab === 'settings'`), keeping all 3 tabs muted. Capsule dock uses CSS grid for exact horizontal centering.
- **Smooth `+` to `×` Rotation**: The floating action button rotates 45° into an exact diagonal `×` close icon with a 280ms spring transition.
- **Tab Back-Navigation Stack**: Android hardware Back button pops through previously visited tabs (`tabHistoryRef`) before showing the centered dark exit toast on the root Home screen.
- **Eliminated Red Delete Bleed-Through**: In `<SwipeableRow />`, the red delete background is hidden until the user swipes left (`translateX < -2`), preventing red bleed-through behind translucent cards.
- **Pinned Data Retention Policy Reminder**: The 2-Month Data Retention Reminder is permanently pinned at the top of Notifications with a visible pin badge and is protected against "Clear All".
- **Refined Form Focus & Keyboard Stability**: Removed `autoFocus` from Add Quick Action amounts to eliminate mobile jitter, displaying a subtle pulsing caret until explicitly tapped.

---

## [v4.0.0] — 2026-11-01

### 🚀 Major Release: Interactive Motion System, Micro-Interactions, 2-Month Rolling Retention & Native Notifications

Centra `v4.0.0` introduces a fluid, physics-based motion system featuring spring stretch toggle switches, elastic pop-burst tap feedback, spatial origin speed-dial expansion, horizontal error shake validation, sliding active navigation pills, touch swipe-to-delete with smooth height collapse, 2-month rolling data retention with sticky monthly headers, direct +Add and -Withdraw goal management, native Android status-bar notification tray alerts, and immediate PIN lock on app minimize with Centra branding.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v4.0.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v4.0.0-debug.apk) (Fallback: [`releases/Centra-v4.0.0-debug.apk?raw=true`](releases/Centra-v4.0.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v4.0.0-debug.apk)
- **File Size**: `6,268,158 bytes` (5.98 MB)
- **SHA-256 Checksum**:
  ```
  0bfd170ccefabcd4c15cdb60a01e8b42ccfc4b12240ff500c1a0d8a1f351cd54
  ```

#### 🎭 Physics-Based UI Motion & Micro-Interactions
- **Spring Stretch & Overshoot Toggle Switches**: Added physical spring mechanics (`transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1)`) with horizontal thumb elongation (`scaleX(1.28)`) on toggle drag/tap across `<Switch />` components and the Dark/Light Appearance setting.
- **Elastic Pop & Radial Burst Tap Feedback**: Micro-interaction feedback (`@keyframes popBurst` and `@keyframes radialRingPulse`) triggering an expanding tactile radial ring on Privacy Mode (Eye toggle), Pinned Transaction toggles, Payment/Category selections, and Modal Confirm actions.
- **Spatial Origin Menu Expansion**: Floating Quick Action speed-dial (`+` menu) expands from `origin-bottom-right` while rotating the `+` icon 135°, and Goal card actions (`⋮` menu) expand dynamically from `origin-top-right` with elastic overshoot.
- **Horizontal Error Shake Validation**: Visual error feedback (`@keyframes errorShake`) vibrating inputs horizontally upon invalid PIN entry, OTP verification failure, empty/zero amounts in Quick Actions, and over-withdrawal attempts in Savings Goals.
- **Sliding Active Pill Continuity**: Fluid sliding background indicator (`cubic-bezier(0.34, 1.3, 0.64, 1)`) tracking active tabs across the 3-tab Bottom Nav dock, 5-tab Quick Action modal, 2-tab Goal Funds switcher, and 4-tab Transaction Drawer filters.
- **Swipe-Left to Delete with Smooth Height Collapse**: Touch swipeable row architecture (`<SwipeableRow />`) revealing a red trash action with haptic feedback, followed by an animated 280ms height collapse (`max-height: 0px; opacity: 0; transform: scale(0.96)`) prior to state deletion in Recent Activities, Full Transaction Drawer, Calendar Day views, and Notifications.

#### 🗓️ 2-Month Rolling Retention & Sticky Month Headers
- **Rolling 2-Month Lifecycle**: Retains transactions exclusively for the Current Month and Previous Month (from the 1st of the previous calendar month). Older transactions are automatically pruned from local storage and Supabase while preserving net balance in the user's account totals.
- **Monthly Retention Notification Reminder**: Automatically emits an in-app and system notification once per calendar month reminding users of the 2-month retention window with CSV backup guidance.
- **Sticky Month Grouping Headers**: View All Activities drawer organizes transactions under sticky month headers (`Current Month • [Month Year]` and `Previous Month • [Month Year]`) with unified row border dividers.

#### 🔔 Native Android Status-Bar Notifications
- **System Notification Tray Alerts**: Added `POST_NOTIFICATIONS` permission in `AndroidManifest.xml` and native dispatch utility (`triggerSystemNotification`) pushing budget overrun warnings and rollover reminders directly to the Android notification shade and lock screen.
- **Single Notification Dismissal**: Added touch swipe-to-dismiss and height collapse for individual notification items in the notifications tray.

#### 🔒 Immediate PIN Lock on App Minimize & Brand Logo
- **Instant Background Locking**: Transitioning the app to the background (via Capacitor App state listener and document visibility change) immediately triggers the PBKDF2 PIN lock screen without delay or window timeouts.
- **Centra Brand Identity**: Added the official high-resolution Centra brand logo above the PIN lock input field for a clean, secure lock screen experience.

#### 🎯 Goal Ergonomics & Form Polish
- **Dual Direct Goal Action Buttons**: Exposed both `+ Add` and `- Withdraw` action chips directly on Savings Goal cards in `PlanScreen.tsx` for one-tap fund adjustments.
- **Aligned Modal Inputs & Category Merging**: Standardized 52px input heights and grid alignments in the Goals create form, unified Category picker overlines (`SPEND` vs `BUDGET`), and merged default categories across expense and income tabs.
- **Clean Transaction Subtitles**: Streamlined subtitle format to `${categoryName} • ${smartDate}` to prevent text truncation in dense feeds.
- **Refined Calendar Highlights**: Replaced neon glow filters with clean, flat solid `#C6FF3D` styling on selected day cells.

---

## [v3.3.0] — 2026-11-01

### 🌟 Latest Release: Custom Payee Transaction Titles, Goal Withdrawals & Onboarding Persistence

Centra `v3.3.0` elevates custom payees ("Received From" / "Paid To") to primary transaction titles, adds the ability to withdraw funds from Savings Goals back into connected accounts with balance auditing, persists in-progress onboarding state across app minimizes and backgrounding, carries over net month-end balances into new periods, and updates Android launcher icons to a pure 100% black background.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.3.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.3.0-debug.apk) (Fallback: [`releases/Centra-v3.3.0-debug.apk?raw=true`](releases/Centra-v3.3.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.3.0-debug.apk)
- **File Size**: `6,262,918 bytes` (5.97 MB)
- **SHA-256 Checksum**:
  ```
  f226a8942698e67177d6075d6d2d3c11a068fc6fe603416579d274a9ab844ee5
  ```

#### 🏷️ Primary Transaction Title & Subtitle Formatting
- **Payee / Source Priority**: Updated `getTransactionDisplay` in `formatters.ts` so custom merchants (`Paid To` for expenses and `Received From` for income) take Priority 1 as the primary bold title.
- **Smart Note & Category Fallback**: Clean notes take Priority 2 when merchant is absent, followed by Category Name as Priority 3.
- **Deduplicated Subtitle Hierarchy**: Subtitles display `${categoryName} • ${cleanNote} • ${smartDate}` when both custom merchant and note are provided, `${categoryName} • ${smartDate}` when only one is present, and `${accountName} • ${smartDate}` when falling back to category name, eliminating redundant category text.

#### 🎯 Savings Goal Withdrawals & Fund Management
- **Withdraw Funds Action**: Added `applyWithdrawFromGoal` in `financeOperations.ts` and exposed `withdrawFromGoal` through `FinanceContext`. Users can withdraw or deduct money from active savings goals directly back into any connected account.
- **Goal Funds Segmented Switcher**: Implemented a 2-tab segmented control (`+ Add Funds` | `- Withdraw Funds`) in the Goal Funds modal on `PlanScreen.tsx` with live saved balance display and validation ensuring withdrawals cannot exceed the saved goal balance.
- **Context Menu Integration**: Added a dedicated "Withdraw Funds" option in each goal card's `⋮` dropdown menu to launch the modal directly in withdrawal mode.
- **Transaction & Balance Reversals**: Goal withdrawals generate linked income transactions (`Goal Withdrawal`), and deleting a withdrawal transaction cleanly restores goal progress and accounts.

#### 🔄 Onboarding State Persistence & Month-End Balance Carryover
- **Onboarding Minimize Resilience**: Resolved premature onboarding completion on app minimize by gating `CentraDB.hasCachedData` and `AuthContext` on `onboarding_completed: true`, and auto-saving in-progress onboarding drafts to `localStorage`.
- **Month-End Balance Carryover**: When filtering by period (e.g. this month), leftover net savings from strictly prior transactions carry forward into starting period income so new months reflect the accurate remaining balance.
- **Pure Black Android Adaptive Icons**: Regenerated all Android launcher and adaptive icon densities (`mipmap-*`) with transparent foregrounds and 100% pure black backgrounds (`#000000`).

---

## [v3.2.0] — 2026-10-31

### ⚪ Previous Release: Glowing Calendar "Today" Navigation & Pinned Transactions

Centra `v3.2.0` introduces an interactive, glowing "Today" quick-jump action in the Spending Calendar that auto-dims when already viewing today, ensures pinned transactions stick to the top with rotating pin badges across all transaction lists (Recent Activity, View All Drawer, and Calendar Day view), enables immediate pin-state toggling inside Transaction Details without reopening the modal, and bumps the application version to `3.2.0`.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.2.0-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.2.0-debug.apk) (Fallback: [`releases/Centra-v3.2.0-debug.apk?raw=true`](releases/Centra-v3.2.0-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.2.0-debug.apk)
- **File Size**: `6,228,266 bytes` (5.94 MB)
- **SHA-256 Checksum**:
  ```
  c977cdc4787747597795e2e35e13dccd6bf78be6d08fe99077a533b826095b3e
  ```

#### 📅 Spending Calendar "Today" Glow & Auto-Dim
- **Context-Aware Today Glow**: Added dynamic state checking (`isOnToday = isViewingCurrentMonth && selectedDate === todayKey`) in `AnalyticsCalendar.tsx`. When navigating to past/future months or selecting any other day, the "Today" button glows with an electric neon lime badge (`bg-[#C6FF3D] text-[#0A0E1A] shadow-[0_0_14px_rgba(198,255,61,0.55)]`) paired with a calendar icon (`<CalendarIcon className="w-3.5 h-3.5" />`).
- **Auto-Dim & One-Tap Jump**: When viewing today's date in the current month, the button auto-dims (`opacity-60 cursor-default shadow-none`) with `disabled={isOnToday}`. Tapping when active instantly sets the month view to the current month and selects today's date cell.

#### 📌 Pinned Transactions Stick to Top Across All Lists
- **Immediate In-Modal Toggle**: In `TransactionDetailModal.tsx`, bound the live record via `useFinance().transactions.find(t => t.id === transaction.id)`, making the `Pin` / `Pinned` button reflect state changes immediately upon click without reopening the drawer.
- **Recent Activity on Home**: Pinned transactions (`tx.isPinned === true`) now stick to the top of the 5-item Recent Activity list, styled with a distinct lime card highlight and a rotating lime `<Pin />` badge next to the transaction title.
- **View All Activities Drawer**: Sorted filtered search results with pinned transactions prioritized at the top followed by chronological ordering, featuring the `<Pin />` badge and card highlight.
- **Calendar Daily Breakdown**: Transactions on any selected date prioritize pinned entries at the top of the list with the `<Pin />` indicator.

---

## [v3.1.4] — 2026-10-31

### ⚪ Previous Release: Layout, Typography & Android Safe-Area Spacing Optimization

Centra `v3.1.4` optimizes layout, typography, and safe-area spacing across all Android screen sizes (320px–430px width), aspect ratios, and aggressive system font scaling. It eliminates the excess black top-bar gap on Android devices by aligning with non-overlay status bars, prevents header title wrapping on narrow 360px phones, repairs mid-word text breaking on savings goal and budget cards, and locks root scrolling directly inside `<main>` with zero header overlap.

#### 📥 Direct Downloads & Verification
- **Android APK (One-Click Direct Download)**: [**Centra-v3.1.4-debug.apk**](https://github.com/iqbalhasanshanto-dev/fintech-centra/raw/main/releases/Centra-v3.1.4-debug.apk) (Fallback: [`releases/Centra-v3.1.4-debug.apk?raw=true`](releases/Centra-v3.1.4-debug.apk?raw=true))
- **Direct Raw Mirror**: [Download from Raw GitHub](https://raw.githubusercontent.com/iqbalhasanshanto-dev/fintech-centra/main/releases/Centra-v3.1.4-debug.apk)
- **File Size**: `6,227,662 bytes` (5.94 MB)
- **SHA-256 Checksum**:
  ```
  984b4ab2c6f7a12c9dd1a160e6f1e254bb6e422b2549d014efcb7ea9073390bf
  ```

#### 📐 Safe-Area & Viewport Layout
- **Zero Excess Top Bar Gap**: Set `--safe-area-inset-top: 0px` by default in `index.css` and replaced hardcoded padding fallbacks across `Header.tsx`, `SettingsScreen.tsx`, `NotificationsModal.tsx`, and `TransactionDrawer.tsx` with clean `env(safe-area-inset-top, 0px)`, removing the redundant black gap above the header on Android devices where WebView already renders beneath the native status bar.
- **Font Scale Lock**: Added `-webkit-text-size-adjust: 100%; text-size-adjust: 100%` on `html, body` so large Android system display zoom settings do not distort card grids or overflow containers.
- **Locked Main Scroll Container**: Locked the outer application shell to `h-[100dvh] overflow-hidden flex flex-col` and delegated all page scrolling strictly to `<main className="flex-1 min-h-0 overflow-y-auto">`, ensuring the header stays permanently docked above page content without content clipping or scroll bleed.

#### 🔤 Header Typography & Compact Controls
- **Non-Wrapping Header Titles**: Changed header titles on Analytics and Goals & Budgets to `text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap truncate`, preventing double-line wrapping on narrow 360px Android viewports.
- **Header Action Bar Optimization**: Tightened action button gap (`gap-1.5 sm:gap-2.5`) and hid the redundant `GUEST` text badge on mobile screens (`hidden sm:inline-block`), allowing ample horizontal room for titles and icons.

#### 🎯 Text Wrapping & Budget Card Ergonomics
- **Whole-Word Wrapping on Savings Goals**: Removed `break-words` from Goal card headings, applied `word-break: normal; overflow-wrap: normal` with `line-clamp-2`, scaled the goal icon container to `w-9 h-9 sm:w-11 sm:h-11 shrink-0`, and made `+ Add Funds` compact (`px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0`) to keep words like `"Apartment"` intact.
- **Squeeze Prevention**: Ensured all numeric currency totals use `whitespace-nowrap tabular-nums shrink-0` across Monthly Budgets, Your Money cashflow summary, Report category items, and Recent Activity transactions.

---

## [v3.1.3] — 2026-10-31

### ⚪ Previous Release: Locked Sticky Headers, Unified Typography & 60fps Theme Toggle

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

