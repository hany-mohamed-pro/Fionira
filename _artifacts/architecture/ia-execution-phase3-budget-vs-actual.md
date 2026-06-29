# IA Consolidation — Phase 3 (FINAL): Budget vs Actual

**Date:** 2026-06-28
**Precision:** MAX (new financial capability)
**Scope:** the final phase of the IA plan — the Budget vs Actual module, built exactly per the confirmed design (commit e0fde690). After this, only the future real Owners' Equity statement remains (separately gated).

---

## Pre-flight — deferred-items registry re-confirmed intact (final)
D11 / D12 / D13 (engine-technical-debt.md), Cash Flow Investing/Financing (cash-flow-statement-build.md), 20-row preamble cap, UserManagement backend, Balance Sheet structural fix, smart branch suggestion, 4 remaining activity profiles, bilingual ~29 rules (SESSION-HANDOFF.md) — **all present, none drifted.** Survives intact into the next session (see the final handoff for the complete list incl. the new future-Equity item).

---

## What was built (exactly per confirmed design)

### TASK 1 — Budget definition: template + storage
- **Storage:** `BudgetEntry { branchId, period, revenue, cogs, opex }` added to **`AppSettings.budgets`** (settings-service) — the **config store, NOT the financial registry**, so budgets can never be confused with actuals. Per-tenant, per-branch, per-period. Reuses the proven `getSettings`/`saveSettings` path (incl. the dev-auth save fix from `5482b2ae`). Net budget is **derived** (revenue − cogs − opex), never stored → can't drift.
- **Excel template:** generated client-side from the tenant's real branches + current period, columns `الفرع | السنة | الإيرادات | تكلفة المبيعات | المصاريف التشغيلية`. Section-level (the MVP), so there is no category-name ambiguity; the only mapping needed is branch-name → branchId.
- **Parse:** light client-side parse (xlsx), maps branch names → ids, validates numbers, **flags unrecognized branch names** (the one governance point), merges by `(branchId, period)`. No classification engine involved.

### TASK 2 — In-app table editor
Editable grid (rows = branches incl. الفرع الرئيسي, columns = revenue/cogs/opex) for the current period; "حفظ الموازنة" persists via `saveSettings`.

### TASK 3 — Actual + Variance (computePnLCore is the SOLE source)
- **Actual** comes ONLY from the `incomeStatement` object passed in — which App computes as `computePnLCore(scopedExpenses, scopedRevenues, scopedPayroll)`, i.e. the **exact same object the Income Statement page receives.** Therefore Actual == Income Statement **by construction**, and it is automatically branch- and period-scoped. **No parallel calculation anywhere.**
- **Variance:** amount + %, with **sign-aware favorability** — for revenue/net, actual ≥ budget = favorable; for costs (COGS/OPEX), actual ≤ budget = favorable. Over-spend reads red even though the number is higher.
- Rolls up to **Budgeted vs Actual Net Profit**.

### TASK 4 — Comparison view
New `BudgetVsActual.tsx`, placed as a **Reports tab right after Income Statement** (`budget_vs_actual`) + a hub card. Table: البند | الموازنة | الفعلي | الفرق | النسبة | الحالة, branch- and period-aware (follows the global scope/date filter).

### TASK 5 — Owner Home one-line surfacing (additive)
App computes `budgetSummary` (net actual vs net budget for the current period+scope) and passes it to `GlobalDashboard`, which renders **one additive line** below the Phase-2 band: "أنت متقدّم على موازنة {year} بنسبة X%" / "أنت دون موازنة {year} بنسبة X%". Shown only when a budget exists; **nothing existing is displaced.**

---

## TASK 6 — LIVE verification (exhaustive)
| # | Check | Result |
|---|---|---|
| 1 | Excel template format + parse (branch mapping, numbers, unrecognized-branch flagging) | ✅ (deterministic — browser file-input automation infeasible) |
| 2 | In-app edit persists (saved `{default,2026,rev 80000,cogs 40000,opex 50000}`, confirmed via API) | ✅ |
| 3 | **Actual EXACTLY == Income Statement** (COGS 33,900, OPEX 63,000) | ✅ zero drift |
| 4 | Variance sign-aware: COGS under budget (−6,100) → **مُرضٍ** (green); OPEX over budget (+13,000) → **يحتاج انتباه** (red) | ✅ |
| 5 | Branch filtering: كل الفروع → Actual 33,900; فرع جدة (no records) → Actual 0; restored | ✅ |
| 6 | Owner Home additive line shows real data ("أنت دون موازنة 2026 بنسبة 869%") | ✅ |
| 7 | Regression: Phase 2 waterfall intact on Income Statement; Owner Home band + all KPIs/chart/cards intact; owners/visual still gone; Phase 1 bank code untouched | ✅ |
| 8 | Console clean throughout | ✅ |

`tsc --noEmit`: **0 src errors** · `vite build`: **passes** (1m 09s). Test artifacts (budget rows, test branch) live only in the in-memory dev store and clear on restart; `data/` untouched (0 bank records, 1138 total); temp scripts removed.

---

## Honest notes / deliberate MVP scoping (not silent re-litigation)
- **Period granularity = annual (YYYY).** The confirmed design named "monthly base, aggregate up"; for the section-level MVP I implemented **annual** budgets (the unit owners plan in, and it matches how the P&L is typically reviewed). **Monthly** and **per-category** remain the documented next layers. Core settled decisions (Excel+table entry, section-level MVP, computePnLCore as sole Actual, branch-aware) are all honored exactly.
- Actual is whatever the global date filter yields; the budget period follows it (defaulting to the current year). The comparison is only as period-aligned as the user's selected filter — surfaced plainly on the page.

## Files
- `src/lib/settings-service.ts` — `BudgetEntry` + `budgets` field
- `src/modules/BudgetVsActual.tsx` (new) — comparison + editor + template/upload
- `src/App.tsx` — route, REPORT_PAGE, page-title, `budgetSummary`, GlobalDashboard prop
- `src/components/NewAppShell.tsx` + `src/modules/ReportsDashboard.tsx` — nav entry + hub card (Target icon)
- `src/modules/GlobalDashboard.tsx` — additive budget one-line

## Status
✅ **Phase 3 EXECUTED — the IA consolidation goal is fully achieved.** The ONLY remaining unimplemented roadmap item is the **future real Owners' Equity statement** (gated on owner-contribution/drawing data capture + the chart-of-accounts-with-types foundation), per Phase 2's honest scoping.
