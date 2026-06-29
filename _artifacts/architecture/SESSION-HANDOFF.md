# Fionira — Session Handoff

## 0. Latest segment (2026-06-28): IA CONSOLIDATION COMPLETE (Phases 1–3) + new financial statements

This segment delivered the financial-statement triad completion + the full Information-Architecture
consolidation. **This is a natural, complete stopping point — today's IA consolidation goal is fully achieved.**

**A) Financial capabilities built this segment (all live-verified):**
- **Real Cash Flow Statement** (`8bfaaf64`) — direct-method, reconciled to the **actual bank closing balance** (shared `bank-cashflow-core.ts`); branch-aware. Investing/Financing honestly labelled, not fabricated.
- **Settings save fix** (`5482b2ae`) — dev-auth Firestore `permission-denied` no longer surfaced as a false save error (strictly a dev artifact; production unaffected).
- **Per-branch visibility** (`7bf4614b`) — `computePnLCore` single P&L source + `مقارنة الفروع` view + global branch scope.

**B) IA Consolidation Plan (`75cc6b0d`, corrected additive-only `a94f3d70`) — EXECUTED in 3 phases:**
- **Phase 1** (`acb0d8b7`) — Bank pages merged into one tabbed page (`BankAccountsView`: مطابقة / حسب النوع / حسب الطرف); Visual Analytics retired (strict GlobalDashboard duplicate). Zero info loss; multi-account never-merge re-verified.
- **Phase 2** (`2c26bdb5`) — **Owner Home** additive band (ربحك / النقدية لديك via reconciled cash / ما يحتاج انتباهك) above the *preserved* GlobalDashboard; **Profitability Waterfall relocated** to Income Statement (`ProfitabilityWaterfall.tsx`) and verified BEFORE **OwnersSummary retired** (gate honoured).
- **Phase 3** (`726af371`) — **Budget vs Actual** (`BudgetVsActual.tsx`): Reports tab after Income Statement + Owner Home one-line; budgets in `AppSettings.budgets`; Excel template + in-app editor; **Actual sourced exclusively from `computePnLCore` (zero drift)**; sign-aware variance; branch-aware. MVP = annual section-level.

Binding principle enforced throughout (`a94f3d70` "WHAT WE WILL NEVER DO"): **no existing KPI card, chart, or unique visualization was hidden, collapsed, demoted, or lost** — every consolidation was structural (fewer entry points) or additive, never a reduction of information.

**C) Deferred-items registry — RE-CONFIRMED INTACT for the next session (every open item):**
1. **D11** — full construction-materials WIP / job-costing (own dedicated session).
2. **D12** — deferred/unearned-revenue LIABILITY (needs chart-of-accounts-with-types).
3. **D13** — "ال"/vendor-leakage tokenization (highest risk; per-keyword vendor-safety tagging first).
4. **20-row preamble cap** on expenses/revenues parsing (bank parser already anchor-based).
5. **UserManagement real backend** (endpoints stubbed — debt B3).
6. **Balance Sheet structural fix** — replace estimated/labelled-"تقديري" equity with real chart-of-accounts-driven statement.
7. **Cash Flow Investing/Financing** — separable only after fixed-asset (D10) + owner-capital tagging (documented in `cash-flow-statement-build.md`).
8. **Smart branch suggestion** — suggest-don't-force branch inference at upload (planned, not started; §6).
9. **4 remaining activity profiles** — beyond the 5 done (insight-only rules).
10. **Bilingual parity (~29 rules)** — English coverage for classification rules flagged in `2e6349a`.
11. **NEW — Real Owners' Equity statement** (from Phase 2/3 scoping) — needs NEW data capture (owner contributions/drawings) + the chart-of-accounts-with-types foundation (shared with #6 Balance Sheet + D12). The ONLY remaining IA-roadmap item; a separate future milestone.

None of the above was touched/altered by this segment — all remain open and accurately stated.

> Resume point for any future session. HEAD = `74b3638`. Working tree clean except the
> long-standing untouched runtime/state files (`data/erp_registry.json`, `data/uploads.json`,
> and a few `data/**/staged-files/*.staged` left from live upload testing — all under the
> git-ignored/runtime `data/` tree). Evidence-based; pulled from live git + file state, not memory.
>
> **Latest segment (2026-06-22): Bank module audited & hardened end-to-end** — parser robustness,
> bank-native classification, dedicated reconciliation/movements pages, multi-account segmentation,
> and `branchId` established as a system-wide dimension. See §2 (commits `f1e723a`→`74b3638`), the new
> §3 "Bank Module" subsection, and §4 debt additions.

## 1. What this project is

Fionira is an **Arabic-first financial intelligence + governance platform for Saudi SMEs**. It is built
to act as the **expert *for* a non-specialist user** — the owner does not need to know accounting; the
system classifies, validates, and governs the financials and surfaces plain-language decisions. It is
**not** a traditional ERP and does not push accounting mechanics onto the user.

## 2. Complete chronological commit ledger (root → HEAD, 56 commits)

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
| 43 | `b0a88ba` | [DOCS] | session handoff update — financial statement triad audit complete (BS flawed+labeled, TB sound, IS sound+D2/D7 fixed) |
| 44 | `1c9cd92` | [AUDIT] | User Management live audit — page unreachable in UI + endpoints are no-op stubs (empty list, fake-success promote/delete); auth layer intact |
| 45 | `3cece7f` | [FIX] | CommandPalette mode mismatch corrected; live-verified the page is in fact reachable (audit correction) — **palette is dead code (no open-trigger exists)**; endpoints remain stubbed |
| 46 | `bc1e9ca` | [UX] | User Management discoverability — added as a Settings sub-tab (was hover-menu-only) |
| 47 | `f322ed3` | [AUDIT] | Payroll Dashboard live audit — **zero payroll data existed at the time**; Deductions KPI reads a non-existent field (always 0) found by code; GOSI panel confirmed hardcoded placeholder; read-only aggregate, independent of the intelligence engine |
| 48 | `f1e723a` | [FIX] | Payroll & Bank Excel parser robustness — real user files (`رواتب JANUARY 2025`, `Records_12042026-2.xlsx`) now parse; reconciled to the **riyal/halala** against the files' own printed control totals; fixed 3 latent bugs (negative-debit sign, Excel-serial dates, false `PAYROLL_WITH_VAT` flag). New `header-detection.ts` (sparse/multi-row headers + preamble skip) |
| 49 | `f0031f0` | [FEAT] | Bank-native classification engine — transaction type + counterparty + GL account (`bank-classification.ts`), replacing expense-style categorization for bank records |
| 50 | `9d4c76e` | [FEAT] | Dedicated Bank Reconciliation page — **was misrouted to the generic alerts/anomalies center**; opening/closing/running-balance + continuity, backward-compatible with legacy records |
| 51 | `b282746` | [FEAT] | Bank Movements — bank-native view (by transaction type / by counterparty) with cash-flow KPIs, replacing the expense chart-of-accounts view |
| 52 | `7b48c41` | [UX] | GL-nature grouping with per-nature subtotals + **universal drill-down** (account/type/counterparty → individual transactions with running balance) |
| 53 | `676bebe` | [DOCS] | Rich classification activated via the real governance **replace-flow**; control totals unchanged, verified **to the halala** before/after |
| 54 | `61347e8` | [AUDIT] | Multi-bank investigation — accounts had **NO identity captured**; multiple active bank files **silently merged** balances into one meaningless running balance (no warning); upload classifier account-blind (risk of false "replace" losing an entire account). Verdict: **actively misleading**, fix before Balance Sheet cash link |
| 55 | `b0df476` | [FEAT] | **`branchId` defined as a system-wide central dimension** (`dimensions.ts`, zero-migration default). Bank accounts now identified (`Account_Number`/`Bank_Name` from preamble) and **segmented** — Reconciliation/Movements never merge across accounts; upload classifier account-aware (safety-biased to additive). Live-verified: the exact `61347e8` false-mismatch scenario now shows **2 independently-reconciled accounts, zero false diff** |
| 56 | `74b3638` | [DOCS] | Architectural review — is bank account-segmentation generalizable? **Verdict: NO** — tied to running-balance semantics (order-dependent, stateful), unique to bank accounts today. `branchId` is the correct/sufficient generalization for the real "multiple sources" need elsewhere (payroll multi-entity, expenses/revenues multi-store — additive flows, not running balances). Bank code deliberately **left untouched** |

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

### Bank Module — Audited & Hardened 2026-06-22

The bank-module segment (commits `f1e723a`→`74b3638`) is **closed: hardened, live-tested, and
architecturally reviewed**. Verified against the user's **real** files (`رواتب JANUARY 2025`,
`Records_12042026-2.xlsx`), not synthetic stand-ins.

- **Parser (`header-detection.ts`):** robust against sparse / non-contiguous header cells, two-row merged
  headers (payroll), and arbitrary-length metadata **preambles** (the Saudi bank format's ~21-row
  preamble). Both real files parse; reconciled **to the halala** against the files' own printed control
  totals (bank: debit `671,818.18` / credit `671,882.98`; payroll net `38,657`).
- **Classification:** bank-native **3-axis** — transaction type, counterparty, and **GL account/nature**
  (`bank-classification.ts`) — replacing the expense chart-of-accounts lens that was previously (wrongly)
  applied to bank records.
- **Reconciliation / Movements:** dedicated bank pages (the "مطابقة البنوك" tab previously **misrouted to
  the generic anomalies center**). Per-account opening/running/closing balance + continuity, GL-nature
  subtotals, and a **universal drill-down** (account / type / counterparty → individual transactions with
  running balance).
- **Multi-account:** accounts are **identified** (`Account_Number`/`Bank_Name`/`Account_Key` from the
  preamble) and **segmented — never merged**. The `61347e8` failure (two accounts silently merged into one
  meaningless running balance with a false "فرق") is fixed: live test shows **2 accounts, each reconciled
  independently, zero false diff**. The upload classifier is **account-aware**, safety-biased toward
  *additive* (a different account is never offered as a "replace" of another).
- **`branchId` (system-wide):** defined once in `dimensions.ts` with a zero-migration `'default'` — the
  **reusable** dimension for OTHER modules' multiple-source needs (payroll multi-entity, expenses/revenues
  multi-store). **Rollout path documented, NOT yet implemented** in those modules (their processors are
  `@DO_NOT_MODIFY`).
- **Generalization verdict (`74b3638`):** the bank *never-merge* logic is **NOT** generalized — it is tied
  to running-balance semantics unique to banks today; `branchId` is the sufficient generalization. Bank
  code left untouched (no refactor for theoretical purity). **Inventory** is noted as a *future* candidate
  for running-balance segmentation **only if** it becomes a real perpetual-inventory ledger (not built
  today, no current need).
- Artifacts: `payroll-bank-parser-fix.md`, `bank-rich-classification-activation.md`,
  `multi-bank-support-investigation.md`, `system-wide-branch-dimension-and-bank-phase1.md`,
  `multi-source-segmentation-generalization-review.md`.

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

**NEW debt found during the bank-module segment (2026-06-22):**

| # | Description | Severity | Status |
|---|---|---|---|
| B1 | **Expenses/revenues 20-row preamble cap** — `expenses-processor.ts` & `revenues-processor.ts` cap header search at `Math.min(20, …)`. A >20-row preamble (the same shape that broke the bank parser) makes them fall back to row 0 and **silently emit garbage records** (null financials, "غير محدد"). Found & reproduced (test), **not fixed** — both files are `@DO_NOT_MODIFY`. | MEDIUM-HIGH | Needs user sign-off to fix (apply `detectTabularHeader` or raise the cap) |
| B2 | **CommandPalette is dead code** — has **no open-trigger anywhere in `src`**; the mode-mismatch fix (`3cece7f`) was cosmetic, the palette itself remains unreachable. | LOW | Cosmetic; either wire a trigger or remove |
| B3 | **UserManagement backend endpoints stubbed** — list/promote/delete are no-ops (empty list, fake-success). Page is now reachable via 2 paths (`bc1e9ca`); backend remains stubbed. | MEDIUM | Deferred to its own MAX-precision session (standing decision) |

## 5. Explicitly NOT started

- **Bilingual parity** — flagged needs-human-review (~29 rules per the prior audit; see `17a598f`,
  `2e6349a`). Not implemented.
- **Any activity beyond the 5** implemented.
- **Any engine-fix track beyond Tracks 1–2** (new-accounts, coverage, and the combined
  field-separation + ال track all pending).
- **Accounting Bundle** — dedup re-enable, VAT-posting formalization, double-entry enforcement.
  Explicitly still **gated**, not started.

## 6. Recommended next-session priority (professional opinion)

**The Bank module segment is CLOSED** — hardened, live-tested, and architecturally sound
(parser, 3-axis classification, multi-account segmentation, `branchId` dimension). Continue Phase B on the
**remaining unaudited modules**, in priority order by financial / user-trust sensitivity (apply the SAME
discipline: read-only audit first, then label-or-fix **only after explicit confirmation**):

1. **TaxDeclaration** — ZATCA-facing, **highest remaining financial sensitivity** (wrong VAT figures have
   regulatory consequence).
2. **OwnersSummary** — owner-equity / drawings view; trust-sensitive.
3. **SmartInvoice / QuotationManager** — outward-facing documents (customer-visible).

**Already covered this segment (no longer top of queue):** PayrollDashboard (audited `f322ed3`) and
BanksDashboard (fully hardened `f1e723a`→`74b3638`).

**Separately, explicitly deferred (ready to scope when prioritized):** **UserManagement real backend
implementation** (endpoints still stubbed — debt B3) — its own MAX-precision session per standing decision.

**Still-open engine/accounting debt (tracked in §4, parallel to the module audits):**
- **D12** (deferred/unearned-revenue LIABILITY) + **D11's** dedicated construction WIP/direct-cost
  account — both need the **chart-of-accounts-with-types / account-driven balance sheet** foundation
  (also what unblocks the real Balance Sheet). Bring the account naming + IFRS treatment to the
  financial-manager user as a product decision.
- **D13** (the "ال"/vendor-leakage tokenization issue) — highest risk; only via **per-keyword
  vendor-safety tagging FIRST** (Track 2 + Track B proved naive paths regress). May stay open.

Same baseline-first, one-change-at-a-time, full-regression discipline as every track so far.

### D11 — Full Construction Materials WIP (Job Costing): ESCALATED to top priority

**ESCALATED from "deferred" to "planned with equal priority to TaxDeclaration"** — per the user's
explicit strategic decision (2026-06-22): Fionira must build the complete, accounting-correct solution
for every supported activity from the start, not a partial solution awaiting real-customer demand.
(Today D11 routes construction materials to the existing COGS raw-materials account as a stopgap; the
*dedicated* WIP/direct-cost infrastructure does not exist.)

This requires its **OWN dedicated MAX-precision session** to design and implement proper
work-in-progress cost tracking per project: material direct-cost accumulation, percentage-of-completion
considerations, and the WIP-to-COGS transition on project completion — **not a quick patch**.

**Sequencing:** follows the restaurant-data verification (done, commit `ca295fd`) and remains queued
**alongside TaxDeclaration as a top-priority next session**, under the same rigor used throughout this
session (live-tested, evidence-based, one verified step at a time). It shares the
**chart-of-accounts-with-types / account-driven balance sheet** foundation with D12 and the real
Balance Sheet fix.

### Strategic Roadmap — Multi-Branch/Multi-Activity Rollout (Planned, Not Started)

**Context.** `branchId` is now established as a **central, system-wide dimension** (`dimensions.ts`,
commit `b0df476`) with a zero-migration `'default'` — but it is **applied to the bank module ONLY**. No
other module (expenses, revenues, payroll, inventory) yet carries or uses it. The user's strategic intent
is to extend it broadly:
- **Multiple branches / activities across every module** — each branch/activity with its own expenses,
  revenues, payroll, and bank accounts, segmentable and filterable end-to-end (dashboards, reports,
  financial statements) without ever blending where blending is wrong.
- **Proposals for new modules/sections** that this dimension enables.
- **Possible restructuring** of existing pages/architecture to make branch/activity a first-class lens.

**Recommendation (professional opinion).** This is a **large strategic scope that needs its own dedicated,
full session** — design → incremental, module-by-module implementation → **live testing per module** (the
same evidence-based, one-module-at-a-time discipline proven on the bank module today). It must **NOT** be
merged into, or bolted onto, any other task; doing it piecemeal alongside audits would compromise both.

**Proposed sequencing — do these FIRST, before opening Multi-Branch Rollout:**
1. **Critical restaurant-data verification** (see §7) — must complete first; gates any new engine work.
2. **TaxDeclaration audit** — highest remaining financial sensitivity (ZATCA-facing).
3. **D12 (deferred/unearned-revenue LIABILITY) + the real BalanceSheet structural fix** — i.e. the
   chart-of-accounts-with-types / account-driven foundation.
4. **Only then:** open **"Multi-Branch / Multi-Activity Rollout"** as a standalone, full phase of its own.

**Status: PLANNED, NOT STARTED.** Nothing here is implemented; this entry exists so the strategic
direction stays visible and is not lost. The reusable groundwork already in place: `branchId` +
`withBranch()` in `dimensions.ts`, and the documented per-module adoption path in
`system-wide-branch-dimension-and-bank-phase1.md` (§ Task 7).

### Smart Branch Suggestion (Planned Enhancement, Not Started)

Context: Real multi-branch support is now live (commit ae55d967) — the user explicitly assigns a branch at
upload time via a dropdown, defaulting safely to 'الفرع الرئيسي' for single-branch tenants. This
explicit-assignment design is DELIBERATE and CORRECT: branch/activity is an organizational decision the
user makes BEFORE uploading, not a fact discoverable from file content. Auto-inferring branch from filename
or in-file text would repeat the exact failure class fixed today in categorization-engine.ts (a generic
word like 'مكتب' silently hijacking a category) — but applied to branch assignment, where a wrong silent
guess could misroute large sums between branch reports.

Planned future enhancement (additive, never replacing explicit choice): After the user uploads a file and
has selected (or defaulted to) a branch, the system MAY analyze the file's content for repeated
location/branch-name signals (e.g., 'جدة' appearing frequently in transaction descriptions) and offer a
SUGGESTION — never a silent decision — through the same proven 'suggest, don't force' governance pattern
already built for the 5 activity profiles (Phase 1-5) and the bank account-aware classifier. The user
accepts or dismisses with one click; declining never blocks or alters the upload.

This is explicitly NOT urgent and NOT scoped for the next session — documented here only so the idea isn't
lost, per standing practice.

## 7. Critical operational reminders for next session

- **⚠️ VERIFICATION NEEDED (named, explicit — check FIRST in the practical-testing phase):** Compare the
  current engine output on the user's **real restaurant Excel data** against the user's own
  **previously-corrected results** (which pre-date today's Track 1/2/A/B engine changes), to confirm no
  silent regression was introduced for that specific real-world dataset. The in-repo 730-record fixture
  showed **zero** regression at every step, but it is not guaranteed identical to the user's latest real
  file — so this is a distinct, mandatory check, not a vague caveat. Run it before any new engine work.
  **STILL PENDING — and do NOT conflate it with the 2026-06-22 bank/payroll real-file work.** That work
  exercised the **parser + bank classification** against real bank/payroll statements; it did **not** touch
  `categorization-engine.ts` and did **not** re-run the user's previously-corrected **restaurant expense
  classification** against the post-Track-1/2/A/B engine. The exact comparison described here
  (engine output on the user's corrected restaurant data) has **not** been performed.
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
