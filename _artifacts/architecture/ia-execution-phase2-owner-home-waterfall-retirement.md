# IA Consolidation — Phase 2 Execution: Owner Home + Waterfall relocation + Owners Summary retirement

**Date:** 2026-06-28
**Precision:** MAX (touches the first page every user sees)
**Scope:** Phase 2 of `ia-consolidation-plan.md` (a94f3d70): (1) relocate the Profitability Waterfall — the gate; (2) build the additive Owner Home band; (3) retire OwnersSummary. Phase 3 (Budget vs Actual) and the future real-Equity statement are **NOT** touched.

---

## Pre-flight — deferred-items registry re-confirmed intact
D11/D12/D13 (engine-technical-debt.md), Cash Flow Investing/Financing (cash-flow-statement-build.md), 20-row preamble cap, UserManagement backend, Balance Sheet structural fix, smart branch suggestion, 4 remaining activity profiles, bilingual ~29 rules (SESSION-HANDOFF.md) — all present, none drifted.

---

## TASK 1 — Profitability Waterfall relocated (THE GATE — done first, verified before anything was retired)

### 1.1 Re-confirmed unique (read directly, not from memory)
`OwnersSummary.tsx` lines 114-158: a 3-bar progressive cascade (revenue 100% → gross-profit % → net-profit %) over `totalRevenue / grossProfit / netOperatingIncome / netMargin`. Re-verified it has **no equivalent** elsewhere: Income Statement shows the cascade only as a *table*; GlobalDashboard has a revenue-vs-expenses bar chart, not this cascade. **Confirmed unique → gated.**

### 1.2 New home
Extracted **verbatim** into `src/modules/ProfitabilityWaterfall.tsx` (pure presentation over `incomeStatement`, no recomputation) and mounted on the **Income Statement** page (`IncomeStatement.tsx`, after the CAPEX block) — its natural companion, since both derive from the same P&L.

### 1.3 LIVE-verified BEFORE touching OwnersSummary
With real restaurant data: the waterfall renders on Income Statement — all 3 steps present, COGS 33,900, OPEX 63,000. **Only after this passed** did Task 3 (retirement) begin. Gate honoured.

---

## TASK 2 — Owner Home (strictly additive)

### 2.1 Plain-language band added ABOVE existing content (`GlobalDashboard.tsx`)
A 3-card band as the new first section:
- **ربحك هذا الشهر** — net profit (sign-aware) + plain sentence ("خسرت 96,900 ر.س هذا الشهر — راجع المصروفات."); links to Income Statement.
- **النقدية لديك** — real reconciled cash from `computePortfolioCashFlow(scopedBanks)` (wired via new `cashClosing`/`cashHasData` props from App); shows "ارفع كشف حساب بنكي…" when no bank data; links to Cash Flow.
- **ما يحتاج انتباهك** — real governance signals: staged-files count + anomalies count (one-click to review); "كل شيء على ما يرام" when none.

### 2.2 Zero-loss check (every existing element confirmed present, live)
The band is inserted *above* `{stagedFilesCount > 0 && …}`. Live-verified all original GlobalDashboard content remains, unchanged, below it: **staged-files banner, 4 KPI cards (الإيرادات / المصروفات / صافي الربح / المعاملات), the "نظرة عامة مالية" chart, Quick Actions, and the 4 lower cards (العملاء / الموردون / المعاملات / النشاط الأخير).** Nothing hidden, collapsed, moved to a tab, or shrunk.

### 2.3 WelcomePage first-run logic — unaffected
The empty-state branch (`App.tsx`: `availableFiles all empty && stagedFilesCount===0 ? WelcomePage : GlobalDashboard`) was **not touched** — WelcomePage still shows only for genuinely-new tenants, exactly as built in UX Sprint 1. Confirmed.

---

## TASK 3 — OwnersSummary retired (only after Task 1 verified)
Confirmed **only `App.tsx` imported it** (no other module). Removed: the import, the route, the `REPORT_PAGE` list entry, the page-title entry, the `NewAppShell` nav entry, and the `ReportsDashboard` hub card. CommandPalette had **no** OwnersSummary command (no dead entry). The `OwnersSummary.tsx` file is retained on disk but **fully unreferenced** (its unique waterfall is relocated; the rest was duplicate KPI/margin cards) — safe to delete in a later cleanup; kept now for conservatism (same approach as `VisualDashboard.tsx` in Phase 1).

---

## TASK 4 — LIVE verification (exhaustive)
| Check | Result |
|---|---|
| Owner Home: all original GlobalDashboard elements present | ✅ |
| New band: real profit (−96,900) + real cash (**13,000**, reconciled) + governance (4 staged) | ✅ |
| Waterfall renders on Income Statement with real data | ✅ |
| OwnersSummary route retired; Reports hub now 5 cards (قائمة الدخل / الميزانية / التدفقات النقدية / مقارنة الفروع / المقارنة السنوية) — both ملخص الملاك and التحليل الرسومي gone | ✅ |
| CommandPalette: no dead entries | ✅ |
| Branch scoping on Owner Home (فرع جدة → cash card shows upload prompt as records are `default`; كل الفروع → 13,000 restored) | ✅ |
| Regression: net profit consistent (band −96,900 == KPI card −96,900); existing figures unchanged | ✅ |
| Console clean | ✅ |

`tsc --noEmit`: **0 src errors** · `vite build`: **passes**. Test data (1 bank account + test branch) and temp scripts removed; `data/erp_registry.json` restored (0 banks, 1138 total) and `uploads.json` restored.

---

## "WHAT WE WILL NEVER DO" compliance
- The unique Profitability Waterfall was **relocated and verified before** OwnersSummary was touched — the gate was honoured exactly.
- Owner Home is **purely additive**: every existing KPI card, chart, Quick Action, and lower card remains at equal-or-greater prominence (the band is a new lead section, the existing dashboard is untouched below).
- OwnersSummary's retirement lost **zero unique information** (waterfall preserved; KPI/margin cards were duplicates of Income Statement + Owner Home).

## Files
- `src/modules/ProfitabilityWaterfall.tsx` (new) · `src/modules/IncomeStatement.tsx` (waterfall mounted) · `src/modules/GlobalDashboard.tsx` (additive band) · `src/App.tsx` (cash wiring + OwnersSummary route/import removed) · `src/components/NewAppShell.tsx` + `src/modules/ReportsDashboard.tsx` (owners_summary entry/card removed). `OwnersSummary.tsx` retained but unreferenced.

## Status
✅ **Phase 2 EXECUTED.** Pending: Budget vs Actual (Phase 3), then future real Owners' Equity statement (gated on owner-contribution/drawing capture + chart-of-accounts foundation).
