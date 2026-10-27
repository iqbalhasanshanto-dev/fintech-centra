# Centra Input Validation Rules & Inventory

This document defines the complete inventory of all user text, numeric, and file input fields in Centra, along with their validation rules, length caps, and security guarantees.

## Security Model: Validation vs. Output Escaping

1. **No Silent Deletion of Normal Characters**:
   Previous iterations used aggressive regex replacements in `sanitizeText` that stripped valid user characters like `<`, `>`, `&`, `'`, `"`, `/`, `*`, or substrings like `javascript:` and `metadata:`. That approach silently destroyed user data (e.g. "Balance < $100 and > $50" or "metadata: paid").
2. **Control Character Stripping**:
   Input strings are stripped ONLY of dangerous non-printable ASCII control characters (`U+0000` to `U+0008`, `U+000B`, `U+000C`, `U+000E` to `U+001F`, `U+007F`), invisible directional override characters (`U+202A` to `U+202E`, `U+2066` to `U+2069`), and lone surrogates.
3. **Preserving International Scripts**:
   Zero-Width Joiner (`U+200D`) and Zero-Width Non-Joiner (`U+200C`) are strictly preserved because complex scripts like Bengali (Bangla), Devanagari, and Arabic rely on them for correct conjunct ligature rendering. Unicode normalization is standardized on NFC (`normalize('NFC')`).
4. **React Contextual Output Escaping**:
   Protection against Cross-Site Scripting (XSS) is provided by React's standard JSX text rendering, which escapes HTML entities (`&lt;`, `&gt;`, `&quot;`, `&#x27;`, etc.) upon DOM insertion. Notes and descriptions containing markup like `<script>alert(1)</script>` or `<img src=x onerror=alert(1)>` are rendered as harmless literal text nodes without execution.
5. **Client-Side Validation**:
   Validation checks run on `onChange` and on `onSubmit` (never on `keydown`, preserving IME and composition keyboards). Invalid inputs display inline feedback and disable form submission.

---

## Input Fields Inventory & Rules Matrix

| Field | Location / Screens | Validator | Max Length | Allowed Character Class / Rules | UI Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Profile Full Name** | `ProfileInfoScreen.tsx`, `SettingsScreen.tsx` | `validateName` | 80 | Unicode letters (`\p{L}`), marks (`\p{M}`), spaces, `-`, `'`, `’`, `.`. Collapses repeated spaces. No digits, symbols, emoji. Accepts Bangla names (e.g. মোঃ ইকবাল হাসান). | Inline error, submit disabled |
| **Account Name** | `FirstAccountScreen.tsx`, `AddAccountModal.tsx` | `validateLabel` | 60 | Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. No `< > { } * = ; \ \`` and emoji. | Inline error, submit disabled |
| **Bank Name** | `AddAccountModal.tsx` | `validateLabel` | 60 | Optional. Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. | Inline error, submit disabled |
| **Category Name** | Predefined pills in `SpendingCategoriesScreen.tsx`; ready for custom categories | `validateLabel` | 60 | Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. | Inline error, submit disabled |
| **Goal Name** | `AddActionModal.tsx` (Goal tab) | `validateLabel` | 60 | Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. | Inline error, submit disabled |
| **Budget Name** | Linked to `category_name` in DB; ready for custom budgets | `validateLabel` | 60 | Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. | Inline error, submit disabled |
| **Transaction Merchant** | `AddActionModal.tsx`, `TransactionDetailModal.tsx` | `validateLabel` | 60 | Letters, marks, digits, spaces, and `. , - _ & ' / ( ) # +`. Falls back to Category Name if omitted. | Inline error, submit disabled |
| **Transaction Note / Transfer Note** | `AddActionModal.tsx`, `TransactionDetailModal.tsx` | `validateNote` | 500 | Free-text. Retains all printable characters, punctuation, and symbols. Strips control characters and directional overrides. Render-escaped by React. | Inline char counter / error, submit disabled |
| **Receipt File & Name** | `AddActionModal.tsx` | `validateImageFile`, `processImage`, `validateLabel` | 5 MB raw / 1600 px long edge | JPEG, PNG, WebP only. Magic byte validation. Strips EXIF/GPS metadata via canvas decode/re-encode. | File picker reject toast / inline feedback |
| **Profile Avatar Upload** | `ProfileInfoScreen.tsx`, `SettingsScreen.tsx` | `validateImageFile`, `processImage` | 5 MB raw / 512 px / ~100 KB base64 | JPEG, PNG, WebP only. Magic byte inspection. Downscaled to 512 px max, re-encoded (strips EXIF/GPS), capped at ~100 KB for DB column storage. | File picker error message |
| **Contact Email** | `IntroScreen.tsx`, `SettingsScreen.tsx` | `validateEmail` | 254 | Trimmed, lowercase, 1 `@`, valid standards-based email format. | Inline error, submit disabled |
| **Phone Number** | Ready for contact/2FA fields | `validatePhone` | 15 digits (total 25 chars) | Digits, spaces, hyphens, parentheses, optional leading `+`. 7 to 15 actual digits. | Inline error, submit disabled |
| **Address** | `ProfileInfoScreen.tsx` | `validateAddress` | 200 | Optional. Letters, marks, digits, spaces, and `, . - / # '`. No `< > { } * = ; \ \``. | Inline error, submit disabled |
| **Financial Amounts** | `FirstAccountScreen.tsx`, `AddAccountModal.tsx`, `AddActionModal.tsx`, `TransactionDetailModal.tsx`, `PlanScreen.tsx` | `validateAmount` | Up to 999,999,999,999.99 | Positive finite numbers, maximum 2 decimal places (or currency fraction digits). Rejects negative or NaN. | Currency input formatting & inline error |
| **Date of Birth / Dates** | `ProfileInfoScreen.tsx`, `AddActionModal.tsx`, `TransactionDetailModal.tsx` | Date picker / ISO validator | 10 | Valid date strings (`YYYY-MM-DD`). | Native / custom date picker |
| **PIN Lock Code** | `SettingsScreen.tsx`, `PinLockScreen.tsx` | PIN validator | 4-8 digits | Digits only (`0-9`). | Direct input mask |
| **Data Deletion Confirmation** | `SettingsScreen.tsx` | Exact match | 6 | Must strictly equal `DELETE`. | Submit button disabled until exact match |

---

## Avatar Storage Finding & Size Mitigation

- **Storage Location**: When Supabase Storage is configured and online, profile avatars are uploaded to the `avatars` bucket and stored as public URLs. However, in offline mode, guest mode, or before cloud sync is finalized, the avatar is stored as a base64 `data:image/...` URL inside the `profiles.avatar_url` database column and synchronized locally via `localStorage` (`centra_user_profile`).
- **Risk Identified**: If users upload uncompressed 5 MB images, base64 expansion generates ~6.7 MB strings, bloating PostgreSQL table rows and risking `localStorage` quota errors (`QUOTA_EXCEEDED_ERR`).
- **Mitigation Implemented**:
  1. `validateImageFile` verifies JPEG, PNG, or WebP magic bytes and enforces a 5 MB raw ceiling.
  2. `processImage` decodes the image into an HTML Canvas, downscales to a maximum of 512px on the longest side, and re-encodes as JPEG. This strips all camera, EXIF, and GPS geolocation metadata.
  3. Capped at **~100 KB** (`MAX_AVATAR_BYTES = 100 * 1024`): iterative quality reduction and scaling guarantees that any base64 string stored in `profiles.avatar_url` remains well under ~130 KB, preventing database row bloat and quota exhaustion.

---

## Database Constraints (Migration 20261027000000_input_constraints.sql)

To guarantee defense-in-depth, length `CHECK` constraints are prepared in migration `supabase/migrations/20261027000000_input_constraints.sql`:
- `public.profiles.name`: `CHECK (length(name) <= 80) NOT VALID`
- `public.accounts.name`: `CHECK (length(name) <= 60) NOT VALID`
- `public.categories.name`: `CHECK (length(name) <= 60) NOT VALID`
- `public.goals.name`: `CHECK (length(name) <= 60) NOT VALID`
- `public.budgets.category_name`: `CHECK (length(category_name) <= 60) NOT VALID`
- `public.transactions.merchant`: `CHECK (merchant IS NULL OR length(merchant) <= 60) NOT VALID`
- `public.transactions.note`: `CHECK (note IS NULL OR length(note) <= 500) NOT VALID`

All constraints are additive, idempotent (`IF NOT EXISTS` via `pg_constraint`), and added `NOT VALID` so existing rows do not block migration. Instructions are documented for operator validation via `VALIDATE CONSTRAINT` post-deployment. Per project rules, the migration file is created but **NOT** applied.

