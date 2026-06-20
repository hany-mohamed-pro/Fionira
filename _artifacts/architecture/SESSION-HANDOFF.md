# Fionira — Session Handoff

> Resume point for any future session. HEAD = `849c2b0`. Working tree clean except the three
> long-standing untouched data/lock files (`data/erp_registry.json`, `data/uploads.json`,
> `package-lock.json`). Evidence-based; pulled from live git + file state, not memory.

## 1. What this project is

Fionira is an **Arabic-first financial intelligence + governance platform for Saudi SMEs**. It is built
to act as the **expert *for* a non-specialist user** — the owner does not need to know accounting; the
system classifies, validates, and governs the financials and surfaces plain-language decisions. It is
**not** a traditional ERP and does not push accounting mechanics onto the user.

## 2. Complete chronological commit ledger (root → HEAD, 35 commits)

This Claude Code session resumed at `12a0529`; commits `2aaa928` → `849c2b0` are this session's work.
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
| 34 | `ecef9da` | [ENGINE-FIX] | Track A — D10 resolved (equipment purchase→fixed asset, rental-guarded); D11 partial (construction materials→existing COGS); D2/D7/D12 deferred (need new COA account) |
| 35 | `849c2b0` | [ENGINE-FIX] | Track B — D13 combined fix attempted; field-separation **measured unsafe** (8-record blast radius, legitimate vendor-signal regressions), **reverted**; D13 stays open (needs per-keyword vendor-safety tagging first) |

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
  (`cf90a62`), **Track 2's surgical D5 fix** (`bb88233`), and **Track A's two new Stage-3 rules**
  (`ecef9da`): construction/heavy-equipment purchase → fixed asset (rental-guarded, D10) and
  construction materials → COGS (D11). **Track B changed nothing** — its field-separation candidate was
  measured unsafe and reverted (`git diff` clean). Net effect: every engine change to date is verified
  zero-regression on the 730 real records. Treated as frozen except via approved engine-fix tracks.
- **Activity-aware layer:** 5 profiles live (restaurant_fb, manufacturing_food, professional_services,
  trading_retail, contracting_construction), **insight-only**, **zero engine coupling** — verified by
  the cross-rule non-interference test (re-confirmed after Track 1). Wired through both the expenses and
  revenues intelligence paths; activity selected via a fixed enum dropdown in Settings.
- **PATCH-7 (subcollection tenant isolation):** committed structurally (`a9e16bc`); **live Firebase
  rules deployment to a real environment remains pending/unverifiable from the repo.**

## 4. Open technical debt (live from `engine-technical-debt.md`)

**RESOLVED — 8 items:** D1, D3, D4, D6, D8, D9 (Track 1) + **D5** (Track 2) + **D10** (Track A). All zero-regression.

**PARTIALLY RESOLVED — 1 item:** **D11** (Track A) — construction materials now route to the existing
COGS raw-materials account; a *dedicated* construction direct-cost/WIP account is still missing.

**DEFERRED — need a NEW chart-of-accounts entry in `financial-utils.ts` + an accountant decision
(out of engine-only scope; the activity-insight layer already surfaces all three operationally):**

| # | Description | Discovered | Severity |
|---|---|---|---|
| D2 | production-wastage has no dedicated account | Phase 2 (`6a66112`) | MEDIUM |
| D7 | inventory-shrinkage has no dedicated account | Phase 4 (`ced0cc2`) | MEDIUM |
| D12 | customer advance → no deferred-revenue (unearned) account | Phase 5 (`679f791`) | MEDIUM-HIGH |

**D13 — STILL OPEN, twice-measured, sharpened diagnosis.** Track 2 showed a universal "ال" strip
re-exposes vendor-name leakage (`المعدات`→`معدات`→fixed-asset for a *rental*; `الموقع`→`موقع`→
subscriptions). Track B then showed the prerequisite **field-separation** step itself regresses
*legitimate* vendor signal (`عامل سباكة`/plumber → maintenance; `معدات المخابز`/equipment vendor →
fixed-asset are correct vendor hints that blunt separation discards). **Conclusion:** D13 needs
**per-keyword vendor-safety tagging FIRST** (declare per pattern whether it may match the vendor name),
then field separation, then "ال" — see §6.

## 5. Explicitly NOT started

- **Bilingual parity** — flagged needs-human-review (~29 rules per the prior audit; see `17a598f`,
  `2e6349a`). Not implemented.
- **Any activity beyond the 5** implemented.
- **Any engine-fix track beyond Tracks 1–2** (new-accounts, coverage, and the combined
  field-separation + ال track all pending).
- **Accounting Bundle** — dedup re-enable, VAT-posting formalization, double-entry enforcement.
  Explicitly still **gated**, not started.

## 6. Recommended next-session priority (professional opinion)

Two tracks remain, in this order:

**(1) NEW-ACCOUNTS track — D2, D7, D12 (do this first; lowest risk, highest clarity-of-scope).**
These are *not* engine bugs — each needs a new account added to the chart of accounts
(`financial-utils.ts`) plus the user/accountant's decision on naming + IFRS treatment
(production-wastage, inventory-shrinkage, deferred/unearned-revenue). Once the accounts exist, wiring the
engine to route to them is trivial and low-risk. This is a **product/accounting decision**, not a
tokenization risk — ideal to bring to the financial-manager user directly.

**(2) D13 — only via per-keyword vendor-safety tagging FIRST (highest risk; do last).** Track 2 and
Track B together proved the naive paths are unsafe: a universal "ال" strip re-exposes vendor-name leakage
(Track 2), and blunt field-separation discards *legitimate* vendor signal (Track B — plumber→maintenance,
equipment-vendor→equipment). The only safe sequence is:
1. **Tag each of the ~85 patterns** with whether it may match the vendor name (vendor-safe) or
   description-only — building on the `descOnly` flag from Track 1.
2. **Then** apply field separation using those tags.
3. **Then** layer "ال" normalization on the separated description text.
4. **Re-measure blast radius** at each step. Expect D13 may stay open if step 1 proves too large.

D11's remaining part (dedicated construction WIP/direct-cost account) folds into track (1).
Same baseline-first, one-change-at-a-time, full-regression discipline as every track so far.

## 7. Critical operational reminders for next session

- **⚠️ VERIFICATION NEEDED (named, explicit — check FIRST in the practical-testing phase):** Compare the
  current engine output on the user's **real restaurant Excel data** against the user's own
  **previously-corrected results** (which pre-date today's Track 1/2/A/B engine changes), to confirm no
  silent regression was introduced for that specific real-world dataset. The in-repo 730-record fixture
  showed **zero** regression at every step, but it is not guaranteed identical to the user's latest real
  file — so this is a distinct, mandatory check, not a vague caveat. Run it before any new engine work.
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
