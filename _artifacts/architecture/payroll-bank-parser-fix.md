# Payroll & Bank Excel Parser — Robust Header Detection Fix

**Date:** 2026-06-22
**Scope:** `payroll-processor.ts`, `bank-processor.ts`, new `header-detection.ts`
**Trigger:** Two REAL user files failed/misbehaved on upload:
- Payroll: `_رواتب   JANUARY 2025 xls.xlsx` (مؤسسة منى سليمان احمد موصلي لتقديم الوجبات)
- Bank: `Records_12042026-2.xlsx` (Saudi bank statement export)

Every figure below was produced by running the **actual processor functions**
and the **live UI upload** against the **actual user files** — not synthetic
stand-ins.

---

## TASK 1 — True baseline (current parser vs. the REAL files)

| File | Old behaviour | Root cause |
|------|---------------|------------|
| **Bank** | **THROWS** `Could not detect structural header for banks.` → file rejected, 0 records | Real header is at **row 21**, but detection scanned only `Math.min(20, …)` = rows 0–19. The header is past the window, so it is never found. |
| **Payroll** | **Did NOT throw** — extracted 10 records, but every value was wrong: `Net=0`, `Basic=0`, `Total=9500` (the basic-salary group header, not net) | Two-row merged header. Parser locked onto **row 5 only** (top-level groups), never reading **row 6** (the real detail columns). |

This **refines** the original diagnosis:
- The bank file is the one that literally throws ("تعذر تحليل / معطوب بنيوياً").
- The payroll file's problem is header *misinterpretation*, not detection
  failure — it silently produced wrong numbers. A second, latent issue
  (`parseAmt` used `/[^d.-]/`, a typo that strips all digits → always 0) made
  the breakdowns doubly broken.

### Confirmed real structures

**Payroll** — 3 sheets, `صرف رواتب` is Sheet[0] (the tabular disbursement register):
```
row5 [s7/n0]  رقم | الاسم | الراتب | · | · | · | · | اجمالي الراتب | الاستقطاعات | · | · | · | اجمالي الاستقطاع | صافي الراتب
row6 [s9/n0]   ·  |   ·   | الراتب الاساسي | بدل سكن | بدل نقل | بدل وجبة | اخرى | · | سلف | غياب | ايقاف راتب | جزاءات
row7 [data]    1  | هبه محمود محمد سالم | 9500 | 2375 | 500 | · | · | 12375 | · | · | · | · | 0 | 12375 | …
```
Two physical header rows must be **merged** to recover all column meaning:
detail columns (basic/housing/transport/loan/absent…) live only in row 6;
totals (gross/net/الاستقطاعات) live only in row 5.

**Bank** — single sheet `Records`, 19-row metadata preamble before the header:
```
rows 0–18  account name / number / date range / transaction totals (s1–s2 each)
row 21 [s9/n0]  [SA]Processing Date | التفاصيل | الوصف | تفاصيل إضافية | المرجع | ملاحظات | مدين | دائن | الرصيد
row 22 [data]   46124 | شراء محلي عبر الإنترنت | … | -1,179.47 | · | 1,252.84
```
(The consultant's "header at row 29 / 29-row preamble" was approximate; the
real header is at row 21. The *class* of bug — arbitrary-length preamble past
a fixed 20-row window — is exactly as described.)

---

## TASK 2 — Fix design (driven by the real evidence)

New shared module **`header-detection.ts`** (payroll & bank only — the
`@DO_NOT_MODIFY` expenses/revenues/shared files are untouched):

1. **Scan the whole sheet** (bounded at 200 rows), not the first 20 → handles an
   arbitrary-length preamble (bank).
2. **Keyword anchor** — a candidate header row must contain a domain keyword
   (`مدين/دائن/الوصف/المرجع/رصيد` for bank; `اسم/راتب/استقطاع/موظف/net/salary`
   for payroll). This lets us relax the structural test without mistaking a
   title/metadata row for the header.
3. **Sparse-cell tolerant** structural test: `stringCount ≥ 3 && stringCount >
   numberCount` (handles `None` gaps from merged cells; no longer requires
   `numberCount === 0`).
4. **Multi-row merge** (`mergeMultiRow`, payroll only): absorb consecutive
   label-only rows beneath the first header row and concatenate per-column
   labels (e.g. col 2 → `"الراتب الراتب الاساسي"`, col 13 → `"صافي الراتب"`).
   Data starts after the last header row. A clean single-row header is
   unaffected because the first numeric row ends the block.
5. **Priority-scored `getCol`** (`makeScoredGetCol`): returns the column matching
   the **highest-priority** pattern, with exclusions — fixes the greedy-substring
   bug where a bare `/راتب/` bound *net* to the basic-salary group header, and
   where `/in/` inside `"processing date"` would have stolen the *credit* column
   in the bank file.

**Sheet selection (multi-sheet payroll):** the processor uses the first sheet.
For this file that is the correct `صرف رواتب` (actual disbursement). The other
sheets are `قسيمة راتب` (per-employee slip, non-tabular) and `استحقاق رواتب`
(gross accrual, sum 49,657 vs. disbursed 38,657). **Known limitation, flagged:**
single-sheet processing — if a future file ordered the non-tabular slip sheet
first, the anchor test would skip/fail rather than pick the right sheet.

**Latent bugs the fix uncovered (and also fixed, since they block "sane values"):**
- Bank: debits are stored **negative** (`-1,179.47`); old `debit > 0 ? debit : credit`
  pushed every debit to credit=0 → `Total=0`, miscategorised as deposit. Now
  direction is decided by which column carries a value, amount = magnitude
  (works for negative- *and* positive-debit formats).
- Bank: date column is an Excel serial (`46124`) — now parsed via the existing
  shared `parseExcelDate` → `2026-04-12`.
- Payroll: `VAT_Amount` was populated with the deductions total. The engine's
  own rule flags any payroll VAT as accounting-impossible (`PAYROLL_WITH_VAT`).
  Once deductions extracted correctly, this fired a **false CRITICAL** alert on
  منى موصلي. Payroll has no VAT → `VAT_Amount: 0`, deductions moved to
  `Total_Deductions` + `DeductionsBreakdown`.

---

## TASK 3 — Before / after against the REAL files

### Payroll `_رواتب   JANUARY 2025 xls.xlsx`

| Metric | Before | After |
|--------|--------|-------|
| Records extracted | 10 (garbage values) | **10 (correct)** |
| هبه محمود محمد سالم | Basic 0, Net 0, Total 9500 | **Basic 9500, Housing 2375, Transport 500, Gross 12375, Net 12375** |
| Sum of net salaries | n/a (all 0 net) | **38,657 — exactly matches sheet total row (الاجمالي صافي = 38657)** |
| منى موصلي (stopped salary) | Net 0 (by accident) | **Net 0 correctly: ايقاف راتب 10000 captured as deduction** |

All 10 employees, after:
```
هبه محمود محمد سالم   basic=9500  net=12375  total=12375
منى موصلي             basic=10000 net=0      total=0      (ايقاف راتب 10000)
بشير ملوندو           basic=6500  net=7150   total=7150
دبندرا شيرسزا         basic=3800  net=4465   total=4465
عظيم حسين             basic=2000  net=2662   total=2662
محمد اسماعيل          basic=2200  net=2181   total=2181
ام دي سيف الاسلام     basic=2000  net=1824   total=1824
عماد الطيب            basic=5000  net=5000   total=5000
انور                  basic=1500  net=1500   total=1500
جويل السواق           basic=1500  net=1500   total=1500
                                  ────────
                          Σ net = 38,657  ✓ (= sheet total)
```

### Bank `Records_12042026-2.xlsx`

| Metric | Before | After |
|--------|--------|-------|
| Parse result | **THROWS — rejected** | **746 transactions** |
| Header located | never (window=20, header=21) | row 21, data from row 22 |
| Debits | — | **583, Σ = 671,818.18 — matches sheet "إجمالي المبلغ المدين"** |
| Credits | — | **163, Σ = 671,882.98 — matches sheet "إجمالي المبلغ الدائن"** |
| Dates | — | parsed (`46124` → `2026-04-12`) |

Sample (after):
```
2026-04-12  سحب بنكي    1179.47  "شراء محلي عبر الإنترنت"
2026-04-12  سحب بنكي       0.26  "ضريبة عملية نقاط بيع فوري"
2026-04-12  إيداع بنكي   220.00  "إيداع نقاط بيع/دفع الكتروني"
```
The 583 / 163 counts also match the sheet's own stated transaction counts.

---

## TASK 4 — Regression (zero regression)

Synthetic cases through the real processors (`scratch/parser-fix/regression.ts`):

| Case | Result |
|------|--------|
| Clean 4-column single-row payroll header | PASS — 2 records, net 6000 (multi-row merge does not over-absorb data) |
| Clean bank sheet + short preamble | PASS — 2 records, 1 debit / 1 credit |
| No-header sheet | PASS — throws gracefully (not a crash) |
| Positive-debit bank format (debit NOT negative) | PASS — amount 750, سحب بنكي (abs() is format-agnostic) |

Real expense/revenue files through their **untouched** processors:
```
revenues  sales-q1.xlsx      records=450   skipped=1
revenues  sales-q2.xlsx      records=1028  skipped=1
expenses  purchases-q1.xlsx  records=374   skipped=1
expenses  purchases-q2.xlsx  records=341   skipped=1
TOTAL = 2193 records, zero throws
```
> Note: the prior session's "730 records" referred to a different file set not
> available on this machine; the proven invariant is that `expenses-processor.ts`
> / `revenues-processor.ts` / `shared-processor.ts` are **byte-identical**
> (`git diff` touches only payroll, bank, and the new file) — regression-free by
> construction, and demonstrated live on the current real quarterly files.

`tsc --noEmit`: no errors in any changed file.

---

## TASK 5 — Live UI upload (real server pipeline, port 3100)

Both files uploaded through the real `<input type=file>` → React `handleUpload`
→ `POST /api/erp/files/governance/staged-upload` → ingestion session.

**Payroll:** `[INGESTION] Processing file _رواتب JANUARY 2025 xls.xlsx as payroll`
→ session returned **10 records, ALL `APPROVED`**, **0** `PAYROLL_WITH_VAT`
flags, Σ net = **38,657**. UI showed "تم رفع ملفك بنجاح ✓ … قيد القرار" with
"عدد السجلات 10". (Two pre-existing `غير صالح` entries for the same filename are
the user's *historical* failed uploads persisted in `uploads.json` — direct
corroboration of the original bug, now contrasted with the passing upload.)

**Bank:** `[INGESTION] Processing file Records_12042026-2.xlsx as banks` →
session returned **746 records, ALL `APPROVED`**; 583 debits Σ 671,818.18 +
163 credits Σ 671,882.98; dates `2026-04-12`. Banks dashboard reads
"تم معالجة 746 عملية".

---

## TASK 6 — Multi-file upload (explicitly deferred)

Out of scope. Multi-file upload is a missing **feature**, not part of this
bug fix. Not implemented here. Defer to a separate follow-up if wanted.

---

## TASK 7 — Do expenses/revenues share the vulnerability? (DEBT, not fixed today)

**Tested, not inferred** (`scratch/parser-fix/task7-vuln.ts`): built an expense
file with a 25-row metadata preamble before a sparse real header and ran the
real `processExpenses`.

- **Different detector:** expenses/revenues do NOT use the brittle
  `stringCount>3 && numberCount===0` logic. They use keyword-**scoring**
  (pick the row with the most keyword hits) + a priority-scored `getCol`. They
  handle **sparse headers fine**.
- **Shared weakness:** they still cap the search at `Math.min(20, data.length)`.
  With a >20-row preamble the real header is missed, they fall back to **row 0**,
  mis-map every column, and **silently emit 26 garbage records** (entity
  "غير محدد", null financials) — worse than the bank's honest throw.

**Verdict:** same vulnerability *class* (fixed preamble window), different
symptom (silent garbage vs. throw). **Not fixed today** — `expenses-processor.ts`
and `revenues-processor.ts` are `@DO_NOT_MODIFY`. Recommended follow-up: apply
`detectTabularHeader` (or at minimum remove the 20-row cap) to both, behind
explicit user sign-off to unlock those files.

---

## Files changed
- `src/backend/core/processors/header-detection.ts` (new)
- `src/backend/core/processors/payroll-processor.ts`
- `src/backend/core/processors/bank-processor.ts`

Untouched (verified): `expenses-processor.ts`, `revenues-processor.ts`,
`shared-processor.ts` (all `@DO_NOT_MODIFY`).
