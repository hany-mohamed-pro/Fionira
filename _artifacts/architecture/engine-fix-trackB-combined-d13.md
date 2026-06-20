# Engine Fix — Track B: D13 combined mechanism — attempted, measured, **still OPEN**

**Outcome:** the field-separation step (the prerequisite for the combined D13 fix) was implemented and
measured. It **produces genuine regressions** because vendor names sometimes carry *legitimate*
classification signal. The combined mechanism cannot be made safe with a blunt change, so it was
**reverted**. **D13 remains open** — an honest, evidence-based result (which the task explicitly accepts).

---

## STEP 1 — field separation alone (measured before layering "ال")

Candidate: make Stage-2 item keywords match the **description only** (`descText`), not the concatenated
`allText` (vendor name + description). Vendor hints already come from Stage 1.

**Blast radius: 8 records changed (6 real + 2 synthetic).** Every one examined:

| Record | before → after | verdict |
|---|---|---|
| `عامل سباكة \| شغل يد` (R136/R507) | صيانة وإصلاح → **أخرى** | ❌ regression — "سباكة" (plumber) in the vendor name is a *correct* maintenance signal, now lost |
| `معدات المخابز الكبرى \| قالب إنتاج صناعي كبير` (INV-2012, 6 900) | أصول ثابتة → **مستهلكات تشغيلية** | ❌ regression — high-value mold no longer capitalised; "معدات" vendor signal lost |
| `شركة الوان الهدية \| اكولبيتس` (R202/R571) | مواد خام → أخرى | ⚠️ debatable — "الوان" (colors) vendor signal lost |
| `مركز سلامة \| الفحص الدوري لسيارة` (R349/R708) | رسوم حكومية → أخرى | ⚠️ both wrong; only the *combined* (field-sep + "ال") would reach the correct مصاريف سيارات |
| `معدات الإنشاء \| تأجير رافعة برجية` (CC-5004) | أصول ثابتة → أخرى | ✅ improvement — a *rental* is no longer wrongly capitalised |

## STEP 2/3 — why the combined mechanism cannot be made safe here

The decisive finding: **vendor names carry legitimate signal in some cases and noise in others, and the
same matching mechanism serves both** —
- `عامل سباكة` (plumber) → maintenance is *correct* vendor signal.
- `مؤسسة تأجير المعدات` (equipment-rental co) → `المعدات`→`معدات`→fixed-asset is *wrong* vendor leakage.

Pure field-separation discards the correct signal (regressions above). A "lower-score vendor pass"
(the spec's suggested refinement) does not separate the two either: the leakage simply wins at a lower
score whenever the description has no competing signal (e.g. the rental case still capitalises because
nothing in the description outscores the leaked `معدات`). There is no single score threshold that keeps
plumber→maintenance while dropping rental-vendor→asset — it depends on whether the vendor's business
*aligns* with the item, which the engine cannot tell generically.

A safe fix therefore requires **per-keyword vendor-safety tagging** (declaring, for each of the ~85
patterns, whether it may match the vendor name) — a large, careful, separately-scoped effort. Layering
"ال" normalization on top before that tagging exists would only re-introduce the Track-2 leakage.

## Decision

- **Reverted** the field-separation change. Engine is unchanged from Track A (verified: 0 diff, D5 still
  professional — Track 2 not regressed). `npx tsc --noEmit` → exit 0.
- **D13 stays OPEN**, with a sharper diagnosis than before: it is blocked not just by "ال" but by the
  **absence of per-keyword vendor-safety tagging**. Recommended future track: tag each keyword's
  vendor-safety first, *then* apply field separation, *then* layer "ال", measuring blast radius at each
  step. Until that exists, D13 is correctly left open.
- No engine code shipped in Track B — only this finding is recorded (honest "still open, here's why").
