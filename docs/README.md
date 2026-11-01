# Centra Documentation Index

This directory contains technical documentation, testing guidelines, architecture specifications, and security disclosures for the Centra personal finance project.

---

## 📚 Document Index

| Document | Purpose & Description |
|:---|:---|
| **[DATA_PROTECTION.md](DATA_PROTECTION.md)** | **Storage Topology & Security Disclosures**<br>Detailed disclosure of client-side caching (plain `localStorage`), WebCrypto PBKDF2 device PIN locking, session-scoped guest isolation, and honest data protection assurances. |
| **[TESTING.md](TESTING.md)** | **Cross-Platform Testing Matrix & Setup Guide**<br>Full testing guide for Android (Studio, ADB deep links, Chrome remote debugging), iOS (Xcode SPM, simctl), and Desktop (Tauri 2), including a 16-scenario manual QA matrix. |
| **[INPUT_RULES.md](INPUT_RULES.md)** | **Input Validation Rules & Field Inventory**<br>Complete inventory of all user text, numeric, and file input fields in Centra, along with validation rules, Unicode NFC normalization, length caps, and security guarantees. |
| **[SECURITY_AUDIT.md](SECURITY_AUDIT.md)** | **Full Security Audit & Hardening Report**<br>Comprehensive 13-point security audit: API keys, RLS authorization, XSS sanitization, rate limiting, CORS, security headers, passwordless/PIN PBKDF2 cryptography, and git secret scan. |

---

## 🔒 Protected Features Note

All developers and automated tools must respect the protected **Transfer** feature (`src/components/modals/AddActionModal.tsx` Transfer tab, `src/context/FinanceContext.tsx` `transferFunds`, `src/utils/financeOperations.ts` `applyTransferFunds`, and associated database fields). Transfer is a planned future capability for multi-account and family financial tracking and must never be removed, disabled, or refactored away.
