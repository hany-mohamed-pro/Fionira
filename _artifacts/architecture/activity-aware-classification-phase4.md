# Activity-Aware Classification — Phase 4 (Trading / Retail)

**Status:** Implemented & verified through the real ingestion path on **SYNTHETIC** pre-launch data.
**Scope:** ONE activity (`trading_retail`), two edge-case insights + verification of two engine-owned cases.
**Hard constraint honored:** ZERO changes to `categorization-engine.ts` and its ~44 hardened rules.

> ⚠️ **All Phase-4 transaction data is SYNTHETIC**
> (`_artifacts/architecture/phase4-synthetic-trading-retail-data.json`). No real tenant/vendor/
> transaction is represented. Approved pre-launch test-fixture practice.

---

## STEP 1 — mapping the 4 edge cases to the insight-only architecture

| Edge case | Nature | Decision |
|---|---|---|
| Inbound freight → COGS | classification (engine-owned) | **verify & report** (no new code) |
| Sale packaging → selling expense, not raw material/COGS | **divergent** from engine default | **net-new insight** |
| Inventory shrinkage → separate category | needs a **new account** (engine frozen) | **advisory insight** + log debt |
| Sales-rep commissions → selling expense, not salaries | classification (engine-owned) | **verify & report** |

Net-new code = `trading-retail.ts` with two insight types. Inbound freight and commissions are the
engine's job — verified below, debts logged where it diverges.

## Implementation

- New rule `src/backend/core/financial-intelligence/rules/activity/trading-retail.ts`
  (`IntelligenceRule`, gated on `activityProfile === 'trading_retail'`, Arabic-normalized). Shrinkage
  takes precedence over packaging on a damaged-stock line. Registered in the live `activityRules` array
  alongside Phases 1–3. Engine untouched.

## Verification — real ingestion path (`createValidationSession`), 18/18 ingested

### A) Edge cases correctly FLAGGED for user choice (precision: 5 target records, 0 false positives)

| Record | Retail insight |
|---|---|
| أكياس تسوق بشعار المتجر للعملاء | ✅ `ACTIVITY_SALE_PACKAGING_TREATMENT` |
| أكياس بلاستيك للعملاء عند البيع | ✅ `ACTIVITY_SALE_PACKAGING_TREATMENT` |
| ورق تغليف هدايا للمناسبات | ✅ `ACTIVITY_SALE_PACKAGING_TREATMENT` |
| هالك مخزون بضاعة تالفة | ✅ `ACTIVITY_INVENTORY_SHRINKAGE` |
| عجز جرد سنوي في الأصناف | ✅ `ACTIVITY_INVENTORY_SHRINKAGE` |
| 13 other records (freight, commissions, goods, rent, salary, electricity, POS, gosi, marketing) | ✅ none fired |

### B) Engine-owned cases — verified, with honest findings

| Edge case | Engine result | Verdict |
|---|---|---|
| **Sales commissions** `عمولة مبيعات` ×2 | مصروفات بيعية وتسويقية - دعاية وإعلان | ✅ **verified** — selling-expense family, **not salaries** (the spec's concern is satisfied) |
| **Inbound freight** `شحن وارد للبضاعة` | مصروفات بيعية وتسويقية - نقل وتوصيل للعملاء (**outbound!**) | ❌ engine debt **D8** — inbound treated as outbound |
| **Inbound freight** `نقل مشتريات أصناف` | تكلفة المبيعات - مواد خام ومكونات | ⚠️ engine debt **D8** — COGS but not the dedicated inbound-shipping account |

### C) Additional engine mis-classifications found (documented, NOT fixed — engine frozen)

| Record | Engine (wrong) | Expected | Debt |
|---|---|---|---|
| vendor `مستودع الجملة` — شراء بضاعة للبيع | مصروفات عمومية وإدارية - إيجارات | COGS / merchandise | **D9** (`مستودع` vendor-name hijack — same root as D5) |
| فاتورة كهرباء المعرض | مصروفات عمومية وإدارية - صيانة وإصلاح | منافع كهرباء ومياه | **D1** (known) |
| هالك مخزون / عجز جرد (base category) | مواد خام / G&A-أخرى | distinct shrinkage account | **D7** (missing account; insight still fired correctly) |

> All of C are pre-existing engine debt, **not regressions** and **not touched**. The retail insights
> still fired correctly regardless of the wrong base category (insight-only robustness).

## Cross-phase non-interference (the check carried forward from Phase 3)

Each synthetic dataset run under its own profile shows **only its own** activity insight types:

| Dataset (profile) | Insight types produced | Foreign leaks |
|---|---|---|
| Phase 2 (`manufacturing_food`) | tools ×2, transport ×2 | **none** |
| Phase 3 (`professional_services`) | project-link ×6 | **none** |
| Phase 4 (`trading_retail`) | sale-packaging ×3, shrinkage ×2 | **none** |

All four activity rules coexist with zero cross-talk.

## Regression (success criteria)

| Check | Result |
|---|---|
| REAL 730 — non-activity signature identical: **unset** vs **trading_retail** | ✅ identical |
| REAL 730 — activity insights when **unset** | 0 |
| Synthetic retail — base category identical: **trading_retail** vs **unset** | ✅ identical |
| Synthetic retail — activity insights when **unset** | 0 |
| (informational) retail insights if a restaurant tenant were mislabeled trading_retail | 10 (packaging/damaged terms in F&B data; only shown under a wrong profile) |

`npx tsc --noEmit` → exit 0. Real ingestion path used. Zero hardened-rule changes.

## Honest scorecard (no single misleading "100%")

- **5 retail edge-case records** correctly **flagged**; **13 others** correctly silent → exact precision.
- **Commissions** edge case **verified correct** by the engine (selling expense, not salaries).
- **Inbound freight** edge case is **engine-unreliable** (D8) — reported, not fixed.
- **3 additional engine mis-classifications** (D7, D9, and known D1) found and **documented**.
- **Zero regression** on real 730; **zero cross-phase interference** across all 4 activity rules.

## Status after Phase 4

- Activity profiles done: restaurant_fb, manufacturing_food, professional_services, **trading_retail**.
- **Remaining: contracting_construction (1 profile).**
- Engine technical debt now **9 items** (D1–D9) in `engine-technical-debt.md`, with the shared-root
  diagnostic note — all queued for the single post-completion Max engine-fix session.
