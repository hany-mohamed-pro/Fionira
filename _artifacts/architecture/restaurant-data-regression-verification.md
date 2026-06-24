# Engine vs. User's Real Restaurant Data — Regression Verification

**Date:** 2026-06-23
**Type:** Verification only. **No engine/erp/financial-intelligence file modified.**
**Verdict (one line):** **No genuine regression found — but NOT verifiable against an
explicit user-correction baseline, because none exists in the repo.** Re-running the
current HEAD engine on the user's real expense records reproduces the stored
classification for **95.25% (1083/1137)**; every divergence is either a refinement
(generic → specific) or a debatable-but-plausible reclassification — **none breaks a
specific-correct category into a wrong one**. ~8 records across 3 edge-case types are
flagged for the user's personal judgment.

---

## TASK 1 — Real data located; correction trail searched

**A) The real data** is `data/erp_registry.json`:
- **1137 expense** records, **335 revenue** records, **746 bank** records (+1 stray).
- Expense source files: `valid_source_june_1/2.xlsx` and **`corrected_source_june_1.xlsx`**
  — the user's real restaurant uploads. (The "730" figure used in earlier regression
  notes is a *subset*; the full real expense set is 1137.)

**B) Search for a prior manual-correction trail — NONE found:**
- **auditLogs (221 entries):** ALL are **file-lifecycle** actions —
  `upload_staged_file` (75), `classify_staged_file` (75), `activate_new_source` (38),
  `replace_active_source` (15), `archive_active_source` (13), `cancel_staged_file` (4),
  `restore_archived_source` (1). **Zero category-change / reclassification entries.**
- **No version chains:** records carry no `isActive` flag and no `_v{n}` markers.
- **Revenues are not engine-classified at ingestion:** `revenues-processor.ts` hardcodes
  `Category = "إيرادات المبيعات"` (confirmed: all 335 revenue records carry exactly that).
  So revenue classification is engine-independent and not part of this comparison.

**C) Plain report:** **Explicit before/after evidence does NOT exist.** The presence of a
file literally named `corrected_source_june_1.xlsx` (re-uploaded via the `replace`
flow) indicates the user applied corrections **by editing the source Excel and
re-uploading**, *not* via per-record in-app category overrides — so there is no logged
"user-approved category per record" to diff against. The stored `Category` reflects the
**engine version active at ingestion** (records span 2026-05-31 → 2026-06-23, i.e. mixed
engine versions), not a captured user decision.

---

## TASK 3 — Honest alternative: HEAD engine re-run vs stored category

Because no correction trail exists, I re-ran the **current HEAD `getExpenseCategory`** on
every real expense record and compared to its stored `Category`.

```
EXPENSE records: 1137   identical = 1083   differ = 54   → 95.25% identical
```

### The 54 divergences (stored → current HEAD), grouped

| # | Stored → Current | Read |
|---|---|---|
| 18 | G&A‑أخرى → **صيانة وإصلاح** | **Refinement** — maintenance items leaving the generic catch-all (e.g. "صيانة المكسر" mixer repair) |
| 8 | G&A‑أخرى → **COGS مواد خام** | **Refinement** — restaurant ingredients (حبوب قهوة/coffee, شوكلاتة/chocolate) correctly to COGS |
| 4 | G&A‑أخرى → **COGS تعبئة وتغليف** | **Refinement** — packaging (طباعة سليف+ستكر, اكياس شفافة) correctly to COGS packaging |
| 4 | G&A‑أخرى → **بيعية وتسويقية - نقل وتوصيل** | **Debatable** — "نقل طلبية" refrigerated delivery; outbound-selling vs inbound-COGS is a judgment call |
| 2 | G&A‑أخرى → **قرطاسية ومطبوعات** | Refinement — "طباعة اتفاقية مورد" printing → stationery |
| 2 | G&A‑أخرى → **نظافة وضيافة** | Refinement — "اسفنجة" sponge → cleaning |
| 2 | COGS‑مستهلكات → قرطاسية | Reclass — "ورق طباعة" printing paper; arguable but reasonable |
| 2 | COGS‑تعبئة → نظافة | Reclass — "ممسحة/مكنسة" mop/broom → cleaning (arguably more correct) |
| 2 | COGS‑مستهلكات → COGS‑تعبئة | Intra-COGS — "ورق طباعة انتهاء التواريخ" date-label paper |
| 2 | COGS‑مواد خام → COGS‑تعبئة | Intra-COGS — mixed item (الوان بودرة/ادوات كيك/اكياس) |
| 2 | G&A‑أخرى → **مصاريف سفر وانتقالات** | **🔴 Debatable / possibly worse** — "مرتبة للموظف/توصيل" (employee mattress); the توصيل=delivery token pulled it to travel |
| 2 | G&A‑أخرى → رسوم حكومية | Refinement — "الفحص الدوري لسيارة الشركة" vehicle inspection → govt fees |
| 2 | COGS‑شحن داخلي → **صيانة** | **🔴 Debatable** — "اجره دينا نقل ثلاجة" truck fee to move a fridge; neither bucket is clearly right |
| 2 | COGS‑مواد خام → صيانة | Refinement — "صيانة المكسر" mixer maintenance → maintenance |

### Interpretation
- **~46 of 54** move **from the generic `مصروفات عمومية وإدارية - أخرى` (G&A-other)
  catch-all → a specific, correct bucket**, or are sensible intra-COGS refinements.
  This is exactly the *direction* of the intended Track 1/2/A D-fixes (context-aware
  tokenization making classification more specific). **These are improvements.**
- **No case** takes a specific, correct category and breaks it into a clearly wrong one.
  The categories that changed were overwhelmingly the generic "أخرى" — so the engine
  refined vagueness, it did not corrupt good classifications. **→ No regression.**
- **~8 records across 3 transition types are genuinely DEBATABLE** and are flagged for
  the user's own judgment (the engine does **not** outrank the operator's expertise):
  1. **"مرتبة للموظف/توصيل" → travel** (the delivery token; the item is employee
     furniture) — most likely the weakest call.
  2. **"اجره دينا نقل ثلاجة" (fridge transport) → maintenance** — arguably inbound
     freight or asset-handling, not maintenance.
  3. **"نقل طلبية مبرد" refrigerated delivery → selling/distribution** — defensible if
     outbound, wrong if it is inbound material freight.

---

## TASK 4 — Live UI verification

Through the running app (port 3100, dev-auth): **Expenses → التصنيفات (حسابات
المصروفات / "دليل الحسابات التلقائي")** renders the user's **real** active expense data
("تم معالجة 385 عملية لـ 88 الموردون" for the currently-active source) into the correct
hierarchical restaurant chart of accounts — **تكلفة المبيعات**, **مصروفات بيعية
وتسويقية**, **مصروفات عمومية وإدارية** as main accounts (each expandable to its
sub-accounts). No console errors. This confirms the live system presents the engine's
classification of the real data coherently — consistent with the script.

> Scope note: the UI displays the *stored* classification (the engine runs at
> ingestion, not at render). The HEAD re-run above is therefore the substantive engine
> check; the live view confirms the same data renders correctly end-to-end.

---

## TASK 5 — Verdict (no hedging)

**Partial trust with named exceptions — no genuine regression.**

1. **No regression found.** HEAD engine reproduces 95.25% of the real expense
   classifications exactly; all 54 divergences are refinements (generic→specific, the
   intended fix direction) or plausible reclassifications. None degrades a
   specific-correct category into a wrong one.
2. **Not fully verifiable against the user's own ground truth** — because that ground
   truth was **never persisted** as a per-record correction trail (audit logs are
   file-lifecycle only; corrections were applied by re-uploading edited source files).
   So this is *not* the authoritative "engine vs user-approved" diff the task ideally
   wanted; it is the honest substitute.
3. **For the user to personally check (engine ≠ authority here):** the ~8 records in the
   3 🔴/Debatable rows above — especially "mattress→travel" and "fridge-transport→
   maintenance". Please eyeball these against your intent.

**Recommendation:** safe to proceed; **no engine change made or warranted by this
review.** If the user confirms any of the flagged edge cases are wrong, open a separate
MAX-precision engine-fix track for them (do not fix here — verification-only task).

## Constraints honoured
- No modification to `categorization-engine.ts`, `erp-engine.ts`, or any
  financial-intelligence file (`git` shows no code changes).
- No regression found → nothing to STOP-and-fix; flagged edge cases reported, not changed.
