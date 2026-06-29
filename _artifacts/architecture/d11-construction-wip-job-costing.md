# D11 — Construction Work-in-Progress (Job Costing)

**Date:** 2026-06-30
**Precision:** MAX — escalated to top priority per the user's strategic decision.
**Outcome:** ✅ **RESOLVED.** Real per-project WIP cost accumulation with a completed-contract COGS transition — deferral verified both deterministically (exact numbers, real engine) and live in the UI. Zero regression on the other activities.

---

## Confirmed design (built exactly as approved)
- **Defer from P&L (real WIP)** · **completed-contract method** · **full scope** — all three confirmed by the user before implementation.

## What was built
1. **Project model** (`settings-service.ts`): `Project { id, name, startDate, expectedCompletion, status: 'active'|'completed', branchId }` + `makeProjectId`, stored in `AppSettings.projects` (config store, NOT the financial registry). Mirrors the proven branches/budgets pattern. Branch-aware.
2. **WIP partition** (`App.tsx`, mirrors `scopeByBranch`): a cost is attributed to a project by **project-name match in its text** (the exact signal Phase 5's `ACTIVITY_PROJECT_COST_LINK` insight surfaces — transparent and user-controlled). Costs of an **active** project are excluded from the expenses fed to `computePnLCore` (`pnlExpenses`), held as WIP; on **completion** they flow back to COGS. `computePnLCore` stays pure (no settings coupling). **`hasActiveProjects` false → `pnlExpenses === scopedExpenses` → zero change for restaurant/all others.**
3. **«تكلفة المشاريع» view** (`ProjectCosting.tsx`): per-project accumulated cost (WIP if active / COGS if completed), advance/recognized revenue, profit, status; WIP total; honest explanatory note. Branch-aware. Routed under Accounting (nav + AccountingDashboard card + page-title + REPORT_PAGE for the branch/date filter).
4. **Project management UI** (`Settings.tsx` → «المشاريع»): create projects + the **«تحديد كمكتمل» / «إعادة فتح»** toggle — the WIP→COGS trigger. Admin-gated, reuses the existing save path.

## TASK 3 — LIVE verification (all ✅)
**Deterministic (authoritative — real `computePnLCore` + real `getExpenseCategory` on the synthetic contracting set):**
| Scenario | COGS | P&L expense records |
|---|---|---|
| No projects (baseline) | 63,000 | 11 |
| Both projects **active** (WIP deferred) | **0** | 7 |
| فيلا **completed** | **45,000** | 9 |
| All completed (= baseline restored) | 63,000 | 11 |

Per-project costing: فيلا cost 45,000; برج cost 30,000 / revenue 100,000 / profit 70,000. ✅ defer → recognize → restore all correct.

**Live UI (dev server, real restaurant data + an uploaded contracting cost file for «مشروع فيلا الياسمين» = 60,000 net):**
1. Expenses dashboard shows **156,900** (96,900 restaurant + 60,000 project) — all records present.
2. Project **active** → Income Statement **COGS = 33,900** (فيلا's 40,000 COGS portion **deferred as WIP**; **73,900 NOT present**). ✅ genuine deferral.
3. **«تكلفة المشاريع»** view: فيلا — 2 cost records, status **WIP (تحت التنفيذ)**, **60,000 ر.س**; WIP total 60,000. ✅
4. Mark فيلا **completed** → Income Statement **COGS = 73,900** (40,000 recognized). ✅ WIP→COGS transition.
5. **Branch-aware** (projects carry branchId; view + partition respect the global branch scope — reuses the Phase-1/2-fixed pattern).
6. **Zero regression:** restaurant COGS stayed 33,900 throughout (the project costs never leaked into it); no project → unchanged path.
7. **Console clean.**

`tsc --noEmit`: **0 src errors** · `vite build`: passes. Test data (uploaded file + project) and temp scripts removed; `data/erp_registry.json` restored (0 project records, 1138 total).

## Constraints honored
- `categorization-engine.ts` **untouched** (the ~44 hardened rules are intact; cost categorization is unchanged — WIP only *defers* already-categorized costs).
- Reuses `branchId`, `computePnLCore` (sole P&L source), and the suggest-don't-force project-link signal.
- Zero regression on the other 4 activities (the partition is inert without active projects).

## Honest scope note
A **fully GL-correct WIP** (a real balance-sheet asset account with journal entries, and **deferred/unearned-revenue (D12)** recognition) is gated on the chart-of-accounts-with-types foundation (registry #2/#6). What is delivered today is accounting-correct for the **matching principle**: a project-cost subledger that genuinely **defers active-project costs from the P&L** and recognizes them as COGS on completion (completed-contract), with WIP labelled honestly as «أعمال تحت التنفيذ». The formal balance-sheet WIP asset line and revenue-side deferral (D12) land with that foundation — same honesty discipline as the estimated Balance Sheet and Cash Flow's Investing/Financing.

## Status
✅ **D11 RESOLVED** (cost-side WIP + completed-contract transition). Remaining linked future work: the formal balance-sheet WIP asset + D12 revenue deferral, both on the chart-of-accounts foundation.
