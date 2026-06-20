# Engine Fix — Track 2: D13 ("ال" prefix) — measured, rejected globally, D5 resolved narrowly

**Goal:** fix D13 (Arabic definite-article "ال" breaks word-boundary matching) and complete D5.
**Outcome:** the **global** D13 root-fix was implemented, **measured, and REJECTED as unsafe** (it
re-exposes the vendor-name-bleed class and causes regressions). **D5 was instead resolved with a
targeted, zero-regression keyword fix.** D13 remains open and re-scoped.

This is an honest "we tried the root fix, proved it unsafe, and chose the safer path" report — exactly
the judgment the task authorized.

---

## STEP 1 — baseline

Captured before-state for **795 rows** (730 real + 65 synthetic). The only pure D13-blocked target is
**D5** (`ترجمة مستندات لصالح مشروع التدقيق الضريبي` → "أخرى"; professional never fires because `التدقيق`
≠ `تدقيق`). Probe targets P1/P2 already worked via other words.

## STEP 2 — TRUE blast radius (measured BEFORE committing to a fix)

Implemented the candidate mechanism — a **symmetric "ال"/"لل" strip** applied to both input text and
regex sources (so words that themselves start with "ال" keep matching). Measured against all 795 rows:

- **First attempt (ال/لل/بال/وال/فال/كال):** 22 changed. Found `بالموقع` (at the site) → `موقع`
  (website) → subscriptions — a false collision. Narrowed to **ال/لل only**.
- **Narrowed (ال/لل):** **21 changed (17 real + 4 synthetic).**

Every changed record was examined (not assumed fine). The decisive finding:

> The strip applied to the **vendor name** re-exposes **vendor-name bleed**: once the article is removed,
> a generic word in the vendor's name matches an item keyword via `allText`.
> - `مؤسسة تأجير المعدات` → `المعدات`→`معدات` → **fixed-asset** for a *rental* expense (CC-5003) — wrong.
> - `معرض المعدات الثقيلة` → same → CC-5005.
> - `عمالة الموقع` → `الموقع`→`موقع` (website) → **subscriptions** for site labor (CC-5006) — wrong.

Even the real-730 "improvements" (e.g. fruit-vendor → raw materials) partly relied on this *accidental*
bleed rather than the item description. This is the **same vendor-bleed class** Track 1 only partly
solved (it made the *rent* keyword `descOnly`; equipment/subscriptions/etc. are still `allText`).

## STEP 3 — design decision (per the task's explicit authorization to choose a safer path)

A global "ال" strip cannot be made safe **on its own**, because its blast radius is dominated by
vendor-name bleed, which is a *separate* unsolved architectural item (item keywords matching the vendor
name). Forcing it would trade a clean D5 for new regressions. Therefore:

- **Rejected & reverted** the global tokenization change.
- **Resolved D5 narrowly and correctly:** added `ترجمة`/`translation` as a professional-services keyword
  (`REGEX_PROFESSIONAL` + the Stage-2 professional keyword). Translation *is* a professional service, so
  this is semantically right and independent of the "ال" root.

## STEP 4 — verification of the chosen fix

| Check | Result |
|---|---|
| 730 real records changed vs baseline | **0** |
| 5 synthetic fixtures changed | **1** — only the D5 record (`PS-3005`) |
| D5 → target category | ✅ `مصروفات عمومية وإدارية - أتعاب مهنية واستشارات` |
| Cross-activity-rule non-interference | ✅ identical (P2 tools2+transport2, P3 link6, P4 packaging3+shrinkage2, P5 cost6+labor2) — PS-3005's project-link insight still fires despite its base category changing |

`npx tsc --noEmit` → exit 0.

## STEP 5 — honest report

- **D5 — RESOLVED**, cleanly, zero regression. Stated plainly.
- **D13 — NOT resolved.** The global root-fix was implemented and **measured to be unsafe** (21-record
  blast radius dominated by re-exposed vendor-name bleed, with genuine synthetic regressions). It was
  **reverted**, not forced. This is a deliberate, evidence-based rejection of the literal Track-2 spec —
  the task explicitly authorized choosing the safer path.
- **Re-scoped D13:** its true resolution must be bundled with **vendor/description field separation**
  (item keywords matching `descText` not `allText` — the change deferred in Track 1). Done together, the
  "ال" strip becomes safe because vendor names no longer feed item-keyword matching. Recommend a future
  "Track: vendor/desc separation + ال-tolerance" that measures blast radius again with that combination.

## Net debt movement

Resolved this track: **D5**. Still open: **D13** (re-scoped), **D2, D7, D10, D11, D12** (untouched).
The commit message reflects reality: D5 fixed, D13 measured-and-deferred — *not* "resolves D13".
