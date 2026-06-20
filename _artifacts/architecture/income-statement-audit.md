# Income Statement — Deep Audit (read-only)

> **Verdict up front: SCENARIO A — the data source is SOUND (real, not estimated).** Revenue/expense
> figures are summed from **actual classified records**, so the Balance Sheet's flaw was **isolated to
> its own ratio-conversion layer** — it distorted *good* upstream data, it did not inherit *bad* data.
> Net profit, total revenue, and total expenses are **reliable**.
>
> **One concrete, narrow gap found (not estimation): the new D2/D7 COGS accounts (commit `e46052f`) are
> NOT in the Income Statement's hard-coded COGS list, so wastage/shrinkage currently lands under
> Operating Expenses instead of COGS.** This is a real follow-up wiring fix (proposed in TASK 5), and it
> corrects an over-claim in the Phase-A chart-of-accounts deliverable. It does **not** affect net profit.
>
> Read-only audit — no code changed. Base HEAD `9ed75b9`.

---

## TASK 1 — what the module actually does (file:line evidence)

### A) Inputs and origin — REAL records, not estimates
`IncomeStatement` renders entirely from the `incomeStatement` prop ([IncomeStatement.tsx:19,129-304](../../src/modules/IncomeStatement.tsx)),
computed in App.tsx's `incomeStatement` useMemo ([App.tsx:889-960](../../src/App.tsx)) from
`plFilteredRevenues` / `plFilteredExpenses` / `plFilteredPayroll`. Those trace to
`revenuesData.records` / `expensesData.records` / `payrollData.records`
([App.tsx:831-861](../../src/App.tsx)) — the **real parsed-and-classified records**, date/search
filtered. No ratios, no fabricated figures. (Phase 1H was display-only: the component only applies
`formatAmount`/`formatCurrency`; the math is entirely in the App.tsx useMemo.)

### B) Exact aggregation ([App.tsx:904-960](../../src/App.tsx))
```
totalRevenue = Σ Net_Amount over revenue records
for each expense record (cat = Category):
   amt = isPayroll ? Total_Amount : Net_Amount
   if cat ∈ cogsCategories  → totalCOGS += amt
   elif cat ∈ capexCategories → totalCAPEX += amt
   else                     → totalOPEX += amt   (+ payroll added to totalOPEX/totalPayroll)
grossProfit        = totalRevenue − totalCOGS
netOperatingIncome = grossProfit − totalOPEX
```

### C) Same real data as Trial Balance? — same underlying uploads, **different representation**
Trial Balance aggregates **journal entries** (debit/credit, via API); Income Statement aggregates the
**classified records** (`Category`, `Net_Amount`) directly in the client useMemo. Both are real and
derive from the same uploads, sliced differently (by account vs by revenue/expense type). Neither is
estimated. So Income Statement is the **same "real-data" class as Trial Balance**, *not* the estimation
class of the Balance Sheet.

### D) isActive / tenant scoping — **legitimate, but a DIFFERENT mechanism than Trial Balance's**
- **Tenant:** records are loaded per-tenant via the authenticated data hooks (`useExpenses`/`useRevenues`,
  populated by `fetchDataForMode`, gated on `activeFileId` — [App.tsx:181-182,377-378](../../src/App.tsx)).
- **Superseded data:** there is **no per-record `isActive` filter** like Trial Balance's
  (`isActive !== false`). Records aren't versioned the way journal entries are; instead, only the
  **active file's** records are loaded (governed by the active-file-registry). So replaced/orphaned
  files are excluded at the **file** level, not the **entry** level.
- **Honest note:** this is a legitimate but *different* guard. Its correctness depends on the
  active-file-registry working as the governance phases established — it is **not** the same explicit
  per-record check Trial Balance uses. Worth keeping in mind, but not a defect on its own.

### E) D2/D7 integration — **GAP CONFIRMED (the headline finding)**
The COGS aggregation uses a **hard-coded 4-item list** ([App.tsx:890-895](../../src/App.tsx)):
```
cogsCategories = [ مواد خام ومكونات, مواد تعبئة وتغليف, مستهلكات تشغيلية, شحن ونقل للداخل ]
```
The accounts added in commit `e46052f` — **`تكلفة المبيعات - هدر وتلف إنتاج` (D2)** and
**`تكلفة المبيعات - هالك وعجز مخزون` (D7)** — are **NOT in this list**. So a wastage/shrinkage record
fails `cogsCategories.includes(cat)` and falls to the `else` → **`totalOPEX` / `opexBreakdown`**, i.e.
it appears under **Operating Expenses, not COGS**, in the Income Statement.
- This **contradicts the user-confirmed "تحت COGS" decision** for D2/D7 and **corrects an over-claim**
  in `chart-of-accounts-additions-d2-d7-d12.md` ("displays under COGS"): adding them to `CATEGORY_ORDER`
  (ordering) was not sufficient — the Income Statement uses this *separate hard-coded list*, not a
  `تكلفة`-prefix test, for the COGS/OPEX split.
- **Impact:** net profit is **unchanged** (the amount is counted either way); but **gross profit is
  overstated** and the COGS↔OPEX split is wrong **for records in D2/D7**. With the current real data
  (the 730 restaurant records contain **zero** wastage/shrinkage entries — established in Phase 1), the
  *present-day* numeric impact is **nil**; the gap bites once such records appear.

### F) What the user sees
KPI cards + sectioned statement (Revenue → COGS → Gross Profit → OpEx → Net) with real sums and margins.
The presentation is **honest** for the reliable figures (it is real data). The only misrepresentation is
the COGS-vs-OPEX placement of D2/D7 records (E) — a classification-section error, not a fabricated number.

## TASK 2 — isolate the Balance Sheet flaw (definitive)

The Balance Sheet ratios multiply Income Statement outputs:
`cash = max(netIncome,0)*0.40`, `AR = revenues*0.15`, `inventory/AP = expenses*0.10/0.12`,
`accrued = payroll*0.05` — where `expenses = totalOPEX + totalCOGS` ([App.tsx:2713-2715](../../src/App.tsx)).
- `netIncome = totalRevenue − (totalOPEX+totalCOGS) − totalPayroll` — **reliable**, because moving an
  amount between COGS and OPEX (the D2/D7 gap) **does not change their sum**, so it does not change
  `netIncome` or `expenses` fed to the Balance Sheet.
- **Conclusion (definitive):** the Balance Sheet's flaw is **fully isolated to its own ratio-multiplication
  step.** It takes *correct* Income Statement totals and multiplies them by arbitrary ratios. The Income
  Statement's net-profit figure is **not** itself unreliable. The two findings are distinct and are not
  conflated: (1) Balance Sheet = fabricated via ratios [its layer only]; (2) Income Statement = real,
  with one COGS/OPEX classification gap for D2/D7 that does **not** propagate to net profit or to the
  Balance Sheet inputs.

## TASK 3 — user-facing risk

- **(A)** For the user's real restaurant data **today: reliable.** Revenue, total expenses, and net
  profit are real sums; and since there are no real wastage/shrinkage records yet, the D2/D7 gap has
  **zero current numeric effect**. Gross-profit/COGS will become mildly overstated only when
  wastage/shrinkage records are uploaded.
- **(B) Good news, stated plainly:** this **closes the loop** — the Balance Sheet's problem was an
  isolated ratio layer, not corrupt upstream data. The Income Statement (like the Trial Balance) is
  built on real data. Two of the three core statements are sound; only the Balance Sheet fabricates.
- **(C)** The D2/D7 accounts need **follow-up wiring** (TASK 5) to actually land under COGS as intended.
- **(D) No "تقديري" label** — the figures are real; a label would be dishonest in the opposite direction.
  The warranted action is a small **correctness fix**, not a disclosure label.

## TASK 4 — verdict

**SCENARIO A: sound, real-data Income Statement — Balance Sheet's flaw is isolated.** One concrete,
non-estimation gap: **D2/D7 wastage/shrinkage misclassified to OPEX instead of COGS** because of a stale
hard-coded `cogsCategories` list. Net profit unaffected; present-day numeric impact nil (no such records
in real data yet); fix is small and warranted.

## TASK 5 — proposed fix (NOT implemented — awaiting confirmation)

**Add the two D2/D7 accounts to the `cogsCategories` array** in the Income Statement aggregation
([App.tsx:890-895](../../src/App.tsx)):
```diff
  const cogsCategories = [
      'تكلفة المبيعات - مواد خام ومكونات',
      'تكلفة المبيعات - مواد تعبئة وتغليف',
      'تكلفة المبيعات - مستهلكات تشغيلية',
      'تكلفة المبيعات - شحن ونقل للداخل',
+     'تكلفة المبيعات - هدر وتلف إنتاج',     // D2
+     'تكلفة المبيعات - هالك وعجز مخزون',    // D7
  ];
```
- **Type:** real correctness fix, **not** a label. Two lines, additive.
- **Risk:** minimal — only records already classified into D2/D7 move from OPEX to COGS; net profit
  unchanged; zero effect on the 730 real records (none are D2/D7 today). Should be verified with the
  same 730 + 5-synthetic regression harness before commit.
- **Checkpoint discipline:** proposed only; awaiting confirmation, same as the Balance Sheet / D12
  decisions. (Also recommend updating `chart-of-accounts-additions-d2-d7-d12.md` to correct the
  "displays under COGS" claim once this lands.)
