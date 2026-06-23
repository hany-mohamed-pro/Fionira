# Multi-Bank / Multi-Account Support — Investigation (Read + Live Test)

**Date:** 2026-06-22
**Type:** Investigation only — NO implementation. Determines scope/sequencing for
the coherence audit and Balance Sheet cash link.
**Verdict (one line):** The data/activation layer allows multiple active bank
files, but the bank module is **account-blind** — it captures no account
identity and **merges all active accounts into one running balance**, producing a
financially meaningless (actively misleading) reconciliation. Multi-bank is
**architecturally assumed-single in the parts that matter.**

---

## TASK 1 — Data-model trace (evidence)

### A) Is the bank account identified on a record? — NO
The bank record shape (from `bank-processor.ts`, confirmed against today's real
upload and a fresh parse) carries:
`_sourceFile`/`fileId` (file-level), `Invoice_Date`, `Entity_Name` (=التفاصيل),
`Narrative`, `Counterparty`, `Total_Amount`, `Flow_Direction`, `Category`,
`Transaction_Type`, `GL_Account`, `Running_Balance`.
There is **no bank account number and no bank name** on the record.

The statement's `رقم الحساب` (e.g. `21100000291807`, row 16) and bank/customer
name live in the **metadata preamble** — i.e. the rows *before* the detected
transaction header (`dataStartIndex`). `detectTabularHeader` skips straight to
the header row, so the entire preamble (account number, bank name, date range)
is **discarded, never captured**.
- Direct evidence: parsing the synthetic 2nd file, the only record key matching
  `/account|بنك|حساب/` is `GL_Account` — the classification, not the account.

### B) Does the registry allow multiple active bank files? — YES (data layer)
`active-file-registry.ts` `getActiveFiles()` returns a **filtered array** (not a
singleton); `getActiveFileIds()` returns an array; the records endpoint builds an
`activeFileIds` **Set** and aggregates records across *all* of them
(`server.ts` ~1289, ~1867). Two lifecycle endpoints exist:
`/api/erp/files/lifecycle/:stagedId/activate` (additive) and
`/.../replace/:targetId` (versioning). So "replace" is **not** the only path —
multiple bank files can be simultaneously active.

### C) Does reconciliation assume a single file? — YES (merges across files)
`BankReconciliation` and `BankMovements` take the aggregated bank `records` and
compute **one global** opening/closing/running-balance/continuity and one set of
control totals, sorted across *all* records with **no per-account grouping**.
There is no account dimension anywhere in the bank pages. → If two accounts are
active, their balances are merged into one meaningless running balance. **Verified
live below.**

---

## TASK 2 — Live test: second bank file (different account, overlapping period)

Uploaded a synthetic-but-realistic statement through the real UI:
`كشف بنك الرياض - حساب 99887766.xlsx` — different bank (بنك الرياض), different
account number (`99887766554433`), period 2026-04 (overlapping the active file's
2026-01→2026-04), 6 transactions. Parsed cleanly (6 records; debit 12,028.75 /
credit 73,000.00).

### B) What did the system offer? — Additive ("إضافة كمصدر جديد")
The governance flow classified it `NEW_PERIOD_SOURCE` and offered
**"إضافة كمصدر جديد"** (Add as new source), recommended action
"اعتماد الملف كمصدر بيانات جديد للفترة الزمنية المحددة" — **not** replace-only.
Activation succeeded: `POST /api/erp/files/lifecycle/.../activate → 200`.
So additive multi-file activation works.

> ⚠️ But the additive-vs-replace decision is **account-blind**: it keys on date
> overlap + a business key of `Invoice_Number|Entity_Name|Invoice_Date`
> (`upload-classifier.ts`). For banks `Invoice_Number=''` and `Entity_Name` is the
> raw التفاصيل. Two **different accounts covering the same months** with common
> transaction phrasings can exceed the 80% business-key overlap threshold and be
> mislabeled `CORRECTED_VERSION` → the user is steered to **replace**, silently
> losing account #1. My synthetic file avoided this only because its التفاصيل
> strings differed from the real file's.

### D) With both active — does it merge balances? — YES (broken)
With 2 active accounts the Reconciliation page showed:

| Metric | Single account (correct) | Two accounts (merged) |
|---|---|---|
| عدد الحركات | 746 | **752** (746+6 merged) |
| إجمالي المدين | 671,818 | **683,847** (671,818+12,029) |
| إجمالي الدائن | 671,883 | **744,883** (671,883+73,000) |
| الرصيد الافتتاحي | 1,188 | **1,188** (account #1 only) |
| الختامي المحسوب | 1,253 | **62,224** (acct#1 opening + BOTH accounts' net) |
| رصيد الكشف الختامي | 1,253 | **60,971** (account #2's closing!) |
| الحالة | **مطابق ✓** | **فرق في المطابقة: 1,253 ر.س** |
| تسلسل الرصيد | 742/745 | **739/751** (breaks at account boundary) |

The GL-nature table also merged both accounts with **no account label**
(e.g. تحويلات وحوالات صادرة 163→165). The merge is **silent** — no warning, and
**no console errors** (a logic defect, not a crash — more dangerous).

This is exactly the prohibited behavior the task flagged: two different banks'
balances combined into one running balance, yielding a false reconciliation.

*(Test data cleaned up afterward: synthetic file archived, the rich single
account restored and re-verified مطابق ✓ — no implementation performed.)*

---

## TASK 3 — Correcting the Balance Sheet cash premise

The prior plan said link Balance Sheet cash "summed across all active bank
accounts if multiple exist." **That premise is currently false/impossible:**
- There is **no per-account identity**, so "per bank account" cannot be
  distinguished today.
- "Cash = Σ each account's closing balance" needs **per-account** closing
  balances; today the only closing balance the system computes is the **merged**
  (meaningless) one.
- Summing net movements across accounts onto a single opening (as the page does)
  is arithmetically wrong.

**Corrected premise:** cash linkage is only safe **when exactly one bank account
is active**. A correct multi-account cash figure requires first (1) capturing
account identity and (2) computing per-account opening/closing — then summing the
per-account closing balances. Until then, do not link to the merged number.

---

## TASK 4 — Severity verdict & sequencing

**A) Classification:** Hybrid, but the decision-relevant parts are **(c)
architecturally assumed-single**:
- Activation/registry plumbing: **(a)** works (additive multi-file supported).
- Data model: **(c)** no account identity captured (account number/bank name
  discarded in the preamble).
- Reconciliation/movements: **(c)** single-account-assumed; **merges** balances
  across accounts into one meaningless running balance, with no warning.

**B) Priority & sequencing — YES, this outranks the cash link.**
This is a real architectural gap at the **"actively misleading"** severity bar: a
business with 2+ banks today gets a single merged running balance and a false
reconciliation status, silently. Recommended sequence:

1. **FIRST — multi-bank architecture (its own phase):**
   - Capture account identity in the parser from the preamble (`رقم الحساب`,
     bank name, customer) and tag every record with an `Account_Number` /
     `Bank_Name` / account key.
   - Segment Reconciliation & Movements **per account** (per-account
     opening/closing/running-balance/continuity); never merge running balances.
   - Make the staged-upload classifier **account-aware** so a different account
     in an overlapping period is never mistaken for a "corrected version".
2. **THEN — Balance Sheet cash link:** sum per-account closing balances (now
   well-defined). Doing the cash link first would bind it to a single-account
   assumption and require rework once accounts are separated.

The coherence-audit / cash-link task should be **rewritten** to depend on the
multi-bank work, or explicitly scoped to "single active bank account only" in the
interim.

---

## Success criteria
✅ TASK 1 data-model trace with evidence (no account id; registry multi-capable; recon merges)
✅ TASK 2 live test with a real second bank file upload (additive offered; balances merged — verified)
✅ TASK 3 prior premise corrected (per-account closing balances don't exist yet)
✅ TASK 4 honest verdict: assumed-single where it matters; fix multi-bank BEFORE cash link
✅ Investigation only — no implementation; test data cleaned up; state restored
