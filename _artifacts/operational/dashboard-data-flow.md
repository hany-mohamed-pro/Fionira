# Fionira — Dashboard Data Flow & First-Run Experience

> **Read-only audit** — no source files modified. Evidence cited as file:line.
> **Generated:** 2026-06-16 · **Base:** `a9e16bc`

---

## TASK 2 — Dashboard data flow

### A) Firestore directly, or via API?

**Via the Express API — not Firestore.** The dashboards are **presentational, props-driven** components. `App.tsx` owns the data and passes it down.

- `App.tsx` loads module data with `fetchDataForMode()` → `fetch('/api/erp/files/{fileId}/data?moduleType={mode}')` ([App.tsx:397-409](src/App.tsx)), storing it in React state (`expensesData`, `revenuesData`, `payrollData`, `banksData`).
- `GlobalDashboard` receives that state as **props** (`expensesData`, `revenuesData`, …) ([GlobalDashboard.tsx:6,25-26](src/modules/GlobalDashboard.tsx)).
- `ExpensesDashboard` / `IncomeStatement` operate on **passed-in records** (`allRecords`, `incomeStatement.*`) — neither imports `firebase/firestore`.
- The **only** direct Firestore use touching dashboards is **settings** via `subscribeToSettings(profile.tenantId, …)` ([App.tsx:153-155](src/App.tsx)) → Firestore `appSettings/{tenantId}` (with dev API fallback) — used for company name/logo/currency, **not** financial figures.

> This matches the broader split-plane map: **financial/record data = Postgres/JSON via API**, while Firestore holds master data (settings, invoices, catalog, etc.) written directly by *other* modules. The three audited dashboards are firmly on the **API plane**.

### B) If Firestore directly: which collections/fields?

**Not applicable for financial data.** The only Firestore read in this flow is `appSettings/{tenantId}` (via `settings-service.ts`), supplying `companyName`, `logo`, `currency`, etc. ([settings-service.ts:117-150](src/lib/settings-service.ts), [App.tsx:155-170](src/App.tsx)). Financial figures never come from Firestore here.

### C) Loading / error / empty states

**Yes — all three exist:**
- **Global loading gate:** spinner + *"جاري تهيئة الصلاحيات…"* while `loading || isBootstrapping` ([App.tsx:1985-1992](src/App.tsx)).
- **Fetch in-progress:** `setStatus('processing')` during `fetchDataForMode` ([App.tsx:402](src/App.tsx)).
- **Fetch errors:** on 404/401/500, the active file is cleared and module state reset to **empty data** (no crash) ([App.tsx:410-419](src/App.tsx)).
- **Empty-data UI (Arabic/English):**
  - GlobalDashboard: *"لا توجد بيانات كافية" / "Insufficient data"*, *"No comparison available"* ([GlobalDashboard.tsx:128,228,246,264](src/modules/GlobalDashboard.tsx)).
  - IncomeStatement: *"لا توجد إيرادات/تكلفة مبيعات/مصروفات تشغيلية مسجلة لهذه الفترة"* ([IncomeStatement.tsx:247,259,276](src/modules/IncomeStatement.tsx)).
  - ExpensesDashboard: *"لا توجد عناصر تحتاج انتباهك"*, *"بيانات المصروفات غير متوفرة"*, etc. ([ExpensesDashboard.tsx:1159,1307,1385,1471,1515,1568](src/modules/ExpensesDashboard.tsx)).

### D) What the user sees on first login with no data

A fully-rendered **Global Dashboard with zeroed KPIs and "Insufficient data" placeholders.** No file is selected (`activeFileId` empty) → no fetch fires ([App.tsx:357-372](src/App.tsx)) → records stay `[]` → every card shows its empty-state message. **No crash, no spinner-hang — but also no guidance** toward uploading the first file.

---

## TASK 3 — First-run experience

### A) User flow after successful login

Render gate order in `App.tsx`:
1. `loading || isBootstrapping` → spinner *"جاري تهيئة الصلاحيات…"* ([App.tsx:1985-1992](src/App.tsx))
2. `!user` → `<Login />` ([App.tsx:1994-1996](src/App.tsx))
3. `user && !profile` → **permissions-error screen** *"مشكلة في الصلاحيات"* + fix-role button ([App.tsx:1998-2031](src/App.tsx))
4. otherwise → **main app shell**, default `appMode='dashboard'` / `activeTab='dashboard'` ([App.tsx:164-165](src/App.tsx)) → **Global Dashboard**.

(The `setAppMode('expenses')` redirect at [App.tsx:136-142](src/App.tsx) fires **only** on the `/rapid-s1` sprint path, not for normal users.)

### B) Guided onboarding, or empty dashboard?

**Empty dashboard. There is NO guided onboarding.**

🔴 **Notable finding:** a ready-made welcome component **exists but is dead code** — `WelcomePage` ([WelcomePage.tsx:7](src/pages/WelcomePage.tsx)) is **never imported or rendered** anywhere in `src/` (a project-wide search returns only its own definition). It contains polished Arabic onboarding copy (*"يمكنك تصفح التقارير والإحصائيات من خلال القائمة الجانبية"* — "browse reports via the side menu") and three feature cards — but no route shows it.

So a freshly-onboarded admin lands directly on an **empty Global Dashboard** with no "upload your first file" call-to-action, no wizard, and no pointer to where data comes from.

### C) Navigation — intuitive for an Arabic-speaking accountant?

- **Layout:** RTL throughout (`dir="rtl"`, Arabic labels) — appropriate for Arabic users.
- **Structure:** sidebar driven by `appMode` (`dashboard, expenses, revenues, payroll, banks, invoices, reports, accounting, settings, users`) + per-module `activeTab` (`dashboard`, `upload`, …); switching via `handleNavClick(mode, tab)` ([App.tsx:381-395](src/App.tsx)).
- **Strengths:** Arabic-first, RTL, module names map to accountant mental models (مصروفات/إيرادات/رواتب/بنوك).
- **Gaps for a first-time accountant:**
  1. No first-run guidance — the empty dashboard doesn't tell them to go to a module → **Upload** tab to add data.
  2. The path to value (upload an Excel file → see dashboards populate) is **undiscoverable without prior knowledge**.
  3. The unused `WelcomePage` is a missed, low-cost win — surfacing it on first login or when all modules are empty would orient the user immediately.

### D) What the user sees on first login with no data uploaded

Same as TASK 2-D: a zeroed **Global Dashboard** full of *"لا توجد بيانات كافية"* placeholders — functional and non-breaking, but **not directive.** The user is left to discover the upload flow on their own.

---

## Summary & quick operational wins (observations only — not implemented)

| Finding | Evidence | Suggested low-cost win |
|---|---|---|
| Dashboards are API/props-driven (Postgres plane), not Firestore | App.tsx:397-409; GlobalDashboard.tsx:6 | None needed — already clean |
| Empty/loading/error states exist and are bilingual | App.tsx:1985; IncomeStatement.tsx:247 | None needed |
| **No first-run onboarding; empty dashboard on first login** | App.tsx:164; no WelcomePage usage | Render `WelcomePage` (or an "upload first file" CTA) when all modules are empty |
| **`WelcomePage` is dead code** | WelcomePage.tsx:7 (zero references) | Wire it into the default/empty-state view |
| Path to first value (upload → populate) is undiscoverable | App.tsx:357-372 | Add an empty-state CTA linking to a module's Upload tab |

> Cross-reference: first-user **login** is itself blocked until claims are set out-of-band — see `onboarding-checklist.md` (Headline Blocker). Onboarding readiness = **fix claims bootstrap first**, then **add a first-run CTA** so the empty dashboard becomes a guided start.
