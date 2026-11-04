# Centra Web & Desktop Releases (Standalone PWA)

Centra Web is delivered as a modern, zero-download installable standalone Progressive Web Application (PWA). Centra requires **NO `.zip` downloads or extractions** — users install it in a single click directly from the browser URL bar in Chrome, Edge, Brave, and Safari.

Once installed, Centra runs in a dedicated borderless window with desktop dock/taskbar pinning, offline IndexedDB storage, and high-performance 60fps UI animations.

---

## 📦 Web & Desktop Version Inventory

| Version | Channel | Installation Method | Highlights |
|:---|:---|:---|:---|
| **`v1.0.4`** | 🟢 Latest | **Direct Browser Install** (Zero `.zip` files) · [Install Guide](#-how-to-install--run-centra-as-a-standalone-desktop-app) | Web-only static rows with 1-click delete buttons, desktop centered Notifications modal card, enlarged header greeting & balanced padding, expanded Recent Activity box, default system appearance theme, descriptive tab title, and Network-First PWA caching |
| **`v1.0.2`** | ⚪ Previous | **Direct Browser Install** | Unified floating bottom capsule navigation on desktop & mobile, side-by-side Account Information & Cash Flow Trend dashboard, permanent standalone PWA title bar, Google account chooser support |

---

## 💻 How to Install & Run Centra as a Standalone Desktop App

### Option 1: Chrome / Microsoft Edge / Brave (macOS, Windows, Linux)
1. Open the hosted Centra application in **Google Chrome**, **Microsoft Edge**, or **Brave**.
2. Click the **Install** button:
   - Click the **Install icon** in the browser URL address bar (top right, just like YouTube).
   - Or click **Install App** in Centra's header or **Settings > Install Centra App**.
   - Or click the browser menu (<span className="font-bold">⋮</span>) &gt; **Install Centra**.
3. Click **Install** in the confirmation dialog.
4. Centra will launch in its own dedicated, borderless desktop window with native OS dock / taskbar pinning and full offline capabilities.

### Option 2: Safari on macOS (macOS Sonoma+)
1. Open the hosted Centra application in **Safari**.
2. In the macOS menu bar at the top, select:
   **File → Add to Dock...**
3. Click **Add**.
4. Centra will immediately appear in your Mac Dock and launch in its own standalone window with zero browser UI distractions.

### Option 3: Mobile Web (Safari iOS & Chrome Android)
- **Safari on iOS**: Tap the **Share** button (box with upward arrow) in Safari &gt; **Add to Home Screen** &gt; **Add**.
- **Chrome on Android**: Tap menu (<span className="font-bold">⋮</span>) &gt; **Install app** or **Add to Home screen**.

---

## 🚀 Maintainer Guide: How to Publish a New Web Release

Publishing a Web release updates the version track and compiles the production web bundle without generating any `.zip` archives:

```bash
npm run release:web [version]
```
