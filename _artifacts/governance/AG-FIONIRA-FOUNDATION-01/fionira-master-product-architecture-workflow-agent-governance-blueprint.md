# Fionira — Master Product Architecture, Workflow, and Agent Governance Blueprint

> **Document Version**: 1.1  
> **Phase**: AG-FIONIRA-FOUNDATION-01-R1  
> **Date**: 2026-06-01  
> **Status**: DRAFT — Awaiting User Review and Approval  

---

# Revision History

| Version | Date | Change Summary |
| :--- | :--- | :--- |
| 1.0 | 2026-06-01 | Initial draft created during AG-FIONIRA-FOUNDATION-01. |
| 1.1 | 2026-06-01 | Incorporates user review corrections. Adds canonical source-file identity contract, corrects classification logic to reject date overlap alone as authority, prohibits invisible partial report contribution, clarifies ARCHIVED/Removal/RESTORABLE semantics, adds backward-compatibility principle for legacy active data, adds financial review/governance integration contract requirement, expands mandatory testing coverage. **Does not authorise implementation in any workspace.** |

---

# 1. Document Authority and Usage Rules

> [!IMPORTANT]
> This document is the **governing functional and architectural reference** for Fionira. It defines the target product logic, mandatory principles, and agent operating rules across all agent workspaces.

**Binding rules:**

1. **No agent may implement** new functionality, modify existing workflows, remove functions, change data authority, or perform migration/cleanup without first reading this blueprint and producing a workspace-specific gap analysis.
2. This document **governs all agents conceptually**, but each workspace remains **technically independent**. A feature present in one workspace must not be assumed to exist in another workspace.
3. Future implementation commands must **cite the relevant blueprint sections** and the relevant **independent workspace roadmap**.
4. This blueprint is a **target reference**, not an implementation authorization. Each workspace requires its own approved roadmap and phase-specific implementation authorization before any changes are made.
5. Amendments to this blueprint require explicit user approval before they take effect.

---

# 2. Product Vision and Professional Objective

**Fionira** is a financial/accounting intelligence ERP platform that converts operational source files into validated, auditable, traceable financial data and reports, with strong governance, non-duplication, reviewability, and compliance readiness.

## Core Objectives

| Objective | Description |
| :--- | :--- |
| **Reliable Financial Reporting** | All reports derive from a single, reconciled, authoritative data pipeline. Financial totals must be traceable and consistent. |
| **Traceable Source-File Lineage** | Every transaction record is traceable to its originating source file, upload event, and lifecycle decisions. |
| **Intelligent Parsing and Validation** | Source files are parsed, validated, and classified by the system before contributing to reports. Human review is integrated for anomalies. |
| **Prevention of Duplicate or Conflicting Data** | Overlapping, duplicate, or ambiguous sources are detected and surfaced for informed human decision. Double-counting is architecturally prevented. |
| **Transparent Review and Anomaly Resolution** | Financial anomalies, critical errors, and governance-sensitive records are surfaced to qualified reviewers with evidence. |
| **Professional Finance-User Experience** | Arabic-first professional interface with clear outcomes, no raw technical errors, and minimal steps for routine operations. |
| **Controlled File Correction/Replacement/Removal** | Source corrections, replacements, and removals follow governed workflows with impact preview, atomic execution, and audit trail. |
| **Audit History and Recoverability** | All state-changing actions are recorded. Archived sources remain recoverable through controlled restoration workflows. |

---

# 3. Target Users and Roles

> [!NOTE]
> Actual implemented role enforcement must be **verified independently in each agent workspace** before any permission-based feature is built. The roles below are the target conceptual model.

### Finance/Accounting Operator

- **Responsibility**: Uploads source files, reviews classification outcomes, confirms routine activations and replacements, manages day-to-day file lifecycle.
- **Decision Boundaries**: May activate non-overlapping valid sources, confirm evidence-based replacements, remove unlocked personal-scope data, and view audit history. May not override governance holds or approve exceptional-risk items.

### Finance Reviewer/Controller

- **Responsibility**: Reviews anomalies, validates financial accuracy, approves or rejects governance-escalated items, confirms replacements involving locked or filed-return periods.
- **Decision Boundaries**: May approve or reject escalated governance requests, resolve financial anomalies, and authorize actions on locked-period data. May not modify system configuration or user permissions.

### Administrator

- **Responsibility**: Manages system configuration, user accounts, permissions, company identity, and period controls.
- **Decision Boundaries**: Full system configuration authority. May not unilaterally alter financial data without audit trail.

### Management/Report Consumer

- **Responsibility**: Consumes financial reports, dashboards, KPIs, and exports. Reviews business performance and compliance summaries.
- **Decision Boundaries**: Read-only access to reports and dashboards. No direct file lifecycle or data modification authority.

---

# 4. Functional Domain Map

Each domain below describes its purpose, relationship to source files, report contribution, review/governance, and preservation principle. Verified existence differs per workspace and must be confirmed by each workspace roadmap.

---

### 4.1 Dashboard and Management Overview

- **Purpose**: Aggregated financial health view across all operational domains.
- **Source Files**: Consumes summarized data from all domains; does not directly ingest files.
- **Report Contribution**: Displays KPIs derived from the same active-source authority used by detailed reports.
- **Review/Governance**: Reflects governance-resolved data only; does not initiate governance actions.
- **Preservation**: Dashboard calculations and visual layout must remain consistent after lifecycle changes.

### 4.2 Purchases / Expenses

- **Purpose**: Ingestion, validation, categorization, and reporting of purchase/expense transactions.
- **Source Files**: Primary consumer of uploaded purchase Excel/CSV files.
- **Report Contribution**: Active purchase records contribute to expense reports, income statements, VAT input calculations, and cash flow.
- **Review/Governance**: Records with anomalies, duplicates, or critical errors require financial review before contributing to reports.
- **Preservation**: Existing categorization logic, grouped purchases views, and expense breakdown reports must be preserved.

### 4.3 Revenues / Sales

- **Purpose**: Ingestion and reporting of revenue/sales transactions.
- **Source Files**: Uploaded revenue source files.
- **Report Contribution**: Active revenue records contribute to income statements, VAT output calculations, and cash flow.
- **Review/Governance**: Same anomaly detection and review model as purchases.
- **Preservation**: Revenue dashboards, sales categorization, and revenue-side reports.

### 4.4 Payroll

- **Purpose**: Salary, allowance, and payroll expense tracking and allocation.
- **Source Files**: Payroll source files or manual entries.
- **Report Contribution**: Payroll expenses contribute to income statements, cash flow, and allocation reports.
- **Review/Governance**: Payroll anomalies and allocation mismatches require review.
- **Preservation**: Monthly payroll views, allocation logic, and payroll expense reports.

### 4.5 Banks / Reconciliations

- **Purpose**: Bank statement ingestion, account reconciliation, and cash position tracking.
- **Source Files**: Bank statement files.
- **Report Contribution**: Reconciled bank data contributes to cash flow, statement of account, and balance sheet.
- **Review/Governance**: Unreconciled items and discrepancies require review.
- **Preservation**: Bank dashboards, reconciliation logic, and statement matching.

### 4.6 Inventory (where available)

- **Purpose**: Stock tracking and inventory valuation.
- **Source Files**: Inventory source files where supported.
- **Report Contribution**: Inventory values contribute to balance sheet and cost of goods calculations.
- **Review/Governance**: Stock discrepancies require review.
- **Preservation**: Existing inventory components if present.

### 4.7 Invoices / Quotations (where available)

- **Purpose**: Sales invoice generation, quotation management, and invoice history.
- **Source Files**: May reference revenue/sales source data; also supports direct invoice creation.
- **Report Contribution**: Invoiced amounts contribute to revenue tracking and accounts receivable.
- **Review/Governance**: Invoice approval workflows where implemented.
- **Preservation**: Invoice dashboards, quotation manager, and smart invoice generation.

### 4.8 Financial Reporting

- **Purpose**: Comprehensive financial statements derived from all operational domain data.
- **Source Files**: Does not directly ingest; consumes records from active sources across all domains.
- **Report Contribution**: This IS the report layer — income statement, balance sheet, cash flow, trial balance, general ledger, owners summary, yearly comparison.
- **Review/Governance**: Report accuracy depends on upstream governance resolution. Reports must not include unresolved or governance-held data.
- **Preservation**: All financial statement components, calculation logic, and export capabilities.

### 4.9 VAT / Tax Declaration

- **Purpose**: Calculation and declaration of VAT/tax obligations based on input and output tax from purchases and revenues.
- **Source Files**: Derives from purchase and revenue active records.
- **Report Contribution**: Tax declaration reports and taxable/non-taxable breakdowns.
- **Review/Governance**: Tax calculations must be auditable and traceable to contributing records and files.
- **Preservation**: Tax declaration component, VAT calculation logic, and tax-related exports.

### 4.10 File Management (per operational module)

- **Purpose**: Governed lifecycle management of source files within each operational domain.
- **Source Files**: This IS the file ingestion and lifecycle layer.
- **Report Contribution**: Controls which files and records are active and contribute to reports.
- **Review/Governance**: Classification, overlap detection, replacement safety, and removal impact preview.
- **Preservation**: Upload surface, staging, classification, activation, replacement, removal, history, and restoration workflows.

### 4.11 Validation / Anomaly Detection / Financial Review

- **Purpose**: Parsing validation, duplicate detection, critical error flagging, and human decision center for financial anomalies.
- **Source Files**: Operates on parsed records from staged or active source files.
- **Report Contribution**: Determines which records pass validation and may contribute. Blocked records must not contribute until resolved.
- **Review/Governance**: This IS the core governance/review mechanism for record-level financial quality.
- **Preservation**: Validation engine, anomaly detection, duplicate detection, financial review UI, and approval/rejection workflows.

### 4.12 Audit Trail and History

- **Purpose**: Immutable chronological record of all state-changing actions across the system.
- **Source Files**: Records actions performed on source files and derived data.
- **Report Contribution**: Does not directly contribute to financial reports; provides traceability evidence.
- **Review/Governance**: Audit trail is the evidence layer for governance decisions.
- **Preservation**: All audit log entries, history display capabilities, and traceability links.

### 4.13 Settings, Company Identity, Users, and Permissions

- **Purpose**: System configuration, organizational identity, user account management, and role-based access control.
- **Source Files**: Not file-dependent.
- **Report Contribution**: Company identity appears on reports and exports. User roles govern access.
- **Review/Governance**: Permission changes are auditable.
- **Preservation**: Settings pages, company profile, user management, and authentication flows.

### 4.14 Data Governance Dashboard

- **Purpose**: Centralized view of data quality, governance request status, and operational health metrics.
- **Source Files**: Aggregates governance state from all operational domains.
- **Report Contribution**: Informational; does not directly contribute financial data.
- **Review/Governance**: This IS the governance oversight layer.
- **Preservation**: Governance dashboard, request tracking, and operational error panels.

---

# 5. Non-Negotiable Architecture Principles

These principles are binding for all future implementation across all agent workspaces.

| # | Principle |
| :---: | :--- |
| **1** | **One source of truth** for report-contributing records. All reports, dashboards, KPIs, and exports derive from the same authoritative active-source resolution. |
| **2** | **Active-file visibility and report contribution must use consistent authority.** A file shown as active in the UI MUST have its records included in reports. No silent exclusion due to identity mismatch or conflicting resolver logic. |
| **3** | **Non-contributing files must never pollute live reports.** Staged, invalid, archived, rejected, cancelled, and test files must never contribute records to live reports. |
| **4** | **Original uploaded source files must be durably preserved** for audit, comparison, and potential restoration. No destructive deletion of legitimate financial source files is part of normal professional lifecycle behavior. |
| **5** | **File lifecycle and record-level validation are integrated but not conflated.** File status governs whether records CAN contribute; record validation governs whether individual records SHOULD contribute. Both must function correctly and visibly. |
| **6** | **No silent capability loss.** New features must not disconnect, hide, duplicate, or replace existing valuable capabilities without explicit user approval and documented migration. |
| **7** | **Every state-changing action must be auditable.** Activation, replacement, removal, restoration, approval, rejection, and any data modification must produce an audit record. |
| **8** | **Financial reconciliation.** Financial totals must reconcile and be traceable to contributing files and records. `Total Including VAT = Total Before VAT + VAT`, subject only to explicitly documented accounting presentation rules. |
| **9** | **Arabic-first professionalism.** Arabic user-facing text and filenames must display correctly. No raw technical errors, internal identifiers, or English-only error messages in the Arabic user experience. |
| **10** | **Testing isolation.** Testing must never pollute real persistent user data. All state-changing tests must use isolated temporary data workspaces. |
| **11** | **Agent quality gate.** The user must not be the first detector of ordinary implementation defects. Agents must verify their work through automated checks before requesting user testing. |
| **12** | **Workspace independence.** No agent workspace may be mixed with another without explicit user-authorized dependency declaration. |
| **13** | **Backward compatibility.** Legitimate existing files and records predating lifecycle improvements must remain discoverable, correctly mapped, and correctly contributing after upgrades. No lifecycle redesign may make legacy active data disappear from UI or reports without an approved mapping/migration plan and isolated proof. |

---

# 6. Source-of-Truth Model

The following authority model defines how data flows from upload to report contribution.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOURCE-OF-TRUTH CHAIN                        │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ Source File   │───▶│ File Lifecycle    │───▶│ Parsed Records   │  │
│  │ Artifact     │    │ Registry         │    │                  │  │
│  │ (Original)   │    │ (Status/Lineage) │    │ (Derived Data)   │  │
│  └──────────────┘    └──────────────────┘    └──────────────────┘  │
│                              │                        │            │
│                              ▼                        ▼            │
│                    ┌──────────────────┐    ┌──────────────────┐    │
│                    │ Active-Source    │───▶│ Report Resolver  │    │
│                    │ Resolver         │    │                  │    │
│                    │ (Authority Gate) │    │ (Same Authority) │    │
│                    └──────────────────┘    └──────────────────┘    │
│                                                     │              │
│                    ┌──────────────────┐              ▼             │
│                    │ Staging Registry │    ┌──────────────────┐    │
│                    │ (Non-Contrib.)   │    │ Financial Reports│    │
│                    └──────────────────┘    │ & Dashboards     │    │
│                                           └──────────────────┘    │
│                    ┌──────────────────┐    ┌──────────────────┐    │
│                    │ Audit/History    │    │ Validation/      │    │
│                    │ Store (Immutable)│    │ Review State     │    │
│                    └──────────────────┘    └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Authority Components

| Component | Purpose | Report Impact |
| :--- | :--- | :--- |
| **Source File Artifact** | Original uploaded file stored durably on disk. | None directly; serves as audit evidence and restoration source. |
| **File Lifecycle Registry** | Authoritative status and lineage of every uploaded file (active, staged, archived, etc.). | Determines which files are eligible to contribute records. |
| **Parsed Records** | Transaction records derived from source file parsing. | Contain the actual financial data. |
| **Active-Source Resolver** | Determines which files are currently active and whose records may contribute to reports. | **This is the single authority gate.** |
| **Report Resolver** | Derives report records from the **same** active-source authority. | Must produce identical record sets as the active-source resolver. |
| **Staging Registry** | Contains uploaded but non-contributing files under analysis, classification, or user decision. | **Must never contribute to reports.** |
| **Audit/History Store** | Immutable lifecycle and decision trace for all state-changing events. | None directly; provides traceability. |
| **Validation/Review State** | Financial review outcomes tied to file/record lineage. | May gate individual records within active files from contributing until reviewed. |

### Binding Target Rule

> **Visible active files = files whose records are allowed to contribute to live reports, subject only to explicit visible user filters.**

No UI may show a source as active while excluding it from reports because of hidden identity mismatch or conflicting resolver logic.

## 6.1 Canonical Source-File Identity Contract

> [!IMPORTANT]
> This identity contract is binding for all workspaces. Existing workspaces with conflicting ID/hash usage require an approved backward-compatibility and migration plan before any code or data changes.

| Identity Concept | Definition | Usage |
| :--- | :--- | :--- |
| **`SourceFileId`** | The immutable internal identity assigned to a source file at upload time. | This is the **canonical key** used to connect: file lifecycle state, parsed records, active-source resolution, report contribution, audit/history entries, and version lineage. All resolvers, registries, and record associations must use `SourceFileId` as their primary linkage. |
| **`ContentHash`** | A hash derived from the binary content of the uploaded file. | Evidence for **binary equality, duplicate detection, or integrity verification only**. `ContentHash` must **never** silently substitute for `SourceFileId` when linking records to active reports. A content hash match does not imply identity equivalence; two distinct uploads with identical content remain distinct source files with distinct `SourceFileId` values. |
| **`VersionLineageId`** | An identifier connecting a file to its replacement chain. | Represents replacement history. When file B replaces file A, both share a `VersionLineageId` or B carries `PreviousVersionSourceFileId = A.SourceFileId`. This enables history traversal and restoration conflict detection. |

**Binding rules:**

1. `SourceFileId` is assigned once at upload and never changes for the lifetime of that source file entry.
2. `ContentHash` is computed for evidence purposes but must not be used as a record-association key or active-source resolver key.
3. `VersionLineageId` and/or `PreviousVersionSourceFileId` must represent replacement history where implemented.
4. Any workspace where `ContentHash` is currently used as a record-association key has a **data-authority defect** requiring an approved migration plan before correction.

---

# 7. Complete Source-File Lifecycle Model

## Target Lifecycle Statuses

> [!NOTE]
> These are conceptual statuses. User-facing language must be Arabic and professional. Internal enum names may differ but must map cleanly to these concepts.

| Status | Meaning | Contributes to Reports | Available User Actions | Audit Behavior |
| :--- | :--- | :---: | :--- | :--- |
| `STAGED` | File uploaded and stored durably; not yet parsed. | ❌ | Cancel upload, view info. | Upload event recorded. |
| `ANALYSING` | System is parsing, validating, and classifying the file. | ❌ | Wait; view progress. | Analysis start recorded. |
| `READY_NEW_SOURCE` | Classified as a valid new non-overlapping source. | ❌ | Activate, cancel. | Classification outcome recorded. |
| `READY_REPLACEMENT` | Classified as a valid corrected replacement of an existing active source. | ❌ | Confirm replacement (with target), cancel. | Classification + identified target recorded. |
| `NEEDS_DECISION` | Overlapping, ambiguous, or requires human judgment. | ❌ | View evidence, choose action (activate as new, replace specific target, cancel). | Classification + evidence recorded. |
| `INVALID` | File is unparseable, structurally incorrect, or fails mandatory validation. | ❌ | View errors, cancel/remove. | Validation failure recorded. |
| `ACTIVE` | File is active and its valid records contribute to live reports. | ✅ | Remove from reports, view history, replace (via new upload). | Activation event recorded. |
| `ARCHIVED` | Previously active file that has been removed from reports or replaced. Preserved for audit, history, and potential restoration. | ❌ | Restore (governed), view history. | Archive event + financial impact + reason recorded. |

### Lifecycle Status Semantics — Clarifications

> [!NOTE]
> - **`ARCHIVED`** is the principal non-contributing retained state for any previously active file that was removed from reports or replaced by a newer version. It is the target state for both user-initiated removal and system-initiated replacement archival.
> - **Removal** is an audited lifecycle action and reason that causes archival. It is not destructive deletion and is not necessarily a separate persistent file status. The audit record distinguishes removal-initiated archival from replacement-initiated archival.
> - **Restorability** is preferably an eligibility property of an archived source (e.g., `isRestorable: true`) rather than a separate mutually exclusive status, unless a workspace-specific approved model requires otherwise. An archived file is restorable if no conflict prevents it and restoration has not been administratively prohibited.
> - **No destructive deletion** of legitimate financial source files is part of normal professional lifecycle behavior. The original source file artifact and its parsed records remain available for audit regardless of lifecycle status.

## Target Workflow

```
Upload → Durable Staging → Backend Parsing → Financial Validation
    → Classification → User-Visible Outcome → Authorised Action
    → Atomic Report Update → Audit/History Record
```

---

# 8. Smart Upload Classification Logic

## Required Classification Categories

| Category | Condition | User Outcome |
| :--- | :--- | :--- |
| **A. New Non-Overlapping Valid Source** | Parsed successfully. No composite-key or business-record overlap with existing active sources. Financial validation passed or has only minor warnings. | Presented as ready to activate. One-action activation. |
| **B. Clear Corrected Replacement** | Parsed successfully. Strong evidence of overlap with a specific existing active source (high composite-key overlap, matching module/business scope, similar structure, version/replacement relationship). Changes detected (added/removed/changed rows, financial deltas). | Presented with comparison evidence and identified replacement target. One-action confirmed replacement. |
| **C. Overlapping or Ambiguous** | Partial composite-key overlap with one or more existing sources. Cannot automatically determine if new source or replacement. Possible duplication risk based on business-record analysis. | Presented with overlap evidence. User must choose: activate as additional source, replace a specific target, or cancel. |
| **D. Invalid or Unprocessable** | Parsing failed, unsupported format, structural errors, or mandatory validation failures that prevent any record extraction. | Presented with error summary. User may cancel/remove. No activation path available. |

## Classification Evidence Hierarchy

> [!IMPORTANT]
> Multiple legitimate files may cover the same accounting date period. Date-range overlap alone is contextual supporting evidence only — it must **never** be treated as sufficient grounds for duplication or ambiguity classification.

**Primary classification evidence** (system must use for new-source vs. replacement vs. ambiguous determination):

1. **Module/business scope** — which operational domain the file serves
2. **Source/document scope** — the type or category of business document where known
3. **Composite transaction-key overlap** — exact and fuzzy matching of business-record identifiers across the new file and existing active sources
4. **Exact and fuzzy duplicate analysis** — record-level comparison identifying true duplicates versus distinct transactions
5. **Version/replacement relationship** — evidence that the new file is a correction or update of a specific existing source
6. **Financial totals and deltas** — differences in amounts, record counts, and financial summaries

**Supporting contextual evidence only** (informational, never sole classification authority):

- Parsed transaction date ranges
- Display filename
- User-entered label
- Visible period text in filename

> [!CAUTION]
> - **Filename alone must never activate, replace, or reject a financial source file.** Classification must be evidence-based on parsed financial content.
> - **A file must not be classified as overlapping or ambiguous merely because it shares calendar dates with another source.** Same-period files serving different business scopes, document types, or containing entirely distinct transaction records are legitimate co-existing active sources.

---

# 9. New Source, Replacement, Removal, and Restoration Workflows

## 9.1 New Source Activation

1. File is staged and classified as Category A (new, non-overlapping, valid).
2. System presents the file with record count, date range, and financial summary.
3. User confirms activation through one clear action.
4. System atomically: marks file as `ACTIVE`, enables its records for report contribution, updates report totals, and creates audit record.
5. Dashboard and reports reflect the new data immediately.

## 9.2 Replacement

1. File is staged and classified as Category B (clear replacement) or Category C where user selects replacement.
2. System presents: identified target file, record comparison (added/removed/changed), and financial impact summary (delta in totals).
3. User confirms replacement through one action, selecting the target if ambiguous.
4. System atomically: archives old version (with replacement reason and lineage), activates new version, updates all records (old records no longer contribute, new records contribute), updates report totals, and creates audit record preserving replacement lineage.
5. No double-counting occurs at any point during the atomic operation.
6. Old version history remains accessible through the audit trail and archived file record.

## 9.3 Removal from Reports

1. User selects removal action on an active file.
2. System presents: financial impact preview showing the effect of removing this file's records from reports (record count, total before VAT, VAT, total including VAT that will be removed).
3. For normal unlocked user-controlled data: user confirms through one action.
4. For governance-locked data (locked periods, filed returns): escalation to reviewer/controller required.
5. System atomically: archives the file (with removal reason), excludes its records from report contribution, updates report totals, and creates audit record.
6. Removal causes archival, **not destructive deletion**. The source file artifact, its parsed records, and its lifecycle history remain for audit and potential restoration.

## 9.4 Restoration

1. User or administrator selects restore action on an archived file.
2. System checks for conflicts: is there a newer version of the same source currently active? Would restoration cause duplication?
3. If conflicts exist: system presents the conflict and available resolution options (replace current version, cancel restoration).
4. If no conflicts: system presents record count and financial impact of restoration.
5. User confirms restoration.
6. System atomically: reactivates the file, re-enables its records for report contribution, updates report totals, and creates audit record.

---

# 10. Validation, Error Detection, and Financial Governance Workflow

## Distinct Purposes

Financial review is **connected to but not conflated with** file lifecycle:

| Layer | Purpose | Scope |
| :--- | :--- | :--- |
| **Parsing/Schema Validation** | Ensure file structure is processable and records have required fields. | Per-file, during staging. |
| **Duplicate Detection** | Identify records that duplicate existing active records. | Cross-file, during classification. |
| **Total Consistency** | Verify that record-level amounts sum to expected totals. | Per-file and cross-file. |
| **VAT Validation** | Verify VAT calculations are correct per record and in aggregate. | Per-record and per-file. |
| **Anomaly and Critical-Error Detection** | Flag unusual values, missing data, calculation mismatches, and structurally suspicious records. | Per-record. |
| **Human Decision Center** | Present records requiring human judgment with evidence. Allow approval, correction, or rejection at the record level. | Per-record, per-file. |

## Binding Rules

> [!IMPORTANT]
> - File lifecycle must not eliminate or disconnect existing financial review capability.
> - Financial review must not be incorrectly reused as a file replacement/removal engine.
> - A staged file that has validation failures must surface the correct review path before becoming active.
> - A professional user must be able to understand whether a file is blocked because of **file lifecycle ambiguity** or because its **records contain financial validation issues**. These are different problems with different resolution paths.

## Invisible Partial Contribution Prohibition

> [!WARNING]
> A file shown as `ACTIVE` must not have records silently excluded from live reports due to unresolved validation issues, hidden identity mismatches, or implicit review holds.
>
> The default target behavior is that **critical blocking validation issues prevent activation** until resolved. A file with critical validation failures should remain in a pre-active status (e.g., `NEEDS_DECISION` or a validation-specific hold) until the issues are resolved or explicitly accepted.
>
> If partial record-level activation is ever approved in the future (i.e., some records from an active file contributing while others are held), it must be:
> - an **explicit documented policy** with separate user approval;
> - **visibly reflected** in the file card and reports (e.g., "318 of 358 records contributing — 40 records held for review");
> - **auditable**;
> - subject to **separate design and implementation approval**.

## Financial Review/Governance Integration Contract

> [!IMPORTANT]
> Preserving an existing financial review screen or governance component does **not** automatically authorise directly reconnecting or reusing it in a new lifecycle flow. Before integration, each workspace must verify:
>
> 1. The component's **input contract** — what data it expects, in what format, from what source.
> 2. The component's **output/decision contract** — what state changes, persistence writes, or ingestion side effects it produces.
> 3. Any **persistence or ingestion side effects** — does it write records, change statuses, or trigger downstream actions?
> 4. Whether it operates at **record level, file level, or both**.
> 5. The **safe boundary** between file lifecycle decisions and financial review decisions.
>
> Integration must preserve useful existing review functionality without using a record-ingestion workflow incorrectly as a file replacement/removal engine, and without introducing unintended side effects into the file lifecycle flow.

---

# 11. Reporting and Dashboard Integration

## Core Rules

1. **Reports consume records only from authoritative active sources.** The report resolver must use the same active-source authority as the file lifecycle registry.
2. **File cards, dashboards, and reports must reconcile.** If a file card shows "active — 358 records", the reports must include exactly those 358 records (subject only to explicit visible user filters).
3. **Visible filters must explain differences.** If a user applies a date filter or category filter that reduces the visible count, the filter state must be visually clear.
4. **Report total reconciliation**: `Total Including VAT = Total Before VAT + VAT`, subject only to explicitly documented accounting presentation rules (e.g., rounding conventions).
5. **Export parity**: Every export (Excel, PDF) must represent the same currently filtered/live report state unless explicitly labeled otherwise (e.g., "full period export").
6. **No hidden partial contribution.** If a file is shown as `ACTIVE`, all its valid records must be included in reports. If any records are excluded, the exclusion must be visibly explained in the file card and reports (see §10 Invisible Partial Contribution Prohibition).

## Integration Points

| Consumer | Data Source | Must Reconcile With |
| :--- | :--- | :--- |
| Dashboard KPIs | Active-source resolver | Detailed report totals |
| Financial Statements | Report resolver (same authority) | Dashboard KPIs, file card record counts |
| Excel Exports | Same filtered report data | On-screen report display |
| PDF Exports | Same filtered report data | On-screen report display |
| VAT/Tax Outputs | Purchase + Revenue active records | Corresponding report line items |

---

# 12. Audit Trail, History, and Traceability

## Required Audit Data

The system must retain the following for every file lifecycle event:

| Data Point | Description |
| :--- | :--- |
| **Original file identity** | System-assigned `SourceFileId` and original display filename. |
| **Upload event** | Timestamp, user/role, file size, original filename. |
| **Parse/validation outcome** | Record count, validation pass/fail, error summary. |
| **Classification outcome** | Category (A/B/C/D) and supporting evidence summary. |
| **Activation event** | Timestamp, user/role, record count, financial totals at activation. |
| **Replacement lineage** | Which file was replaced (`PreviousVersionSourceFileId`), comparison summary, old→new record deltas. |
| **Archive/removal action** | Timestamp, user/role, reason (removal vs. replacement), financial impact. |
| **Restoration action** | Timestamp, user/role, conflict resolution outcome, financial impact. |
| **User/role** | Identity of the actor where role enforcement is implemented. |
| **Financial effect summaries** | Totals before and after the action (before VAT, VAT, total). |
| **Timestamps** | UTC timestamps for all events. |

## Required UX

> [!IMPORTANT]
> The user must be able to select **`عرض السجل`** (View History) on any file card and see meaningful lifecycle history — not a nonfunctional control. The history display must show a chronological list of events with human-readable Arabic descriptions, timestamps, and financial effect summaries where applicable.

---

# 13. Governance Exceptions and Period Controls

- **Review/approval escalation** is required only where a verified policy requires it:
  - Role segregation mandating reviewer approval.
  - Locked accounting periods.
  - Filed tax returns whose data must not be retroactively altered.
  - Exceptional risk identified by the system (e.g., large financial impact beyond a threshold).

- **A prior exclusion request is not a period lock.** Exclusion requests are governance actions on specific records or files, not period-wide locks.

- **No agent may invent closed-period or filed-return behavior** without verifying an existing model or receiving explicit approval to design one. These controls must be architecturally designed, not ad-hoc.

---

# 14. Data Integrity, Migration, and Backward Compatibility

1. **Existing legitimate files and records must remain visible and correctly contributing** after lifecycle changes. No "silent data loss" from schema changes, key migrations, or resolver updates.

2. **Backward compatibility for legacy active data.** Legitimate existing files and records predating lifecycle improvements must remain discoverable, correctly mapped, and correctly contributing after upgrades. No lifecycle redesign may make legacy active data disappear from UI or reports without an approved mapping/migration plan and isolated proof that the migration preserves all legitimate data.

3. **Changes to file identity, status, UUID/hash mapping, or active-source resolution** require an approved migration/backward-compatibility plan that:
   - Documents current state.
   - Defines the migration transformation.
   - Preserves all legitimate data.
   - Includes rollback capability.
   - Is tested in isolation before production execution.
   - Proves that legacy active files remain correctly visible and contributing after migration.

4. **Data cleanup cannot occur** until test artifacts and real user data are clearly distinguished, inventoried, and approved for separate disposition.

5. **Legacy workflows may be retired** only after:
   - Migration analysis confirms no data loss.
   - Replacement workflow is verified functional.
   - User approval is obtained.
   - Audit trail of the migration is created.

---

# 15. UI/UX Professional Standards

| Standard | Requirement |
| :--- | :--- |
| **Language** | Arabic-first user-facing application text where Arabic mode is active. All labels, messages, statuses, confirmations, and error messages in Arabic. |
| **Filename Rendering** | Correct UTF-8 Arabic filename display throughout the application. |
| **Error Handling** | No raw technical errors (`e.message`, stack traces, HTTP status codes, JSON payloads) displayed to users. All errors must be translated to professional Arabic user-facing messages. |
| **Internal Data** | No internal IDs, hashes, UUIDs, enum values, file paths, tenant identifiers, or storage keys exposed in the UI. |
| **Status Clarity** | Clear, unambiguous Arabic status labels. User must understand what state a file is in and what actions are available without technical knowledge. |
| **Evidence Display** | When the system states that a file overlaps, needs decision, or has validation issues, the supporting evidence must be shown (date ranges, record counts, financial deltas, affected records). |
| **Efficiency** | Minimal user steps for routine actions. No default approval maze for standard source correction/removal unless governance policy truly requires it. |
| **Responsiveness** | Professional loading states, progress indicators, and transition animations. No frozen or unresponsive UI during backend operations. |

---

# 16. Testing and Acceptance Governance

## Mandatory Testing Rules

1. **Isolation**: All state-changing tests must be performed in an **isolated temporary data workspace**, never merely using a test tenant inside normal persistent storage.

2. **Required Test Cases** (for any lifecycle implementation):

| Test Case | Coverage |
| :--- | :--- |
| Valid new source upload and activation | Happy path, Category A |
| Valid replacement upload and confirmation | Happy path, Category B |
| Overlapping/ambiguous upload requiring decision | Category C |
| Invalid/unprocessable file upload | Category D |
| Oversized file rejection | Server-side limit enforcement |
| Arabic filename handling | UTF-8 correctness |
| Removal from reports | Financial impact preview + atomic removal |
| Restoration from archive | Conflict detection + atomic restoration |
| History/audit display | `عرض السجل` functionality |
| Validation/review integration | Anomaly surfacing and resolution |
| Report/file-card reconciliation | Active files = report-contributing records |
| Export parity | Excel/PDF match on-screen data |
| Legacy active files after migration | Files predating lifecycle changes remain visible and correctly contributing |
| Same-period distinct legitimate files | Two files covering identical date ranges but different business scopes coexist correctly |
| Date-overlapping files with no duplicate records | Files with overlapping dates but entirely distinct transaction records are not falsely classified as ambiguous |
| Identity migration backward compatibility | After SourceFileId/ContentHash migration, all legitimate active files retain correct record associations and report contribution |
| Prevention of hidden partial contribution | No active file has records silently excluded from reports |
| Report/file-card authority reconciliation after migration | File card record counts exactly match report record counts post-migration |

3. **Agent quality gate**: Agent must supply passing test evidence before requesting user manual testing.

4. **User testing cadence**: User manual testing occurs **once per accepted integrated flow**, not after each micro-fix. The agent must batch and verify changes before presenting them.

---

# 17. Agent Governance Protocol

## Mandatory Procedure for Every Future Agent Phase

Every agent, in every workspace, must follow this sequence for any implementation phase:

| Step | Action | Output |
| :---: | :--- | :--- |
| **1** | Read this master blueprint. | Confirmed understanding. |
| **2** | Read the independent workspace roadmap for the target workspace. | Workspace-specific context. |
| **3** | Verify existing relevant functionality through **read-only inspection**. | Current-state evidence. |
| **4** | Produce a **scoped gap/impact statement** for the proposed changes. | Gap analysis + risk assessment. |
| **5** | **Obtain explicit user authorization** before implementation. | User approval. |
| **6** | Make **only approved changes**. No scope expansion without re-authorization. | Controlled implementation. |
| **7** | Run **isolated automated verification**. | Test evidence. |
| **8** | Report: files changed, evidence, preserved functions, residual risks. | Completion report. |
| **9** | Request **one controlled user review** only after passing acceptance gates. | User verification. |

## Explicit Rules

> [!WARNING]
> - **No broad regex/string rewriting** of production source files via generated scripts.
> - **No unapproved deletion or cleanup** of any persistent data.
> - **No assumptions across agent workspaces** about what features exist elsewhere.
> - **No implementation that disables an existing function** without documented migration plan and explicit user approval.
> - **No scripted production-source rewrite utilities** (e.g., `fix.js`, `add-lifecycle-apis.js`, `refactor-file-management.js`). All source changes must be made through deliberate, reviewable, individual file edits.

---

# 18. Blueprint Approval Boundary

> [!CAUTION]
> This master blueprint is a **governing target reference**. It does **not** authorize implementation in any workspace.
>
> Each workspace requires:
> 1. Its own approved **independent workspace roadmap**.
> 2. **Phase-specific implementation authorization** for each roadmap phase.
>
> No agent may cite this blueprint as permission to implement. This blueprint defines WHAT the system should be. Workspace roadmaps define HOW and WHEN to get there, subject to user approval at each phase.
>
> Approval of this v1.1 document does not authorise any implementation phase, code change, data migration, cleanup, or runtime action in any workspace.
