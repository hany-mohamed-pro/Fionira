# System-as-Expert Principle — Audit (read-only)

> **The principle:** Fionira *is* the financial/accounting expert FOR the user. The user (professional or
> not) must never be asked to "review/verify/approve" something **structural or technical** themselves.
> The system reviews, decides, and either (a) proceeds silently with confidence, or (b) asks a **simple,
> plain-language** question only for genuinely ambiguous cases (via the existing governance pipeline).
>
> **Headline finding:** one clear **🔴 VIOLATION** — the `migration_review` tab
> ("مراجعة الجاهزية المحاسبية" / `MigrationReviewDashboard`). It asks the **"accountant"** to review and
> approve structural DB-migration decisions (entity clustering, AP-account collapse, trial-balance
> reconciliation), exposes deep migration-engineer jargon, **and runs entirely on static mock data**
> (it is a non-functional leftover). Everything else audited is ✅ correct or ⚪ appropriately non-owner.
>
> Read-only audit — no code changed. Base HEAD `ec883d4`.

---

## TASK 1 — `migration_review` ("مراجعة الجاهزية المحاسبية")

### A) Current content/purpose
A full dashboard ([MigrationReviewDashboard.tsx](../../src/modules/MigrationReviewDashboard.tsx)) with 5
sections — overview, vendor de-duplication, AP-account standardization, rounding differences, trial-balance
before/after — plus an "Approval Gates (بوابات الاعتماد)" panel and an "accountant certify" button.

### B) Origin — **leftover Phase-3D database-migration tooling, already flagged for halt**
- It imports **static sample data** ([migrationReviewSample.ts](../../src/data/migrationReviewSample.ts)):
  hardcoded `113` vendor groups, `125` AP standardizations, `798` rounding diffs, sample vendor `SUP-0042`,
  fake `legacy_uuids_to_merge`. **No real tenant data; the buttons have no working handlers.** It is a
  **non-functional mock.**
- Its sections map 1:1 to the **Phase-3D migration artifacts** (`_artifacts/database/phase3D-3/`:
  `entity_mapping_review`, `ap_collapse_preview`, `rounding_reconciliation`, `trial_balance_comparison`).
- The project's own plan already says to stop it:
  `implementation_plan_verified_2026-05-25.md` §1 — *"The standalone `MigrationReviewDashboard` approach
  must be halted… it unnecessarily duplicates existing logic, splits the UX, and scatters approval
  workflows."*

### C) Real intended audience — **a data-migration engineer, NOT the business owner**
The content is explicit: status **"انتظار فحص المحاسب (Pending)"**, **"بوابات الاعتماد"**, a button
**"مصادقة المحاسب على توازن الميزان"**, and a "عرض التفاصيل الفنية" toggle revealing
`[TECHNICAL: Phase 3D Entity Clustering]`, *"Maps 125 liability accounts into single Account 210000"*,
`Reclassification_Shift … SAR`, `Normalized`/`Legacy`, raw JSON + UUIDs
([lines 76, 134, 167, 241, 211-213, 332-337, 342](../../src/modules/MigrationReviewDashboard.tsx)). This
is migration-engineering, surfaced to the user as an approval gauntlet.

## TASK 2 — the same anti-pattern elsewhere (+ the TaxDeclaration distinction)

### TaxDeclaration disclaimer (touched in `ec883d4`) — **✅ CORRECT (legitimate external-authority case)**
*"نموذج استرشادي… يجب مراجعة جميع الفواتير ومطابقتها لمتطلبات ZATCA قبل تقديم الإقرار الرسمي."*
This is **fundamentally different** from the migration-review violation, and the difference must be stated
plainly:
- The migration tab asks the user to **review the system's own internal structural decisions** — a
  technical job the system should do itself. 🔴
- The tax disclaimer directs the user to an **external regulator (ZATCA)** before an **official legal
  filing**. The system *did* compute the number correctly; advising the user to confirm with the tax
  authority before submitting a government return is **appropriate and standard**, not a principle
  violation. ✅
- *Minor, optional polish (not a violation):* "يجب مراجعة جميع الفواتير" could be softened toward
  "قبل التقديم الرسمي، اعتمد الأرقام لدى هيئة الزكاة والضريبة" so it doesn't imply the user must
  re-audit every invoice by hand. Optional — left as ✅.

### ValidationReviewScreen — **✅ CORRECT pattern (the sanctioned governance pipeline)**
This is exactly mechanism (b): the system **detects** issues and surfaces **plain-language**
confirm/dismiss decisions for genuinely-ambiguous lifecycle/classification cases. No structural/migration
jargon was found in it by the marker scan. It is where any genuinely-needed "ambiguous case" question
belongs — not a separate approval tab.

### Settings (incl. Users & Permissions, Security) — **⚪ NOT a violation (appropriate admin config)**
Admin-facing configuration (company info, notifications, security, user roles, regional). The admin is the
correct audience; this is not "asking the business owner to do accounting review."

### "مراجعة الرواتب / الإيرادات / الملاحظات" tabs — **✅ correct ("view your data", plain)**
These are plain data-viewing tabs, not technical-review gates.

### Internal field names (`Entity_Normalized_Name`, `Vendor_Name`, `crypto.randomUUID`) — **⚪ not user-facing**
Code-level identifiers used to *display the vendor's name value* or generate keys; the user sees the
value, not the field name. No violation.

## TASK 3 — classification summary

| Item | Verdict |
|---|---|
| `migration_review` / `MigrationReviewDashboard` | 🔴 **VIOLATION** (accountant-approval gates + migration jargon + static mock) |
| TaxDeclaration ZATCA disclaimer | ✅ CORRECT (external authority / official filing — distinct legitimate case) |
| ValidationReviewScreen | ✅ CORRECT (sanctioned plain-language governance pipeline) |
| "مراجعة الرواتب/الإيرادات/الملاحظات" tabs | ✅ CORRECT ("view your data") |
| Settings (Users/Security/Company) | ⚪ NOT user-facing-violation (appropriate admin config) |
| Internal field names / UUID keys | ⚪ NOT user-facing |

## TASK 4 — proposed fixes (NOT implemented — awaiting your review)

**Primary (the only real fix): remove `migration_review` from the product.** It is a non-functional
mock and a direct principle violation, already flagged for halt.
- Remove the CommandPalette entry `mig_rev` ([CommandPalette.tsx:55](../../src/components/CommandPalette.tsx)).
- Remove the routing + title block ([App.tsx:2099, 2141, 2533-2535](../../src/App.tsx)) and the
  `MigrationReviewDashboard` import ([App.tsx:75](../../src/App.tsx)).
- Archive/delete `MigrationReviewDashboard.tsx` + `data/migrationReviewSample.ts` (mock data).
- **The capability it pretended to offer already exists, correctly, elsewhere:** entity/vendor
  de-duplication is the job of the **canonicalization engine** (it runs automatically; see the permanent
  rule in `CLAUDE.md`), and any genuinely-ambiguous case should surface as a **simple plain-language
  question in ValidationReviewScreen** — never as an "accountant approval gates" tab. So removal loses no
  real function; it removes a violation + dead mock.

**Secondary (optional polish, not a violation):** soften the TaxDeclaration "review all invoices" wording
as noted in TASK 2. Optional; can be folded into a later TaxDeclaration pass or skipped.

**No other violations found.** The governance pattern (system decides → plain-language question only when
ambiguous, via ValidationReviewScreen) is otherwise correctly applied across the audited surface.

---

> **Checkpoint:** per instruction, this is **audit + proposal only**. Awaiting your review of these
> findings before implementing any fix or proceeding to OwnersSummary.
