# Antigravity Workspace — Current-State Gap Analysis and Governed Roadmap

> **Document Version**: 1.1  
> **Phase**: AG-FIONIRA-FOUNDATION-01-R1  
> **Date**: 2026-06-01  
> **Status**: DRAFT — Awaiting User Review and Approval  
> **Master Blueprint Reference**: `fionira-master-product-architecture-workflow-agent-governance-blueprint.md` v1.1

---

# Revision History

| Version | Date | Change Summary |
| :--- | :--- | :--- |
| 1.0 | 2026-06-01 | Initial draft created during AG-FIONIRA-FOUNDATION-01. |
| 1.1 | 2026-06-01 | Incorporates user review corrections. Corrects evidence confidence labels throughout inventory, corrects unified-upload acceptance wording, corrects Copy file status to unresolved governed disposition, corrects lifecycle mutation action wording to distinguish code presence from accepted functionality, adds review/governance integration contract gap, resequences roadmap into AG-01 through AG-09 separating design/isolation/simulation/implementation/cleanup/integration, preserves freeze rules. **Does not authorise implementation.** |

---

# 1. Document Authority and Workspace Isolation

> [!IMPORTANT]
> This document applies **exclusively** to the **Antigravity workspace**. It must not be assumed that the same implementation state exists in Codex, Google Studio, or any other agent workspace.

- **Derived from**: The master Fionira blueprint v1.1 and the accepted AG-FIONIRA-FOUNDATION-00 evidence artifacts.
- **Authorization scope**: This document **does not authorize implementation**. It is a governed assessment and planning artifact. Each roadmap phase requires separate explicit user authorization before execution.
- **Independence**: No assumptions are made about work completed, features available, or data state in any other workspace. Findings herein reflect only what has been verified through read-only inspection of the Antigravity workspace.

---

# 2. Preserved Verified Baseline

All values below are binding and must be preserved without modification. No action may alter these until explicitly authorized through an approved roadmap phase.

| Parameter | Verified Value |
| :--- | :--- |
| **Workspace Path** | `d:\Projects\files-mentioned-by-the-user-fionira` |
| **Verified Active Purchases File** | `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` |
| **Active Record Count** | `358` |
| **Total Before VAT** | `245,895.15 ر.س` |
| **Input VAT** | `35,251.16 ر.س` |
| **Total Including VAT** | `281,146.31 ر.س` |
| **Prior Exclusion Request** | Approved but **unexecuted** — must remain unexecuted until governed disposition |
| **State Changes Authorized** | **None** |

---

# 3. Verified Current Module and Capability Inventory

The following inventory is derived from AG-FIONIRA-FOUNDATION-00 evidence and confirmed source structure inspection. Evidence confidence labels reflect actual verification depth.

### Evidence Confidence Labels

| Label | Meaning |
| :--- | :--- |
| `VERIFIED_PRESENT_IN_SOURCE` | Component file confirmed to exist in the workspace source tree. |
| `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` | User or agent has observed this component rendered in the running application. |
| `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` | Code exists and may render, but end-to-end functional acceptance has not been proven or approved. |
| `PRESENT_BUT_DISCONNECTED_OR_BROKEN` | Code exists but is confirmed to be non-functional, unreachable, or has no working trigger. |
| `NOT_FOUND` | No code or capability exists for this feature. |
| `UNRESOLVED` | Status cannot be determined from available evidence. |

### 3.1 Core Operational Modules

| Module | Component | Evidence Status |
| :--- | :--- | :--- |
| Global Dashboard | `GlobalDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` · `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` |
| Visual Dashboard | `VisualDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Expenses / Purchases | `ExpensesDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` · `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` |
| Revenues / Sales | `RevenuesDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Payroll | `PayrollDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Banks | `BanksDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Invoices | `InvoicesDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Reports Directory | `ReportsDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Accounting Ledger | `AccountingDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| User / Settings | `UserManagement.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Data Governance | `DataGovernanceDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Migration Review | `MigrationReviewDashboard.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |

### 3.2 Financial Statement Components

| Report | Component | Evidence Status |
| :--- | :--- | :--- |
| Income Statement | `IncomeStatement.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Balance Sheet | `BalanceSheet.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Cash Flow | `CashFlow.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Owners Summary | `OwnersSummary.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Yearly Comparison | `YearlyComparison.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Tax / VAT Declaration | `TaxDeclaration.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Statement of Account | `StatementOfAccount.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Trial Balance | `TrialBalance.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| General Ledger | `GeneralLedger.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |

### 3.3 Data Processing and Intelligence

| Engine | Location | Evidence Status |
| :--- | :--- | :--- |
| Upload Parser (Multer + Validation) | `server.ts`, `pre-validation-engine.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Record Categorization | `categorization-engine.ts`, `CategoriesSummary.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Anomaly Detection | `financial-utils.ts`, `server.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Upload Classification | `upload-classifier.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Ingestion Engine | `ingestion-engine.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| ERP Engine | `erp-engine.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Financial Intelligence | `financial-intelligence/` directory | `VERIFIED_PRESENT_IN_SOURCE` |
| Operational Intelligence | `operational-intelligence/` directory | `VERIFIED_PRESENT_IN_SOURCE` |
| Pre-validation | `pre-validation/` directory | `VERIFIED_PRESENT_IN_SOURCE` |
| PDF Export Engine | `pdf-engine.ts`, `PDFService.ts` | `VERIFIED_PRESENT_IN_SOURCE` |

### 3.4 File Management and Lifecycle

| Feature | Evidence Status | Notes |
| :--- | :--- | :--- |
| Unified Upload UI | `VERIFIED_PRESENT_IN_SOURCE` · `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` | Upload button `رفع ملف Excel للمشتريات` renders. Transport and non-active staging corrections were introduced, but end-to-end professional acceptance remains pending source-of-truth alignment, evidence display, governance integration, and isolated lifecycle testing. |
| Multer Multipart Staging Endpoint | `VERIFIED_PRESENT_IN_SOURCE` | `/api/erp/files/governance/staged-upload` — code exists; not independently accepted for production use. |
| Binary File Durable Storage | `VERIFIED_PRESENT_IN_SOURCE` | `data/staged-files/` — code writes files to disk; correctness and cleanup behavior not independently accepted. |
| Server-Side Validation | `VERIFIED_PRESENT_IN_SOURCE` | `createValidationSession` — code exists; validation accuracy and completeness not independently accepted. |
| Upload Classification | `VERIFIED_PRESENT_IN_SOURCE` | `classifyStagedUpload` — code exists; classification correctness and evidence display not independently accepted. |
| Active Files List API | `VERIFIED_PRESENT_IN_SOURCE` · `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` | `GET /api/erp/files` — returns data that renders file cards. Subject to known identity authority mismatch (GAP-01). |
| Activate Action | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` | `POST /api/erp/files/lifecycle/:id/activate` — endpoint code exists; safety, atomicity, and audit behavior not independently accepted. |
| Replace Action | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` | `POST /api/erp/files/lifecycle/:id/replace/:targetId` — endpoint code exists; target safety, atomicity, and audit behavior not independently accepted. |
| Remove (Archive) Action | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` | `DELETE /api/erp/files/:id` — endpoint code exists; impact preview accuracy, atomicity, and audit behavior not independently accepted. |
| View History (`عرض السجل`) | `PRESENT_BUT_DISCONNECTED_OR_BROKEN` | Button renders on file cards but has no `onClick` handler — produces no action when clicked. |
| Restore Action | `NOT_FOUND` | No restore endpoint, UI action, or conflict-detection logic exists. |
| Audit Log Entries | `VERIFIED_PRESENT_IN_SOURCE` | Audit log write calls exist in activate, replace, and archive code paths; log correctness and completeness not independently accepted. |

### 3.5 Governance and Review

| Feature | Evidence Status | Notes |
| :--- | :--- | :--- |
| Governance Requests Store | `VERIFIED_PRESENT_IN_SOURCE` | `governance_requests.json` — file exists with data. |
| Governance Dry-Run Engine | `VERIFIED_PRESENT_IN_SOURCE` | `governance-dry-run.ts` — code exists. |
| Validation Review Screen | `PRESENT_BUT_DISCONNECTED_OR_BROKEN` | `ValidationReviewScreen.tsx` (53 KB) exists but is not imported, routed, or triggered from any current flow. Integration contract is unresolved. |
| Global Audit Log | `VERIFIED_PRESENT_IN_SOURCE` | `GlobalAuditLog.tsx` — code exists. |
| Audit Module | `VERIFIED_PRESENT_IN_SOURCE` | `Audit.tsx` — code exists. |
| Shadow Validation UI | `VERIFIED_PRESENT_IN_SOURCE` | `ShadowValidationUI.tsx` — code exists. |
| Alerts Report | `VERIFIED_PRESENT_IN_SOURCE` | `AlertsReport.tsx` — code exists. |
| Anomalies Report | `VERIFIED_PRESENT_IN_SOURCE` | `AnomaliesReport.tsx` — code exists. |
| Operational Errors Panel | `VERIFIED_PRESENT_IN_SOURCE` | `OperationalErrorsPanel.tsx` — code exists. |

### 3.6 Supporting Infrastructure

| Feature | Location | Evidence Status |
| :--- | :--- | :--- |
| Active File Registry | `active-file-registry.ts` | `VERIFIED_PRESENT_IN_SOURCE` — contains `getActiveFiles`, `filterRecordsByActiveFiles`; subject to known identity authority defect (GAP-01). |
| Financial Basis | `financial-basis.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Settings Service | `settings-service.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Invoice History Service | `invoice-history-service.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Smart Invoice Service | `smart-invoice-service.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Dev Auth | `dev-auth.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Logger | `logger.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Formatters | `formatters.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| Schemas | `schemas.ts` | `VERIFIED_PRESENT_IN_SOURCE` |
| i18n Localization | `src/i18n/` directory | `VERIFIED_PRESENT_IN_SOURCE` |
| App Router | `App.tsx` (144 KB) | `VERIFIED_PRESENT_IN_SOURCE` |
| Raw Data Inspector | `RawDataInspector.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Trace Modal | `TraceModal.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Grouped Purchases | `GroupedPurchases.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Items Directory | `ItemsDirectory.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Monthly Summary | `MonthlySummary.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Monthly Payroll | `MonthlyPayroll.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Payroll Expense Allocation | `PayrollExpenseAllocation.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Quotation Manager | `QuotationManager.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Smart Invoice | `SmartInvoice.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |
| Journal Entry Modal | `JournalEntryModal.tsx` | `VERIFIED_PRESENT_IN_SOURCE` |

---

# 4. Verified Current Purchases File Lifecycle State

| Aspect | Current State | Evidence Level |
| :--- | :--- | :--- |
| **Unified upload UI** | Upload button renders and staging endpoint code exists. Transport and non-active staging corrections were introduced, but end-to-end professional acceptance remains pending source-of-truth alignment, evidence display, governance integration, and isolated lifecycle testing. | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` |
| **Active-file cards** | Render with file name, record count, and status badge. Subject to known identity/report authority mismatch. | `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` |
| **Staged-file cards** | Render with classification labels. Evidence display is incomplete or absent. | `VISUALLY_OBSERVED_IN_CURRENT_RUNTIME` |
| **Replacement control** | Code exists and opens target-selection dialog. Target safety, atomicity, and audit behavior not independently accepted. | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` |
| **Removal control** | Code exists and opens impact dialog. Impact accuracy, atomicity, and audit behavior not independently accepted. | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` |
| **History action** | `عرض السجل` button present but produces no action when clicked. | `PRESENT_BUT_DISCONNECTED_OR_BROKEN` |
| **Restore capability** | No code, endpoint, or UI exists. | `NOT_FOUND` |
| **Classification evidence display** | Labels shown without supporting financial evidence (dates, overlaps, deltas). | `PRESENT_BUT_NOT_FUNCTIONALLY_ACCEPTED` |
| **Review/governance integration** | `ValidationReviewScreen.tsx` exists but is orphaned. Integration contract is unresolved. | `PRESENT_BUT_DISCONNECTED_OR_BROKEN` |
| **Active-file / report authority** | Inconsistent — UUID vs. hash mismatch causes silent record exclusion. | `UNRESOLVED` — data-authority defect per Blueprint §6.1 |
| **Test artifacts** | Present in production storage — test tenant data in `uploads.json` and staged files on disk. | `UNRESOLVED` — contamination requiring governed cleanup |

---

# 5. Current Data and UI Contradictions

The following contradictions are documented as factual observations. No repairs are proposed in this document.

### 5.1 Two Files Appear Active, Only One Contributes

- The UI active-file section displays **two** files as `نشط في التقارير`:
  1. `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` — 358 records
  2. `مشتريات الفترة من يناير وحتى مارس 2026 - Copy.xlsx` — 376 records
- The active-files counter shows `2 ملفات نشطة`.
- However, the header/report metric shows only `358` processed records.
- **Root cause**: `filterRecordsByActiveFiles` uses `getFileIdentifier(file)` which evaluates to the file's UUID (`id`). The Copy file's records in the registry are keyed by its content hash, not its UUID. The mismatch silently excludes the Copy file's 376 records from reports. This is a data-authority defect per Blueprint §6.1.

### 5.2 Copy File — Unresolved Governed Disposition

The Copy file (`مشتريات الفترة من يناير وحتى مارس 2026 - Copy.xlsx`, 376 records) is visibly present in lifecycle active state and currently excluded from report contribution according to accepted forensic findings. Its business legitimacy and intended disposition remain unresolved pending explicit user review before any identity migration could cause its records to contribute.

> [!WARNING]
> **Mandatory risk statement**: Resolving identity matching (GAP-01) without first governing the Copy file disposition may cause its 376 records to enter reports unexpectedly, changing financial totals without user awareness or approval.

### 5.3 Staged Decision Items Lack Evidence

- Staged file cards display classification labels (e.g., "ملف متداخل أو غير محسوم — يحتاج مراجعة") but do not render the stored overlap analysis, comparative date bounds, or financial delta evidence that would allow the user to make an informed decision.

### 5.4 Financial Review Screen Unreachable

- `ValidationReviewScreen.tsx` (containing "مركز القرار المالي", anomaly metrics, and record-level review) exists as a component but is not imported, routed, or triggered from any current application flow.

### 5.5 History Control Nonfunctional

- The `عرض السجل` button on file cards produces no visible action or UI change when clicked.

### 5.6 Database State vs. UI State Divergence

- Per AG-FIONIRA-FOUNDATION-00 forensic findings: the database (`uploads.json`) may show different file statuses than what the frontend displays, depending on when the user last refreshed. Browser view may be stale relative to backend state after agent operations.

### 5.7 Test Artifact Contamination

- Test tenant data (`test-lifecycle-123`) and test staged files persist in production storage alongside real user data.

---

# 6. Function Preservation Requirements for Antigravity

All source code and data listed below must be preserved by any future implementation work. No feature may be disabled, removed, or replaced without documented migration analysis and explicit user approval.

> [!NOTE]
> Preservation of code presence does not imply acceptance of current behavior. Lifecycle mutation actions (activate, replace, remove) have code present but are not approved for production use until independently accepted through isolated testing and user verification per the governed roadmap.

| # | Feature | Preservation Requirement | Acceptance Status |
| :---: | :--- | :--- | :--- |
| 1 | **Accepted financial baseline** | 358 records, 245,895.15 / 35,251.16 / 281,146.31 ر.س | Accepted and binding |
| 2 | **Dashboard components** | Global, visual, expenses, revenues, payroll, banks dashboards | Code present; functional acceptance per-module not independently verified |
| 3 | **Financial report components** | Income statement, balance sheet, cash flow, trial balance, general ledger, owners summary, yearly comparison, tax declaration, statement of account | Code present; calculation correctness depends on active-source resolver (subject to GAP-01) |
| 4 | **File upload UI and staging path** | Unified upload surface, multer staging endpoint, durable binary storage | Code present; end-to-end acceptance pending |
| 5 | **Original file durability** | Uploaded source files preserved on disk | Code present |
| 6 | **Backend parsing** | `createValidationSession`, schema validation, record extraction | Code present; parsing accuracy not independently accepted |
| 7 | **Upload classification** | `classifyStagedUpload` — category assignment logic | Code present; classification correctness not independently accepted |
| 8 | **Active file registry** | `getActiveFiles`, `filterRecordsByActiveFiles` | Code present; subject to known identity authority defect (GAP-01) |
| 9 | **Anomaly detection** | Duplicate detection, critical error flagging, financial validation | Code present |
| 10 | **Validation/review component** | `ValidationReviewScreen.tsx` — preserved pending contract verification and correct reintegration | Code present; disconnected; integration contract unresolved |
| 11 | **Governance requests** | `governance_requests.json` and dry-run engine | Code and data present |
| 12 | **Export engines** | PDF and Excel export capabilities | Code present |
| 13 | **Settings and company identity** | Company profile, system configuration | Code present |
| 14 | **Auth and user management** | Authentication flow, user roles, permissions | Code present |
| 15 | **Audit log data** | All existing audit entries and logging infrastructure | Code and data present |
| 16 | **Active file lifecycle controls** | Remove, replace actions on active file cards | Code present; safety, atomicity, and audit behavior not independently accepted |
| 17 | **Staged file lifecycle controls** | Activate, replace, cancel actions on staged file cards | Code present; safety, atomicity, and audit behavior not independently accepted |
| 18 | **Categorization engine** | Transaction categorization and category summaries | Code present |

---

# 7. Gap Matrix Against Master Blueprint

Each gap below references the master blueprint v1.1 requirement it violates and provides assessment details specific to the Antigravity workspace.

---

### GAP-01: SourceFileId / ContentHash Identity Authority Mismatch

| Attribute | Detail |
| :--- | :--- |
| **Current State** | `getFileIdentifier` prioritizes `file.id` (UUID). Registry records for some files are keyed by content hash. Mismatch causes silent record exclusion from reports. Per Blueprint §6.1, any workspace where `ContentHash` is used as a record-association key has a data-authority defect. |
| **Blueprint Requirement** | §5 Principle 2, §6 Source-of-Truth Model, §6.1 Canonical Source-File Identity Contract. |
| **Risk** | 🔴 **Severe** — Financial statements silently omit transactions from files shown as active. |
| **Dependencies** | Requires canonical identity model design (SourceFileId-primary), migration plan, and governed Copy file disposition (GAP-03) before any code or data change. |
| **Verification Needed** | Full audit of all file-to-record association keys. Migration simulation in isolated data copy. |
| **Priority** | **P0 — Must be resolved before any other lifecycle work** |

---

### GAP-02: UI Active / Report Contribution Inconsistency

| Attribute | Detail |
| :--- | :--- |
| **Current State** | UI shows 2 active files (2 ملفات نشطة) but reports include records from only 1 file (358 records). |
| **Blueprint Requirement** | §5 Principle 2, §11 Rule 6 — No hidden partial contribution. |
| **Risk** | 🔴 **Severe** — User sees misleading active-file count. |
| **Dependencies** | Directly caused by GAP-01. Resolution of GAP-01 will resolve this gap. |
| **Verification Needed** | After GAP-01 resolution: confirm file card record counts match report record counts. |
| **Priority** | **P0 — Resolves with GAP-01** |

---

### GAP-03: Copy File Governed Disposition

| Attribute | Detail |
| :--- | :--- |
| **Current State** | The Copy file is visibly present in lifecycle active state and currently excluded from report contribution according to accepted forensic findings. Its business legitimacy and intended disposition remain unresolved pending explicit user review before any identity migration could cause its records to contribute. |
| **Blueprint Requirement** | §7 — Every file must have a clear lifecycle status. §5 Principle 13 — Backward compatibility. §14 — Migration must not cause unexpected data contribution. |
| **Risk** | 🔴 **Severe** — Resolving identity matching without first governing the Copy file disposition may cause its 376 records to enter reports unexpectedly, changing financial totals without user awareness. |
| **Dependencies** | Must be resolved **before** GAP-01 migration implementation to prevent unintended financial impact. Requires explicit user decision. |
| **Verification Needed** | User decision on whether this file should remain active, be archived, or be removed. |
| **Priority** | **P0 — Must be addressed before GAP-01 migration execution** |

---

### GAP-04: Staged Evidence Display Deficiency

| Attribute | Detail |
| :--- | :--- |
| **Current State** | Staged file cards show classification labels but not the underlying overlap analysis, date comparisons, record counts, or financial deltas that justify the classification. |
| **Blueprint Requirement** | §8 — Classification must present primary evidence. §15 — Evidence must be shown. |
| **Risk** | 🟡 **Moderate** — User cannot make informed decisions about staged files without seeing evidence. |
| **Dependencies** | Classification engine stores some overlap data; gap is in frontend presentation. |
| **Verification Needed** | Inspect stored overlap analysis structure and determine if sufficient evidence exists for rendering. |
| **Priority** | **P2 — Important but does not block core lifecycle correctness** |

---

### GAP-05: Replacement Target Safety

| Attribute | Detail |
| :--- | :--- |
| **Current State** | Replace modal shows all active files as potential targets regardless of date/content overlap relevance. User could accidentally replace the wrong file. |
| **Blueprint Requirement** | §9.2 — Replacement requires identified target with comparison and financial impact. §8 — Classification must identify correct target using primary evidence, not date overlap alone. |
| **Risk** | 🟡 **Moderate** — Wrong-target replacement could cause data loss and financial misalignment. |
| **Dependencies** | Requires classification evidence to rank and filter replacement targets. |
| **Verification Needed** | Review replacement endpoint logic for safety guards and target validation. |
| **Priority** | **P2 — Address during lifecycle UX completion phase** |

---

### GAP-06: History Action Wiring (`عرض السجل`)

| Attribute | Detail |
| :--- | :--- |
| **Current State** | `عرض السجل` button exists on file cards but has no `onClick` handler. Clicking produces no visible action. |
| **Blueprint Requirement** | §12 — User must be able to select `عرض السجل` and see meaningful lifecycle history. |
| **Risk** | 🟡 **Moderate** — Audit trail exists in backend but is inaccessible through the file management UI. |
| **Dependencies** | Requires audit data API endpoint and history overlay/panel component. `GlobalAuditLog.tsx` and `Audit.tsx` exist and may provide foundation. |
| **Verification Needed** | Assess if existing audit log infrastructure can serve per-file history queries. |
| **Priority** | **P1 — Required for lifecycle completeness** |

---

### GAP-07: Restoration Capability Absence

| Attribute | Detail |
| :--- | :--- |
| **Current State** | No restore endpoint, no restore UI action, no conflict-detection logic for restoration exists. |
| **Blueprint Requirement** | §7 — Archived files should have restorability as an eligibility property. §9.4 — Restoration with duplication/conflict guard. |
| **Risk** | 🟢 **Low-to-Moderate** — Archive/removal is currently permanent unless database files are manually edited. |
| **Dependencies** | Requires archive storage model and conflict detection against current active files. |
| **Verification Needed** | Determine if archived file data is preserved sufficiently for restoration. |
| **Priority** | **P1 — Required for lifecycle completeness** |

---

### GAP-08: Review/Governance Integration Contract Unresolved

| Attribute | Detail |
| :--- | :--- |
| **Current State** | `ValidationReviewScreen.tsx` (53 KB, containing financial decision center metrics, anomaly review, and record-level approval) is orphaned — not imported, routed, or triggered from any current flow. The correct integration contract for this existing financial review/governance capability is unresolved. It must be analysed before reuse to prevent record-ingestion or decision side effects from being incorrectly applied to file lifecycle actions. |
| **Blueprint Requirement** | §10 — Financial Review/Governance Integration Contract. Before integration, must verify input contract, output/decision contract, persistence side effects, record-vs-file scope, and safe boundary between file lifecycle and financial review. |
| **Risk** | 🔴 **Severe** — Directly reconnecting this component without contract verification could introduce unintended record ingestion, status changes, or decision side effects into the file lifecycle flow. |
| **Dependencies** | Requires full analysis of the component's props, data requirements, state mutations, and expected integration points before any reuse decision. |
| **Verification Needed** | Contract analysis per Blueprint §10 Financial Review/Governance Integration Contract requirements. |
| **Priority** | **P1 — Required for governed file lifecycle, but must not be rushed without contract verification** |

---

### GAP-09: Legacy Exclusion Request Historical Disposition

| Attribute | Detail |
| :--- | :--- |
| **Current State** | One governance request exists with status `APPROVED_AWAITING_EXECUTION` (type `PREVIEW_SOFT_DISABLE`). It remains unexecuted per user directive. |
| **Blueprint Requirement** | §13 — A prior exclusion request is not a period lock. §7 — Every file must have a clear lifecycle status. |
| **Risk** | 🟢 **Low** — Currently has no impact on active files or reports. |
| **Dependencies** | Requires user decision on whether to execute, cancel, or archive this historical request. |
| **Verification Needed** | Confirm request details and affected file identity without executing. |
| **Priority** | **P3 — Cleanup item, no operational urgency** |

---

### GAP-10: Test Data Contamination and Cleanup

| Attribute | Detail |
| :--- | :--- |
| **Current State** | Test tenant (`test-lifecycle-123`) data persists in `uploads.json`. Five test staged files (50 bytes each) exist in `data/staged-files/` alongside one real upload. |
| **Blueprint Requirement** | §5 Principle 3 — Test files must never contribute to live reports. §16 — Testing must use isolated temporary data workspace. |
| **Risk** | 🟡 **Moderate** — Test data could leak into active environment if tenant filters fail. |
| **Dependencies** | Requires clear inventory distinguishing test artifacts from real user data before any cleanup. |
| **Verification Needed** | Full inventory of test vs. real artifacts with confirmation before cleanup authorization. |
| **Priority** | **P2 — Should be resolved before further lifecycle testing** |

---

### GAP-11: Period Lock / Filing Controls Not Found

| Attribute | Detail |
| :--- | :--- |
| **Current State** | No period lock, closed-period, or filed-return enforcement mechanism is implemented. |
| **Blueprint Requirement** | §13 — Governance exceptions require verified policy model. No agent may invent these controls without approval. |
| **Risk** | 🟢 **Low** — Absence is acceptable as long as no agent assumes these controls exist. |
| **Dependencies** | Requires business requirements gathering before design. |
| **Verification Needed** | Confirm no hidden period-lock logic exists in current source. |
| **Priority** | **P3 — Future design, not current gap** |

---

### GAP-12: Isolated Testing Deficiency

| Attribute | Detail |
| :--- | :--- |
| **Current State** | Previous lifecycle testing was performed using a test tenant within production storage. No isolated test harness or temporary data workspace exists. |
| **Blueprint Requirement** | §16 — All state-changing tests must be performed in isolated temporary data workspace. |
| **Risk** | 🟡 **Moderate** — Future testing without isolation will continue to contaminate production data. |
| **Dependencies** | Requires test harness design that provides isolated database copies and staged-file directories. |
| **Verification Needed** | Design approval before implementation. |
| **Priority** | **P1 — Must be in place before any lifecycle implementation testing** |

---

# 8. Governed Future Roadmap — Planning Only

> [!CAUTION]
> This roadmap is a **proposal only**. No phase may be executed until explicitly authorized by the user. Each phase requires separate approval. Design phases require approval before producing design documents. Implementation phases require separate approval after design is accepted.

---

## Phase AG-01 — Source Identity, Data Authority, and Current-State Disposition Design Only

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Define the canonical `SourceFileId` / `ContentHash` / `VersionLineageId` contract per Blueprint §6.1. Reconcile real, staged, archived, test, legacy-request, and Copy-file states at a planning level. Produce migration, rollback, and disposition options. Consult user on Copy file governed disposition (GAP-03). |
| **Prerequisites** | Master blueprint v1.1 and this roadmap v1.1 approved. |
| **Allowed Scope** | Documentation and read-only evidence only. Identity model design document. Migration plan document with rollback strategy. Copy file disposition options for user decision. Impact assessment on all resolvers. |
| **Forbidden Scope** | No source code changes. No data modifications. No schema migrations. No runtime commands. |
| **Expected Evidence** | Design document with: chosen canonical identity model, migration steps, rollback plan, Copy file disposition recommendation with risk analysis, impact assessment on all resolvers and record associations, backward-compatibility proof strategy. |
| **Acceptance Gate** | User approval of identity model design, migration plan, and Copy file disposition before any implementation. |

---

## Phase AG-02 — Isolated Test Workspace and Harness Design/Implementation

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Establish a true isolated temporary data/testing environment before any state-changing lifecycle verification (GAP-12). |
| **Prerequisites** | AG-01 design approved (identity model needed to correctly design test data isolation). |
| **Allowed Scope** | Test harness architecture design document. After separate authorization: implementation of test infrastructure only. |
| **Forbidden Scope** | Must not modify production/user persistent data. Must not execute lifecycle actions against real data. Must not clean production test artifacts. |
| **Expected Evidence** | Test harness design document. After implementation authorization: working isolated test environment that creates temporary data copies and cleans up after itself. |
| **Acceptance Gate** | Design approval first. Implementation approval separately. Working test harness demonstrated before any lifecycle testing. |

---

## Phase AG-03 — Identity/Migration/Resolver Simulation in Isolated Data Copy Only

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Simulate the approved identity model, resolver alignment, Copy file disposition scenario, and migration/rollback plan against an isolated copied data set (GAP-01, GAP-02, GAP-03). |
| **Prerequisites** | AG-01 design approved. AG-02 test harness implemented and verified. |
| **Allowed Scope** | Copy production data into isolated test workspace. Apply identity migration to isolated copy. Run resolver alignment against isolated copy. Verify financial reconciliation against isolated copy. Test rollback against isolated copy. |
| **Forbidden Scope** | No production code changes. No production data changes. No runtime modifications to the real workspace. |
| **Expected Evidence** | Reconciliation evidence from isolated simulation: all legitimate active files correctly mapped, record counts match, financial baseline preserved (or explicitly adjusted per approved Copy file disposition). Rollback proof from isolated simulation. |
| **Acceptance Gate** | User review of simulation evidence before authorizing production implementation. |

---

## Phase AG-04 — Controlled Source-of-Truth and Resolver Alignment Implementation

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Implement the separately approved identity/resolver correction and migration against the real workspace, only after AG-03 simulation evidence and explicit approval (GAP-01, GAP-02). |
| **Prerequisites** | AG-03 simulation evidence accepted. Explicit user authorization for production implementation. |
| **Allowed Scope** | Identity model code changes in resolver and registry. Data migration execution per approved plan. Resolver alignment to use consistent `SourceFileId` authority. Copy file disposition per approved user decision. |
| **Forbidden Scope** | No new lifecycle features. No UI changes beyond what is required by resolver alignment. No changes to financial calculations. Must not include test-data cleanup unless separately authorized. No changes to upload/classification flow. |
| **Expected Evidence** | All legitimate active files' records correctly contribute to reports. File card counts match report counts. Financial baseline preserved at 358 records (or user-approved adjusted total after Copy file disposition). Rollback capability confirmed. Audit trail of migration created. |
| **Acceptance Gate** | Automated reconciliation evidence. One controlled user verification. |

---

## Phase AG-05 — Approved Persistent Test-Artifact Cleanup Execution

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Remove only explicitly identified test artifacts after identity/resolver stability is proven (GAP-10). Separate from source-of-truth implementation to prevent cleanup from masking migration issues. |
| **Prerequisites** | AG-04 completed and verified. Identity/resolver alignment stable. |
| **Allowed Scope** | Inventory all test artifacts with explicit identification. Present cleanup list to user. Execute approved cleanup only. |
| **Forbidden Scope** | Must not remove any real user data. Must not modify resolver or identity logic. Must not alter any file that is not explicitly identified as a test artifact and approved for removal. |
| **Expected Evidence** | Complete inventory of test artifacts with clear justification for each item's classification as test data. Post-cleanup verification that no real data was affected. |
| **Acceptance Gate** | User approval of exact cleanup list before execution. Post-cleanup verification. |

---

## Phase AG-06 — History and Restoration Design, Then Separately Authorised Implementation

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Design and implement meaningful `عرض السجل` behavior and safe restoration capability, only after data authority is stable (GAP-06, GAP-07). |
| **Prerequisites** | AG-04 completed and verified (consistent identity model required for history queries and restoration conflict detection). AG-05 cleanup completed (clean data state). |
| **Allowed Scope** | Phase 1 (design): History display design document. Restoration workflow design document. Phase 2 (implementation, separately authorized): History API endpoint. History overlay/panel UI. Restore endpoint with conflict detection. Restore UI action on archived file cards. Audit records for restoration events. |
| **Forbidden Scope** | No changes to active-file resolution. No changes to financial calculations. No changes to upload/classification flow. |
| **Expected Evidence** | Design phase: Design documents. Implementation phase: `عرض السجل` displays chronological lifecycle history. Restore action works with duplication guard. Isolated tests passing. |
| **Acceptance Gate** | Design approval before implementation. Implementation approval separately. Automated test evidence. One controlled user verification. |

---

## Phase AG-07 — Financial Review/Governance Integration Contract Design, Then Separately Authorised Implementation

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Determine the safe integration boundary for the existing financial review capability (`ValidationReviewScreen.tsx`) and the file lifecycle flow (GAP-08). Do not assume direct reuse before contract verification per Blueprint §10. Address legacy exclusion request disposition (GAP-09). |
| **Prerequisites** | AG-06 completed (history must work so that review decisions are auditable). |
| **Allowed Scope** | Phase 1 (contract analysis): Full analysis of `ValidationReviewScreen.tsx` input contract, output/decision contract, persistence/ingestion side effects, record-vs-file scope, and safe integration boundary. Design document for integration approach. Phase 2 (implementation, separately authorized): Review screen integration per approved contract. Routing/trigger implementation. Review outcome → file status state machine. Exclusion request historical disposition. |
| **Forbidden Scope** | No changes to financial calculations. No changes to active-file resolution logic (stable from AG-04). No invention of period-lock controls without approval. No direct reconnection of `ValidationReviewScreen.tsx` without completed contract verification. |
| **Expected Evidence** | Contract analysis phase: Contract analysis document per Blueprint §10 requirements. Implementation phase: Staged files with validation issues surface review path. Review screen is reachable. Review decisions are audited. Exclusion request has governed final state. Isolated tests passing. |
| **Acceptance Gate** | Contract analysis approval before implementation design. Implementation approval separately. Automated test evidence. One controlled user verification. |

---

## Phase AG-08 — Classification Evidence, Replacement Safety, and Arabic UX Completion

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Surface classification evidence on staged file cards (GAP-04). Implement replacement target safety filters using primary evidence hierarchy per Blueprint §8 (GAP-05). Complete professional Arabic-first user flow. |
| **Prerequisites** | AG-07 completed (review integration must be stable before UX polish). |
| **Allowed Scope** | Evidence display components (composite-key overlap analysis, record deltas, financial impact, date ranges as supporting context). Replacement target filtering by primary evidence relevance. Arabic status labels and error messages. Loading states and transitions. |
| **Forbidden Scope** | No changes to core data model or resolvers. No new lifecycle statuses. No classification based on date overlap alone. |
| **Expected Evidence** | Classification evidence visible on staged cards with primary evidence hierarchy. Replace modal shows only relevant targets with comparison data. All user-facing text professional Arabic. No raw technical errors. Isolated tests passing. |
| **Acceptance Gate** | Automated test evidence. One controlled user verification of complete lifecycle UX. |

---

## Phase AG-09 — Integrated Isolated Acceptance and One Final User Verification

| Attribute | Detail |
| :--- | :--- |
| **Purpose** | Comprehensive end-to-end testing of all lifecycle scenarios in isolated environment. One final integrated user verification. |
| **Prerequisites** | AG-08 completed. All prior phase acceptance gates passed. |
| **Allowed Scope** | Full test suite execution per Blueprint §16: valid new source, valid replacement, overlap/ambiguity, invalid file, oversized file, Arabic filename, removal, restoration, history, review integration, report/file-card reconciliation, export parity, legacy active files after migration, same-period distinct files, date-overlapping files with no duplicates, identity migration backward compatibility, prevention of hidden partial contribution, post-migration authority reconciliation. |
| **Forbidden Scope** | No new features. No architectural changes. Bug fixes only if discovered during testing, with documented scope and separate authorization. |
| **Expected Evidence** | All test cases passing. Financial reconciliation verified. Export parity confirmed. No test data in production storage. Legacy active files correctly preserved. |
| **Acceptance Gate** | Complete test report. One final user manual verification of the complete integrated lifecycle. |

---

# 9. Immediate Freeze Rules

> [!WARNING]
> Until this roadmap is reviewed and **explicitly approved**, the following restrictions remain in force. Approval of this v1.1 roadmap document does **not** authorize AG-01 or any other phase. Each phase requires separate explicit authorization.

- ❌ No source code modification
- ❌ No persistent data cleanup
- ❌ No upload testing
- ❌ No delete or replacement confirmation
- ❌ No restoration development
- ❌ No governance reconnection
- ❌ No UUID/hash fix implementation
- ❌ No exclusion request execution
- ❌ No runtime restart
- ❌ No build, lint, or test execution
- ❌ No further experiments or exploratory commands
- ❌ No lifecycle mutation action (activate, replace, remove, restore)
- ❌ No clicking or user-action requests

The workspace must remain in its current verified state until Phase AG-01 is explicitly authorized.

---

# 10. Approval Request

> [!IMPORTANT]
> This document and the accompanying Master Blueprint v1.1 are submitted for **review and feedback only**. Approval of these documents does not authorize implementation of any roadmap phase.
>
> **Requested user actions:**
> 1. Review the Master Blueprint v1.1 for completeness, accuracy, and alignment with product vision.
> 2. Review this Antigravity Roadmap v1.1 for accuracy of current-state assessment and appropriateness of the proposed phase sequence.
> 3. Provide feedback, corrections, or amendments.
> 4. When satisfied, approve both documents to establish the governance baseline for future work.
> 5. Separately authorize Phase AG-01 when ready to begin the first design-only phase.
