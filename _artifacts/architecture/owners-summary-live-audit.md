# OwnersSummary — Live Audit

**Date:** 2026-06-27
**Precision:** MAX (equity/owner-facing, trust-sensitive)
**Method:** read-only code trace + live UI test against real restaurant data. No implementation.
**File:** `src/modules/OwnersSummary.tsx` (162 lines) · routed at `App.tsx:2803` via `activeTab === 'owners_summary'`.

---

## Verdict (one line)
✅ **SOUND** — real, data-driven, accurate, correctly guarded. It is **NOT** a mock like migration_review, and it does **NOT** inherit the Balance Sheet's flawed plug-equity (it shows no equity at all). One non-blocking naming note below.

---

## TASK 1 — Reality check FIRST (given the migration_review precedent)

**Is it a mock with hardcoded/sample values and dead controls? — NO.**
- `OwnersSummary` receives a single prop, `incomeStatement` (`App.tsx:2804`), and destructures `{ totalRevenue, totalOPEX, totalCOGS, grossProfit, netOperatingIncome, netMargin, grossMargin, totalPayroll }` (line 15). Every rendered figure is one of these — **zero hardcoded numbers, zero sample data, zero non-functional controls.**
- All eight destructured fields are genuinely produced by the `incomeStatement` `useMemo` in `App.tsx` (returned at lines 1061–1069) from real `expensesData`/`revenuesData` records — the **same** Income-Statement source audited **SOUND** earlier this session (real period-filtered data, output−input, D2/D7 COGS fix).
- The component itself has **no internal state, no filters, no controls** — it is a thin presentational derivative of the Income Statement. (The date filter / "كل السنوات" / "تصدير" visible on the page are the shared report-page chrome at the App level, not part of this component.)

**What it actually computes (TASK 1C):** a **profitability / P&L digest** — 5 KPI cards (إجمالي المبيعات, COGS, OPEX, صافي الرواتب, صافي الربح), 2 margin cards (gross/net), and a 3-step *Profitability Waterfall* (revenue → gross profit → net profit). Its data source is the **Income Statement `useMemo`** (journal-free, classified-records aggregation), **not** a ratio estimate and **not** the Balance Sheet.

**It computes NO owner equity, drawings, or capital contributions.** A keyword scan of the component for equity/drawings/capital/حقوق/مسحوبات/رأس المال returns **nothing**.

---

## TASK 2 — Does it inherit the Balance Sheet's known flaw? — NO (and this is the key connection)

The Balance Sheet's documented defect (commits e8510d6 / f60038f) is a **forced-plug equity** line — equity fabricated to force Assets = Liabilities + Equity. The audit brief correctly flags the risk that an "Owners Summary" might surface that same poisoned equity figure and thereby be *misleading by inheritance*.

**It does not — by construction.** OwnersSummary contains **no equity line at all**; it never reads the Balance Sheet, equity, assets, or liabilities. It only shows P&L figures. There is no path by which the plug-equity flaw can reach this page. So it is **NOT** "actively misleading by inheritance" — it is **immune**, because it simply doesn't display the flawed quantity. This is reported explicitly (not as a fresh, unrelated finding): the Balance Sheet flaw and this page are **disconnected by design**, and that disconnection is *why* this page is safe.

---

## TASK 3 — Live test (dev server :3100, dev-auth admin, real restaurant fixture)

Navigated **التقارير → ملخص الملاك → عرض التقرير**. Observed rendered values against the real data:

| Card | Live value | Check |
|---|---|---|
| إجمالي المبيعات (revenue) | **0** | no revenue file in the active fixture (expenses-only) |
| تكلفة المبيعات (COGS) | **33,900** | real classified COGS |
| المصاريف التشغيلية (OPEX) | **63,000** | real classified OPEX |
| صافي الرواتب | **0** | no payroll in fixture |
| صافي الربح (net) | **−96,900** | loss, rendered in the red box |
| نسبة مجمل/صافي الربح | **0% / 0%** | correctly guarded (`totalRevenue > 0 ? … : 0`) — no divide-by-zero |

- **Internal consistency confirmed:** COGS 33,900 + OPEX 63,000 = **96,900**, which exactly matches the **Expenses dashboard** headline (96,900 / 50 transactions) and the Income-Statement source. The figures are real and reconcile.
- **Edge-case handling is correct:** with revenue = 0, margins safely show 0% (guarded) rather than NaN/Infinity, and net correctly shows a −96,900 loss (expenses with no offsetting revenue in this fixture).
- **Interactive elements:** the component has none of its own; the shared report-page date filter drives `incomeStatement` upstream (verified it renders against the filtered figure).
- **Console:** **no errors.**
- **Timing caveat (not a defect):** on first load every P&L-derived view (Expenses dashboard, Reports hub, Income Statement, OwnersSummary) showed 0 until the client finished its async data sync; after a reload + settle, real values appeared. This is a client data-load timing characteristic affecting **all** P&L pages equally — **not** specific to OwnersSummary, and **not** a logic defect. (Server registry confirmed present: `/api/erp/files?moduleType=expenses` → 26 files.)

---

## TASK 4 — Honest verdict + recommendation (no implementation)

**Classification: ✅ SOUND.** Real, data-driven, accurate, edge-case-guarded; faithfully mirrors the audited-sound Income Statement; immune to the Balance Sheet's equity flaw because it shows no equity.

**One non-blocking note (naming/expectation, not correctness):**
The page is titled **"ملخص الملاك" (Owners Summary)**, which *could* lead a user to expect owners' **equity / drawings / capital**. It actually presents owner-facing **profitability KPIs**. This is mitigated, and arguably already correct, because the system describes it honestly everywhere it is labeled:
- Subtitle (`App.tsx:2135`): *"ملخص مالي مباشر ... لعرض مؤشرات الأداء الحيوية"* (performance KPIs).
- Reports-hub card (`ReportsDashboard.tsx:17`): *"ملخص الأداء المالي لمتخذي القرار"* (financial **performance** summary for decision-makers).

So "ملخص الملاك" reads naturally as *a summary **for** owners*, not *a statement **of** owners' equity*.

**Professional recommendation (authorized to propose):**
1. **Keep the page as-is** — it is sound and useful, and its descriptions are honest. No fix required.
2. *(Optional, user's call)* If the equity-expectation ambiguity is a concern, a **trivial label tweak** (e.g., "الملخص التنفيذي" / "ملخص الأداء للملاك") removes it. Pure copy change, zero logic.
3. A **genuine owners'-equity statement** (capital contributions, drawings, retained earnings) is a **separate NET-NEW feature** — it needs real owner-transaction data plus the **chart-of-accounts-with-types / equity foundation** (the same foundation the real Balance Sheet and D12 require). It is **NOT** a fix to this page and should not be bolted on here.

**Bottom line:** unlike migration_review (a non-functional mock), OwnersSummary is a real, correct, honestly-described profitability digest. No removal, no rebuild, no "تقديري" honesty-label needed — it carries no estimated or flawed quantity.
