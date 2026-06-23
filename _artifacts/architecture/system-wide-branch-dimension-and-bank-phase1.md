# System-Wide Branch Dimension + Bank Multi-Account (Phase 1)

**Date:** 2026-06-22
**Builds on:** multi-bank investigation `61347e8` (found: account-blind, balances
merged across accounts).
**Scope this session:** define `branchId` as a central dimension **once**, and
apply account-awareness **only to the bank module**. Expenses/revenues/payroll
processors, categorization-engine, and erp-engine were **not touched**.

---

## TASK 0 — Central dimension (confirmed before implementation)

`src/backend/core/dimensions.ts` (new):
- `DEFAULT_BRANCH_ID = 'default'`, `BranchDimension { branchId; branchName?; branchActivity? }`,
  `withBranch(record, branchId?)`, `normalizeBranchId()`.
- Every record defaults to one implicit branch → **zero migration** for current
  single-branch tenants.
- **No DB table, no branch entity, no UI** — a record-level field with a default.
- `branchId` is **separate** from bank account identity (a branch may own several
  accounts).

**Confirmed design decision (signed off):** *Central `branchId` + account
segmentation* — branchId rides on every bank record (default), while the
immediate merge bug is fixed at the **account** level via `accountNumber`.

---

## Implementation (bank module only)

1. **Account identity captured** (`bank-classification.ts` →
   `extractBankAccountMeta`, used by `bank-processor.ts`): scans the metadata
   **preamble** (the rows header-detection skips) for `رقم الحساب` / `اسم البنك` /
   `اسم الحساب|اسم العميل`. Each record now carries `Account_Number`, `Bank_Name`,
   `Account_Label`, a stable `Account_Key` (number → label → bank → file), and
   `branchId: 'default'`.
   - Verified: real file → `Account_Number 21100000291807`; synthetic → `99887766554433`, `بنك الرياض`.
2. **Reconciliation & Movements segment by `Account_Key`** and compute
   opening/closing/running-balance/continuity **per account** — running balances
   are **never merged**. A single-account dataset renders exactly one section
   (unchanged behaviour). A portfolio header shows aggregate counts/totals
   (additive) without ever blending balances.
3. **Account-aware upload classifier** (`upload-classifier.ts` +
   `server.ts` wiring): if a staged file's account identity does not match any
   active account, it is forced to `NEW_PERIOD_SOURCE` ("حساب بنكي مختلف — مصدر
   بيانات جديد"), **never** a corrected-version/replace — safety-biased to
   additive. Same account → still offered as a corrected replacement.

---

## Before / after vs. the investigation (`61347e8`)

Two active accounts (real 21100000291807 + synthetic بنك الرياض 99887766554433):

| | Investigation (merged) | Now (segmented) |
|---|---|---|
| Reconciliation sections | 1 (merged) | **2 (one per account)** |
| Running balance | one global, meaningless | **per account** |
| Account 1 (21100000291807) | — | opening 1,188 → closing 1,253 → **مطابق ✓** |
| Account 2 (بنك الرياض) | — | opening 0 → closing 60,971 → **مطابق ✓** |
| Reconciliation status | **false "فرق 1,253"** | **2 × مطابق ✓, 0 mismatches** |
| Banner | none | "يوجد 2 حسابات بنكية — كل حساب يُطابَق على حدة (لا يتم دمج الأرصدة)" |

Portfolio totals (additive, correctly shown): مدين 683,847 / دائن 744,883 / 752 txns.
Movements page likewise renders 2 account sections. **No console errors.**

Upload classifier (live): the different account was offered
**"إضافة كمصدر جديد"** (additive), recommended "اعتماد الملف كمصدر بيانات جديد" —
not replace. Re-uploading the *same* account was correctly offered as
"نسخة معدلة" (replace).

---

## Regression — single real file unchanged

After cleanup (synthetic archived), single active account:
`رقم الحساب 21100000291807`, 746 txns, مدين **671,818** / دائن **671,883**,
**1 × الكشف مطابق ✓**, rich GL natures intact. Identical to the pre-change
single-account behaviour. `tsc --noEmit` clean on all changed files.

---

## TASK 7 — System-wide rollout path (documentation only; NOT implemented)

The same central `branchId` generalises to every module with minimal friction.
For each processor (future work, behind its own sign-off):

- **expenses-processor.ts / revenues-processor.ts / payroll-processor.ts**
  (all currently `@DO_NOT_MODIFY`):
  1. `import { DEFAULT_BRANCH_ID } from '../dimensions'` and set
     `branchId: DEFAULT_BRANCH_ID` on each emitted record (or wrap with
     `withBranch(record)`). One line; zero behaviour change today.
  2. When branch data becomes available (a future per-row "branch" column, or a
     per-file branch selection at upload), pass the resolved id instead of the
     default — the field and all downstream consumers already exist.
- **Module-specific identity stays separate from `branchId`** (mirroring banks):
  e.g. expenses keep `Vendor`/invoice identity, revenues keep customer identity;
  `branchId` is the orthogonal business-unit dimension layered on top.
- **Reporting/aggregation:** dashboards and the Balance Sheet can later group or
  filter by `branchId` (e.g. cash per branch = Σ per-account closing within that
  branch). Because every record carries the field with a safe default, adding a
  branch filter is additive — no record migration.
- **Branch management entity/UI** (naming/editing branches) is a separate future
  phase; the dimension does not require it to function.

This proves TASK 0's design is reusable: adopting it elsewhere is a one-line
import + field, not a redesign.

---

## Files changed
- `src/backend/core/dimensions.ts` (new — central dimension)
- `src/backend/core/processors/bank-classification.ts` (account extraction + GL nature already present)
- `src/backend/core/processors/bank-processor.ts` (account fields + branchId)
- `src/modules/BankReconciliation.tsx`, `src/modules/BankMovements.tsx` (per-account segmentation)
- `src/lib/upload-classifier.ts` + `server.ts` (account-aware classification)

NOT touched: expenses/revenues/payroll processors, categorization-engine, erp-engine, shared-processor.

## Success criteria
✅ TASK 0 central design confirmed before implementation
✅ branchId defined once, centrally, reusable by future modules (Task 7 path)
✅ Bank accountNumber/bankName captured, kept distinct from branchId
✅ Reconciliation/Movements never merge across bank accounts (2×مطابق ✓ live)
✅ Upload classifier account-aware, safety-biased toward additive
✅ Zero regression on the real single-file scenario (مطابق ✓, totals unchanged)
✅ Task 7 rollout path documented for expenses/revenues/payroll
