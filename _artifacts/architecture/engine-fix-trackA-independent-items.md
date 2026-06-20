# Engine Fix — Track A: independent debt items (D2, D7, D10, D11, D12)

**Outcome:** **D10 resolved**, **D11 partially resolved**, **D2 / D7 / D12 deferred with reason**.
Zero regression on the 730 real records; only the 3 intended synthetic records changed.

---

## STEP 2 — analysis (the debt log's grouping is NOT uniform)

The five items split by what they actually require:

- **D10** needs only **vocabulary → an account that already exists** (`أصول ثابتة - أجهزة ومعدات`).
  → engine-only fixable.
- **D11** needs vocabulary; the *ideal* target (a construction direct-cost / WIP account) **does not
  exist**, but an acceptable existing account does (`تكلفة المبيعات - مواد خام ومكونات`).
  → engine-only *partial* fix.
- **D2, D7, D12** each need a **brand-new account in the chart of accounts** (`financial-utils.ts`):
  production-wastage, inventory-shrinkage, deferred/unearned-revenue. That file is the protected
  master COA, **out of "engine-only" scope**, and the new accounts need an **accountant decision** on
  naming + IFRS treatment. → **cannot be resolved engine-only; deferred.**

This is a genuine correction to the assumption that all five are equivalent low-risk engine fixes.

## STEP 3 — implementation (one at a time, full regression after each)

| Item | Before | After | real-730 regression | Status |
|---|---|---|---|---|
| **D10** `شراء خلاطة خرسانة جديدة` | مصروفات عمومية وإدارية - أخرى | أصول ثابتة - أجهزة ومعدات | 0 | ✅ resolved |
| D10 rental guard `استئجار حفّار` | أخرى | أخرى (NOT capitalised) | 0 | ✅ rental correctly excluded |
| **D11** `أسمنت وحديد تسليح` / `بلوك خرساني` | مصروفات عمومية وإدارية - أخرى | تكلفة المبيعات - مواد خام ومكونات | 0 | ⚠️ partial (existing COGS account; WIP account deferred) |
| D2 `هدر مواد خام تالفة` | مواد خام ومكونات | (unchanged) | 0 | ⛔ deferred — needs new COA account |
| D7 `هالك مخزون` | مواد خام ومكونات | (unchanged) | 0 | ⛔ deferred — needs new COA account |
| D12 advance payment (revenue) | إيرادات المبيعات | (unchanged) | 0 | ⛔ deferred — needs new COA account |

**Engine changes (2 new Stage-3 rules, both `categorization-engine.ts` only):**
- Rule 18: construction/heavy-equipment **purchase** → fixed asset, with a **rental guard**
  (`استئجار/تأجير/ايجار/rent/hire/lease` → not capitalised), so leased equipment stays operating.
- Rule 19: construction **materials** (`أسمنت|حديد تسليح|بلوك خرساني|خرسانة|طابوق|…`) → existing COGS
  raw-materials account.

## STEP 4 — verification

- **730 real records:** 0 changes vs baseline (every step).
- **5 synthetic fixtures:** only **3** changed — all intended: CC-5001 + CC-5002 (materials → COGS),
  CC-5005 (mixer → asset). No collateral.
- **Cross-activity-rule non-interference:** insight type/counts identical (P2 tools2+transport2, P3
  link6, P4 packaging3+shrinkage2, P5 cost6+labor2). The base-category changes for the contracting
  fixture did not alter any activity insight (insights key off description text, not base category).
- `npx tsc --noEmit` → exit 0.

## STEP 5 — honest report

- **D10 — RESOLVED.** Equipment purchase now capitalises to the existing fixed-asset account; rentals
  are correctly excluded.
- **D11 — PARTIALLY RESOLVED.** Construction materials now route to the existing COGS raw-materials
  account (a real improvement over "G&A - other"). The *dedicated* construction direct-cost / WIP
  account remains deferred (it does not exist in the COA).
- **D2, D7, D12 — DEFERRED, with reason.** Each requires a **new chart-of-accounts entry** in the
  protected `financial-utils.ts` plus an accountant decision on naming/IFRS treatment — outside the
  engine-only scope of this track. The activity-insight layer already surfaces all three operationally
  (abnormal-wastage alert, inventory-shrinkage suggestion, advance-payment → deferred-revenue
  suggestion), so they are not silently lost.

## Net debt movement

Resolved: **D10**. Partially resolved: **D11**. Deferred (need COA + accountant): **D2, D7, D12**.
