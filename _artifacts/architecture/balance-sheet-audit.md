# Balance Sheet — Deep Audit (read-only)

> **Verdict up front:** the Balance Sheet is **not a financial statement — it is a set of figures
> fabricated from the income statement by fixed assumption-ratios.** It always "balances" by
> construction, so balancing proves nothing. There is a bottom disclaimer, but it *understates* the
> issue. **Severity: actively misleading → needs an urgent, stronger label now + a scoped real-fix that
> is blocked on foundational accounting architecture.**
>
> Read-only audit — no code changed. Base HEAD `e46052f`.

---

## TASK 1 — what the module actually does (file:line evidence)

### A) Inputs and their origin
`BalanceSheet` receives one prop, `data = { revenues, expenses, payroll }`
([BalanceSheet.tsx:6-13](../../src/modules/BalanceSheet.tsx)). Traced to source
([App.tsx:2711-2716](../../src/App.tsx)):
```
revenues: incomeStatement.totalRevenue
expenses: incomeStatement.totalOPEX + incomeStatement.totalCOGS
payroll:  incomeStatement.totalPayroll
```
`incomeStatement` ([App.tsx:889+](../../src/App.tsx)) sums **real record-derived P&L flows**
(`Net_Amount` per category). So the three INPUTS are genuine income-statement totals — but they are
**P&L flows, not balance-sheet balances.**

### B) The exact line-item logic ([BalanceSheet.tsx:16-29](../../src/modules/BalanceSheet.tsx))
```
netIncome          = revenues - expenses - payroll
cash               = max(netIncome * 0.40, 0)   // "40% of profit is cash"
accountsReceivable = revenues * 0.15            // "15% of revenue"
inventory          = expenses * 0.10            // "10% of expenses"
totalAssets        = cash + accountsReceivable + inventory
accountsPayable    = expenses * 0.12            // "12% of expenses"
accruedExpenses    = payroll  * 0.05            // "5% of payroll"
totalLiabilities   = accountsPayable + accruedExpenses
equity             = totalAssets - totalLiabilities   // residual plug
```
Every balance-sheet number is a **hard-coded ratio of a P&L flow**. None is an actual balance.

### C) Does it reconcile? — **Yes, but meaninglessly.**
`equity = totalAssets − totalLiabilities` ([:29](../../src/modules/BalanceSheet.tsx)), and the
statement renders `Assets` vs `Liabilities + Equity`. Because equity is **defined as the residual**,
`Assets ≡ Liabilities + Equity` **by construction for any input whatsoever.** The balance check — the
single most important validation of a real balance sheet — is therefore **vacuous here.** It can never
fail, and never detects an error.

### D) Any path to real account balances? — **No.**
The component reads only the three estimated ratios. It never imports/queries journal entries, account
balances, or the ledger. (By contrast `TrialBalance.tsx` *does* read real journal entries via
`/api/debug/journalEntries/raw` — so real per-account debit/credit sums exist in the system, but the
Balance Sheet ignores them entirely.)

### E) What the user sees
- KPI cards "إجمالي الأصول / الالتزامات / حقوق الملكية" and line items ("النقد وما في حكمه",
  "ذمم مدينة", "ذمم دائنة" …) all render **precise-looking** `formatCurrency` figures with no per-number
  qualifier ([:34-150](../../src/modules/BalanceSheet.tsx)).
- One amber disclaimer at the bottom ([:153-154](../../src/modules/BalanceSheet.tsx)):
  *"هذه الميزانية تقديرية بناءً على البيانات المرفوعة … ولا تشمل الأصول الثابتة أو القروض طويلة الأجل…"*
- **Problem:** the disclaimer frames it as *"estimative, and excludes fixed assets/long-term loans"* —
  which a reader hears as "derived from my data, minus a couple of categories." It does **not** say the
  numbers are **formula guesses unrelated to actual cash/receivables/payables**. The framing understates
  the reality.

## TASK 2 — gap vs a real Balance Sheet

### A) A real Balance Sheet requires
- A **chart of accounts with TYPES** (asset / liability / equity), including balance-sheet accounts:
  cash, bank, AR, inventory, fixed assets, accumulated depreciation, AP, accruals, loans, capital,
  retained earnings.
- **Posted double-entry journal entries that touch those balance-sheet accounts**, summed into balances.
- **Opening balances / carry-forward** across periods.
- Equity derived from real capital + accumulated retained earnings — not as an arithmetic plug.

### B) What is concretely missing in this codebase
1. **No account-type model** anywhere (asset/liability/equity) — same root as the D12 finding.
2. **No chart of accounts at all** — journal-entry `debitAccount`/`creditAccount` are **free-text Arabic
   strings**, not typed accounts ([phase-c1-journal-entries-plan.md A/§Critical](phase-c1-journal-entries-plan.md));
   `CATEGORY_ORDER` is **expense-only**.
3. **Journal entries are P&L-generated** (debit expense / credit "ذمم دائنة"/"حساب تسوية البنك" —
   [erp-engine.ts:101,131,136](../../src/backend/core/erp-engine.ts)); there is **no posting to
   cash/bank/AR/inventory/fixed-asset/equity** accounts.
4. **No opening balances / carry-forward** mechanism.
5. **BalanceSheet.tsx doesn't even read the ledger** — it would have to be rebuilt to aggregate by
   account type once (1)-(4) exist.

### C) Connection to the data-architecture work — **Yes, directly blocked on it.**
- `data-plane-map.md` (§1, §3): `journalEntries` live in **Firestore + JSON only, no Postgres table**;
  there is **no unified source of truth**.
- `phase-c1-journal-entries-plan.md` (status gate): the `journal_entries` relational table is a
  **plan only (unexecuted)**, and the **"Accounting Bundle (double-entry enforcement, posting rules)
  remains BLOCKED"** pending approval.
- Therefore a real Balance Sheet is **not fixable inside `BalanceSheet.tsx`**. It depends on: a typed
  chart of accounts (the D12/D2/D7 COA gap), real balance-sheet posting + opening balances (the blocked
  Accounting Bundle), and a relational ledger source of truth (Phase C1/C2). These are foundational,
  multi-phase efforts.

## TASK 3 — user-facing risk

### A) How misleading, honestly?
**High.** The figures are not approximations of the truth — they are **arithmetic of the income
statement** with no link to actual financial position:
- Two businesses with identical P&L but wildly different cash, debt, and inventory would show the
  **identical** balance sheet.
- "النقد وما في حكمه = 40% of net income" can be badly wrong in either direction (a profitable business
  can be cash-poor; a loss-making one shows **zero** cash via the `max(…,0)`).
- Because equity is a plug, the sheet **always balances**, giving false confidence that it's "correct."
- A user assessing liquidity, solvency, or borrowing capacity from these numbers would be **misled**.

This is **not** "acceptable estimation for an early product stage" *as currently presented*, because it
is presented with the visual authority of a real statement and only a soft, under-stated disclaimer.

### B) Minimal honest fix that should ship regardless of the deep fix
**Yes** — a prominent, unmistakable "تقديري توضيحي" treatment so no one mistakes these for real
balances. Proposed in TASK 5. This is cheap, honest, and decouples user-trust safety from the large
architectural fix.

## TASK 4 — verdict

**Actively misleading → (1) ship a stronger honest label now (TASK 5), and (2) treat the real Balance
Sheet as a scoped future effort blocked on foundational accounting work (typed COA + double-entry
posting + opening balances + relational ledger), NOT a `BalanceSheet.tsx` change.** The current bottom
disclaimer is necessary but insufficient: it understates that the numbers are ratio-derived, not actual.

## TASK 5 — proposed minimal labeling fix (NOT implemented — awaiting confirmation)

Three small, read-only-safe UI additions to `BalanceSheet.tsx`:

1. **Page-top warning banner** (above the KPI cards), red/amber, unmissable:
   > **⚠️ هذه ليست ميزانية محاسبية فعلية — أرقام تقديرية توضيحية فقط.**
   > القيم أدناه محسوبة بنسب افتراضية من قائمة الدخل (مثلاً: النقد = 40% من صافي الربح، الذمم = 15% من
   > الإيرادات)، وليست أرصدة حسابات حقيقية. لا تُستخدم لاتخاذ قرارات مالية أو ائتمانية.

2. **A small `تقديري` chip** next to each KPI card title ("إجمالي الأصول · تقديري") and the section
   headers, so the qualifier travels with every number, not just the footer.

3. **Reword the existing bottom disclaimer** from "تقديرية بناءً على البيانات" to explicitly say the
   figures are **derived by assumption-ratios from the income statement, not actual account balances.**

> Per the same checkpoint discipline as the D12 liability decision: this is user-trust-facing, so it is
> **proposed only** here and awaits your confirmation before implementation.
