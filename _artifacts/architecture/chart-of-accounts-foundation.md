# Architecture Proposal — Chart-of-Accounts Foundation (typed accounts + journal_entries → real Balance Sheet)

**Date:** 2026-06-30
**Type:** Architecture proposal (approved 2026-06-30). Phased; implementation begins with Phase A only after explicit confirmation.
**Goal:** replace the estimated/"تقديري" Balance Sheet + plug-equity with a **real** position derived from the actual double-entry journal entries — the shared foundation that unblocks registry items **D12, formal WIP asset line, item 11 (real owners' equity), and part of item 7 (cash-flow investing/financing)**.
**Methodology:** analyze → propose → no implementation until approval. `categorization-engine.ts` and (in Phase A) `erp-engine.ts` are NOT touched.

---

## 1) Current-state analysis (grounded in the actual code)

### A) The current Balance Sheet is 100% estimated
`src/modules/BalanceSheet.tsx` receives only `{revenues, expenses, payroll}` from `incomeStatement` (App.tsx ~2782) and derives every line by a fixed assumed ratio:

| Line | Current formula | Problem |
|---|---|---|
| Cash | `netIncome × 0.4` | assumption, not a real bank balance |
| Accounts receivable | `revenues × 0.15` | assumption |
| Inventory | `expenses × 0.10` | assumption |
| Accounts payable | `expenses × 0.12` | assumption |
| Accrued expenses | `payroll × 0.05` | assumption |
| **Equity** | **`totalAssets − totalLiabilities` (plug)** | **balances tautologically, by construction, not by correctness** |

The page already carries honest "⚠️ ليست ميزانية فعلية — تقديري" banners.

### B) The real accounting foundation ALREADY EXISTS and is unused by the Balance Sheet
- **`erp-engine.ts::generateJournalEntries`** already produces proper **double-entry** journal entries for every operation, posting to balance-sheet-natured accounts:
  - Expense → **Dr** `{expense category}` / **Cr** `الموردين - {entity}` (AP); opening → **Cr** `رأس المال (أرباح مبقاة)`
  - Revenue → **Dr** `العملاء - {entity}` (AR) / **Cr** `{revenue category}`
  - Bank → **Dr/Cr** `البنوك - {entity}` (+ `رأس المال` / bank-settlement)
  - Payroll → **Dr** `مصروف راتب أساسي` / `مصروف - {allowance}` / **Cr** `رواتب وأجور مستحقة الدفع` (accrued liability) / `ذمم دائنة - {deduction}`
  - Inventory → **Dr** `مخزون بضاعة` / **Cr** `الذمم الدائنة الموردين`
- **1,179 real journal entries** persisted in `data/erp_registry.json` (`journalEntries`), served via `/api/erp/ledger` and `/api/debug/journalEntries/raw`.
- **`TrialBalance.tsx` already computes per-account balances** (debit/credit/balance) by aggregating the journal entries, with separate VAT input/output handling. **160 distinct accounts.**

### C) The single structural gap
There is **no account-TYPE classification** (Asset / Liability / Equity / Revenue / Expense). Account names are free-text, so they cannot be grouped into a balance sheet, and `BalanceSheet.tsx` ignores the journal entries and estimates instead. **This is the only thing missing — not the journal entries themselves.**

---

## 2) Chart-of-accounts design (the types)

An **additive, pure** layer (`src/lib/chart-of-accounts.ts`): a pure function classifying an account name → its accounting type, using the conventions `erp-engine` already emits (no change to journal generation).

```
AccountType = Asset | Liability | Equity | Revenue | Expense
```

| Type | Subtype | Matching accounts (prefix/pattern) |
|---|---|---|
| **Asset** | Cash & banks | `البنوك - *`, `نقدية *`, `حساب تسوية البنك (مدينة)` |
| | Accounts receivable | `العملاء - *` |
| | Inventory | `مخزون *` |
| | Fixed assets | `أصول ثابتة - *` (from `CAPEX_CATEGORIES`) |
| | WIP *(new, §4)* | `أعمال تحت التنفيذ` |
| **Liability** | Accounts payable | `الموردين - *`, `الذمم الدائنة *` |
| | Accruals | `رواتب وأجور مستحقة الدفع`, `ذمم دائنة - *` |
| | Taxes payable | `ضريبة المخرجات`, `الضرائب` |
| | Unearned revenue *(new, D12)* | `إيراد مقدم / غير مكتسب` |
| **Equity** | Capital | `رأس المال (أرباح مبقاة)` |
| | Drawings *(new, item 11)* | `مسحوبات الملاك` |
| | Retained earnings | **derived = Σ(Revenue − Expense) from the journal entries** |
| **Revenue** | — | `إيرادات *` + revenue categories |
| **Expense** | COGS / OPEX | `CATEGORY_ORDER` cost/expense categories |

Classification keys off the **account prefix + `CATEGORY_ORDER` / `COGS_CATEGORIES` / `CAPEX_CATEGORIES`** (already defined in `financial-utils.ts` / `pnl-core.ts`). Any unknown account → "غير مصنّف", surfaced for review (suggest-don't-force) rather than guessed.

---

## 3) journal_entries design

The double-entry layer **exists and works — we do not rebuild it.** Design = reuse + a few additive postings:

**A) Read path (Phase A — does NOT touch `erp-engine`):** a builder `computeBalanceSheetCore(journalEntries, chartOfAccounts)`:
1. Aggregate each account's balance using the **exact same logic as `TrialBalance`** (single source, no drift).
2. Classify each account by type (§2).
3. **Assets = Σ Asset balances · Liabilities = Σ Liability balances · Equity = Capital + (Retained earnings = Σ Revenue − Σ Expense from the journal entries) − Drawings.**
4. **`Assets = Liabilities + Equity` holds by REAL construction** — every journal entry balances (Σ Dr = Σ Cr), so it ties out without any plug. Any non-zero difference = a real error, surfaced (same rigor as the bank-reconciliation gate).

**B) Generation for the new accounts (Phase B — additive postings in `erp-engine`, each behind its own confirmation):**
- **D12:** customer advance → **Cr** `إيراد مقدم (التزام)` instead of `إيرادات` (recognized later).
- **WIP:** active-project cost → **Dr** `أعمال تحت التنفيذ` / **Cr** payable; on completion → **Dr** COGS / **Cr** WIP.
- **Owner contributions/drawings →** `رأس المال` / `مسحوبات الملاك`.

**Guarantees:** `categorization-engine.ts` is **never touched** (the type layer only reads categories). Phase A does **not** touch `erp-engine.ts`. **Validation gate:** the journal-derived profit must equal `computePnLCore` to the halala.

---

## 4) How this unblocks the four deferred items — and what remains

| Item | How it's unblocked | What remains |
|---|---|---|
| **Item 11 — real owners' equity** | ✅ **Immediately in Phase A** — retained earnings computed for real from the journal entries (no plug). | Owner contribution/drawing data capture = a small entry path (Phase B). |
| **Formal WIP asset line** | The type layer classifies `أعمال تحت التنفيذ` as an Asset → it appears on the Balance Sheet. | Generate the WIP journal entry on defer/complete (Phase B; links today's D11 P&L-deferral to a real posting). |
| **D12 — revenue deferral** | `إيراد مقدم` typed as a Liability appears on the Balance Sheet. | Change the advance-payment journal generation (Phase B, `erp-engine`). |
| **Item 7 — cash-flow investing/financing** | The contra-account's type on a bank entry distinguishes: fixed-asset → investing, capital/loan → financing. | Enrich bank-entry contra-accounting (currently limited to capital/settlement). |

**Still deferred even after the foundation:**
- **Opening balances at go-live** — an accurate position statement needs real opening balances (cash/AR/assets before the first upload). Without them, the Balance Sheet reflects **only the uploaded period's activity**, not the full position. (= migration; the single biggest caveat — see §5.)
- AR/AP aging — detail only, not needed for the totals.
- Bank-entry contra enrichment for full investing/financing split.

---

## 5) Risk assessment

- **Touches real existing data?** Phase A is **read-only** over the existing 1,179 journal entries — **no modification, no regeneration** → very low risk. Phase B adds new entries (never edits old ones).
- **Migration needed?** **Yes — partially, stated honestly:** the journal-derived Balance Sheet reflects only the uploaded period. A full position statement needs **opening balances** (entered as an opening `رأس المال (أرباح مبقاة)` entry — the structure already supports it). The existing journal entries themselves need no migration (their shape is sound).
- **Backward compatibility:**
  - `TrialBalance` and `GeneralLedger` run on the same journal entries → **no impact**.
  - `computePnLCore` / Income Statement is **independent** of the journal entries → no conflict (with the reconciliation gate as a check).
  - Safe transition: **keep the estimated Balance Sheet, labelled "تقديري", side-by-side with the new real one until the real one is approved after a live proof**, then replace (same one-step-at-a-time discipline). Remove the "تقديري" label only after proving `Assets = Liabilities + Equity` on real data.

---

## Phased rollout (recommended)
- **Phase A (read-only, highest value / lowest risk):** account-type layer + balance-sheet builder reading the existing journal entries → **a real Balance Sheet + real equity (real retained earnings)** without touching `erp-engine` or `categorization-engine`. Resolves most of item 11 and proves the foundation. *(Estimated current Balance Sheet kept side-by-side, still labelled "تقديري", until live-proven.)*
- **Phase B (additive postings, each behind confirmation):** formal WIP asset entry (asset line) → unearned-revenue entry (D12) → owner contribution/drawing capture → bank-entry contra enrichment (item 7).
- **Phase C (later):** opening balances (migration) + AR/AP aging.

---

## Live-proof acceptance criteria (Phase A)
On real data: **Assets = Liabilities + Equity exactly** (not by plug — every entry balances), and **journal-derived profit (Σ Revenue − Σ Expense) = `computePnLCore` to the halala**. Documented with the real numbers, same rigor as the D11 verification.
