# Pending Decisions Closure — Classification Corrections + CommandPalette

**Date:** 2026-06-23
**Standing principle applied:** institutional-grade accuracy over "good enough"
— a dedicated transport account was created (not a shortcut reuse), and the
CommandPalette is fully reactivated (keyboard + visible trigger), not minimally
patched. Rigor of *method* unchanged: one verified step at a time, live-tested.

---

## PART A — Three classification corrections (user-confirmed)

### New account
`مصروفات عمومية وإدارية - نقل ومواصلات` — created per user decision (2026-06-23)
as the correct home for transport/logistics of goods & equipment that is neither
customer delivery (selling) nor inbound material freight (COGS). Added to
`CATEGORY_ORDER` (G&A block, `financial-utils.ts`). Verified it is **NOT** in the
Income Statement `cogsCategories` list → auto-classified under **OPEX** (no
Income-Statement wiring change needed — the D2/D7 wiring trap avoided).

### Method
Snapshot baseline of `getExpenseCategory` over **all 1,137 real expense records**,
then apply each correction and diff — confirming only the intended records moved.

### Correction #2 — "أجرة دينا نقل ثلاجة" (fridge transport): maintenance → transport
- Rule 11 (`Transport/Freight Rentals`): the equipment-transport branches changed
  from `صيانة وإصلاح` to `نقل ومواصلات` (a hired truck moving a fridge is transport,
  not maintenance).
- **Diff: exactly 2 records changed** (`اجره دينا نقل ثلاجة`: صيانة → نقل ومواصلات).
  Zero unrelated regression.

### Correction #1 — "مرتبة للموظف/توصيل" (employee mattress delivery): travel → transport
- Removed `مرتبة للموظف | توصيل موظف | مرتبة` from the Travel rule (a mattress is
  not travel).
- Added a focused **Transport & Logistics** Stage-2 rule using the `WB/WE`
  word-boundaries (which treat `/` as a separator, so `مرتبة للموظف/توصيل` matches)
  → `نقل ومواصلات`, scoped to goods/equipment transport tokens
  (نقل عفش/أثاث/ثلاجة/معدات/مكيف, مرتبة للموظف, اجرة دينا, دينا نقل, رسوم نقل …) to
  avoid bleeding into customer-delivery (selling) or generic `نقل`.
- **Cumulative diff: exactly 4 records changed** (2 mattress travel→transport + 2
  fridge maintenance→transport). Zero unrelated regression on the other 1,133.

### Correction #3 — refrigerated delivery: confirmed already correct (no change)
`نقل طلبية فلاورد` already classifies as `مصروفات بيعية وتسويقية - نقل وتوصيل`
(a selling expense = the user's intended "مصروف بيع"). **No edit needed** — and it
does **not** appear in the diff, confirming it was untouched.

### Cross-activity-rule non-interference
Only `categorization-engine.ts` and `financial-utils.ts` were modified.
`financial-intelligence/rules/activity/*` and `erp-engine.ts` are **byte-unchanged**
(`git status` clean for those paths) → activity insight outputs are structurally
unaffected.

### Live verification (actual UI upload path, restarted server)
Uploaded a synthetic expense file through the real Expenses upload UI; the live
ingestion engine classified (server log `PHASE 5` trace):
| Item | Live category |
|---|---|
| اجره دينا نقل ثلاجة | **مصروفات عمومية وإدارية - نقل ومواصلات** ✓ |
| مرتبة للموظف/توصيل | **مصروفات عمومية وإدارية - نقل ومواصلات** ✓ |
| نقل طلبية فلاورد (control #3) | مصروفات بيعية وتسويقية - نقل وتوصيل ✓ (unchanged) |
| حبوب قهوة (control) | تكلفة المبيعات - مواد خام ومكونات ✓ (unchanged) |

`tsc --noEmit` clean. Staged test file cancelled (no data pollution; existing
active reports untouched — engine runs at ingestion, not on stored records).

---

## PART B — CommandPalette reactivation

### B1 — Confirmed dead-code state
`CommandPalette.tsx` defines **12 commands** across 6 groups (Purchases, Sales,
Payroll, Banks, Reports, Admin, Structure). `isCommandPaletteOpen` existed in
`App.tsx` (default `false`) and was **never set true** anywhere — and the palette
was **rendered twice** (a duplicate-render bug). The component's own Ctrl+K only
*closed* (it's unmounted when closed, so it could never open itself).

### B2 — Real, professional open-triggers added
- **Ctrl/Cmd+K** global toggle owned by `App.tsx` (single source of truth); the
  palette now only handles **Escape** internally (removed its Ctrl+K branch to
  avoid a double-toggle race).
- **Visible, discoverable trigger**: the existing header search bar in
  `NewAppShell` is now a real button ("بحث وتنقّل سريع… [Ctrl K]") that opens the
  palette — discoverable for non-keyboard users, present on every page.
- Removed the **duplicate** CommandPalette render in `App.tsx` (kept the single
  top-level instance).

### B3/B4 — EVERY command tested live (not sampled)
Both triggers confirmed: **Ctrl+K opens ✓, header button opens ✓, Esc closes ✓,
click-outside (backdrop) closes ✓.**

| # | Command | Destination | Result |
|---|---|---|---|
| 1 | الاحصائيات والتحليل (المشتريات) | expenses/dashboard | ✅ لوحة المصروفات |
| 2 | استيراد ورصد البيانات | expenses/upload | ✅ سجل المصروفات |
| 3 | سجل الموردين المجمع | expenses/grouped_purchases | ✅ الموردون |
| 4 | الاحصائيات والتحليل (المبيعات) | revenues/dashboard | ✅ لوحة الإيرادات |
| 5 | استيراد البيانات | revenues/upload | ✅ سجل الإيرادات |
| 6 | مولد الفاتورة الذكي | revenues/smart_invoice | ✅ الفاتورة الذكية |
| 7 | التحليل المالي للرواتب | payroll/dashboard | ✅ لوحة الرواتب |
| 8 | التدفقات النقدية (البنوك) | banks/dashboard | ✅ البنوك |
| 9 | قائمة الدخل (P&L) | reports/income_statement | ✅ قائمة الدخل |
| 10 | قائمة المركز المالي | reports/balance_sheet | ✅ الميزانية العمومية |
| 11 | إدارة المستخدمين | settings/user_management | ✅ إدارة المستخدمين |
| 12 | مراجعة الجاهزية المحاسبية | dashboard/migration_review | ✅ **(fixed — see below)** |

**One broken command found and fixed (trivial routing, same standard as `mode:'users'`):**
Command #12 used `mode:'dashboard'`, but `appMode==='dashboard'` unconditionally
rendered the GlobalDashboard *over* the migration-review content and labeled the
page "لوحة التحكم". Two-line fix in `App.tsx`: (a) gate the GlobalDashboard render
with `activeTab !== 'migration_review'`, and (b) give `migration_review` its own
page type + title ("مراجعة الجاهزية المحاسبية"). Re-verified live: it now renders
the Accounting Readiness Review cleanly with the correct header, no overlap.

### Console
Only **pre-existing** dev errors: `settings` Firestore `permission-denied` (dev
environment, present since boot, unrelated to the palette). No palette errors.

> **Honest note (not introduced by this work):** during *rapid automated* loop
> navigation, the Firebase Firestore SDK threw its known `INTERNAL ASSERTION
> FAILED (ca9/b815)` from `<SmartInvoice>`'s `onSnapshot` listener (listener
> churn faster than the SDK handles). It does **not** reproduce at human click
> speed and is a Firestore-SDK/dev issue, not a CommandPalette defect — flagged
> as separate pre-existing debt.

### Files changed (Part B)
`src/components/CommandPalette.tsx`, `src/components/NewAppShell.tsx`, `src/App.tsx`.
