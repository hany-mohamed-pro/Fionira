# Activity-Aware Classification — Phase 3 (Professional Services / Consulting)

**Status:** Implemented & verified through the real ingestion path on **SYNTHETIC** pre-launch data.
**Scope:** ONE activity (`professional_services`), ONE edge case — project/client linking suggestion.
**Hard constraint honored:** ZERO changes to `categorization-engine.ts` and its ~44 hardened rules.

> ⚠️ **All Phase-3 transaction data is SYNTHETIC**
> (`_artifacts/architecture/phase3-synthetic-professional-services-data.json`). No real tenant/vendor/
> client/project/transaction is represented. Approved pre-launch test-fixture practice.

---

## The edge case

A professional-services firm incurs expenses that are attributable to a **specific project/client**
(billable job costing) vs general overhead (own rent, salaries, own software). Per the approved
insight-only architecture, the engine classifies the expense silently and correctly, and a new rule
adds an **optional "link to project/client" suggestion** via the existing
`Insight → ValidationReviewScreen` pipeline. It is **not** a settings toggle and **never** changes the
category.

**Precision by design:** the suggestion fires ONLY when the description carries an explicit
project/client signal (`مشروع`, `عميل/العميل`, `عقد رقم`, `أمر عمل`, `لصالح`, `project`, `client`,
`PO`, `WBS` …). Billable-type expenses without such a reference are intentionally left silent.

## Implementation

- New rule `src/backend/core/financial-intelligence/rules/activity/professional-services.ts`
  (`IntelligenceRule`, gated on `activityProfile === 'professional_services'`, Arabic-normalized).
- Registered in the live `analyzeExpenses` `activityRules` array alongside Phases 1–2. No other path
  touched; engine untouched. Scope note: this surfaces the SUGGESTION only — persisting an actual
  expense↔project association is a larger future feature (data model + UI).

## Verification — real ingestion path (`createValidationSession`), 16/16 ingested

### A) Edge case — link suggestion (correctly flagged for user choice)

| Record | Link suggestion |
|---|---|
| تذاكر طيران لزيارة موقع **مشروع** شركة النخبة | ✅ fired |
| أتعاب مستشار من الباطن - **عقد رقم** 4471 | ✅ fired |
| طباعة تقارير **لحساب العميل** مجموعة الفيصل | ✅ fired |
| بدل إقامة فندق لمهمة **عميل** في جدة | ✅ fired |
| ترجمة مستندات **لصالح مشروع** التدقيق | ✅ fired |
| ضيافة اجتماع مع **العميل** ضمن **أمر عمل** | ✅ fired |
| تذاكر طيران داخلية *(no ref)* | ✅ **not** fired (precision) |
| طباعة وتصوير مستندات *(no ref)* | ✅ **not** fired (precision) |
| 8 general overhead records (rent/salary/software/internet/stationery/gosi/CR/medical) | ✅ none fired |

**Link-rule precision: 6/6 true positives, 0 false positives across 10 non-linked records.**

### B) Honest finding — the suggestion is correct EVEN WHEN the engine's base category is wrong

Several project-linked records were **mis-classified by the (frozen) engine**, yet the link suggestion
still fired correctly — demonstrating the insight-only design is robust to base-category errors. These
engine mis-classifications are **new technical-debt items, documented not fixed** (see
`engine-technical-debt.md` D3–D6):

| Record | Engine base category (wrong) | Expected | Debt |
|---|---|---|---|
| طباعة تقارير لحساب العميل | مواد تعبئة وتغليف | قرطاسية ومطبوعات | D3 (`طباعة` collision) |
| بدل إقامة فندق لمهمة عميل | رواتب وأجور | مصاريف سفر وانتقالات | D4 (`بدل` collision) |
| ترجمة مستندات لصالح مشروع | إيجارات | خدمات مهنية | D5 (`مكتب` in vendor) |
| راتب محاسب أول (general) | أتعاب مهنية واستشارات | رواتب وأجور | D6 (`محاسب` collision) |

> These are NOT regressions from this phase and NOT touched (engine frozen). They are queued for the
> consolidated engine-fix session.

### C) Correctly classified clear-cut records (engine, verified)

تذاكر طيران (مشروع) → مصاريف سفر وانتقالات ✅ · أتعاب مستشار → أتعاب مهنية واستشارات ✅ ·
ضيافة العميل → نظافة وضيافة ✅ · rent → إيجارات ✅ · software → اشتراكات وبرمجيات ✅ ·
internet → اتصالات ✅ · stationery → قرطاسية ✅ · gosi → تأمينات اجتماعية ✅ · CR fees → رسوم حكومية ✅ ·
medical → تأمين طبي ✅.

## Regression (success criteria)

| Check | Result |
|---|---|
| REAL 730 — non-activity insight signature identical: **unset** vs **professional_services** | ✅ identical |
| REAL 730 — activity insights when **unset** | 0 |
| REAL 730 — project-link suggestions if a restaurant tenant were mislabeled professional_services | 0 (no expense desc carries a project/client token) |
| Phase-2 manufacturing synthetic under **manufacturing_food** — manufacturing insights intact | ✅ 4 (2 tools + 2 transport) |
| Phase-2 manufacturing synthetic — professional-services insights leaked in | ✅ 0 (cross-phase non-interference) |
| Synthetic PS — base category identical: **professional_services** vs **unset** | ✅ identical |
| Synthetic PS — activity insights when **unset** | 0 |

`npx tsc --noEmit` → exit 0. Real ingestion path used. Zero hardened-rule changes.

## Honest scorecard (no single misleading "100%")

- **6 project-linked records** correctly **flagged for user choice**; **10 non-linked** correctly silent
  → link-rule precision is exact (no false positives).
- **10 clear-cut records** classified correctly by the engine and **verified**.
- **4 engine mis-classifications** found and **reported, not fixed** (D3–D6), all pre-existing
  keyword-collision debt; the link suggestion remained correct despite them.
- **Zero regression** on the real 730, zero cross-phase interference with Phase 2, zero activity output
  when unset.

## Deferred (unchanged)

Remaining activity profiles: **trading/retail** and **contracting/construction** — not started.
Engine technical debt now totals **6 items** (D1–D6) in `engine-technical-debt.md`, to be fixed
together after all activities are complete.
