# Activity-Aware Classification — Executive Summary (Phases 1–5)

A single high-level picture of the whole initiative. Technical detail lives in the per-phase docs.

## What was built

A tenant now picks its **business activity** from a fixed dropdown (6 values incl. "unset"). When set,
**activity-aware rules** add plain-language suggestions/alerts through the existing
`Insight → ValidationReviewScreen` governance pipeline. They **never change a category** — the
categorization engine was **never touched** (hard constraint held across all 5 phases).

| Phase | Activity | Net-new behavior |
|---|---|---|
| 1 | Restaurants / F&B | abnormal food-wastage alert (tenant-relative baseline) |
| 2 | Manufacturing / Food | tools/molds simplification + asset-transport treatment |
| 3 | Professional Services | link expense to project/client |
| 4 | Trading / Retail | sale-packaging → selling expense + inventory-shrinkage |
| 5 | Contracting / Construction | project-cost linking (norm) + direct labor + customer advance → deferred revenue |

## By the numbers

- **5 activity profiles** implemented (+ "unset" = today's exact behavior, zero regression).
- **6 activity rules** added (5 expenses-domain + 1 revenues-domain).
- **9 insight types** introduced.
- **Wiring:** activity enum in Settings → threaded through both the **expenses** and **revenues**
  intelligence paths. `categorization-engine.ts`: **0 changes**.
- **Verification:** every phase ran through the **real ingestion path** (`createValidationSession`) on
  clearly-labeled **synthetic** fixtures (Phase 1 used the real 730 F&B records).
- **Regression:** **zero** behavior change on the real 730-record dataset when unset; **zero
  cross-phase interference** — each activity's rules fire only under its own profile, confirmed across
  all 5 activities and both domains.

## Technical debt accumulated: 12 items (D1–D12)

All are **pre-existing engine issues surfaced by the synthetic data** — none introduced by this work,
none touched (engine frozen). They fall into three classes:

1. **Context-blind token collisions (7): D1, D3, D4, D5, D6, D8, D9.** One Arabic word matched as a
   substring and chosen without sentence context (طباعة/بدل/مكتب/محاسب/كهرباء/شحن/مستودع). **One root
   cause.** D8 (inbound freight mis-routed) proves the pattern reaches **core logic**, not just rare
   edge cases.
2. **Missing accounts (3): D2** production wastage, **D7** inventory shrinkage, **D12** deferred revenue.
3. **Coverage gaps (2): D10** equipment purchase not capitalized, **D11** no construction vocabulary
   (all project costs → "G&A - other").

## Readiness assessment for the engine-fix session

**Readiness: HIGH — recommend proceeding.** Rationale:

- The backlog is **concrete, reproducible, and test-backed**: 12 named items, each with an example
  input, the wrong output, the expected output, and the likely cause.
- There is a **clear shared root** for the largest class (7/12): replace context-blind single-token
  scoring with **context-aware scoring** + **separate the vendor-name field from the item description**
  + **prioritize multi-word phrases**. Fixing the pattern should clear all 7 at once.
- We have a **ready regression harness**: the 5 synthetic fixtures + the real 730 records, plus the
  cross-phase non-interference check, can validate engine fixes without guesswork.
- **Scope is now well-understood and broader than first assumed.** Early on we expected only rare edge
  cases; D8 (core inbound-freight logic) and D10/D11 (whole-activity construction coverage) show the
  engine work is more than cosmetic. Better to know this now, pre-launch.

**Suggested structure for that session (3 workstreams):**
1. Context-aware scoring refactor → D1, D3, D4, D5, D6, D8, D9.
2. New chart-of-accounts entries + routing → D2, D7, D12.
3. Construction (and similar) vocabulary/coverage → D10, D11.

The activity-aware layer is complete, safe, and independent of these fixes — it will keep working as-is,
and its suggestions already compensate for several of the gaps (e.g. project-link fires even when the
base category is "other").
