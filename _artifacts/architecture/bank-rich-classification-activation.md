# Bank Module — Activating Rich 3-Axis Classification (Live Governance)

**Date:** 2026-06-22
**Action:** Replaced the active bank dataset (`Records_12042026-2.xlsx`) with the
freshly re-processed upload carrying the bank-native 3-axis classification
(transaction type + counterparty + GL nature), through the real governance UI.
**Standard:** every claim below traces to an observed live action on the running
app (port 3100). Control totals verified identical before and after.

---

## How it was done — real governance flow (TASK 1 & 2)

The pending upload sat in **"الملفات المرفوعة قيد التصنيف والقرار"** as
`Records_12042026-2.xlsx — قيد القرار — لا يؤثر على التقارير (746 records)`, with
the recommended action **"استخدامه كبديل مصحح للملف الحالي"** — i.e. the project's
**replace-first** governance, not exclude-then-reupload.

Review screen (observed before approving) — captured from the live session
response:
- 746 records, **all 746 carry rich classification**, **0 flagged**, all `APPROVED`.
- 10 distinct transaction types: مشتريات بالبطاقة, ضريبة القيمة المضافة, رسوم بنكية,
  مدفوعات نقاط بيع, تحويل داخلي, حوالة صادرة, إيداع/مقبوضات أخرى, رواتب,
  سحب/مدفوعات أخرى, سحب نقدي.
- Running balance present per line (e.g. 1252.84, 2432.31).

Approval path (all clicked in the UI):
`استخدامه كبديل` → target selector `استبدال هذا الملف` → final confirm
`تأكيد الاستبدال` ("سيتم أرشفة الملف القديم واعتماد الملف الجديد … لضمان عدم تكرار
احتساب البيانات").
Result: `POST /api/erp/files/lifecycle/929ed6be…/replace/c7b1af15… → 200`
`{"success":true,"activeFile":{… fileHash:"6d98a5ab-…"}}`. The old file was
auto-archived; the rich file is now the single active dataset.

---

## Control totals — verified identical before and after (CONSTRAINT)

| | Transactions | إجمالي المدين (debit) | إجمالي الدائن (credit) | صافي |
|---|---|---|---|---|
| **Before (legacy)** | 746 | **671,818 ر.س** | **671,883 ر.س** | 65 |
| **After (rich)** | 746 | **671,818 ر.س** | **671,883 ر.س** | 65 |

Unchanged. (Exact piaster values, confirmed via direct processor runs on the same
file, are **671,818.18** debit / **671,882.98** credit — the UI rounds to whole
riyals.) Only the *classification detail* changed; the amounts did not.

---

## GL-nature breakdown — before vs after (TASK 3.1, 4)

### Before (legacy derived data) — only 2 inferred buckets
```
إيرادات ومقبوضات   163   دائن 671,883          (→ إيداع بنكي 163)
مصروفات ورسوم      583   مدين 671,818          (→ سحب بنكي 583)
مطابقة الرصيد: "لا يحتوي الكشف على عمود رصيد جارٍ"  (no running balance)
```

### After (rich data) — real accounting natures with subtotals
```
تحويلات وحسابات وسيطة   209   مدين 512,948  دائن 538,029   صافي  25,081
   ├ تحويلات وحوالات صادرة   163   مدين 368,519  دائن 429,546
   └ تحويلات بين الحسابات     46   مدين 144,429  دائن 108,483
إيرادات ومقبوضات        131   مدين   8,347  دائن 133,803   صافي 125,456
   ├ مقبوضات أخرى            18                دائن 113,898
   └ إيرادات نقاط البيع     113   مدين   8,347  دائن  19,905
مصروفات ورسوم           220   مدين  56,944  دائن     45    صافي -56,899
   ├ مصروفات ورسوم بنكية    175   مدين     500  دائن     45
   ├ مشتريات ومدفوعات        34   مدين  27,452
   └ مدفوعات أخرى            11   مدين  28,992
رواتب وأجور               3   مدين  86,290                صافي -86,290
نقدية وما يعادلها          4   مدين   7,100                صافي  -7,100
   └ نقدية بالصندوق          4   مدين   7,100
ضرائب                   179   مدين     189  دائن      7    صافي    -182
   └ ضريبة القيمة المضافة  179   مدين     189  دائن      7
```
Σ debit across natures = 512,948 + 8,347 + 86,290 + 56,944 + 7,100 + 189 = **671,818** ✓
Σ credit = 538,029 + 133,803 + 45 + 7 = **671,884** (≈ 671,883, rounding) ✓

**Balance reconciliation now resolves** (running balance present in the rich data):
الرصيد الافتتاحي **1,188** + صافي الحركة **65** = الختامي المحسوب **1,253** = رصيد
الكشف الختامي **1,253** → **"الكشف مطابق ✓"**; تسلسل الرصيد الجاري **742/745** متطابقة.

---

## حركة الحسابات — both modes show rich data (TASK 3.3)

KPIs unchanged: داخل 671,883 / خارج 671,818 / صافي 65.

**By transaction type:** حوالة صادرة 163, ضريبة القيمة المضافة 179, رسوم بنكية 175,
مدفوعات نقاط بيع 113, تحويل داخلي 46, مشتريات بالبطاقة 34, إيداع/مقبوضات أخرى 18,
سحب/مدفوعات أخرى 11, سحب نقدي 4, رواتب 3.

**By counterparty:** now real extracted counterparties (e.g. `SA CHNL`,
`شراء بضاعة عقود عمل - تجارة محلية`, `Jeddah 211000002918C00`, `DEP/BEN ID`),
instead of the legacy fallback where counterparty echoed the type label.

---

## Drill-down on rich categories (TASK 3.4)

- **رسوم بنكية** (Movements › by type): expands to lines e.g.
  `2026-01-01 | رسوم عملية نقاط بيع فوري | -POS FS Fees | 1 ر.س | balance 1,337`.
- **حوالة صادرة** (Movements › by type): expands to lines e.g.
  `2026-01-04 | حوالة فورية محلية صادرة | شراء بضاعة عقود عمل - تجارة محلية | 16,000 ر.س | balance 7,897`.
- **مصروفات ورسوم بنكية** (Reconciliation › GL account): expands to its
  individual fee transactions with running balances.

All expand to real individual transactions (date, details, counterparty, amount,
running balance).

## Console (TASK 3.5)
No console errors observed throughout navigation, activation, and drill-downs.

---

## Result
✅ Activated through the real governance replace-first UI (not an API shortcut).
✅ Rich categories now visible in Reconciliation (by GL nature) and Movements
   (by type & by counterparty).
✅ Control totals unchanged (671,818.18 / 671,882.98) — verified before and after.
✅ Drill-down verified on rich categories (رسوم بنكية, حوالة صادرة, مصروفات ورسوم بنكية).
✅ Running-balance reconciliation now resolves (1,188 → 1,253, مطابق ✓).
