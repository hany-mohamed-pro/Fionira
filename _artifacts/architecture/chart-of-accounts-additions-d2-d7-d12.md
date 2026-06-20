# Chart of Accounts — Additions for D2, D7, D12

**Outcome:** **D2 and D7 added and wired end-to-end** (engine classifies into them; Income Statement
displays them under COGS). **D12 deferred** — correctly identified as a *liability*, but the system has
no liability-account infrastructure (estimated balance sheet), so it cannot be homed correctly now.

---

## TASK 1 — the true chart-of-accounts source (evidence)

There is **no single authoritative chart of accounts**. Three disconnected sources exist:

1. **`CATEGORY_ORDER`** (`src/lib/financial-utils.ts:469`) — an **expense-category ordering list**
   (COGS / Selling / G&A / Fixed Assets / Finance Costs / Other Expenses / Uncategorized). The
   categorization engine emits these strings; reports group/sort by them.
2. **`getRevenueCategory`** (`categorization-engine.ts`) — a *separate* set of revenue category strings,
   not in `CATEGORY_ORDER`.
3. **Journal-entry account names** (free-form strings in `erp-engine.ts`) — consumed by Trial Balance.

**(B)** Income Statement builds a hierarchy from each record's `Category` field (COGS detected by the
`تكلفة/مشتريات/بضاعة` prefix, everything else = OpEx) — i.e. driven by the engine's category strings,
not a separate structure. **Balance Sheet is fully ESTIMATED** from three aggregates
(`revenues/expenses/payroll` × fixed ratios — `cash = netIncome*0.4`, `liabilities = expenses*0.12 + …`)
with an explicit on-screen "estimative" disclaimer; it reads **no accounts at all**. Trial Balance sums
debit/credit by journal-entry account string.

**(C)** **No account-TYPE model exists** (asset/liability/equity/revenue/expense). Sections are inferred
from name prefixes; there are **no liability accounts as data**.

## TASK 2 — proposal (confirmed by user before implementation)

| Item | Decision | Type | Placement |
|---|---|---|---|
| **D2** production wastage | ADD | Expense (COGS) | `تكلفة المبيعات - هدر وتلف إنتاج` — under COGS |
| **D7** inventory shrinkage | ADD | Expense (COGS) | `تكلفة المبيعات - هالك وعجز مخزون` — under COGS |
| **D12** customer advance | **DEFER** | **Liability** (unearned obligation, *not* revenue) | no liability infrastructure exists |

**D12 verification (the flagged point):** confirmed it is a **liability**, not a revenue category.
Adding it as a revenue category would be accounting-wrong (recognising revenue before it is earned).
Adding it as a real liability requires building an account-driven balance sheet (the current one is
estimated) — a major separate feature needing accountant input. Deferred.

## TASK 3 — implementation (D2/D7 only)

- `financial-utils.ts`: two new COGS entries added to `CATEGORY_ORDER` (existing entries untouched).
- `categorization-engine.ts`: two **new** Stage-3 routing rules (no existing rule modified):
  - Rule 20: production-wastage signals (`هدر…إنتاج`, `هدر مواد خام`, `تلف…إنتاج`, …) → `هدر وتلف إنتاج`.
  - Rule 21: inventory-shrinkage signals (`هالك مخزون`, `عجز جرد`, `بضاعة تالفة`, `جرد سنوي`, …) → `هالك وعجز مخزون`.

## TASK 4 — verification

| Check | Result |
|---|---|
| 730 real records changed vs baseline | **0** |
| 5 synthetic fixtures changed | **3** — all intended: INV-2009 (production wastage → D2), TR-4006 + TR-4007 (shrinkage → D7) |
| D2 / D7 target categories | ✅ route correctly |
| Cross-activity-rule non-interference | ✅ identical counts (P2 tools2+transport2, P3 link6, P4 packaging3+shrinkage2, P5 cost6+labor2) |
| Statement rendering | Income Statement groups the two new accounts under COGS via the `تكلفة` prefix (no code change needed; appear when records exist, absent when zero — no error). Balance Sheet/Trial Balance unaffected (they don't read these expense categories). |
| `npx tsc --noEmit` | exit 0 |

## TASK 5 — honest end-to-end status

- **D2 — RESOLVED, end-to-end.** Engine classifies production-wastage records into the dedicated COGS
  account; Income Statement displays it under COGS.
- **D7 — RESOLVED, end-to-end.** Same for inventory shrinkage.
- **One honest caveat (scoped, not silently skipped):** the activity-layer *insights* (restaurant/
  manufacturing wastage, retail shrinkage) still emit **advisory text** only — there is no
  "accept suggestion → auto-post to this account" governance/posting mechanism (that feature does not
  exist). It is not needed for correctness here: the **engine already classifies** wastage/shrinkage
  records straight into the new accounts, so they land correctly without any manual acceptance step.
- **D12 — DEFERRED**, with the architectural reason above (liability; no liability-account
  infrastructure). The activity-layer advance-payment insight already flags it for the user.

## Net debt movement

Resolved: **D2, D7**. Still deferred: **D12** (needs account-driven balance sheet + accountant decision).
