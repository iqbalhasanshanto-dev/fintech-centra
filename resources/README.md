# Centra Native Packaging Assets

This directory contains master high-resolution assets staged for mobile and desktop native app packaging:

- `icon.png` (1024×1024): Master application icon for `@capacitor/assets` (Android / iOS app icons) and Tauri icon generation (`cargo tauri icon`).
- `splash.png` (2732×2732): Master splash screen asset centered on `#0A0E1A` background for native boot launch screens.

> **Note**: These assets are not imported directly by the React web code. They are staged for automated icon and splash generation during the Capacitor / Tauri native build phase.
