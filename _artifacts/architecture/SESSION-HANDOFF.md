# Fionira — Session Handoff

> Resume point for any future session. HEAD = `bb88233`. Working tree clean except the three
> long-standing untouched data/lock files (`data/erp_registry.json`, `data/uploads.json`,
> `package-lock.json`). Evidence-based; pulled from live git + file state, not memory.

## 1. What this project is

Fionira is an **Arabic-first financial intelligence + governance platform for Saudi SMEs**. It is built
to act as the **expert *for* a non-specialist user** — the owner does not need to know accounting; the
system classifies, validates, and governs the financials and surfaces plain-language decisions. It is
**not** a traditional ERP and does not push accounting mechanics onto the user.

## 2. Complete chronological commit ledger (root → HEAD, 33 commits)

This Claude Code session resumed at `12a0529`; commits `2aaa928` → `bb88233` are this session's work.
Everything above `12a0529` was already in history at session start (security/UX/early-classification).

| # | Hash | Tag | Description |
|---|---|---|---|
| 1 | `be5d30d` | [INIT] | Initial clean commit (start of recoverable history) |
| 2 | `464ccdc` | [SECURITY] | claims-based auth, RBAC, remove tamper route, Firestore isolation [PR-1..7] |
| 3 | `a9e16bc` | [SECURITY] | harden subcollection tenant isolation via parent-doc lookup (PATCH-7 follow-up) |
| 4 | `355999c` | [UX] | unblock new-user login bootstrap + wire WelcomePage |
| 5 | `09974d8` | [SECURITY] | secure first-admin bootstrap in fix-role handler |
| 6 | `8e6ca83` | [ARCHITECTURE] | architecture data-plane map + operational readiness audit |
| 7 | `1e644fb` | [SECURITY] | ensure sensitive files are gitignored |
| 8 | `7ee4660` | [UX] | improve first-upload experience in FileManagement |
| 9 | `934892e` | [UX] | fix hardcoded module name in upload screen |
| 10 | `eceb9e4` | [UX] | align moduleTitle with canonical sidebar labels |
| 11 | `6d713b1` | [UX] | make governance status visible after upload |
| 12 | `f6195de` | [UX] | governance pending-files alert on dashboard |
| 13 | `f2a60a4` | [UX] | governance alert when staged files exist pre-first-active |
| 14 | `01e6e19` | [ARCHITECTURE] | Phase C1 — journal_entries Postgres schema plan (no execution, no cutover) |
| 15 | `e652cc4` | [CLASSIFICATION] | audit FI engine vs account-classification reality (docs) |
| 16 | `7b47295` | [CLASSIFICATION] | reconcile classification audit vs real processed data (docs) |
| 17 | `17a598f` | [ENGINE-FIX] | harden categorization engine — confidence, normalization bug, bilingual coverage |
| 18 | `2e6349a` | [ENGINE-FIX] | complete Stage-3 normalization (per-rule verified); bilingual parity flagged |
| 19 | `ab23cc0` | [CLASSIFICATION] | forensic verification of classification history (docs) |
| 20 | `12a0529` | [ARCHITECTURE] | add CLAUDE.md auto-sync git workflow |
| 21 | `2aaa928` | [CLASSIFICATION] | remove dead code in categorization-engine |
| 22 | `37180e0` | [CLASSIFICATION] | merge duplicate keyword blocks (marketing/gov/stationery) |
| 23 | `5a95395` | [ARCHITECTURE] | split heavy vendor libs (manualChunks) — bundle 3664→725 KB |
| 24 | `b6e4e45` | [CLASSIFICATION] | unify travel category to canonical 'مصاريف سفر وانتقالات' |
| 25 | `be14600` | [CLASSIFICATION] | permanent canonicalization design principle (CLAUDE.md) |
| 26 | `52cb0b7` | [CLASSIFICATION] | activity phase 1 — restaurant/F&B wastage |
| 27 | `6a66112` | [CLASSIFICATION] | activity phase 2 — manufacturing/food |
| 28 | `a6a5731` | [CLASSIFICATION] | activity phase 3 — professional services |
| 29 | `ced0cc2` | [CLASSIFICATION] | activity phase 4 — trading/retail |
| 30 | `679f791` | [CLASSIFICATION] | activity phase 5 — contracting/construction (expenses+revenues) |
| 31 | `cf90a62` | [ENGINE-FIX] | Track 1 — context-aware tokenization (resolves 6 of 7: D1,D3,D4,D6,D8,D9) |
| 32 | `6705b53` | [DOCS] | session handoff document created |
| 33 | `bb88233` | [ENGINE-FIX] | Track 2 — D5 resolved surgically (ترجمة/translation = professional); global "ال"-prefix fix attempted, **measured unsafe** (21-record blast radius dominated by vendor-name leakage), **rejected and reverted** |

## 3. Current system state (factual, verified)

- **Auth / RBAC:** claims-based auth + RBAC, tamper route removed, Firestore tenant isolation, and
  PATCH-7 parent-doc subcollection isolation are **committed in code/rules** (`464ccdc`, `a9e16bc`,
  `09974d8`). Live enforcement depends on a valid Firebase project, deployed `firestore.rules`, and
  custom claims being set (`scripts/set-dev-admin-claims.ts`). **Live deploy / key validity is not
  verifiable from the repo** — see §7.
- **Data plane (current reality):** three-way. Dev/runtime uses an **in-memory JSON store**
  (`devMemoryDb` in `server.ts`) persisted to `data/*.json`; the client uses **Firestore**; a
  **Postgres** `journal_entries` schema is **planned only** (`01e6e19`, no execution, no cutover).
- **Classification engine (`categorization-engine.ts`):** Stages 0–2 hardened with `nrx`/`nTest`
  normalization (`17a598f`), Stage-3 normalization complete (`2e6349a`), **Track 1 context-aware fixes**
  (`cf90a62`), and **Track 2's surgical D5 fix** (`bb88233`). The net engine change since Track 1 is
  **only D5's targeted keyword** (`ترجمة`/`translation`) — the global "ال" tokenization attempt was
  reverted and left **zero trace** (confirmed by `git diff`). Treated as frozen except via approved
  engine-fix tracks.
- **Activity-aware layer:** 5 profiles live (restaurant_fb, manufacturing_food, professional_services,
  trading_retail, contracting_construction), **insight-only**, **zero engine coupling** — verified by
  the cross-rule non-interference test (re-confirmed after Track 1). Wired through both the expenses and
  revenues intelligence paths; activity selected via a fixed enum dropdown in Settings.
- **PATCH-7 (subcollection tenant isolation):** committed structurally (`a9e16bc`); **live Firebase
  rules deployment to a real environment remains pending/unverifiable from the repo.**

## 4. Open technical debt (live from `engine-technical-debt.md`)

**RESOLVED — 7 items:** D1, D3, D4, D6, D8, D9 (Track 1) + **D5** (Track 2, surgical). All zero-regression.

**OPEN — 5 items (unchanged):**

| # | Description | Discovered | Severity | Recommended track |
|---|---|---|---|---|
| D2 | production-wastage has no dedicated account | Phase 2 (`6a66112`) | MEDIUM | new-accounts track |
| D7 | inventory-shrinkage has no dedicated account | Phase 4 (`ced0cc2`) | MEDIUM | new-accounts track |
| D12 | customer advance → no deferred-revenue (unearned) account | Phase 5 (`679f791`) | MEDIUM-HIGH | new-accounts track |
| D10 | equipment purchase (concrete mixer) not capitalized | Phase 5 (`679f791`) | MEDIUM-HIGH | coverage track |
| D11 | no construction vocabulary — project costs fall to "G&A - other" | Phase 5 (`679f791`) | MEDIUM | coverage track |

**D13 — RESCOPED, not a standalone fix.** The "ال"-prefix root is **entangled with vendor-name /
description-field separation** (the same architectural gap behind D5/D9). Track 2 *proved* this: a
universal "ال" strip re-exposes vendor-name leakage —
- `مؤسسة تأجير المعدات` (a *rental* company) → `المعدات`→`معدات` → **fixed-asset** category (wrong);
- `عمالة الموقع` (site-labor vendor) → `الموقع`→`موقع` (website) → **subscriptions** category (wrong).

The isolated attempt was measured (21-record blast radius) and **rejected**. D13 must be solved
**together with** the field-separation work — see §6.

## 5. Explicitly NOT started

- **Bilingual parity** — flagged needs-human-review (~29 rules per the prior audit; see `17a598f`,
  `2e6349a`). Not implemented.
- **Any activity beyond the 5** implemented.
- **Any engine-fix track beyond Tracks 1–2** (new-accounts, coverage, and the combined
  field-separation + ال track all pending).
- **Accounting Bundle** — dedup re-enable, VAT-posting formalization, double-entry enforcement.
  Explicitly still **gated**, not started.

## 6. Recommended next-session priority (professional opinion)

**COMBINED TRACK: vendor-name/description-field separation + ال-prefix normalization, designed and
tested together as ONE mechanism — not two sequential attempts.**

Rationale: Track 2 *proved* these are **not independent problems** — solving one without the other
reopens the other (universal "ال" stripping re-exposes the vendor-name leakage that field-separation is
meant to close). A future session should:

1. **Design the field-separation mechanism FIRST** — likely a `descOnly`-style flag extended
   project-wide (building on the `descOnly` pattern already introduced in Track 1 for D9), so item
   keywords match the **description text**, not the vendor name.
2. **Then layer ال-prefix normalization on top** of the now-separated description text (vendor names no
   longer feed item-keyword matching, so stripping "ال" can no longer leak generic vendor words).
3. **Then re-measure blast radius** on that *combined* mechanism — never on raw "ال"-stripping alone
   (which Track 2 showed is dominated by vendor leakage, not by genuine prefix fixes).

Same baseline-first, one-change-at-a-time, full-regression discipline as Tracks 1–2. The independent
**new-accounts** (D2, D7, D12) and **coverage** (D10, D11) tracks are lower-risk, can be done in any
order, and the insight layer already compensates for them operationally.

## 7. Critical operational reminders for next session

- **Firebase service-account key:** `firebase-service-account.json` exists in the repo root; the prior
  checkpoint notes **key rotation/validity must be verified manually by the user** — do not assume the
  live Firebase environment is functional. Auth/RBAC and PATCH-7 enforcement are unverifiable from the
  repo alone.
- **Git history starts at `be5d30d`** ("Initial clean commit") — no earlier history is recoverable.
- **The user is a financial manager (domain expert), not a developer.** Claude Code executes; the user
  (with the consultant) decides direction. Surface professional disagreement, but do not change scope
  unilaterally.
- **Precision discipline = MAX, non-negotiable project policy**, for anything touching
  `categorization-engine.ts`, `erp-engine.ts`, `server.ts` auth, or `firestore.rules`: baseline first,
  one change at a time, full regression after each, honest reporting, commit only on clean verification.
- **Sync workflow (CLAUDE.md):** project syncs between two machines; commit + push after each meaningful
  change. The three modified data/lock files in the working tree are long-standing and intentionally
  left untouched throughout this session.
- **Verification fixtures available:** the real 730-record dataset (`data/erp_registry.json`) + the 5
  synthetic activity fixtures (`_artifacts/architecture/phase*-synthetic-*.json`) are the regression
  harness for any future engine change.
