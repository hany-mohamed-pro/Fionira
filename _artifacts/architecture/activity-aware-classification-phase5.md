# Activity-Aware Classification — Phase 5 (Contracting / Construction)

**Status:** Implemented & verified through the real ingestion path (expenses **and** revenues) on
**SYNTHETIC** pre-launch data.
**Scope:** ONE activity (`contracting_construction`); project-cost linking (the norm here) + direct
labor + customer advance → deferred revenue.
**Hard constraint honored:** ZERO changes to `categorization-engine.ts` and its ~44 hardened rules.

> ⚠️ **All Phase-5 data is SYNTHETIC** (`_artifacts/architecture/phase5-synthetic-contracting-data.json`),
> two concurrent projects (فيلا الياسمين, برج التجارة). Approved pre-launch test-fixture practice.

---

## STEP 1 — architectural note (the one accepted scope extension)

Four of the five edge cases are expense-side; **the customer advance payment is revenue-side**. The
activity infrastructure was expenses-only through Phase 4, so this phase **extends the wiring into the
revenues domain** (`analyzeRevenues` now receives `activityProfile` from the orchestrator and runs a
revenue activity-rules loop). This is a clean mirror of the expenses wiring — no engine change.

Two rules were added: `contractingExpenseRule` (expenses) and `contractingRevenueRule` (revenues).

## Verification — real ingestion path (`createValidationSession`)

### A) Expenses (11/11 ingested) — project linking is the norm

| Record | Activity insight |
|---|---|
| توريد أسمنت وحديد لمشروع فيلا الياسمين | ✅ `ACTIVITY_PROJECT_COST_LINK` |
| بلوك خرساني لموقع مشروع برج التجارة | ✅ `ACTIVITY_PROJECT_COST_LINK` |
| استئجار حفّار ثقيل لمشروع برج التجارة | ✅ `ACTIVITY_PROJECT_COST_LINK` |
| تأجير رافعة برجية لموقع فيلا الياسمين | ✅ `ACTIVITY_PROJECT_COST_LINK` |
| أجور عمالة يومية لمشروع فيلا الياسمين | ✅ `ACTIVITY_PROJECT_COST_LINK` + `ACTIVITY_DIRECT_PROJECT_LABOR` |
| يوميات عمال صب الخرسانة بالموقع | ✅ `ACTIVITY_PROJECT_COST_LINK` + `ACTIVITY_DIRECT_PROJECT_LABOR` |
| شراء خلاطة خرسانة جديدة (equipment purchase) | — (engine debt D10, see below) |
| 4 general (rent/salary/electricity/gosi) | — none fired |

### B) Revenues (4/4 ingested) — advance vs earned

| Record | Activity insight |
|---|---|
| دفعة مقدمة من العميل لمشروع برج التجارة | ✅ `ACTIVITY_ADVANCE_PAYMENT` (defer as unearned) |
| عربون توقيع العقد - مقدم أعمال | ✅ `ACTIVITY_ADVANCE_PAYMENT` |
| مستخلص أعمال المرحلة الأولى المنجزة | — (earned revenue, correctly silent) |
| مستخلص أعمال شهري عن نسبة الإنجاز | — (earned revenue, correctly silent) |

### C) Honest engine findings (documented, NOT fixed — engine frozen)

1. **Equipment purchase not capitalized (D10):** `شراء خلاطة خرسانة جديدة` → `مصروفات عمومية وإدارية -
   أخرى` instead of a fixed asset. `خلاطة خرسانة` (concrete mixer) isn't in the CAPEX keywords. The
   contracting rule correctly did NOT fire (no project ref), so this surfaced purely as the engine's gap.
2. **No construction vocabulary (D11):** every project cost (أسمنت، حديد، بلوك، يوميات عمال) lands in
   `G&A - other`. The engine cannot classify construction costs as direct project cost/WIP. The
   project-link insight still fired correctly on all of them — the insight-only layer adds value
   despite the weak base category.
3. **Deferred revenue account missing (D12):** advances are classified as ordinary `إيرادات المبيعات`;
   there is no unearned-revenue account. The advance-payment insight surfaces the correct treatment.
4. **Electricity → صيانة (D1, known).**

## Cross-phase non-interference (all 5 activities, expenses + revenues)

| Dataset (profile) | Insight types | Foreign leaks |
|---|---|---|
| Phase 2 (`manufacturing_food`) | tools ×2, transport ×2 | none |
| Phase 3 (`professional_services`) | project-link ×6 | none |
| Phase 4 (`trading_retail`) | sale-packaging ×3, shrinkage ×2 | none |
| Phase 5 expenses (`contracting_construction`) | project-cost ×6, direct-labor ×2 | none |
| Phase 5 revenues (`contracting_construction`) | advance-payment ×2 | none |

All six activity rules coexist with **zero cross-talk**, across both domains.

## Regression (success criteria)

| Check | Result |
|---|---|
| REAL 730 — non-activity signature identical: **unset** vs **contracting_construction** | ✅ identical |
| REAL 730 — activity insights when **unset** | 0 |
| Synthetic expenses — base identical: contracting vs unset | ✅ identical |
| Synthetic revenues — base identical: contracting vs unset | ✅ identical |
| Synthetic expenses/revenues — activity insights when **unset** | 0 / 0 |

`npx tsc --noEmit` → exit 0. Real ingestion path used (expenses + revenues). Zero hardened-rule changes.

## Honest scorecard (no single misleading "100%")

- **Project-cost linking** (the pivotal feature) fired on **all 6** project costs; **direct labor**
  added on the 2 labor lines; **advance payment** flagged on **both** advances; earned revenue and
  general overhead correctly **silent**.
- **Equipment purchase** edge case is **engine-broken** (D10, not capitalized) — reported, not fixed.
- The engine has **no construction vocabulary** (D11) — all project costs → "other"; the insight layer
  compensates by flagging them for project linking.
- **Zero regression**, **zero cross-phase interference** across all five activities and both domains.

## Status after Phase 5 — all five activities complete

Engine technical debt now **12 items** (D1–D12) in `engine-technical-debt.md`. See the combined
executive summary: `activity-aware-classification-summary.md`.
