# Tax Declaration (VAT) — Deep Audit (read-only)

> **Verdict up front:** the **bottom line is SOUND** — Net VAT Due = Σ(output VAT) − Σ(input VAT),
> summed from the **actual real per-invoice `VAT_Amount`** over **real, period-filtered** records, with a
> correct payable/refundable direction and an **honest "indicative, verify with ZATCA" disclaimer.**
> **BUT** there is a real ZATCA-accuracy defect in the *subtotal labels*: the two "**الخاضعة للضريبة**"
> (taxable) lines actually sum **taxable + non-taxable together**, mislabeling exempt/zero-rated amounts
> as taxable — even though the data carries the two separately. This does **not** affect the net-VAT
> number, but it misrepresents the taxable base and omits the standard/zero-rated/exempt split a real
> VAT return needs. **Not "actively misleading" (the decisive number is real & disclaimed), but warrants
> a targeted labeling/breakdown fix — not a "تقديري" estimate label.**
>
> Read-only audit — no code changed. Base HEAD `72bd0d9`.

---

## TASK 1 — what the module actually does (file:line evidence)

### A) Inputs and origin — REAL, period-filtered
`TaxDeclaration` receives `revenuesRecords` + `expensesRecords` props
([TaxDeclaration.tsx:7-13](../../src/modules/TaxDeclaration.tsx)). App passes
`plFilteredRevenues` / `plFilteredExpenses` ([App.tsx:2786-2789](../../src/App.tsx)) — the **same real,
date-filtered classified records** the Income Statement uses. So the declaration is **real data, scoped
to the selected period** (correct — a VAT return is per-period). No estimation.

### B) Exact calculation ([TaxDeclaration.tsx:14-39](../../src/modules/TaxDeclaration.tsx))
```
totalSales        = Σ (Taxable_Amount + NonTaxable_Amount)  over revenue records
totalSalesVat     = Σ  VAT_Amount                           over revenue records   // output VAT
totalPurchases    = Σ (Taxable_Amount + NonTaxable_Amount)  over expense records
totalPurchasesVat = Σ  VAT_Amount                           over expense records   // input VAT
netVatDue         = totalSalesVat − totalPurchasesVat
```

### C) Is the VAT math correct? — **the net figure: YES; the subtotals: mislabeled**
- **Net VAT Due = output VAT − input VAT** is the correct ZATCA formula, and it is summed from the
  **actual `VAT_Amount` on each record** (not recomputed as base×15%), which is the right approach. ✅
- **Direction is correct:** `> 0` → "مبلغ مستحق الدفع للهيئة" (payable); `< 0` → "مبلغ مسترد"
  ([:108-113](../../src/modules/TaxDeclaration.tsx)). ✅
- **Defect:** `totalSales`/`totalPurchases` add `Taxable_Amount + NonTaxable_Amount` but the UI labels
  them **"إجمالي المبيعات/المشتريات الخاضعة للضريبة"** (the *taxable* total) — so **non-taxable
  (exempt/zero-rated) amounts are counted as taxable.** The records carry `Taxable_Amount` and
  `NonTaxable_Amount` as **distinct fields** ([types.ts:20-21](../../src/types.ts)), so the breakdown
  exists and is simply discarded. ❌ (label/accuracy)

### D) Scoping (tenant / active data)
Same path as the Income Statement: the records come from the tenant-scoped data hooks, **period-filtered**
via `plFiltered*`, and reflect the **active file** (governance/active-file-registry). Legitimate; no
per-record `isActive` filter (records aren't versioned like journal entries) — same model noted in the
Income Statement audit.

### E) What the user sees
Two cards (Sales / Purchases) each showing a "taxable total" + its VAT, then a prominent **Net VAT Due**
with payable/refundable wording, and a clear amber disclaimer
([:118-122](../../src/modules/TaxDeclaration.tsx)): *"نموذج استرشادي مبني على البيانات المدخلة … يجب
مراجعة جميع الفواتير ومطابقتها لمتطلبات ZATCA قبل تقديم الإقرار الرسمي."* The disclaimer is **honest and
adequate** — it does not present this as a file-ready official return.

## TASK 2 — vs a real ZATCA VAT return

| ZATCA requirement | This module |
|---|---|
| Net VAT = output − input | ✅ correct, from actual VAT amounts |
| Per-period | ✅ period-filtered |
| **Standard-rated base reported separately** from zero-rated & exempt | ❌ lumps taxable + non-taxable into one "taxable" line |
| Zero-rated sales box | ❌ not separated |
| Exempt sales box | ❌ not separated |
| **Only recoverable input VAT deducted** (blocked items e.g. entertainment excluded) | ⚠️ deducts **all** expense VAT as recoverable (simplification) |
| Reverse-charge / imports | ⚠️ not separately handled |

So structurally the **net-VAT engine is right**, but the **presentation/breakdown is incomplete and one
label is wrong** for a true ZATCA return.

## TASK 3 — user-facing risk

- **(A)** For the user's real data **today**: the **Net VAT Due figure is reliable** (real VAT amounts,
  correct formula, correct period). The **risk is the two "taxable" subtotals**, which **overstate the
  taxable base** by including any exempt/zero-rated amounts — a user could misread the taxable base, and
  the return lacks the standard/zero-rated/exempt split ZATCA requires. The "all input VAT recoverable"
  simplification could slightly **understate** net VAT due if blocked-input items exist.
- **(B) Good news:** the decisive number (net VAT) is **real, correctly computed, period-scoped, and
  disclaimed** — fundamentally unlike the Balance Sheet. This is a *real, sound* statement with a
  *labeling/completeness* gap, not a fabricated one.
- **(C) No "تقديري" estimate label** — the figures are real, not estimated; such a label would be wrong
  in the opposite direction. The correct action is a **targeted accuracy fix** (TASK 5).

## TASK 4 — verdict

**SOUND data source + correct net-VAT bottom line + honest disclaimer; with a genuine accuracy defect in
the taxable-base labeling (taxable conflated with non-taxable) and missing standard/zero-rated/exempt
separation.** Severity: **MEDIUM** (does not affect net VAT due, but misrepresents the taxable base on a
regulator-facing screen). Recommend a targeted fix, not an estimate label.

## TASK 5 — proposed fix (NOT implemented — awaiting confirmation)

Use the breakdown the data already has. Two options:

**Option A (minimal, safest):** split each card into **taxable base** and **non-taxable (exempt/
zero-rated)** lines, so nothing is mislabeled:
```
المبيعات الخاضعة للضريبة (standard)      = Σ Taxable_Amount
مبيعات غير خاضعة / معفاة / صفرية         = Σ NonTaxable_Amount
ضريبة المبيعات المحصلة (مخرجات)          = Σ VAT_Amount      (unchanged)
```
(same for purchases). `netVatDue` is unchanged. This makes the taxable base accurate and surfaces the
exempt/zero-rated amount ZATCA needs.

**Option B (smaller):** keep one line but **relabel** it honestly from "إجمالي المبيعات الخاضعة للضريبة"
to "إجمالي المبيعات (خاضعة + غير خاضعة)" so the label matches the computation.

**Recommendation: Option A** — it is accuracy-positive, uses fields that already exist, leaves the
(correct) net-VAT math untouched, and moves the screen closer to a real ZATCA breakdown. I would also add
one honest line to the disclaimer noting input VAT is shown gross (recoverability not yet filtered).

> Same checkpoint discipline as every prior audit: **proposed only**, awaiting your confirmation before
> any code change. This is regulator-facing, so it deserves a look before shipping.
