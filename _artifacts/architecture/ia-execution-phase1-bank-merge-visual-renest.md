# IA Consolidation — Phase 1 Execution: Bank-pages merge + Visual Analytics retire

**Date:** 2026-06-28
**Precision:** MAX (live, real-data financial pages)
**Scope:** Phase 1 of the risk-ordered rollout in `ia-consolidation-plan.md` (a94f3d70): (1) merge the two bank pages into one tabbed entry; (2) retire the Visual Analytics duplicate. Phases 2+ (Owner Home, Owners Summary retire, Budget vs Actual, real Equity) are **NOT** touched here.

---

## Pre-flight — deferred-items registry confirmed intact
Verified before any code change; none missing or drifted:
- **D11 / D12 / D13** → present in `engine-technical-debt.md` and `SESSION-HANDOFF.md`.
- **Cash Flow Investing/Financing limitation** → present in `cash-flow-statement-build.md` (the honest-limitation note).
- **expenses/revenues 20-row preamble cap, UserManagement backend, Balance Sheet structural fix, smart branch suggestion, 4 remaining activity profiles, bilingual parity (~29 rules)** → all present in `SESSION-HANDOFF.md`.

---

## TASK 1 — Bank pages merge

### 1.1 Zero-loss capability inventory (pre-merge)
**BankReconciliation (مطابقة البنوك):** portfolio summary (account count, total txns, total debit/credit) · multi-account "never merged" notice · per-account header · per-account KPIs (count/debit/credit/net) · opening / computed-closing / statement-closing · reconciled✓/diff banner + continuity chain · no-running-balance fallback · GL-nature → account → transaction drill-down · account segmentation · empty state.
**BankMovements (حركة الحسابات):** multi-account notice · per-account header · In/Out/Net KPIs · By-Type / By-Counterparty toggle · table (count/In/Out/Net/share-bar) · transaction drill-down · top-50 counterparty cap · account segmentation · empty state.

### 1.2 Implementation (tabbed merge)
- **New `src/modules/BankAccountsView.tsx`** — a thin tabbed wrapper with 3 modes, each rendering the **original component unchanged** (zero rewrite, so zero behaviour loss):
  - **مطابقة الأرصدة** → `<BankReconciliation>`
  - **الحركة حسب النوع** → `<BankMovements forcedView="type">`
  - **الحركة حسب الطرف** → `<BankMovements forcedView="counterparty">`
- **`BankMovements.tsx`** — added an optional `forcedView` prop (backward-compatible: when set, it uses that view and hides its internal toggle; unset = original behaviour). This is the only change to either original component.
- **Routing (`App.tsx`):** both `bank_reconciliation` and the banks-`categories_summary` routes now render `<BankAccountsView>` (defaulting to reconciliation / by-type respectively), so **no old deep-link is orphaned**. Records passed as `scopeByBranch(filteredRecords)` — see branch note below. Page title → "مطابقة وحركة البنوك".
- **Nav (`NewAppShell.tsx`):** the banks `حركة الحسابات` entry removed; `bank_reconciliation` relabelled "مطابقة وحركة البنوك".
- **CommandPalette:** audited — **no command targeted** `bank_reconciliation` or the banks `categories_summary` (only `bnk_dash` → banks dashboard, still valid). Nothing to repoint; no orphaned commands.
- **`VisualDashboard.tsx` NOT deleted** — it also exports `formatCurrency`, imported by 5 modules (Accounting/Banks/Invoices dashboards + the two bank components). Only its *page* was retired (see TASK 2).

> **Deliberate improvement (authorized to disagree):** the merged page passes **branch-scoped** records (`scopeByBranch`). Previously the reconciliation page used unscoped `filteredRecords`, so the branch selector (which renders on REPORT_PAGE) had **no effect** there — a latent inconsistency. The merge fixes it; identical to before when scope = "all".

### 1.3 LIVE verification (two real accounts uploaded via the real staged-upload+activate flow, then restored)
| Check | Result |
|---|---|
| Page renders, title "مطابقة وحركة البنوك", **3 tabs** present | ✅ |
| Reconciliation tab: opening/closing + reconciled✓ banner + GL-nature breakdown | ✅ |
| By-Type tab: In/Out/Net KPIs + type rows | ✅ |
| By-Counterparty tab: counterparty rows (مدى POS / موظف / سوبر ماركت / …) | ✅ |
| Drill-down (expand row → transactions) | ✅ |
| **Multi-account never-merge** (SA1111 opening 10,000→closing 9,000; SA2222 5,000→7,000; **two independent ✓ banners**) | ✅ |
| Branch scoping (كل الفروع → both accounts; فرع جدة → empty as records are `default`; restored) | ✅ |
| No orphaned routes (both old ids → merged page) | ✅ |
| Console clean | ✅ |

---

## TASK 2 — Visual Analytics (التحليل الرسومي) retire

### 2.1 Re-verified "near-duplicate" LIVE + by code (not trusted blindly)
`VisualDashboard` renders: 4 KPI cards (Revenue/Expenses/Net/Requires-Review), the "نظرة عامة مالية" revenue-vs-expenses bar chart, Quick Actions, a Smart-Alerts list, and a "Recent Activity" placeholder. **Every one of these already exists on `GlobalDashboard`** (the home shown to any user with data — confirmed: `WelcomePage` shows only on first-run/zero-data, else `GlobalDashboard`). Its `revPieData/expPieData/topSuppliers/…` props are **accepted but never rendered** (dead). The Smart-Alerts list is covered by the dedicated `anomalies_report` page. **Nothing unique → no relocation gate needed** (unlike the Owners Summary waterfall, which remains gated for Phase 2).

### 2.2 Implementation
- Removed both `activeTab === 'visual_dashboard'` render blocks from `App.tsx` (there were **two identical** blocks — a pre-existing double-render bug, now gone), plus its import, its `REPORT_PAGE` list entry, its page-title entry, and the `visual_dashboard` exception in `allowExport`.
- Removed the `visual_dashboard` entry from `NewAppShell.tsx` and the card from `ReportsDashboard.tsx`.
- **`VisualDashboard.tsx` kept on disk** (the `formatCurrency` export is still used by 5 modules) — only the page is unreachable now.
- **Live-verified:** Reports hub now shows exactly 6 cards (قائمة الدخل · الميزانية · التدفقات النقدية · ملخص الملاك · مقارنة الفروع · المقارنة السنوية) — التحليل الرسومي gone, all others intact. No orphaned route/nav/command. Console clean.

---

## Build & regression
- `tsc --noEmit`: **0 src errors** · `vite build`: **passes**.
- Test data (2 bank accounts + test branch) and temp scripts removed; `data/erp_registry.json` restored (0 banks records, 1138 total) and `uploads.json` restored via git.
- Files changed: `src/modules/BankAccountsView.tsx` (new), `src/modules/BankMovements.tsx`, `src/App.tsx`, `src/components/NewAppShell.tsx`, `src/modules/ReportsDashboard.tsx`.

## "WHAT WE WILL NEVER DO" compliance
No KPI card, chart, table, or breakdown was hidden, collapsed, or reduced in prominence. The bank merge preserved 100% of both pages' features (each tab renders the original component). Visual Analytics removal lost **zero unique information** (strict duplicate of the home). The Owners Summary Profitability Waterfall was **not touched** (Phase 2, gated).

## Status
✅ **Phase 1 EXECUTED.** Pending: Owner Home (Phase 2), Owners Summary retire (after waterfall relocation), Budget vs Actual, future real Equity.
