# Trial Balance — Deep Audit (read-only)

> **Verdict up front:** **SOUND.** The Trial Balance is built from **real, tenant-scoped, active
> journal entries** and balances **by double-entry construction** — *not* by a forced plug like the
> Balance Sheet's equity. It even ships a genuine imbalance-detection warning. **No "تقديري" label is
> warranted** (applying one would be dishonest in the opposite direction). Minor, non-blocking gaps are
> noted, tied to the already-known free-text-account / opening-balance debt — none affect the balance.
>
> Read-only audit — no code changed. Base HEAD `f60038f`.

---

## The distinction this audit exists to make

- **Balance Sheet (prior audit):** balanced because `equity = assets − liabilities` is a **residual
  plug** → balances for *any* input → the balance check is **vacuous** → verdict "actively misleading."
- **Trial Balance (this audit):** balanced because **every journal entry contributes its amount to
  exactly one debit and one credit**, so `Σ debits ≡ Σ credits` by **double-entry construction** → this
  is the *legitimate* reason a trial balance balances. These are fundamentally different, and the
  evidence below shows Trial Balance is the legitimate kind.

## TASK 1 — what the module actually does (file:line evidence)

### A) Inputs and origin — REAL data, not estimates
[TrialBalance.tsx:24-29](../../src/modules/TrialBalance.tsx) fetches
`GET /api/debug/journalEntries/raw` with the user's ID token and keeps only `isActive !== false`.
The endpoint ([server.ts:1180+](../../server.ts)) is `authenticate`-guarded and returns
`devMemoryDb.journalEntries.filter(d => d.tenantId === tenantId)` — i.e. **real journal entries,
tenant-scoped, active versions only** (superseded `_v{n}` rows correctly excluded). No ratios, no
estimation. This is the opposite of the Balance Sheet's 3-number estimate.

### B) Exact aggregation per account ([TrialBalance.tsx:46-70](../../src/modules/TrialBalance.tsx))
```
for each entry e:
   balances[e.debitAccount].debit   += e.amount
   balances[e.creditAccount].credit += e.amount
   if e.taxAmount > 0:
     expenses: VAT-Input.debit  += tax ; e.creditAccount.credit += tax
     revenues: VAT-Output.credit+= tax ; e.debitAccount.debit   += tax
     other:    الضرائب.debit     += tax ; e.creditAccount.credit += tax
```
Each account's debit and credit are **summed from the actual entries** (`formatAmount` is *display only*
— confirmed: the math at :46-82 is independent of the formatter, consistent with the Phase 1J
display-only note).

### C) Does total debit = total credit BY CONSTRUCTION? — **Yes, legitimately; no plug.**
Every line above adds an amount to **one debit and one matching credit simultaneously** (the main
amount, and each tax amount). Therefore `totalDebit` and `totalCredit` ([:72-82](../../src/modules/TrialBalance.tsx))
increase in lockstep, so they are equal **because of double-entry pairing**, not because any figure was
back-solved. **There is no equity-style plug anywhere.** Crucially, the component does **not** assume
balance — it independently sums both sides and renders an explicit **red warning** if they ever diverge
by > 0.05 ([:137-142](../../src/modules/TrialBalance.tsx): *"تنبيه: محصلة الميزان غير متطابقة!"*). That
is a *real* validation — the exact thing the Balance Sheet structurally cannot do.

### D) Connection to `erp-engine.ts` — confirms the construction guarantee
`erp-engine.ts` generates single-row, inherently-balanced entries (one `debitAccount` + one
`creditAccount` + one `amount`; payroll splits into multiple balanced sub-rows —
[erp-engine.ts:101,131,136](../../src/backend/core/erp-engine.ts)). The Trial Balance's own aggregation
mirrors each amount onto both sides, so balance is guaranteed by construction **regardless** of how the
engine splits entries. **This is "balances because double-entry construction guarantees it" (fine) —
NOT "balances because a plug was inserted" (the Balance Sheet flaw).**

### E) What the user sees
A real table: account · مدين · دائن · الرصيد, sorted, with per-row drill-down to the source module
([:106-126](../../src/modules/TrialBalance.tsx)), a matched-totals footer ([:128-135]), and the
imbalance warning. No fake precision; the numbers are the actual ledger sums.

## TASK 2 — vs what a real Trial Balance requires

- **(A)** A trial balance just lists each account's net debit/credit from posted entries — structurally
  the **simplest** of the three statements; it does **not** need the asset/liability/equity type model
  the Balance Sheet was missing.
- **(B)** Therefore its risk is **genuinely LOWER** than the Balance Sheet's: it needs only correct
  aggregation of entries that already exist — which it does correctly. It is **not** blocked on the
  missing account-type model.
- **(C)** Specific, honest minor gaps (none break the balance):
  1. **Free-text account fragmentation** — accounts are free-text Arabic strings (e.g. `ذمم دائنة
     الموردين` vs `الذمم الدائنة الموردين`, [erp-engine.ts:101 vs 136](../../src/backend/core/erp-engine.ts));
     spelling variants appear as **separate rows**. Totals still match; only per-account grouping is
     fragmented. This is the same free-text-account / canonicalization debt already logged — not a new
     flaw.
  2. **No opening balances / carry-forward** — it reflects **movement within the loaded data**, not a
     multi-period ledger with brought-forward balances. Expected given no period-close mechanism exists.
  3. **`/api/debug/...` naming** — cosmetic; the route is authenticated + tenant-scoped and works.

## TASK 3 — user-facing risk

- **(A)** For the user's real restaurant data: **reliable** for what it represents — a faithful,
  tenant-scoped aggregation of the actual journal entries, balanced by construction, with a real
  mismatch alarm. There is no fabricated figure here.
- **(B)** **Good news, stated plainly:** unlike the Balance Sheet, the Trial Balance is **sound**. Its
  balance is the legitimate double-entry kind, its inputs are real, and it actively validates itself.
- **(C)** **No labeling fix warranted.** Slapping "تقديري" on real, construction-guaranteed figures
  would be dishonest in the opposite direction. The minor gaps in 2(C) are pre-existing, non-blocking,
  and belong to the already-tracked accounting-foundation debt — **no action required now.**

## TASK 4 — verdict

**SOUND — double-entry-guaranteed, real-data, self-validating. No fix needed.** It does **not** share
the Balance Sheet's forced-plug flaw. The only follow-ups (account-name canonicalization, opening
balances) are existing deferred-debt items, optional and non-urgent.

## TASK 5 — fix proposal

**None required.** (Honesty in both directions: the Balance Sheet got a warning label because its
numbers are fabricated; the Trial Balance gets none because its numbers are real.) If desired *later*,
the only worthwhile improvement is **account-name canonicalization** so spelling variants don't
fragment rows — but that belongs to the broader canonicalization/COA effort, not a Trial Balance fix.
