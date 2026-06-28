# Budget vs Actual — Design Proposal (awaiting confirmation)

**Date:** 2026-06-28
**Precision:** MAX (new financial concept)
**Status:** ✅ DESIGN CONFIRMED (2026-06-28) — nothing implemented yet; implementation sequenced to run **alongside the IA/consolidation pass** (Part 2, TASK 6), per the confirmed decision below.
**Concept:** a user-defined **plan** (expected revenue/expenses for a future period) compared against **real actuals** once the period occurs — classic Budget-vs-Actual variance analysis. Distinct from the Balance Sheet (a position statement).

---

## A) How the user defines a budget

**Recommendation: Excel template upload (primary) + a simple in-app table editor (secondary).**

- **Excel upload** reuses Fionira's proven upload-first pattern (owners already provide every dataset this way). But budget data is the user's **own plan numbers** — no entity resolution, no classification ambiguity — so it uses a **light parser**, NOT the full categorization engine: read `Category | Period | Branch | BudgetedAmount`.
- **Template is generated from the REAL categories** (the keys `computePnLCore` actually produces: `revBreakdown` / `cogsBreakdown` / `opexBreakdown`), so every budget line maps 1:1 to an actual line. This is the crux — a budget whose category names don't match actuals produces a meaningless comparison.
- **In-app table editor** for quick edits / single-line tweaks without a round-trip to Excel.

*The one real risk (flagged honestly):* if a budgeted category name doesn't match a real category, the comparison breaks. So unrecognised names are **surfaced for the user to map** (consistent with the canonicalisation principle) — the only place "governance" is needed here.

---

## B) Granularity

- **Per period:** store at **monthly** base granularity; aggregate up to quarter/year by summation (avoids re-entry per view).
- **Per branch:** **branch-aware from day one** — every budget row carries `branchId` (default `الفرع الرئيسي`); reuse `scopeByBranch`. Budgets can be set per branch or at the "all" level.
- **Per category — two layers (see recommendation):**
  - **Section/roll-up level** (Total Revenue, Total COGS, Total OPEX, Net Profit) — what a non-specialist owner actually thinks in ("I expect 100k revenue, 40k food cost").
  - **Line-category level** (matching the real category keys) — for owners who want detail.

**Professional recommendation (a mild disagreement with "full per-category from day one"):** ship **section/roll-up level as the MVP**, with per-category as the next layer. The mission is the *non-specialist* owner, who is far likelier to set 4 numbers than 30 line items. Per-category is valuable but should not gate the first useful version.

---

## C) "Actual" sourcing — reuse computePnLCore (no parallel computation)

The Actual column is **never recomputed**. The view calls `computePnLCore(scopedExpenses, scopedRevenues, scopedPayroll)` for the selected period + branch and reads its totals/breakdowns. This **guarantees** the Actual figures equal the Income Statement exactly (same single source — the same guarantee that keeps the Branch Comparison and Income Statement in sync). Period filter reuses the existing date filter; branch filter reuses the existing `scopeByBranch` global lens.

---

## D) Comparison / variance display

- Per line: **Budget | Actual | Variance (amount) | Variance (%) | favorable/unfavorable**.
- **Sign-aware favorability (critical):** for **revenue**, Actual > Budget = favorable (green); for **expenses/COGS/OPEX**, Actual < Budget = favorable (green). A naive `actual − budget` colour would mislead — over-spending must read red even though the number is "higher."
- Grouped by section (Revenue / COGS / OPEX) with subtotals, ending in **Budgeted Net Profit vs Actual Net Profit** + variance.
- **Multi-period:** if budgets exist for several periods, offer period-over-period and YTD cumulative views.
- **Branch-aware:** respects the global branch scope; optional per-branch budget-vs-actual matrix reusing the `مقارنة الفروع` (BranchComparison) pattern.

---

## E) Governance

**Lighter than financial-data governance — and that's correct.** Budget = the user's own plan: no dedup/overlap risk, no classification ambiguity, no entity resolution. So it does **NOT** need the staged-review / ValidationReviewScreen pipeline. Instead:
- **Light validation:** numeric amounts, valid period/branch, recognised categories; **unrecognised category names flagged for mapping** (the only ambiguity point).
- **Versioning:** replace/update a budget for a period with simple save + overwrite-confirmation (a "budget version"), no multi-step approval.
- **Storage:** budgets are **reference/plan data, not transactions** — store separately (per-tenant budget store, branch-aware rows), **never** in the financial registry, so they can never be mistaken for actuals.

---

## Constraints honored in this design
- Actual = `computePnLCore` only (no parallel computation). · Branch-aware from day one (`branchId` + `scopeByBranch`). · No touch to `categorization-engine.ts` / `erp-engine.ts` (budget parser is separate and light).

## Sequencing note (from the Part 2 IA review)
Budget vs Actual is genuinely valuable and the natural complement to the now-complete P&L + Cash Flow. I'd recommend building it **alongside the IA/consolidation pass** (Part 2, TASK 6) so it strengthens a coherent owner-first story rather than becoming a 46th isolated surface — e.g. surfaced from the owner home as "خطتك مقابل الفعلي."

---

## Decisions — CONFIRMED 2026-06-28
1. **Entry method:** ✅ **Excel template upload + in-app table editor.**
2. **MVP granularity:** ✅ **Section/roll-up level first** (Total Revenue, COGS, OPEX, Net Profit — per period, per branch); per-category as the next layer.
3. **Governance:** ✅ **Light** — validate + map unrecognised categories + simple versioning; no staged-review pipeline.
4. **Sequencing:** ✅ **Build alongside the IA/consolidation pass**, surfaced from the owner home (e.g. "خطتك مقابل الفعلي"), not as a standalone 46th tab.

## Implementation outline (locked, for the combined IA + Budget effort)
1. **Storage:** per-tenant, branch-aware budget store separate from the financial registry (e.g. an `appSettings`-style `budgets` collection: rows of `{ branchId, period (YYYY-MM), section|category, amount }`). Monthly base; aggregate up.
2. **Entry:** generate the Excel template from live category/section names; light parser (`section|category | period | branch | amount`) → validate → map unrecognised names → save (versioned). Plus an in-app grid bound to the same store.
3. **Actual:** `computePnLCore(scopedExpenses, scopedRevenues, scopedPayroll)` for the selected period+branch — no parallel computation.
4. **View:** Budget | Actual | Δ | Δ% with sign-aware favorability; section subtotals; Budgeted vs Actual Net Profit; branch scope via `scopeByBranch`; optional per-branch matrix reusing `BranchComparison`.
5. **Verification (when built):** Actual column must equal the Income Statement for the same period+branch (single-source check); variance math ties out; branch filter respected; zero regression; console clean; live-tested — same discipline as the Cash Flow build.
