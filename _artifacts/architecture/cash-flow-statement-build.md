# Real Cash Flow Statement — Build & Verification

**Date:** 2026-06-28
**Precision:** MAX (new financial statement; hard reconciliation gate)
**Outcome:** ✅ A genuinely accurate, bank-reconciled, branch-aware direct-method Cash Flow Statement. Ending cash reconciles **exactly** (to the halala) to the bank statement's actual closing balance — verified live and deterministically.

---

## Finding that reframed the task: a Cash Flow page already existed — and it was wrong
The brief said "no Cash Flow Statement exists yet." One did — `src/modules/CashFlow.tsx` (Reports → `cash_flow`). It was **not** a real cash-flow statement:
- `cashIn = data.revenues`, `cashOut = data.expenses + data.payroll` — **accrual P&L figures relabeled as cash**.
- Used **zero bank data**, no opening/closing balance, **no reconciliation**, single (operating-only) bucket, not branch-aware. Its own disclaimer admitted it "assumes all invoices were paid/collected during the period."

This was the same *class* of problem as the estimated Balance Sheet. So this was a **rebuild/replace**, not a greenfield build.

---

## Design (confirmed before implementation — Option A: honest, fully accurate)

**Core insight:** the bank statement *is* the cash ledger. A direct-method CFS needs no estimation — it is a **reclassification of the actual bank movements**, which already reconcile (`opening + Σ signed flows = closing`). If every transaction lands in exactly one section, `Σ(sections) = net change = closing − opening`, so **ending cash = statement closing by construction**.

1. **Shared core** `src/lib/bank-cashflow-core.ts` (mirrors `pnl-core.ts`): `computeAccount` (reconciliation math, **extracted verbatim** from `BankReconciliation.tsx`) + `computeAccountCashFlow` / `computePortfolioCashFlow` (direct-method sections) + `dirOf`/`signedAmount`. **Single source of truth** so the Reconciliation page and the Cash Flow Statement can never drift on the cash position.
2. **`BankReconciliation.tsx`** refactored to import from the core (behavior unchanged — verified live).
3. **`CashFlow.tsx`** rebuilt: reads **bank records only** (`moduleType==='banks'`), per account (balances never merged), with an in-UI reconciliation gate banner per account and portfolio-wide.
4. **Branch-aware from day one:** App computes `scopedBanks = scopeByBranch(plFilteredBanks)` (the exact pattern from `7bf4614b`) and passes it in; CashFlow respects the global branch-scope selector.

**Section mapping (honest):** Operating = POS receipts, purchases/payments, bank fees, salaries, VAT, cash deposits/withdrawals. A clearly-labelled **"تحويلات وحركات أخرى"** section holds inter-account transfers / remittances. **Investing and Financing are deliberately NOT fabricated** — see limitation below.

---

## Verification

### A. Deterministic gate test (real bank processor → shared core)
A realistic statement (POS +5000, purchase −2000, fee −500, salary −3000, cash deposit +1000, transfer −1500; running balances 15000→9000) run through the **real `processBanks`** then `computePortfolioCashFlow`:

| Check | Result |
|---|---|
| opening = 10,000 | ✓ |
| statement closing = 9,000 | ✓ |
| net change = −1,000 | ✓ |
| operating net = +500 | ✓ |
| transfers net = −1,500 | ✓ |
| **HARD GATE: computed ending EXACTLY = statement closing** | ✓ (9,000 = 9,000) |
| sections sum to net change (no plug) | ✓ |
| `opening + netChange = closing` identity | ✓ |

### B. Live UI (dev server :3100, real staged-upload + activate of the statement)
- Cash Flow page rendered: **النقدية الافتتاحية 10,000.00 · صافي التغير −1,000.00 · النقدية الختامية 9,000.00**, green **"مطابقة مكتملة ✓"** banner.
- Per-account banner: **"مطابق ✓ — الرصيد الختامي المحسوب يساوي رصيد الكشف البنكي"**; all operating natures + transfers + the honest note rendered.
- **Branch filter (TASK 3.2):** added "فرع جدة" via the real settings API; selecting it → empty-for-branch state (bank records are `default`); switching back to "كل الفروع" → full reconciled statement restored. Branch scope works.
- **Zero regression (TASK 3.3):** the refactored **مطابقة البنوك** page renders opening 10,000 / closing 9,000 / reconciled ✓ — **identical** closing to the Cash Flow page (the shared-core no-drift guarantee, proven live).
- **Console:** clean (no errors) throughout.
- `tsc --noEmit`: 0 src errors · `vite build`: passes.
- **Cleanup:** test bank file + registry/uploads restored via git (0 banks records remain); temp scripts removed. Verified clean.

---

## TASK 4 — Honest assessment

**Is this a genuinely accurate Cash Flow Statement? — YES, for what it presents, with one honestly-labelled simplification.**

- **Genuinely accurate (no estimation):** opening cash, every operating/transfer flow, net change, and **ending cash** all come from real bank movements; ending cash **reconciles exactly** to the statement's actual closing balance — the same hard gate the bank reconciliation enforces. This is **not** "تقديري" and is correctly **not** labelled as such (over-labelling accurate figures would be as misleading as under-labelling estimates).

- **One genuine, honestly-labelled simplification — Investing & Financing:** the bank classifier has no fixed-asset, owner-capital, or loan categories, so a fixed-asset purchase is indistinguishable from any payment, and an owner draw from any transfer. Rather than fabricate Investing/Financing sections, the statement presents detailed **Operating** flows + a labelled **"تحويلات وحركات أخرى"** section, with an explicit on-page note that precise Investing/Financing separation awaits **fixed-asset tagging (D10)** and **owner-capital tagging** (the same foundation OwnersSummary's true-equity view needs). The statement still ties out exactly — the limitation affects *attribution between sections*, never the totals or the reconciliation.

- **Branch caveat (honest):** flows are branch-attributable per transaction; opening/closing **balances** reconcile at the bank-account level (all branches). When a single branch is selected, the UI says so explicitly.

**Bottom line:** institutional-grade and reconciled where it matters (the cash position and operating flows are exact); honestly scoped where the underlying data can't yet support finer attribution — no invented numbers, no forced plug.

---

## Files
- `src/lib/bank-cashflow-core.ts` — new shared reconciliation + direct-method cash-flow core
- `src/modules/CashFlow.tsx` — rebuilt real direct-method, bank-reconciled, branch-aware statement
- `src/modules/BankReconciliation.tsx` — refactored to import the shared core (behavior unchanged)
- `src/App.tsx` — `scopedBanks` branch lens + rewired CashFlow props (removed the P&L-proxy wiring)
