# Categorization Engine — Consolidated Technical Debt

These are engine-level issues discovered while building activity-aware classification
(Phases 1–3). **The engine is deliberately frozen** (`categorization-engine.ts` is
`@DO_NOT_MODIFY`). Per user decision, none of these are touched now — they are recorded
here and will be fixed **together in one Max-level session AFTER all activity profiles are
complete**, since later phases may surface more of the same class of bug.

All items below are **keyword-collision / tie-break** issues in the scoring engine, or a
**missing chart-of-accounts category** — not regressions introduced by the activity rules.

## Resolution status

- **Track 1 (context-aware tokenization) — DONE.** Resolved **D1, D3, D4, D6, D8, D9** with surgical
  context guards + a `descOnly` vendor/description separation. Verified zero regression on the 730 real
  records and on all 5 synthetic fixtures. See `engine-fix-track1-context-tokenization.md`.
- **D5 — RESOLVED (Track 2).** Fixed with a targeted, semantically-correct keyword: `ترجمة`/translation
  is now recognized as a professional service, so the translation-office expense classifies as
  أتعاب مهنية واستشارات. Zero regression on the 730 real records; only the D5 record changed. This
  sidesteps D13 entirely (no dependency on the "ال" root).
- **D13 — STILL OPEN; global fix MEASURED and REJECTED as unsafe (Track 2).** A symmetric "ال"/"لل"
  strip was implemented and measured: it changed **21 records** (17 real + 4 synthetic). Crucially it
  **re-exposes the vendor-name-bleed class** — stripping the article off a vendor name surfaces a
  generic word that then bleeds into item-keyword matching (`المعدات`→`معدات`→fixed-asset for a *rental*
  company; `الموقع`→`موقع`/website→subscriptions for site labor). Several "improvements" on real data
  also relied on this accidental bleed. **Reverted.** D13's true fix must be done **together with
  vendor/description field separation** (the `allText→descText` item-keyword change deferred in Track 1)
  — not as a standalone tokenization change. Re-scoped accordingly.
- **Track A (independent items) — DONE** (engine-only). **D10 resolved** (equipment purchase →
  fixed-asset, rental-guarded). **D11 partially resolved** (construction materials → existing COGS
  raw-materials account; dedicated WIP/direct-cost account remains deferred). **D2, D7, D12 deferred
  with reason** — each needs a NEW chart-of-accounts entry in the protected `financial-utils.ts` plus
  an accountant decision (out of engine-only scope); the activity-insight layer already surfaces them.
  Zero regression on 730 real + only 3 intended synthetic changes. See
  `engine-fix-trackA-independent-items.md`.
- **Track B (D13 combined mechanism) — ATTEMPTED, MEASURED unsafe, D13 STILL OPEN.** Field separation
  (Stage-2 item keywords → description only) was implemented and measured ALONE first: 8-record blast
  radius including **genuine regressions** — vendor names carry *legitimate* signal sometimes
  (`عامل سباكة`/plumber → maintenance; `معدات المخابز`/equipment vendor → fixed-asset are *correct*
  vendor signals that blunt field-separation discards). A lower-score vendor pass does not separate
  legitimate signal from leakage either. **Reverted** (engine unchanged from Track A; D5 not regressed).
  D13's real fix needs **per-keyword vendor-safety tagging FIRST**, then field separation, then "ال" —
  a larger separately-scoped effort. See `engine-fix-trackB-combined-d13.md`.
- **D13 combined resolution (2026-06-29) — RE-ATTEMPTED with a hybrid, MEASURED unsafe again, STILL OPEN.**
  Re-ran the full two-layer plan on an 867-record corpus (802 real + 65 synthetic, all 5 activity sets).
  (1) **Field-separation (hybrid: description full score + vendor name at 0.3× hint)** — lowered the blast
  radius to **1 record** (vs Track B's 8) but did **not** fix the core issue: that 1 record is the
  `معدات المخابز` / `قالب إنتاج` case (`group=tools_high_value`, 6,900 SAR) — a *legitimate* fixed-asset
  vendor signal wrongly pushed to consumables. Confirms: a uniform low-score vendor pass cannot separate
  legitimate strong vendor signal from leakage. (2) **ال-normalization (description-only)** — independently
  unsafe: **root-word breakage** (`ألوان`→`وان`, loses raw-materials) and **descOnly exposure**
  (`المكتب`→`مكتب`→rent, hijacks telecom/utility bills into rent). The two unsafeties are **separable** —
  field-separation does NOT make ال safe. **Reverted; no forced fix.** Sharper prerequisite re-confirmed:
  per-keyword vendor-safety tagging, then a guarded ال-mechanism (root-word guard + descOnly disambiguation).
  D5's ال-prefixed form (`الترجمة`) rides on this same future work; its bare form stays on the narrow patch.
  See `engine-fix-d13-combined-resolution.md`.
- **Chart-of-accounts additions — D2 & D7 RESOLVED (end-to-end), D12 still DEFERRED.** Added two new
  COGS accounts (`تكلفة المبيعات - هدر وتلف إنتاج` for D2; `تكلفة المبيعات - هالك وعجز مخزون` for D7) to
  `CATEGORY_ORDER` + two new Stage-3 routing rules; they display under COGS in the Income Statement.
  Zero regression on 730 real, only 3 intended synthetic changes, activity non-interference confirmed.
  **D12 deferred** — it is a *liability* (unearned revenue), and the balance sheet is fully estimated
  with **no liability-account infrastructure**; adding it as revenue would be accounting-wrong. Needs an
  account-driven balance sheet + accountant decision. See `chart-of-accounts-additions-d2-d7-d12.md`.

| # | Symptom (real-ish input) | Engine output (wrong) | Expected | Likely cause | Found in |
|---|---|---|---|---|---|
| D1 | `فاتورة كهرباء المصنع` (utility bill) | مصروفات عمومية وإدارية - صيانة وإصلاح | منافع (كهرباء ومياه) | `كهرباء` appears in the maintenance keyword set (electrical-repair sense) and wins the tie vs the utilities sense | Phase 2 |
| D2 | `هدر مواد خام تالفة في الإنتاج` (production wastage) | تكلفة المبيعات - مواد خام ومكونات | a distinct "production wastage" account | **No such account exists** in the chart of accounts (`financial-utils.ts`); creating it needs an engine + COA change | Phase 2 |
| D3 | `طباعة تقارير لحساب العميل` (printing/reports) | تكلفة المبيعات - مواد تعبئة وتغليف | مصروفات عمومية وإدارية - قرطاسية ومطبوعات | `طباعة` is a packaging keyword and routes printing to packaging COGS | Phase 3 |
| D4 | `بدل إقامة فندق لمهمة عميل` (accommodation allowance) | مصروفات عمومية وإدارية - رواتب ومنافع موظفين - رواتب وأجور | مصاريف سفر وانتقالات | `بدل` triggers the personnel/salary path; "بدل إقامة" (travel per-diem) collides with salary "بدل/بدلات" | Phase 3 |
| D5 | vendor `مكتب ترجمة معتمد` (translation office) | مصروفات عمومية وإدارية - إيجارات | أتعاب/خدمات مهنية (translation service) | `مكتب` is a rent keyword (office space); any vendor whose name contains `مكتب` is pulled toward إيجارات | Phase 3 |
| D6 | `راتب محاسب أول` (accountant's salary) | مصروفات عمومية وإدارية - أتعاب مهنية واستشارات | رواتب ومنافع موظفين - رواتب وأجور | `محاسب` (accountant → professional services) outweighs `راتب` (salary); an employee's job title hijacks the category | Phase 3 |
| D7 | `هالك مخزون`, `عجز جرد سنوي` (inventory shrinkage) | تكلفة المبيعات - مواد خام ومكونات / مصروفات عمومية - أخرى | a distinct "inventory shrinkage" account | **No such account exists** in the chart of accounts (same class as D2) | Phase 4 |
| D8 | `شحن وارد للبضاعة من المورد` / `نقل مشتريات أصناف` (inbound freight) | مصروفات بيعية وتسويقية - نقل وتوصيل للعملاء (outbound!) / مواد خام ومكونات | تكلفة المبيعات - شحن ونقل للداخل | `شحن/نقل` matched without distinguishing **inbound (وارد/مشتريات)** from **outbound (للعملاء)** | Phase 4 |
| D9 | vendor `مستودع الجملة` (wholesale warehouse) | مصروفات عمومية وإدارية - إيجارات | تكلفة بضاعة / COGS | `مستودع` (warehouse) is a rent keyword; the **vendor name** hijacks the category — same root as D5 | Phase 4 |
| D10 | `شراء خلاطة خرسانة جديدة` (equipment purchase) | مصروفات عمومية وإدارية - أخرى | أصول ثابتة - أجهزة ومعدات (capitalize) | **Coverage gap** — `خلاطة خرسانة` (concrete mixer) isn't in the CAPEX-equipment keywords, so a clear asset purchase is not capitalized | Phase 5 |
| D11 | construction materials/labor (`أسمنت`, `حديد تسليح`, `بلوك خرساني`, `يوميات عمال`) | مصروفات عمومية وإدارية - أخرى (all of them) | direct project cost / WIP (COGS) | **Coverage gap** — the engine has no construction vocabulary; all project costs fall to "G&A - other" | Phase 5 |
| D12 | customer advance payment (revenue) | إيرادات المبيعات | إيراد مقدم / unearned (liability) | **Missing account** (revenue side) — no deferred-revenue account exists (same class as D2/D7) | Phase 5 |
| D13 | `التدقيق`, `المورد`, `للبضاعة` (prefixed words) | keyword silently NOT matched | should match the base word | **Arabic "ال"/attached-preposition prefix breaks word-boundary matching** — systemic; blocks full D5 fix | Track 1 |

**Status legend:** ✅ resolved → **D1, D3, D4, D6, D8, D9** (Track 1), **D5** (Track 2), **D10** (Track A),
**D2, D7** (COA additions). 🟡 partial → **D11** (Track A — COGS routing; WIP account deferred).
⛔ deferred → **D12** (liability; needs account-driven balance sheet + accountant). ⚠️ open/rescoped →
**D13** (pair with vendor/desc field separation, after per-keyword vendor-safety tagging).

## Diagnostic note — the shared root pattern (D3–D6, and likely D1)

D3–D6 (and D1) are **not five unrelated bugs — they are one structural defect repeated**:

> A **single Arabic word** is matched as a **substring** and chosen on its own, **without
> understanding the full sentence context**. One token has two senses, and the keyword scorer
> fires on the wrong sense because it never weighs the surrounding words.

- `طباعة` (printing) → assumed packaging, ignoring "تقارير" (reports) → D3
- `بدل` (allowance) → assumed salary, ignoring "إقامة فندق" (hotel per-diem = travel) → D4
- `مكتب` (office) → assumed rent, ignoring it is part of a **vendor name** ("مكتب ترجمة") → D5
- `محاسب` (accountant) → assumed professional service, ignoring "راتب" (salary) right before it → D6
- `كهرباء` (electricity) → assumed electrical-repair, ignoring "فاتورة" (bill = utility) → D1

Phase 4 added two more instances of the very same pattern:
- `شحن/نقل` (shipping) → picked outbound vs inbound on the bare token, ignoring `وارد/مشتريات`
  (inbound) vs `للعملاء` (outbound) → D8
- `مستودع` (warehouse) → assumed rent, ignoring it is part of a **vendor name** ("مستودع الجملة"),
  exactly like `مكتب` in D5 → D9

**Implication for the fix session:** patching each keyword individually is whack-a-mole. The durable
fix is **context-aware scoring** — e.g. (a) require/deny qualifiers (negative lookahead: `طباعة` is
NOT packaging when near `تقارير/مستندات`; `بدل` is NOT salary when near `إقامة/فندق/سفر`; `شحن` is
inbound when near `وارد/مشتريات/من المورد`), (b) separate the **vendor-name** field from the
**item-description** field so a vendor's name (`مكتب…`, `مستودع…`) can't drive the item category, and
(c) give multi-word phrases priority over single-token substrings. Fixing the **pattern** should
resolve D1, D3, D4, D5, D6, D8, D9 together.

The other items split into two more classes:
- **Missing accounts** (need new chart-of-accounts entries): D2 (production wastage), D7 (inventory
  shrinkage), D12 (deferred/unearned revenue).
- **Coverage gaps** (need new vocabulary/routing): D10 (concrete mixer → capitalize), D11 (no
  construction-materials/WIP vocabulary — all project costs fall to "G&A - other").

## Notes for the future engine-fix session
- D1, D3, D4, D5, D6 are the same root pattern: a keyword has two senses, and the
  scoring/tie-break picks the wrong one. A general fix (sense-disambiguation or
  priority/negative-lookahead tuning) would likely resolve several at once.
- D2 is different: it needs a **new account** in the chart of accounts plus engine routing.
- The activity rules are insight-only and do NOT depend on these being fixed — e.g. the
  Phase 3 project-link suggestion fires correctly even when the base category is wrong.
- Re-run the Phase 1–3 synthetic fixtures after any engine fix to confirm no new regressions.
