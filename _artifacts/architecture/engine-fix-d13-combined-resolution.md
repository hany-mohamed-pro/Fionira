# Engine Fix — D13 Combined Resolution (field-separation + ال-normalization)

**Date:** 2026-06-29
**Precision:** MAX — highest-risk remaining engine item, deferred from Track 2 (`bb88233`) / Track B.
**Outcome:** ❌ **NOT adopted. Engine reverted to last known-good. D13 remains OPEN** — with a sharper diagnosis. Both layers were measured and found unsafe; per the absolute rules, no forced fix was committed. This is the same disciplined honest-rejection outcome as Track 2.

---

## Methodology
- **Corpus (STEP 1 baseline):** 867 records — 802 real expense records (registry / restaurant_fb = phase1) + 65 synthetic (phase2 manufacturing 20, phase3 professional 16, phase4 trading 18, phase5 contracting 11). Each run = `getExpenseCategory(Raw_Entity, Item_Description, Total_Amount)`, the exact production call (`expenses-processor.ts:175`).
- Each layer measured **separately**, never combined untested.

## Engine mechanism (current / last known-good)
- STAGE 0 (override): matches `descText` only.
- STAGE 1 (vendor list): matches `nameText` only, low score (300–500).
- STAGE 2 (keywords, 600–1000) + STAGE 3 (contextual overrides, 3500–5000): match **`allText` = nameText + descText** — the leakage vector (a word inside a vendor name can score at full keyword/override strength).

---

## STEP 2-3 — Field-separation, measured ALONE — REGRESSES a legitimate signal
**Change tried (a hybrid, stronger than Track B's blunt version):** STAGE 2 keywords match `descText` at full score and the vendor `nameText` separately at **0.3×** (a hint, not an override); STAGE 3 strong overrides match `descText` only.

**Blast radius (field-separation alone): 1 / 867 — and it is a REGRESSION, not an improvement:**
```
[phase2] name="معدات المخابز الكبرى" desc="قالب إنتاج صناعي كبير"  (group="tools_high_value", total=6,900)
   أصول ثابتة - أجهزة ومعدات  →  تكلفة المبيعات - مستهلكات تشغيلية
```
The synthetic author labelled this `tools_high_value` (6,900 SAR) — it is **meant to be a fixed asset**, and the vendor "معدات المخابز" (bakery-equipment supplier) is a **legitimate** equipment signal. Field-separation discards that vendor signal: the description keyword "قالب" (operating consumables) wins, and even a 0.3× vendor hint (300) cannot survive the description's STAGE-3 override (3,500). This is **exactly the failure Track B documented** ("vendor names carry legitimate signal that blunt field-separation discards"). The hybrid lowered the blast radius (1 vs Track B's 8) but did **not** eliminate the core problem: a low-score vendor pass cannot separate *legitimate strong vendor signal* from *leakage*.

→ Field-separation has **0 real-record improvements and 1 semantic regression** on the corpus.

---

## STEP 4 — ال-normalization layered on top — INDEPENDENTLY UNSAFE
**Change tried:** strip a leading "ال" from each *description* word only (never the vendor name).

**Combined blast radius: 19 / 867.** Beyond field-separation's regression, the ال layer added **two independent regression classes:**

1. **Root-word breakage** — "ال" as part of the root, not the article:
   ```
   desc="الوان بودرة" / "الوان للكيك"  (ألوان = "colours")
   تكلفة المبيعات - مواد خام ومكونات  →  مصروفات عمومية وإدارية - أخرى
   ```
   ألوان → "وان" loses the raw-materials match.

2. **descOnly-keyword exposure** — stripping reveals an ambiguous generic word that hits a descOnly rule:
   ```
   [phase3] "شركة الاتصالات السعودية" / "فاتورة إنترنت المكتب"  : اتصالات وإنترنت ⇒ إيجارات
   [phase5] "الشركة السعودية للكهرباء" / "فاتورة كهرباء المكتب" : منافع (كهرباء ومياه) ⇒ إيجارات
   ```
   "المكتب" (the office) → "مكتب" triggers the `مكتب`→rent descOnly keyword, hijacking telecom/utility bills into **rent**.

→ ال-normalization is unsafe **independently** of vendor leakage (it is a description-side problem), so field-separation does not "make ال safe."

---

## Sharper diagnosis (the value of this attempt)
The plan's hypothesis was: *field-separation removes the vendor-leakage objection, then ال becomes safe.* Measurement refines this into two distinct, separable facts:

1. **Field-separation's real problem is NOT just leakage — it is signal/leakage entanglement.** A vendor name simultaneously carries *legitimate* category signal (معدات المخابز → equipment) and *leakage* (المعدات in a rental company's name). A flat field switch or a uniform low-score vendor pass treats both identically and therefore must sacrifice one. The documented prerequisite stands and is now confirmed by a second independent measurement: **per-keyword vendor-safety tagging FIRST** — mark which keywords are safe to match on a vendor name (e.g. STC, المراعي) vs which leak when found there (معدات, موقع, مكتب) — *then* field-separation can keep legitimate vendor signal while blocking leakage.

2. **ال-normalization has its own, separate unsafety** (root-words like ألوان; descOnly ambiguity like مكتب) that no amount of field-separation fixes. A safe ال-mechanism needs (a) a root-word guard and (b) descOnly-keyword disambiguation — neither attempted (would be whack-a-mole now).

---

## STEP 6 — D5 (الترجمة) status: narrow patch, partially resolved
- Bare **"ترجمة"** → correctly `أتعاب مهنية واستشارات` (narrow keyword patch works). ✓
- ال-prefixed **"الترجمة"** → `أخرى` — **still unresolved** (the narrow patch doesn't cover the ال-form; the general ال-mechanism is unsafe). D5's ال-prefixed form **remains open**, gated on a safe ال-mechanism.

## STEP 7 — Cross-activity non-interference
Engine reverted → byte-identical to HEAD → `financial-intelligence/rules/activity/*` and all activity-insight outputs are unaffected (zero change). Confirmed by `git diff` (no engine diff).

## Note: المعدات / الموقع leakage in the CURRENT engine
Without ال-stripping (the current state), "المعدات"/"الموقع" in a vendor name do **not** leak — the "ال" prefix itself blocks the bare keyword from matching (`(?:^|\s)معدات` ≠ "المعدات"). The leakage class only manifests *if* ال-stripping is added — which is why ال and field-separation were scoped to be solved together. Both being unsafe, the engine stays in its current (leakage-free for the un-stripped case) state.

---

## Final disposition
- ❌ **Field-separation:** reverted — regresses a legitimate strong vendor signal (tools_high_value), no real-record gain.
- ❌ **ال-normalization:** reverted — two independent description-side regression classes.
- 🟡 **D13:** remains OPEN. Confirmed prerequisite: **per-keyword vendor-safety tagging** must come first (tag safe-on-vendor vs leak-on-vendor keywords); only then can field-separation + a guarded ال-mechanism be layered safely. D5's ال-prefixed form rides on the same future work; its bare form stays on the narrow patch.
- ✅ **No forced fix committed.** Engine unchanged. Only this report + the debt-log diagnosis are committed.
