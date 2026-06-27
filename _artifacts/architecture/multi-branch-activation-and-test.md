# Multi-Branch Activation & Live Test

**Date:** 2026-06-27
**Scope:** Turn `branchId` from a dormant dimension into a real, user-facing capability — branch creation, upload-time assignment, and branch-segmented reporting — without touching the frozen classification/ERP engines and with zero regression for existing single-branch tenants.

---

## 1. What was built

### TASK 2 — Branch creation & storage (per the confirmed AppSettings design)
- **`src/lib/settings-service.ts`**: added the `Branch` interface (`{ id, name }`), `makeBranchId(name)` (stable, collision-resistant, Arabic-preserving id), `branches?: Branch[]` on `AppSettings`, and `branches: []` in `DEFAULT_SETTINGS`. Empty/undefined `branches` ⇒ a single implicit **"الفرع الرئيسي"** (the `DEFAULT_BRANCH_ID` from `dimensions.ts`) → **zero migration** for existing tenants.
- **`src/pages/Settings.tsx`**: new **"الفروع"** tab (between إعدادات المنشأة and التنبيهات). Admin-gated create (input + "إضافة فرع") and a live list that always shows the implicit "الفرع الرئيسي (افتراضي)" first, then configured branches with their ids. Persists through the **existing** `saveSettings` path — no new storage layer. Error handling mirrors the existing `handleSave` exactly.

### TASK 3 — Upload-time branch assignment
- **`src/modules/FileManagement.tsx`**: loads tenant branches from `/api/erp/settings`; a branch `<select>` appears in the upload bar **only when `branches.length > 0`** (single-branch tenants see nothing new). The selection is sent as `branchId` in the staged-upload `FormData` (defaults to `'default'`).
- **`server.ts`** (staged-upload handler): reads `req.body.branchId` and threads it into `createValidationSession`.
- **`src/backend/core/pre-validation/pre-validation-engine.ts`**: `createValidationSession(..., branchId?)` tags every raw record with `r.branchId = normalizeBranchId(branchId)` in **one place**, before intelligence/session building. Additive — **no ingestion processor, categorization-engine, or erp-engine touched**. The tag rides on `normalizedData` and persists through activation, exactly like the proven bank `Account_Key` pattern ("segment first, never silently merge").

### TASK 4 — Branch-segmented reporting
- **`src/modules/ExpensesDashboard.tsx`** (full segmentation): branch filter wired into the single source of truth (`filteredExpenseRecords`) so **all** downstream KPIs/charts respect it. A branch card renders **only when `hasMultipleBranches`**: per-branch totals as clickable chips + an explicitly-labeled **"كل الفروع (مجمّع)"** rollup. Branch names resolved from settings.
- **`src/modules/RevenuesDashboard.tsx`** (display segmentation): per-branch revenue breakdown card with the same "كل الفروع (مجمّع)" labeling. Display-only (not an interactive filter) because the headline revenue figure is derived at the App/`incomeStatement` level rather than from the dashboard's own records — making it a filter here would desync the headline from the breakdown. Documented intentionally; the breakdown still guarantees no silent merge.

**Design guarantee:** the combined total is never presented alone — when more than one branch is present, the per-branch breakdown is always shown alongside it, with the rollup explicitly labeled.

---

## 2. How it was tested

### A. Deterministic end-to-end through the REAL ingestion path
Drove `createValidationSession` with two branch-tagged xlsx expense files plus one untagged file:

| Check | Result |
|---|---|
| Jeddah file → records' `branchId` | `[br_jeddah_x1]` ✅ |
| Riyadh file → records' `branchId` | `[br_riyadh_x2]` ✅ |
| **Untagged upload → `branchId`** | `[default]` ✅ — **zero regression** |
| Dashboard `branchTotals` grouping | Jeddah 3000, Riyadh 500, rollup 3500 ✅ |
| `hasMultipleBranches` | `true` ✅ |
| Filter to فرع جدة only | 2/3 records, total 3000 ✅ |

This exercises the actual upload → `createValidationSession` → `withBranch`/`normalizeBranchId` tagging → dashboard grouping/filter logic.

### B. Live UI (dev server, dev-auth admin, port 3100)
- ✅ **"الفروع" tab renders** in Settings with the branch icon.
- ✅ **Created two real branches** through the UI: **فرع جدة** and **فرع الرياض**.
- ✅ **Persisted via the real `/api/erp/settings` API** — confirmed by re-fetching: `[{id:"br_فرع_جدة_d7i77",name:"فرع جدة"},{id:"br_فرع_الرياض_c1a23",name:"فرع الرياض"}]` (Arabic preserved in ids).
- ✅ **List renders both branches live** plus the implicit "الفرع الرئيسي (افتراضي)".
- ✅ **Zero regression confirmed live**: the existing single-branch restaurant data (all `default`) shows **no branch segmentation card** on the Expenses dashboard — branch UI only appears with real multi-branch data.
- ✅ **migration_review removed** — absent from the top navigation (STEP 1).
- ✅ **No uncaught console errors.**

### Known dev-only caveat (not a regression)
Saving in **dev-auth** mode surfaces a "خطأ في الحفظ" dialog because Firebase `setDoc` is unavailable without a real Firebase session. This is **pre-existing** and identical for every settings save (the existing `handleSave` has the exact same catch/alert). The dev backend (`devMemoryDb.settings`) persists correctly regardless — verified above via the API. In production (real Firebase) `setDoc` succeeds and no dialog appears.

### Not done live (deliberately)
Viewing the segmentation card *populated* and the upload dropdown *on the FileManagement screen* would require uploading branch-tagged files into the running dev instance, which writes into the user's `data/erp_registry.json` / `data/uploads.json` — the runtime data files I was instructed to leave untouched. Those paths are instead proven by the deterministic test (A) and by build verification.

---

## 3. Constraints honored
- `categorization-engine.ts` and `erp-engine.ts`: **untouched**.
- Branch tagging is additive in **one** location (`createValidationSession`); reuses the existing `dimensions.ts` helpers.
- Runtime data files (`data/erp_registry.json`, `data/uploads.json`, `data/**/*.staged`, `package-lock.json`): **untouched** — confirmed by `git status` (only the 7 feature source files changed).
- `tsc --noEmit`: **0 src errors**. `vite build`: **passes**.
- Single-branch tenants: **no UI change, no data change, no behavior change.**

---

## 4. Files changed
- `src/lib/settings-service.ts` — Branch model + `makeBranchId` + storage
- `src/pages/Settings.tsx` — "الفروع" tab (create/list)
- `src/modules/FileManagement.tsx` — upload-time branch selector + `branchId` in FormData
- `server.ts` — staged-upload reads `branchId`
- `src/backend/core/pre-validation/pre-validation-engine.ts` — `branchId` param + per-record tagging
- `src/modules/ExpensesDashboard.tsx` — interactive branch segmentation
- `src/modules/RevenuesDashboard.tsx` — branch revenue breakdown
