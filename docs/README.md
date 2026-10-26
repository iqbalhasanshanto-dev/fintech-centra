# Centra Documentation Index

This directory contains technical documentation, audit reports, testing guidelines, and security disclosures for the Centra personal finance project.

---

## 📚 Document Index

| Document | Purpose & Description |
|:---|:---|
| **[PROGRESS.md](file:///Users/shanto/Developer/Fintech-Centra/docs/PROGRESS.md)** | **Phase & Task Progress Log**<br>Comprehensive, chronological log of all phases (Phase 6, Phase 7, Phase 8), task completions, code modifications, and quality gate verifications. |
| **[AUDIT_REPORT.md](file:///Users/shanto/Developer/Fintech-Centra/docs/AUDIT_REPORT.md)** | **Repository Audit & Architecture Review**<br>In-depth inspection of codebase health, 12 prioritized findings (OAuth lifecycle, back-button handlers, build alignments, code splitting), and resolution plans. |
| **[PHASE7_TESTING.md](file:///Users/shanto/Developer/Fintech-Centra/docs/PHASE7_TESTING.md)** | **Cross-Platform Testing Matrix & Setup Guide**<br>Full testing guide for Android (Studio, ADB deep links, Chrome remote debugging), iOS (Xcode SPM, simctl), and Desktop (Tauri 2), including a 16-scenario manual QA matrix. |
| **[DATA_PROTECTION.md](file:///Users/shanto/Developer/Fintech-Centra/docs/DATA_PROTECTION.md)** | **Storage Topology & Security Disclosures**<br>Detailed disclosure of client-side caching (plain `localStorage`), WebCrypto PBKDF2 device PIN locking, session-scoped guest isolation, and honest data protection assurances. |

---

## 🔒 Protected Features Note

All developers and automated tools must respect the protected **Transfer** feature (`src/components/modals/AddActionModal.tsx` Transfer tab, `src/context/FinanceContext.tsx` `transferFunds`, `src/utils/financeOperations.ts` `applyTransferFunds`, and associated database fields). Transfer is a planned future capability for family financial tracking and must never be removed or disabled.
