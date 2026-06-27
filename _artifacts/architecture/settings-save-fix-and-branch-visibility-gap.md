# Settings Save Error — Fix · Per-Branch Results Visibility — Gap Diagnosis

**Date:** 2026-06-27
**Precision:** MAX. Both items are real, user-discovered from hands-on testing.
**Method:** live reproduction + code trace. Part 1 fixed & verified; Part 2 diagnosed (no implementation — awaits confirmation).

---

## PART 1 — Settings save error (activity / branch) — FIXED ✅

### Reproduced exactly (TASK 1)
Live (dev-auth admin): Settings → changed **activity** → "حفظ إعدادات المنشأة". A blocking **"خطأ في الحفظ"** dialog appeared. Captured console (the real cause, not assumed):
```
[error] Failed to save settings FirebaseError: [code=permission-denied]: Missing or insufficient permissions.   (×8)
```
Same path for defining a **branch** (both go through `saveSettings`).

### Root cause (verified against code)
`saveSettings` (`src/lib/settings-service.ts`) did, in **all** modes:
1. `IS_DEV` → `POST /api/erp/settings` (writes `devMemoryDb`) — wrapped in a try/catch that **swallowed** errors.
2. **Then always** `setDoc(db, 'appSettings', tenantId)` to **real Firestore**.

In **dev-auth** there is no authenticated Firebase user (`firebase.ts` builds a real Firestore client, but dev-auth bypasses Firebase sign-in). So step 2 is rejected with `permission-denied`, the error is re-thrown, and `handleSave`/`handleAddBranch` show "خطأ في الحفظ" — **even though step 1 already persisted the data** to the dev store. The user reasonably believed their settings were lost.

### Production-risk assessment (TASK 2A — explicitly determined, not dismissed)
**Strictly a dev-auth/local artifact.** In a production build `IS_DEV = (process.env.NODE_ENV !== 'production')` is **false** → the dev-API block is skipped entirely and `setDoc` runs under a **real authenticated admin session**, which Firestore rules permit → no error. The reproduced `permission-denied` is caused specifically by dev-auth having no Firebase session. (Caveat noted honestly: this assumes production Firestore rules allow an authenticated admin to write `appSettings/{tenantId}`; that is a separate rules concern, not the bug reproduced here.)

### Fix (TASK 2B — fixed properly, not suppressed)
Made the **dev path authoritative and honest** instead of hiding a real failure:
- In `IS_DEV`: success is determined by the **dev-API** response. If the dev store write fails (`!res.ok`) we **throw** — genuine failures still surface (we are *not* blanket-suppressing errors).
- The Firestore write is now an explicit **best-effort mirror** in dev: its `permission-denied` is downgraded to a `console.warn("[DEV] Firestore mirror skipped … expected in dev-auth")` and the function returns success.
- **Production path unchanged:** Firestore remains authoritative; real write errors still propagate (quota handling preserved).

This removes the false error **without** masking a real persistence failure: in dev the data demonstrably persists (dev store), and a true dev-store failure now reports cleanly.

### Live verification after fix (TASK 3)
- Changed activity → **"تجارة التجزئة والجملة"** → save: **success toast, no error dialog, no console error.** Console now shows only the benign warn `[DEV] Firestore mirror skipped … permission-denied`.
- Added branch **"فرع جدة"** → save: **"تم إضافة الفرع بنجاح" ✓**, no error dialog.
- **Persistence across a full page reload:** the activity select re-rendered as "تجارة التجزئة والجملة"; `GET /api/erp/settings` returned `activity:"trading_retail"`, `branches:["فرع جدة"]`. ✅

**File changed:** `src/lib/settings-service.ts` (`saveSettings` only).

---

## PART 2 — Per-branch / activity results visibility — GAP DIAGNOSED (awaits confirmation)

### Live reproduction of the user's gap (TASK 4)
Created two branches (**فرع جدة**, **فرع الرياض**) and exercised the real upload path tagged to a branch (a synthetic CSV; it tripped the governance validator as `INVALID` — a synthetic-data artifact, not the user's experience with real files — and its registry/staged residue was **cleaned up afterward**: `git checkout data/erp_registry.json` + removed the stray `.staged` file; working tree verified clean). Then navigated the entire app as a user would, looking for "branch A's numbers vs branch B's numbers."

### Where I looked and what I found (live + definitive code evidence)
Branch-aware code exists in **exactly 4 files** (`grep` across `src/**/*.tsx`):

| Location | Branch UI present? |
|---|---|
| `Settings.tsx` | branch **create/list** only |
| `FileManagement.tsx` | upload-time branch **selector** only |
| `ExpensesDashboard.tsx` | ✅ interactive per-branch segmentation (filter + labeled rollup) |
| `RevenuesDashboard.tsx` | ✅ display-only per-branch breakdown |
| **`GlobalDashboard.tsx`** (لوحة التحكم — the landing view) | ❌ **zero** branch references |
| **`IncomeStatement.tsx`** | ❌ **zero** branch references |
| BalanceSheet, OwnersSummary, ReportsDashboard, Payroll, Banks | ❌ none |
| **Dedicated "compare branches" view** | ❌ **does not exist anywhere** |

### Diagnosis (TASK 5): it is **(C) + (B)** — confirmed, not speculation
- **(C) TRUE — no single place to compare branches.** There is **no dedicated "مقارنة الفروع" view**, and the **main dashboard** (لوحة التحكم — where a financial manager naturally starts) has **no branch breakdown at all**. A user looking to "compare my branches" has nowhere obvious to go.
- **(B) TRUE — incomplete coverage.** Segmentation exists **only** in Expenses (interactive) and Revenues (display). It is **absent** from the GlobalDashboard, the Income Statement, and every report — so the consolidated financial picture cannot be viewed per branch.
- **(A) PARTIALLY TRUE — discoverability.** Even where segmentation exists it is a **conditional card buried inside a module dashboard** (renders only when multi-branch data is present), not surfaced by any top-level navigation.

This fully explains the user's "no clear way to see results by branch": the two entry points they'd use first — the **home dashboard** and the **Income Statement** — have zero branch visibility, and the segmentation that does exist is siloed in two sub-dashboards.

### Proposed fix (TASK 6 — propose, do NOT implement until confirmed)

**Recommended (world-class, complete) — two complementary pieces:**

1. **A dedicated "مقارنة الفروع" (Branch Comparison) page** — a first-class, discoverable destination (nav entry, shown only when `branches.length > 1`; zero friction for single-branch tenants). Side-by-side **columns per branch** (الفرع الرئيسي · فرع جدة · فرع الرياض) × key P&L **rows** (إجمالي المبيعات, COGS, مجمل الربح, OPEX, صافي الرواتب, صافي الربح, الهوامش), plus a "مجمّع" total column. This is the single place a manager goes to compare branches.

2. **A global branch scope on the GlobalDashboard (and Income Statement)** — a top-level branch selector ("كل الفروع (مجمّع) / فرع جدة / فرع الرياض") so the landing dashboard and the P&L can be scoped to one branch. Default = "كل الفروع" → identical to today for single-branch tenants.

**Architecture (additive, safe):** records already carry `branchId` (from commit ae55d967). Both pieces are built by **grouping the existing `plFilteredExpenses` / `plFilteredRevenues` by `branchId`** and running the **same** `incomeStatement` reduction per group — **no change to `categorization-engine.ts` or `erp-engine.ts`**, no change to the classification or totals math.

**Lighter alternative (not recommended):** only extend the existing segmentation card to GlobalDashboard + IncomeStatement, without a dedicated comparison page. Cheaper, but still leaves no natural "compare my branches" destination — it addresses (B) but not (C).

**My professional recommendation:** do the **recommended** option (dedicated comparison view + global dashboard branch scope). It directly answers the user's standing principle (completeness over quick patches) and is the only option that closes gap (C).

---

---

## PART 2 — IMPLEMENTED (complete solution, user-confirmed) ✅

The user chose the **complete (world-class)** option. Built additively — **no `categorization-engine.ts` / `erp-engine.ts` change**, no change to classification or P&L math.

### What shipped
1. **Single source of truth for P&L math** — extracted the core profitability reduction into `src/lib/pnl-core.ts` (`computePnLCore`). The consolidated Income Statement (`App.tsx`) now delegates to it, and so does the new comparison — so both compute **identical** figures (no drift).
2. **Dedicated "مقارنة الفروع" view** (`src/modules/BranchComparison.tsx`) — branches as columns × P&L rows + a consolidated "كل الفروع (مجمّع)" column. First-class & discoverable: a card in the Reports hub (`ReportsDashboard.tsx`) and a routed report page (`activeTab === 'branch_comparison'`). Shows a friendly "define 2+ branches" empty state for single-branch tenants.
3. **Global branch scope** (`App.tsx`) — a `branchScope` lens applied to the consolidated P&L (`incomeStatement`) and the monthly chart (`chartDataRaw`) via `scopedExpenses/Revenues/Payroll`. A branch `<select>` ("كل الفروع / الفرع الرئيسي / …") appears in the page toolbar on the **GlobalDashboard** and **report pages** (not the comparison page itself), only when branches exist. Default "all" = today's behaviour → zero change for single-branch tenants.
4. **Settings-read fix (required for the above to work in dev):** `subscribeToSettings` relied on Firestore `onSnapshot`, which in dev-auth fails with `permission-denied` and previously only fell back to the dev API on *quota* errors — so App-level `settings.branches`/`activity` never loaded in dev. Now in dev it loads from the dev API immediately and polls it on any subscription error. (Same production-safe pattern as the Part 1 save fix; production `onSnapshot` path unchanged.)

### Live verification (dev server :3100, 2 branches: فرع جدة, فرع الرياض)
- **Behaviour preserved (critical — central P&L was refactored):** Expenses dashboard still 96,900 before-VAT / 14,535 input VAT / 111,435 total; Income Statement COGS 33,900 / OPEX 63,000 — **identical** to pre-refactor.
- **Global scope works:** Income Statement COGS — scope «الفرع الرئيسي» → **33,900**, scope «فرع جدة» → **0** (no Jeddah-tagged data), scope «كل الفروع» → 33,900.
- **Comparison view works:** columns الفرع الرئيسي (50 سجل) · فرع جدة (0) · فرع الرياض (0) · كل الفروع (50); COGS 33,900 / OPEX 63,000 / صافي −96,900 on the main branch, 0 on the empty branches, مجمّع reconciles. Margins guarded (0% at revenue=0). Numbers reconcile exactly with the Income Statement (same `computePnLCore`).
- **No console errors.** `tsc` 0 errors; `vite build` passes.

### Diagnosis → fix mapping
- (C) no comparison destination → **dedicated مقارنة الفروع page** + Reports-hub card.
- (B) incomplete coverage → **global branch scope** now reaches the GlobalDashboard, Income Statement, OwnersSummary, and the monthly chart.
- (A) discoverability → branch scope surfaced in the page toolbar; comparison is a first-class report.

---

## Status
- ✅ **Part 1: committed** (`5482b2ae`) — settings save fix.
- ✅ **Part 2: implemented & live-verified** (complete solution, user-confirmed) — committed alongside this doc update.
- 🧹 Test data clean: no `data/erp_registry.json` pollution, no stray `.staged`; only feature source files changed.

### Files (Part 2)
- `src/lib/pnl-core.ts` (new) — shared P&L core
- `src/modules/BranchComparison.tsx` (new) — comparison view
- `src/App.tsx` — delegate to pnl-core, branch scope + scoped records, branchComparison memo, routing, toolbar selector
- `src/modules/ReportsDashboard.tsx` — comparison card
- `src/lib/settings-service.ts` — dev settings-read fallback
