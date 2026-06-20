# Activity-Aware Classification — Phase 2 (Manufacturing / Food)

**Status:** Implemented & verified through the real ingestion path on **SYNTHETIC** pre-launch data.
**Scope:** ONE activity (`manufacturing_food`), the TWO genuinely divergent edge cases only.
**Hard constraint honored:** ZERO changes to `categorization-engine.ts` and its ~44 hardened rules.

> ⚠️ **All Phase-2 transaction data is SYNTHETIC** (`_artifacts/architecture/phase2-synthetic-manufacturing-data.json`).
> No real tenant/vendor/transaction is represented. Approved pre-launch test-fixture practice.

---

## STEP 1 — architectural finding (challenge to the spec)

The approved architecture is **insight-only**: activity logic lives in financial-intelligence rules and
**never changes a record's category**. Therefore, of the 6 accounting decisions in the spec:

- **Clear-cut classifications** (ingredients, inbound freight, finished packaging, production wastage)
  are the **categorization engine's** job. No new code — I **verify and report** what the (frozen)
  engine actually does.
- **Only the two divergent cases** (tools/molds, asset-transport) are net-new code — insight rules that
  surface the simplified alternative via the existing `Insight → ValidationReviewScreen` pipeline. This
  is exactly what the spec's TASK 3 scopes.
- **"Production wastage as a separate account" cannot be implemented** — no such account exists in the
  chart of accounts, and creating one requires editing the frozen engine. Out of scope; flagged below.

## Implementation

- New rule: `src/backend/core/financial-intelligence/rules/activity/manufacturing-food.ts`
  (`IntelligenceRule`, gated on `activityProfile === 'manufacturing_food'`, Arabic-normalized matching).
- Wired into the live `analyzeExpenses` path via a small `activityRules` registry alongside Phase 1's
  rule. No other path touched. `categorization-engine.ts` untouched.

## Verification — real ingestion path (`createValidationSession`), 20/20 synthetic records ingested

### A) Clear-cut — verified CORRECT by accounting logic (silent, no interruption)

| Record | Engine category | Verdict |
|---|---|---|
| دقيق فاخر / ألوان طعام / نكهة فانيليا / سكر / شوكولاتة خام (5 ingredients) | تكلفة المبيعات - مواد خام ومكونات | ✅ correct |
| نقل مشتريات مواد خام للداخل | تكلفة المبيعات - شحن ونقل للداخل | ✅ correct |
| علب كرتون تغليف المنتج النهائي / أكياس تغليف للبيع (2) | تكلفة المبيعات - مواد تعبئة وتغليف | ✅ correct |

### B) Divergent — correctly FLAGGED for user choice (not auto-decided)

| Record | Engine category (strict default) | Activity insight |
|---|---|---|
| قالب كيك سيليكون (460) | تكلفة المبيعات - مستهلكات تشغيلية | ✅ `ACTIVITY_TOOLS_SIMPLIFICATION` (offers raw-material simplification) |
| قطاعة عجين يدوية (287) | تكلفة المبيعات - مستهلكات تشغيلية | ✅ `ACTIVITY_TOOLS_SIMPLIFICATION` |
| قالب إنتاج صناعي كبير (6,900) | أصول ثابتة - أجهزة ومعدات | ✅ **no** insight — high value, strict asset stands (simplification is low-value only) |
| نقل ثلاجة عرض إلى المصنع (920) | مصروفات عمومية وإدارية - صيانة وإصلاح | ✅ `ACTIVITY_ASSET_TRANSPORT_TREATMENT` (offers expense-vs-capitalize choice) |
| ترحيل فرن صناعي بين الفروع (1,725) | أصول ثابتة - أجهزة ومعدات | ✅ `ACTIVITY_ASSET_TRANSPORT_TREATMENT` |

### C) General expenses — confirmed UNAFFECTED by activity

rent → إيجارات ✅ · salary → رواتب وأجور ✅ · professional fees → أتعاب مهنية ✅ · internet → اتصالات وإنترنت ✅ · gosi → تأمينات اجتماعية ✅. No activity insight on any. 

### D) HONEST FINDINGS — engine limitations surfaced (NOT fixed; engine is frozen)

1. **Production wastage** `هدر مواد خام تالفة في الإنتاج` → engine classifies as **مواد خام ومكونات**, not a
   distinct "production wastage" account. The spec's desired separate account **does not exist** and
   would require editing the frozen engine. **Out of scope** for Phase 2 — needs the engine-freeze to be
   lifted in a separate approved phase.
2. **Electricity bill** `فاتورة كهرباء المصنع` → engine classifies as **صيانة وإصلاح** (wrong; should be
   منافع كهرباء ومياه). Root cause: the maintenance keyword rule contains `كهرباء` (electrical-repair
   sense), which collides with the utility-bill sense and wins the tie. **Pre-existing engine quirk**
   surfaced by the synthetic data — reported, not touched (engine frozen). Candidate for a future
   engine fix.

## Regression (success criterion)

| Check | Result |
|---|---|
| REAL 730 — non-activity insight signature identical: **unset** vs **manufacturing_food** | ✅ identical |
| REAL 730 — activity insights when **unset** | 0 |
| Synthetic — base category identical: **manufacturing** vs **unset** | ✅ identical |
| Synthetic — activity insights when **unset** | 0 |

`npx tsc --noEmit` → exit 0. Real ingestion path used (not bypassed). Zero hardened-rule changes.

## Honest scorecard (no single misleading "100%")

- **8 clear-cut records** classified silently and **verified correct**.
- **4 divergent records** correctly **flagged for user choice**; **1 high-value tool** correctly **not**
  flagged (strict asset stands).
- **5 general records** correctly unaffected.
- **2 engine limitations** found and **reported, not silently fixed** (production-wastage account gap;
  electricity keyword collision).
- **Zero regression** on the real 730 and on the synthetic batch when activity is unset.

## Deferred (unchanged)

The remaining 3 activity profiles (trading/retail, professional services, contracting/construction)
remain **not started**. The production-wastage account and the electricity keyword collision are
deferred engine-level items requiring the freeze to be lifted.
