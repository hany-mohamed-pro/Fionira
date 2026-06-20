# Categorization Engine — Consolidated Technical Debt

These are engine-level issues discovered while building activity-aware classification
(Phases 1–3). **The engine is deliberately frozen** (`categorization-engine.ts` is
`@DO_NOT_MODIFY`). Per user decision, none of these are touched now — they are recorded
here and will be fixed **together in one Max-level session AFTER all activity profiles are
complete**, since later phases may surface more of the same class of bug.

All items below are **keyword-collision / tie-break** issues in the scoring engine, or a
**missing chart-of-accounts category** — not regressions introduced by the activity rules.

| # | Symptom (real-ish input) | Engine output (wrong) | Expected | Likely cause | Found in |
|---|---|---|---|---|---|
| D1 | `فاتورة كهرباء المصنع` (utility bill) | مصروفات عمومية وإدارية - صيانة وإصلاح | منافع (كهرباء ومياه) | `كهرباء` appears in the maintenance keyword set (electrical-repair sense) and wins the tie vs the utilities sense | Phase 2 |
| D2 | `هدر مواد خام تالفة في الإنتاج` (production wastage) | تكلفة المبيعات - مواد خام ومكونات | a distinct "production wastage" account | **No such account exists** in the chart of accounts (`financial-utils.ts`); creating it needs an engine + COA change | Phase 2 |
| D3 | `طباعة تقارير لحساب العميل` (printing/reports) | تكلفة المبيعات - مواد تعبئة وتغليف | مصروفات عمومية وإدارية - قرطاسية ومطبوعات | `طباعة` is a packaging keyword and routes printing to packaging COGS | Phase 3 |
| D4 | `بدل إقامة فندق لمهمة عميل` (accommodation allowance) | مصروفات عمومية وإدارية - رواتب ومنافع موظفين - رواتب وأجور | مصاريف سفر وانتقالات | `بدل` triggers the personnel/salary path; "بدل إقامة" (travel per-diem) collides with salary "بدل/بدلات" | Phase 3 |
| D5 | vendor `مكتب ترجمة معتمد` (translation office) | مصروفات عمومية وإدارية - إيجارات | أتعاب/خدمات مهنية (translation service) | `مكتب` is a rent keyword (office space); any vendor whose name contains `مكتب` is pulled toward إيجارات | Phase 3 |
| D6 | `راتب محاسب أول` (accountant's salary) | مصروفات عمومية وإدارية - أتعاب مهنية واستشارات | رواتب ومنافع موظفين - رواتب وأجور | `محاسب` (accountant → professional services) outweighs `راتب` (salary); an employee's job title hijacks the category | Phase 3 |

## Notes for the future engine-fix session
- D1, D3, D4, D5, D6 are the same root pattern: a keyword has two senses, and the
  scoring/tie-break picks the wrong one. A general fix (sense-disambiguation or
  priority/negative-lookahead tuning) would likely resolve several at once.
- D2 is different: it needs a **new account** in the chart of accounts plus engine routing.
- The activity rules are insight-only and do NOT depend on these being fixed — e.g. the
  Phase 3 project-link suggestion fires correctly even when the base category is wrong.
- Re-run the Phase 1–3 synthetic fixtures after any engine fix to confirm no new regressions.
