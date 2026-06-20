# Fionira — Session Handoff

> Resume point for any future session. HEAD = `892c4df`. Working tree clean except the three
> long-standing untouched data/lock files (`data/erp_registry.json`, `data/uploads.json`,
> `package-lock.json`). Evidence-based; pulled from live git + file state, not memory.

## 1. What this project is

Fionira is an **Arabic-first financial intelligence + governance platform for Saudi SMEs**. It is built
to act as the **expert *for* a non-specialist user** — the owner does not need to know accounting; the
system classifies, validates, and governs the financials and surfaces plain-language decisions. It is
**not** a traditional ERP and does not push accounting mechanics onto the user.

## 2. Complete chronological commit ledger (root → HEAD, 42 commits)

This Claude Code session resumed at `12a0529`; commits `2aaa928` → `892c4df` are this session's work.
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
| 36 | `3ca0d0c` | [DOCS] | handoff update post Phase A (Track A + Track B outcomes) |
| 37 | `e46052f` | [CLASSIFICATION] | D2/D7 chart-of-accounts additions (engine routing + `CATEGORY_ORDER`); D12 deferred — later found COGS wiring incomplete (see #41/#42) |
| 38 | `e8510d6` | [AUDIT] | Balance Sheet deep audit — verdict: **actively misleading** (figures fabricated by fixed ratios; equity is a forced plug → always balances vacuously) |
| 39 | `f60038f` | [UX] | Balance Sheet honest labeling — top warning banner + 6 "تقديري" badges + reworded disclaimer |
| 40 | `9ed75b9` | [AUDIT] | Trial Balance deep audit — verdict: **sound** (real tenant-scoped journal entries; balance guaranteed by double-entry construction, not a plug); no fix needed |
| 41 | `5a165ed` | [AUDIT] | Income Statement deep audit — verdict: **sound source**; found D2/D7 NOT actually in `cogsCategories` (corrects e46052f's overstated "under COGS" claim) |
| 42 | `892c4df` | [FIX] | Income Statement `cogsCategories` — D2/D7 now genuinely end-to-end under COGS; zero regression on 730 real |

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

### Financial Statement Triad — Audited 2026-06-21 (Phase B)

| Statement | Verdict | Evidence / status |
|---|---|---|
| **Balance Sheet** | ❌ **Actively misleading** | Fully ESTIMATED via fixed ratios from the Income Statement's net profit (`cash = netIncome×0.4`, `AR = revenues×0.15` …); **equity is a forced plug** so it always balances vacuously. Now **labeled "تقديري"** in the UI (`f60038f`: banner + per-card/section badges + reworded disclaimer). A *real* fix requires the Postgres `journal_entries` schema + a chart-of-accounts-with-types (Phase C1 `01e6e19`) — **architecturally blocked**, not a `BalanceSheet.tsx` change. Audit: `balance-sheet-audit.md`. |
| **Trial Balance** | ✅ **Sound** | Real journal-entry aggregation; balance **guaranteed by double-entry construction** (each entry adds its amount to one debit + one credit), **not** a forced plug; tenant-scoped; correctly excludes superseded `_v{n}` versions (`isActive !== false`); has a genuine imbalance warning. No fix needed. Audit: `trial-balance-audit.md`. |
| **Income Statement** | ✅ **Sound source** | Aggregates **real revenue/expense records** (not estimates). D2/D7 wastage/shrinkage now correctly flow into **COGS** (`892c4df`, after `5a165ed` found them landing in OPEX via a stale hard-coded list). **Net profit has been reliable throughout** — the D2/D7 gap only affected the COGS/OPEX *split presentation*, never the bottom line. Audits: `income-statement-audit.md`, `income-statement-d2-d7-cogs-fix.md`. |

**Strategic implication:** the core **double-entry / posting foundation is sound** (Trial Balance + Income
Statement both run on real data). The **one** flawed statement (Balance Sheet) is flawed **only in its own
ratio-conversion layer** — it distorts good upstream data, it does **not** inherit bad data. So the fix
surface is contained and well-understood, not a systemic data-integrity problem.

## 4. Open technical debt (live from `engine-technical-debt.md`)

**RESOLVED — 10 items:** D1, D3, D4, D6, D8, D9 (Track 1) + **D5** (Track 2) + **D10** (Track A) +
**D2, D7** (COA additions `e46052f`, now genuinely end-to-end under COGS as of `892c4df`). All zero-regression.

**PARTIALLY RESOLVED — 1 item:** **D11** (Track A) — construction materials now route to the existing
COGS raw-materials account; a *dedicated* construction direct-cost/WIP account is still missing.

**DEFERRED — needs a NEW account-type the system doesn't have + an accountant decision:**

| # | Description | Discovered | Severity |
|---|---|---|---|
| D12 | customer advance → **deferred/unearned revenue is a LIABILITY**; the Balance Sheet is estimated with no liability-account infrastructure, so there is no correct home yet (adding it as revenue would be accounting-wrong) | Phase 5 (`679f791`) | MEDIUM-HIGH |

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

**Phase B continues — audit the remaining modules, in priority order by financial / user-trust
sensitivity** (apply the SAME discipline used for the statement triad: read-only audit first, then
label-or-fix **only after explicit confirmation**):

1. **TaxDeclaration** — ZATCA-facing, highest sensitivity (wrong VAT figures have regulatory consequence).
2. **OwnersSummary** — owner-equity / drawings view; trust-sensitive.
3. **PayrollDashboard** — wages/GOSI; sensitive but mostly pass-through of payroll records.
4. **BanksDashboard** — cash/bank movements.
5. **SmartInvoice / QuotationManager** — outward-facing documents (customer-visible).
6. **UserManagement** — lowest financial sensitivity, mostly admin CRUD.

**Still-open engine/accounting debt (tracked in §4, parallel to the module audits):**
- **D12** (deferred/unearned-revenue LIABILITY) + **D11's** dedicated construction WIP/direct-cost
  account — both need the **chart-of-accounts-with-types / account-driven balance sheet** foundation
  (also what unblocks the real Balance Sheet). Bring the account naming + IFRS treatment to the
  financial-manager user as a product decision.
- **D13** (the "ال"/vendor-leakage tokenization issue) — highest risk; only via **per-keyword
  vendor-safety tagging FIRST** (Track 2 + Track B proved naive paths regress). May stay open.

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
