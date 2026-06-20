# Fix — Wire D2/D7 into Income Statement COGS aggregation

**What:** added the two D2/D7 accounts to App.tsx's `cogsCategories` list so production-wastage and
inventory-shrinkage aggregate under **COGS** in the Income Statement, as the user-confirmed accounting
decision required. Corrects an overstated "displays under COGS" claim from the Phase-A delivery
(`e46052f`), found by `income-statement-audit.md` (`5a165ed`).

---

## Root cause
The Income Statement's COGS/OPEX split is driven by a **hard-coded list** in the App.tsx
`incomeStatement` useMemo ([App.tsx:890-895](../../src/App.tsx)) — not by a `تكلفة` prefix test. Phase A
added D2/D7 to `CATEGORY_ORDER` (ordering) and to the engine routing, but **not** to this aggregation
list, so wastage/shrinkage records fell into the `else` branch → Operating Expenses.

## The change (App.tsx `cogsCategories` only)
```diff
  const cogsCategories = [
      'تكلفة المبيعات - مواد خام ومكونات',
      'تكلفة المبيعات - مواد تعبئة وتغليف',
      'تكلفة المبيعات - مستهلكات تشغيلية',
      'تكلفة المبيعات - شحن ونقل للداخل',
+     'تكلفة المبيعات - هدر وتلف إنتاج',   // D2
+     'تكلفة المبيعات - هالك وعجز مخزون'   // D7
  ];
```
No other change. `categorization-engine.ts`, `erp-engine.ts`, and `financial-intelligence/rules/activity/*`
untouched.

## Regression (old 4-item list vs new 6-item list)

### Real 730 — zero change (expected)
| Metric | Old | New | Δ |
|---|---|---|---|
| records changing COGS/OPEX bucket | — | — | **0** |
| total COGS | 385,235.70 | 385,235.70 | **0.00** |
| total OPEX | 110,457.20 | 110,457.20 | **0.00** |

The 730 real records contain no wastage/shrinkage entries, so the addition has **no effect** on current
real data — exactly as predicted.

### Synthetic wastage/shrinkage — now correctly under COGS
| Record | Category | Bucket OLD → NEW | Net amount |
|---|---|---|---|
| INV-2009 `هدر مواد خام تالفة في الإنتاج` | تكلفة المبيعات - هدر وتلف إنتاج | OPEX → **COGS** | 320 |
| TR-4006 `هالك مخزون بضاعة تالفة` | تكلفة المبيعات - هالك وعجز مخزون | OPEX → **COGS** | 1,500 |
| TR-4007 `عجز جرد سنوي في الأصناف` | تكلفة المبيعات - هالك وعجز مخزون | OPEX → **COGS** | 900 |

**COGS for those datasets: 37,280 → 40,000 (Δ +2,720).** Correspondingly **gross profit decreases by
2,720** (wastage/shrinkage is now cost of sales, not operating expense) while **net profit is unchanged**
(the amount was already counted as an expense either way). This is the intended, accounting-correct
behavior.

`npx tsc --noEmit` → exit 0.

## Verdict
D2/D7 are now genuinely **end-to-end under COGS** (engine classifies → account in `CATEGORY_ORDER` →
Income Statement aggregates under COGS). Zero regression on real data; correct gross-profit treatment
for wastage/shrinkage when such records exist.
