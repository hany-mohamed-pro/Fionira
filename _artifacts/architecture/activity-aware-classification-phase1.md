# Activity-Aware Classification — Phase 1 (Restaurants / F&B)

**Status:** Implemented & verified on real data.
**Scope:** ONE activity (`restaurant_fb`), ONE new rule (abnormal food-wastage detection).
**Hard constraint honored:** ZERO changes to `categorization-engine.ts` and its ~44 hardened Stage 0–2 rules.

---

## 1. Design decision (approved)

Activity-aware edge cases are implemented as **financial-intelligence rules**, not as edits to the
categorization engine. The base engine keeps classifying silently and correctly; activity rules only
**add a review insight** for genuinely ambiguous/abnormal edge cases, reusing the existing
`Insight → ValidationReviewScreen` pipeline. When no activity is set (or it is any value other than
`restaurant_fb`), every activity rule is inert → **today's exact behavior, zero regression**.

> Important Phase-1 scope note: this rule does NOT re-categorize wastage into a dedicated wastage
> account — that would require touching the forbidden categorization engine. Phase 1 delivers the
> **abnormal-wastage review alert** only. The base engine continues to classify wastage lines as it
> does today. Re-categorization, if ever wanted, is a separate approved phase.

## 2. Activity field → stable enum (Settings)

`نشاط الشركة` changed from a free-text input to a `<select>` of 6 fixed options. The value stored is a
**stable key**, never the Arabic label, so matching never depends on exact text.

| Key | Arabic label |
|---|---|
| `` (empty) | غير محدد *(default = today's behavior)* |
| `trading_retail` | تجارة التجزئة والجملة |
| `manufacturing_food` | التصنيع والمنتجات الغذائية |
| `professional_services` | الخدمات المهنية والاستشارية |
| `contracting_construction` | المقاولات والإنشاءات |
| `restaurant_fb` | المطاعم وخدمات الأغذية |

- `src/lib/settings-service.ts` — added `ActivityKey` + `ACTIVITY_OPTIONS`; default `activity` is now `''` (was the cosmetic free-text `'خدمات'`).
- `src/pages/Settings.tsx` — dropdown bound to `ACTIVITY_OPTIONS`; an unrecognized/legacy stored value falls back to `''` (unset) so it is inert and safe.

## 3. Wiring trace (read path)

Tenant settings already live server-side in `devMemoryDb.settings[tenantId]`. The activity key is read
at the staged-upload handler and threaded down — `categorization-engine.ts` is never touched.

```
server.ts  (staged-upload handler, tenantId in scope)
  devMemoryDb.settings[tenantId]?.activity
    → createValidationSession(files, moduleType, undefined, activityProfile)   [pre-validation-engine.ts]
      → routeToDomainIntelligence(records, moduleType, [], activityProfile)    [domain-orchestrator.ts]
        → analyzeExpenses(records, historicalData, activityProfile)            [expenses-intelligence-engine.ts]
          → context.activityProfile
            → restaurantWastageRule.execute(record, context)                  [rules/activity/restaurant-wastage.ts]
```

Files changed for wiring: `models.ts` (added `activityProfile?` to `IntelligenceContext`),
`domain-orchestrator.ts`, `domains/expenses-intelligence-engine.ts`, `pre-validation/pre-validation-engine.ts`,
`server.ts`.

## 4. The new rule — `rules/activity/restaurant-wastage.ts`

Follows the existing `IntelligenceRule` interface and the threshold approach of `behavioral-anomaly.ts`.

- **Gate:** returns `null` unless `context.activityProfile === 'restaurant_fb'`.
- **Target:** only records whose text matches wastage/spoilage signals
  (`هدر|تالف|تلف|هالك|اتلاف|منتهي الصلاحية|expired|waste|spoilage|damaged …`).
- **Baseline = this tenant's own pattern:** mean + std-dev of wastage amounts across history + current
  batch. Flags a record when `z > 3` **or** `amount > 3 × mean`.
- **Insufficient history (< 3 wastage records):** falls back to a conservative absolute threshold
  (5,000 SAR) and **says so explicitly** in the insight message.
- **Normal wastage → silent** (`null`, no insight) → classified as ordinary expense by the base engine.
- **Abnormal → Insight** `{ type:'ABNORMAL_FOOD_WASTAGE', severity:'MEDIUM', suggestedAction, scoreImpact:20 }`
  which surfaces in ValidationReviewScreen via the existing pipeline.

Known characteristic (reported honestly): the baseline includes the current batch, so a lone extreme
outlier inflates its own mean; the `3 × mean` OR-branch and the low-sample conservative fallback cover
this. With real multi-record batches it is robust.

## 5. Real-data verification

Dataset: `data/erp_registry.json` — 730 real expense records (clearly food/bakery).

| Check | Result |
|---|---|
| Non-wastage insight signature identical: activity **unset** vs **restaurant_fb** | ✅ identical (true) → zero regression |
| `ABNORMAL_FOOD_WASTAGE` flags on real data — unset / restaurant_fb | 0 / 0 |
| **Real data contains wastage records?** | **No (0).** Abnormal-path proven on synthetic rows below — disclosed transparently. |
| Synthetic: 4 normal wastage (200–260) + 1 abnormal (9,000), `restaurant_fb` | only the 9,000 flagged; normal stayed silent ✅ |
| Same synthetic batch with activity **unset** | 0 flags (gate works) ✅ |
| Insufficient-history fallback: single 8,000 wastage line | flagged via conservative 5,000 default, message discloses it ✅ |

Example surfaced insight (synthetic abnormal):
`هدر غذائي مرتفع غير معتاد بقيمة 9000.00 ر.س. يتجاوز النطاق المعتاد لهدر هذه المنشأة (متوسط 1984 ر.س عبر 5 سجل).`

`npx tsc --noEmit` → exit 0.

## 6. Explicitly deferred (not started, not stubbed)

The other 4 activity profiles (trading/retail, manufacturing/food, professional services,
contracting/construction) are **not implemented** — there is no representative real data in the repo to
verify their edge cases against, and the project discipline requires real-data verification per edge
case. They remain deferred until such data exists.
