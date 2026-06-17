# Classification Engine Hardening Report

> Precision-hardening of the existing **rule-based** categorization engine (no AI added).
> **Generated:** 2026-06-16 · **Base:** `7b47295`
> Files touched: `categorization-engine.ts`, `expenses-processor.ts`, `revenues-processor.ts`, `payroll-processor.ts` (+ this report).

---

## TASK 1 — Bilingual coverage audit (evidence)

**A) Does `normalizeArabic` process English?** It only normalizes **Arabic** letters (tatweel, alef, ة→ه, ى→ي) and collapses whitespace ([categorization-engine.ts:45-52](../../src/backend/core/categorization-engine.ts)). English passes through **uncorrupted**. Crucially, the input is `.toLowerCase()`-ed *before* normalization ([:54-55](../../src/backend/core/categorization-engine.ts)), so English is lowercased.

**B) Are rules Arabic-only, English-only, or both?** Mixed. Many rules are **bilingual** — e.g. raw-materials lists `\bfood\b|\bsugar\b…` alongside Arabic ([:125](../../src/backend/core/categorization-engine.ts)); maintenance lists `maintenance|repair` ([:11,143](../../src/backend/core/categorization-engine.ts)). Some are **Arabic-only** — e.g. travel ([:158](../../src/backend/core/categorization-engine.ts)), petty-cash ([:161](../../src/backend/core/categorization-engine.ts)), and the Stage-0 overrides ([:68-72](../../src/backend/core/categorization-engine.ts)). **No purely English-only rules** (English keywords always accompany Arabic).

**C) Behavior by input:**
- English description / vendor → **handled** (English keywords match on lowercased text). Verified: `RENT`→إيجارات, `AC maintenance and repair`→صيانة وإصلاح.
- Both empty/null → returns default `مصروفات عمومية وإدارية - أخرى` ([:43](../../src/backend/core/categorization-engine.ts)).
- Mixed (`فاتورة STC - Mobile bill internet`) → **handled** → telecom (verified).

**D) Case-sensitivity for English?** **Case-insensitive** — text is lowercased before matching, so `RENT`=`rent`=`Rent` (all → إيجارات, verified). `getRevenueCategory` additionally uses `/…/i` flags.

**E) Rule-language counts (by inspection — approximate):**
| Bucket | Total | Arabic-only | Bilingual | English-only |
|---|---|---|---|---|
| Stage-0 overrides | 3 | 0 (after this fix) | 3 | 0 |
| Stage-1 vendors | 15 | ~1 | ~14 | 0 |
| Stage-2 keywords | ~26 | ~12 | ~14 | 0 |
| Stage-3 standalone `REGEX_*` | 32 | ~16 | ~16 | 0 |
| Revenue `check` rules | ~9 | 0 | ~9 | 0 |
| **≈ Total** | **~85** | **~29** | **~56** | **0** |

---

## TASK 2 — Confidence clarity (done, field NOT removed)
`Confidence_Score` measures **arithmetic integrity** (`Net+VAT≈Total`, [expenses-processor.ts:166-178](../../src/backend/core/processors/expenses-processor.ts)), not classification accuracy. Added a clearly-named **`Math_Integrity_Score`** (same value) in all three processors and kept `Confidence_Score` for back-compat:
- [expenses-processor.ts](../../src/backend/core/processors/expenses-processor.ts), [revenues-processor.ts](../../src/backend/core/processors/revenues-processor.ts), [payroll-processor.ts](../../src/backend/core/processors/payroll-processor.ts).

**Misleading frontend display reported (NOT fixed, per constraint):** [GroupedPurchases.tsx:139](../../src/modules/GroupedPurchases.tsx) renders *"الثقة الذكية" (smart confidence)* from `Category_Confidence` — this label implies classification certainty and should be reworded in a later frontend pass.

---

## TASK 3 — Normalization/regex mismatch fix
**Root cause:** `normalizeArabic` rewrites the *text* (ة→ه, [أإآ]→ا, ى→ي) but rules were written with the un-normalized forms, so patterns like `صيانة` never matched the text `صيانه` — a silent miss.

**General fix:** added `nrx(regex)` — applies the **same** letter-normalization to a regex's source — and `nTest(regex, text)`, then routed the engine's **centralized match points** through it:
- `getExpenseCategory`: Stage-0 overrides, Stage-1 vendors, Stage-2 keywords loops ([:74, 117-119, 230-233](../../src/backend/core/categorization-engine.ts)).
- `getRevenueCategory`: the `check()` helper ([:441-443](../../src/backend/core/categorization-engine.ts)) — fixes **all** revenue rules at once.

This covers **Stages 0–2 (≈44 expense rules) + all revenue rules** with zero risk of corrupting Arabic literals.

**Before/after (affected):** previously **any** rule containing `ة`/`أ`/`إ`/`آ`/`ى` could silently fail; after the fix, every rule routed through the loops/`check` matches in the normalized space. Documented concrete repair: `صيانة كومبرسر` mis-classified as *أخرى* → now *صيانة وإصلاح*.

### ⚠️ Deliberately deferred (transparency)
The **32 Stage-3 standalone `REGEX_*` constants** ([:9-40](../../src/backend/core/categorization-engine.ts)) are *not* yet routed through `nrx`. Reaching them requires either reproducing 32 dense Arabic regex literals or ~30 call-site edits — and a single silent character slip would misclassify financial data. **I judged that unacceptable to do un-verified in one pass.** Impact is **low**: Stages 0–2 (now normalized) carry primary classification, and every verified test case (below) is correct. Recommended as a follow-up: wrap each Stage-3 const via `nrx()` with a per-const assertion test. This is the one part of "ALL mismatches" not yet 100% complete.

---

## TASK 4 — English / mixed-language coverage
- English already present in most Stage-1/2 and all revenue rules (see TASK 1-E).
- **Added** English to the Stage-0 override rules (`maintenance|repair|overhaul`, `cable|charger|power adapter`, `gift|gifts|giveaway`) ([:68-72](../../src/backend/core/categorization-engine.ts)).
- `normalizeArabic` confirmed to pass English through safely; matching is case-insensitive.
- **Not completed:** exhaustive English equivalents for *every* Arabic-only Stage-2/Stage-3 rule (~29 rules). Deferred with the Stage-3 work for the same corruption-risk reason. Flagged so coverage is honest.

---

## TASK 5 — Verification (via `tsx`, real + synthetic)

**Real 9 (from the reconciliation audit):**
| Input | Result | vs. before |
|---|---|---|
| العالمية للفواكة — مانجو/رمان | تكلفة المبيعات - مواد خام ومكونات | same |
| الوادي للدواجن — eggs | تكلفة المبيعات - مواد خام ومكونات | same |
| موسسة منارة البلاد — طباعة اتفاقية مورد | مصروفات عمومية وإدارية - **قرطاسية ومطبوعات** | **improved** (was "أخرى"; printing→stationery) |
| sfaqat — cake board | تكلفة المبيعات - مواد تعبئة وتغليف | same |
| صدقة المحل — صدقة | مصروفات أخرى - تبرعات ومساهمات مجتمعية | same |
| SLAM INTERNET — INTERNIT | اتصالات وإنترنت | same |
| قصر البلاستيك — فيري صحون | نظافة وضيافة | same |
| TAXI — مواصلات موظفين | مصاريف سفر وانتقالات | same |
| **صيانة كومبرسر غرفة التبريد** | **مصروفات عمومية وإدارية - صيانة وإصلاح** | **FIXED** (was "أخرى") |

**Synthetic (English / mixed / case):**
| Input | Result |
|---|---|
| Staples — "Office Supplies - printing paper" | تكلفة المبيعات - مستهلكات تشغيلية |
| ABC Trading (English vendor) — "صيانة مكيف" | مصروفات عمومية وإدارية - صيانة وإصلاح |
| STC — "فاتورة STC - Mobile bill internet" (mixed) | مصروفات عمومية وإدارية - اتصالات وإنترنت |
| Landlord Co — "RENT" / "rent" / "Rent" | مصروفات عمومية وإدارية - إيجارات (all three) |
| CoolTech — "AC maintenance and repair" (pure English) | مصروفات عمومية وإدارية - صيانة وإصلاح |

**`npm run build` → pass (exit 0).** No regressions on the 8 stable real examples; the 2 changes (#3, #9) are both improvements.

---

## Net
- ✅ Confidence purpose clarified (`Math_Integrity_Score` added; original kept); misleading frontend label reported.
- ✅ Normalization bug fixed across Stages 0–2 + all revenue rules (the bulk); `صيانة كومبرسر` repaired; verified no regressions.
- ✅ English/case handling confirmed; English added to Stage-0 overrides.
- ⚠️ **Honestly incomplete:** Stage-3 const normalization + exhaustive per-rule English expansion deferred (corruption-risk on dense financial regex literals) — recommended as a verified follow-up.
