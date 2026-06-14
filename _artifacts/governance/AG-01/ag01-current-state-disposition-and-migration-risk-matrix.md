# AG-01 — Current-State Disposition and Migration Risk Matrix

> **Document Version**: 1.1  
> **Phase**: AG-01 — Source Identity, Data Authority, and Current-State Disposition Design Only  
> **Date**: 2026-06-01  
> **Status**: DRAFT — Awaiting User Review  
> **Governing Documents**: Master Blueprint v1.1 §5 Principle 13, §14; Antigravity Roadmap v1.1 §5

---

> [!CAUTION]
> This document records current-state categories and presents **governed decision options conceptually only**. It does not select, recommend, or execute any disposition action. All disposition decisions remain unresolved; no user disposition decision is requested in this phase.

---

# Revision History

| Version | Date | Description |
| :--- | :--- | :--- |
| **1.0** | 2026-06-01 | Initial risk matrix draft documenting active files, staged candidates, and legacy requests. |
| **1.1** | 2026-06-01 | Revised to reconcile active/staged data contradictions, remove destructive Copy file removal, require legacy field compatibility analysis, preserve historical requests, and clarify that no migration mapping is approved yet. |

---

# 1. Accepted Real Active Baseline Source

| Attribute | Verified Value |
| :--- | :--- |
| **File** | `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` |
| **Record count** | 374 (Current persisted active) / 358 (Original historical baseline) |
| **Total before VAT** | 245,895.15 ر.س (for 358 records) |
| **Input VAT** | 35,251.16 ر.س (for 358 records) |
| **Total including VAT** | 281,146.31 ر.س (for 358 records) |
| **Status in file registry** | Active (`status: "processed"`, `isDeleted: false`) |
| **Identity pattern** | Entry has both `id` (UUID) and `fileHash` fields |
| **Record association** | Records in `records` array have `fileId` / `_sourceFile` matching this file's `fileHash` |
| **Report contribution** | Currently contributing — this is the authoritative active baseline |

### Migration risk: 🟢 **Low**

This file's records are currently contributing. Future migration must preserve this association. The future migration process must:
1. Identify records associated via `fileHash` match.
2. Align them to the file's canonical `SourceFileId` (UUID from `id` field).
3. Verify post-migration record count and financial totals match the baseline.
4. If any record count or financial total changes, migration must halt.

---

# 2. Copy File — Unresolved Governed Disposition

| Attribute | Observed State |
| :--- | :--- |
| **File** | `مشتريات الفترة من يناير وحتى مارس 2026 - Copy.xlsx` |
| **Record count (parsed)** | 376 |
| **Visible UI status** | Shows as `نشط في التقارير` (active in reports) |
| **Actual report contribution** | Active — records contribute to reports due to resolver hash fallback |
| **Persisted Registry Status** | Archived/deleted (`status: "archived"`, `isDeleted: true`) in `uploads.json` |
| **Business legitimacy** | **Unresolved** — uploaded during testing, not confirmed as user business data |

### Active-State Reconciliation

A mismatch exists between the file's persisted registry status and its runtime report contribution:
- **Registry status**: Persisted as **archived/deleted** (`isDeleted: true`) in `uploads.json`.
- **Runtime status**: Remains active in reports because the resolver matches its records using `fileHash`, bypassing the ID-based archive state.
- **Rule**: Correcting the resolver split without a prior disposition action would immediately exclude or include its 376 records depending on the resolver rules, changing the financial totals.
- **Status**: `Copy file disposition remains unresolved; no user disposition decision is requested by AG-01-R1.`

### Preserved Concept Options (Non-Destructive Only)

legitimate financial source files must not be permanently deleted. Conceptually, only the following non-destructive options are preserved for future selection:

---

#### Option A: Governed Archival (If proven appropriate)

| Aspect | Detail |
| :--- | :--- |
| **Action** | Resolve the identity split so that the file's records are correctly excluded from reports to align with its registry archived status. |
| **Financial impact** | Financial reports revert to the clean baseline. |
| **Reversibility** | Complete. The file and its records remain archived in the database and can be restored if needed. |
| **Risk** | 🟢 Low |

---

#### Option B: Quarantine / Hold on Unresolved Files

| Aspect | Detail |
| :--- | :--- |
| **Action** | Place the file in a specific quarantine status, explicitly excluding its records from report calculations while preserving the file and records for later review. |
| **Financial impact** | Excluded from active reports; no baseline contamination. |
| **Reversibility** | Complete. Can be restored or archived cleanly. |
| **Risk** | 🟢 Low |

---

#### Option C: Acceptance as Legitimate Source (Only after impact proof)

| Aspect | Detail |
| :--- | :--- |
| **Action** | Confirm the file as a legitimate second active source, aligning its records to its SourceFileId. |
| **Financial impact** | Financial totals increase by the file's unique records. Requires overlap analysis first to prevent double-counting. |
| **Reversibility** | Can be archived or quarantined later. |
| **Risk** | 🔴 High (requires overlap analysis first) |

---

#### Option D: Test-Artifact Cleanup (Only if confirmed as test data)

| Aspect | Detail |
| :--- | :--- |
| **Action** | If evidence proves this file was a test artifact and not legitimate business data, its cleanup must be handled via a separately approved AG-05 test cleanup list, not as part of normal file lifecycle disposition. |
| **Financial impact** | Excluded from active reports; data removed during cleanup. |
| **Reversibility** | Requires backup restoration. |
| **Risk** | 🟡 Moderate |

---

# 3. Staged Items Reconciliation

A difference was identified between the prior UI screenshots (which displayed two staged/decision items) and the current persistent database state:

1. **Prior UI State**:
   - Staged File 1: `مشتريات الفترة من أبريل وحتى يونيو 2025.xlsx` (341 records) classified as `ملف متداخل أو غير محسوم — يحتاج مراجعة`.
   - Staged File 2: `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` (374 records) classified as `نسخة معدلة محتملة من ملف حالي`.
2. **Current Persisted Database State**:
   - `uploads.json` contains the activated file `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` (ID: `24cbd279-066e-4ebf-9b7f-db74b63d7f7d`, `status: "processed"`, `isDeleted: false`, 374 records).
   - `erp_registry.json` → `candidateReplacements` contains only **1 entry** (a test file `مشتريات.csv` with 1 record).
   - Staged folder `data/staged-files/` contains 9 files.
3. **Reconciliation Conclusion**:
   - The second staged item (374 records) was **activated** by the user and is now the persisted active file in `uploads.json`.
   - The first staged item (341 records) was a transient test upload in memory (`devMemoryDb.candidateReplacements`) and is no longer present in the persistent `candidateReplacements` store.
   - Staged candidates do not contribute to reports. Their status remains unchanged as non-contributing staged files.

---

# 4. Archived / Deleted File Entries

| Category | Persisted Count | Description |
| :--- | :--- | :--- |
| Archived real entries | 5 entries | Real user tenant |
| Archived test entries | 6 entries | Test tenants |

### Migration risk: 🟢 **Low**

Archived entries do not contribute to reports. During migration, their metadata may be preserved for historical trace without affecting report-contributing data. They must remain non-contributing.

---

# 5. Test Artifact Categories

* **Test File Registry Entries**: 6 entries in `uploads.json`.
* **Test Physical Files**: 5 staged files in `data/staged-files/` (~50 bytes each).
* **Test Records**: Associated with test tenant IDs in `erp_registry.json`.

### Disposition Policy

Test artifact cleanup is kept strictly separate from ordinary lifecycle disposition and is governed under Phase AG-05. No test cleanup is authorised in this phase.

---

# 6. Legacy Exclusion Request

| Attribute | Value |
| :--- | :--- |
| **Count** | 1 request |
| **Proposed Action** | `PREVIEW_SOFT_DISABLE` |
| **Status** | `APPROVED_AWAITING_EXECUTION` |
| **File reference** | Uses SHA-256 hash as `fileId` |
| **Current Directive** | Unexecuted. Must remain unexecuted. |

### Historical Preservation Principle

To protect audit trace integrity:
* The original historical request's reference (`fileId` set to hash) must **remain unchanged** in the database to preserve historical trace.
* Do not prescribe overwriting this historical reference during migration. Any future mapping must use an external linkage or audit trace reference if required.

---

# 7. Rollback Requirements and Preservation Constraints

### 7.1 Pre-Migration Backup Requirements

Before any future implementation, the following must be backed up:
* `data/uploads.json`
* `data/erp_registry.json`
* `data/governance_requests.json`
* `data/staged-files/` directory

### 7.2 Preservation Constraints

- Original binary source files on disk: **never moved or deleted**
- Audit log entries: **never modified or deleted**
- Governance request: **never executed or status-changed during migration**
- Version lineage fields: **preserved as-is** (already UUID-based)

---

# 8. Explicit Non-Authorisation Statement

> [!CAUTION]
> This document presents disposition categories and options conceptually only. No disposition action, data modification, cleanup, or migration is authorised by this document. All actions require explicit user decision and separate phase authorisation.
