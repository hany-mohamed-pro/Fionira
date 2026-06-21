# Payroll Dashboard — Live Practical Audit

> Live-tested (server run, browser driven, network traced). **Generated:** 2026-06-21 · **HEAD:** `bc1e9ca` · backend in **JSON-fallback mode** (Postgres unavailable here).
> Tags: **[LIVE]** observed on running system · **[CODE]** read-only (not a substitute for live) · **[NOT TESTABLE]** with reason.

## TASK 2 — Environment: ✅ unchanged
HEAD = origin/master = `bc1e9ca` (in sync); server booted clean on :3100; dev-admin session active.

## TASK 1 — Code orientation
`PayrollDashboard.tsx` ([src/modules/PayrollDashboard.tsx](../../src/modules/PayrollDashboard.tsx)) is a **props-driven, read-only display** (`{ payrollData, anomaliesCount, onNavigateToTab }`), fed by App.tsx `payrollData` (from the `/api/erp/files/.../data` API — same pattern as the other dashboards). It computes 3 sums and a monthly chart; it shows **aggregate** figures only (employee count, totals) — **no individual employee names/salaries on this page** (those live in MonthlyPayroll/GroupedPurchases). Payroll record shape (from [payroll-processor.ts:158-179](../../src/backend/core/processors/payroll-processor.ts)): `Total_Amount, VAT_Amount (=gosi+absent+loan), Taxable_Amount (=basic), NonTaxable_Amount (=allowances), Net_Amount (=net), Basic_Salary, AllowancesBreakdown, DeductionsBreakdown`.

## 🔻 Reality vs the brief (I was authorized to adjust scope — doing so)
**There are ZERO payroll records and ZERO payroll files** in the dataset (`802 expenses + 335 revenues + 1 undefined`; payroll = 0). The brief's "730 real payroll records" **does not match reality**. Consequence: **calculation correctness (4A) cannot be tested live** — there is no payroll data to compute on. This also reframes the risk profile: this page is **aggregate display-only, exposes no individual PII, performs no GOSI calculation**, so its real risk is **functional/correctness**, not the security/personal-data caution the brief assumed.

## TASK 4 — Observed results

**A) Calculations** — **[NOT TESTABLE live]** (no payroll data). **[LIVE]** with zero data: employees `0`, total payroll `0 ر.س`, deductions `0 ر.س`, alerts `0`. Two **[CODE]** correctness findings that would manifest *if* data existed:
- 🔴 **Deductions KPI is always 0** — `totalDeductions = sum(r.deductions || 0)` ([:13](../../src/modules/PayrollDashboard.tsx)), but records have **no `deductions` field** (deductions are in `VAT_Amount` / `DeductionsBreakdown`). So «الخصومات» would read 0 even with a real payroll run. Could not confirm live (no data) — flagged as code analysis.
- 🟠 **"Total Payroll" shows net, not gross** — `totalPayroll = sum(grossSalary||netSalary||Net_Amount||Total_Amount)` ([:12](../../src/modules/PayrollDashboard.tsx)); `grossSalary`/`netSalary` don't exist, so it falls to `Net_Amount` (net pay) while labeled «إجمالي الرواتب». Debatable but likely mislabeled.

**B) Tenant isolation** — **[LIVE]** the data fetch fired `GET /api/erp/files?type=payroll → 200` (network trace [13180.499]). The URL carries **only `type=payroll`, no client `tenantId`** — tenant scoping is derived **server-side from the token claim**, so a client cannot request another tenant's data by URL manipulation (no tenant param exists to tamper). **[NOT TESTABLE]**: a true *two-tenant cross-access* test was **not possible** — dev-auth provides a single fixed tenant (`KWkguo4RS4…`); I could not construct a second tenant, so I observed the request is *server-scoped* but did not prove isolation by attempting to read tenant B's data. Stated explicitly per the constraint.

**C) GOSI / Saudi-specific logic** — **[CODE+LIVE]** the dashboard performs **no GOSI calculation** (it only sums uploaded values). The «تفاصيل الخصومات/التأمينات (Deductions/GOSI)» panel ([:169-182](../../src/modules/PayrollDashboard.tsx)) is a **hardcoded "لا توجد بيانات" placeholder** — **[LIVE]** confirmed it shows that text — it never renders a real GOSI/deductions breakdown even when data exists. GOSI is ingested by the processor (a column → `VAT_Amount`/`DeductionsBreakdown`) but this dashboard neither computes nor correctly displays it.

**D) Empty state** — **[LIVE]** clean: chart shows «لا يوجد مسير رواتب معتمد» with an «رفع مسير الرواتب» CTA; GOSI panel «لا توجد بيانات»; KPIs all 0; no crash.

**E) Console** — **[LIVE]** only the pre-existing app-wide `Error subscribing to settings: permission-denied` (dev token isn't a real Firebase token). **No payroll-specific errors.**

## TASK 5 — Independence from the classification/intelligence layer
**[CODE+LIVE]** `PayrollDashboard.tsx` imports only `useUI`, `lucide-react`, `formatters`, `recharts` — **no** `categorization-engine` or `financial-intelligence` imports. It is **fully independent**; the `anomaliesCount` it displays is a prop computed upstream in App.tsx. The activity-aware rules seen loading in the network trace are App-level, not this dashboard. So the answer to TASK 5: **fully independent of the categorization/intelligence engine.**

## Verdict (honest, scope-adjusted)
PayrollDashboard is a **low-risk, read-only aggregate display**. It exposes **no individual employee PII** and does **no payroll/GOSI computation** beyond summing. Its tenant-fetch path is server-scoped (no client tenant param). The genuine issues are **functional, not security**: (1) the Deductions KPI is wired to a non-existent field so it's always 0; (2) the GOSI/deductions detail panel is a permanent placeholder; (3) "Total Payroll" likely shows net while labeled total. None could be exercised against real numbers because **no payroll data exists** — which is itself the most important finding for anyone planning to rely on this module.

## TASK 7 — Fix proposals (NOT implemented — checkpoint discipline)
1. **Deductions KPI:** change `r.deductions` → `r.VAT_Amount` (or sum `DeductionsBreakdown` values) so «الخصومات» reflects real deductions. (1-line, display-only.)
2. **GOSI/deductions panel:** replace the hardcoded placeholder with the real `DeductionsBreakdown` (GOSI / absence / loans) aggregated from records.
3. **"Total Payroll" label:** decide gross vs net and align label/formula (e.g., gross = `Taxable_Amount + NonTaxable_Amount`, or keep net and relabel «صافي الرواتب»).
4. **Test data:** there is no payroll data — to verify calculations and GOSI display, upload a real payroll run or seed payroll records, then re-audit 4A live.
5. **Cross-tenant proof:** to truly verify isolation, provision a 2nd tenant with its own payroll file and confirm tenant A cannot read it — not doable with the current single dev-auth identity.

All proposals are UI/display-level except (4)/(5) which are test-environment; none touch posting/financial logic. Awaiting go-ahead before any implementation.
