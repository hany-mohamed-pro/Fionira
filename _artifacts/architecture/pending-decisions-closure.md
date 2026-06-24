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

_(see Part B section below — appended after live verification)_
