# AG-01 — Authoritative Resolver Alignment and Migration Plan

> **Document Version**: 1.1  
> **Phase**: AG-01 — Source Identity, Data Authority, and Current-State Disposition Design Only  
> **Date**: 2026-06-01  
> **Status**: DRAFT — Awaiting User Review  
> **Governing Documents**: Master Blueprint v1.1 §6, §6.1, §14; Antigravity Roadmap v1.1 Phases AG-02 through AG-04

---

> [!CAUTION]
> This document designs a future migration approach only. **Real-data execution is prohibited** until:
> 1. AG-02 isolated test harness is implemented and verified.
> 2. AG-03 isolated simulation produces accepted reconciliation evidence.
> 3. The user separately authorises AG-04 production implementation.
> No broad real-data re-stamping or cleanup is authorized or selected by this plan.

---

# Revision History

| Version | Date | Description |
| :--- | :--- | :--- |
| **1.0** | 2026-06-01 | Initial migration plan draft detailing target authority chain and simulation requirements. |
| **1.1** | 2026-06-01 | Revised to reconcile active/staged data contradictions, remove destructive Copy file removal, require legacy field compatibility analysis, preserve historical requests, and clarify that no migration mapping is approved yet. |

---

# 1. Target Authority Chain

After future migration, the complete data flow from source file to financial reports must follow a single, consistent authority chain using `SourceFileId` at every link:

```
Source File Upload
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Backend assigns: SourceFileId = crypto.randomUUID()    │
│  Backend computes: ContentHash = SHA-256(file bytes)    │
│  Both stored on file registry entry                     │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Ingestion Engine parses file → produces records        │
│  Each record stamped with:                              │
│    sourceFileId = SourceFileId (NOT ContentHash)        │
│    (Subject to compatibility dual-writing/retaining)    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Record Registry stores records in collections          │
│  Records carry sourceFileId as their file association   │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Active-Source Resolver                                  │
│  getFileIdentifier(file) → returns file.id (UUID)       │
│  filterRecordsByActiveFiles:                            │
│    builds Set from file.id (SourceFileId)               │
│    matches record.sourceFileId against Set              │
│    → consistent single-key match                        │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Report Resolver (same authority)                       │
│  Uses same filterRecordsByActiveFiles logic             │
│  → identical record sets for reports and dashboards     │
└─────────────────────────────────────────────────────────┘
```

---

# 2. Areas Requiring Verification or Migration

### 2.1 Data Store Target Design

Future data migration is narrowed strictly to the minimum report-relevant legitimate active data necessary for source-of-truth alignment. Archived, test, or staged files are kept separate.

| Data Store | Target Migration Design | Scope & Limits |
| :--- | :--- | :--- |
| **`uploads.json`** — file entries | Normalize active file entries to valid UUID `id`. | Legitimate active files only. Excludes test artifacts. |
| **`erp_registry.json`** → `records` array | Add `sourceFileId` set to the file's `SourceFileId` (UUID). | Legitimate active file records only. Keep legacy fields unchanged for compatibility. |
| **`erp_registry.json`** → `journalEntries` array | Re-stamp `sourceFileId` to the file's `SourceFileId` (UUID). | Legitimate active file entries only. |
| **`governance_requests.json`** | Preserve the original immutable reference (hash) unchanged. If later required, add a separate lookup mapping. | Do not overwrite historical request records. |

### 2.2 Legacy Field Compatibility Strategy

To ensure system stability, the migration design requires:
1. Identifying `sourceFileId` as the target canonical field for all records.
2. A compatibility audit to determine whether legacy fields (`fileId`, `_sourceFile`) must remain as read-only historical trace evidence, be dual-written temporarily, or can eventually be safely retired.
3. No field overwrites without explicit compatibility validation.

### 2.3 Code Target Design (Design Only)

| Component | File | Proposed Code Change |
| :--- | :--- | :--- |
| **`getFileIdentifier`** | `active-file-registry.ts` | Return `file.id` only (UUID). |
| **`filterRecordsByActiveFiles`** | `active-file-registry.ts` | Match `record.sourceFileId` against `file.id` Set. |
| **Ingestion engine** | `ingestion-engine.ts` | Set `sourceFileId = file.id` (and legacy fields according to compatibility strategy). |
| **Activation endpoint** | `server.ts` | Set `sourceFileId: newActiveFile.id` (SourceFileId). |
| **Replacement endpoint** | `server.ts` | Match and stamp using SourceFileId only. |
| **Delete endpoint** | `server.ts` | Match using SourceFileId only. |
| **File listing** | `server.ts` | Use `id` (SourceFileId) only. |

---

# 3. Proposed Migration Stages

### Stage 0: Pre-Migration (AG-02 prerequisite)

- Implement isolated test harness.
- Create complete backup of all data stores.
- Document exact pre-migration state: file count, record count, financial totals.

### Stage 1: Copy File Disposition Resolution

- A selected Copy file disposition scenario, once later approved, must first be simulated in AG-03 and only applied to real data atomically in an explicitly authorised AG-04 phase. Do not execute Copy disposition in AG-01.

### Stage 2: Data Migration — Record Re-Stamping (Legitimate Active Data Only)

For legitimate active file entries in `uploads.json`:
1. Find all records in `records` array where `fileId` or `_sourceFile` matches `file.fileHash`.
2. Add `sourceFileId` = `file.id` (UUID).
3. Handle legacy fields (`fileId`, `_sourceFile`) according to the approved compatibility strategy.
4. Find journal entries matching `file.fileHash` and update `sourceFileId` = `file.id`.

### Stage 3: Code Migration — Resolver Simplification

- Update resolver, endpoints, and ingestion engine to use SourceFileId cleanly.

### Stage 4: Post-Migration Reconciliation

- Run all reconciliation checks (see §5).

---

# 4. Rollback Strategy

### 4.1 Pre-Migration Backup Set

The following must be backed up:
* `data/uploads.json`
* `data/erp_registry.json`
* `data/governance_requests.json`
* `data/staged-files/` directory

### 4.2 Rollback Procedure

1. Restore all data files from backup copies.
2. Revert code changes.
3. Restart application and verify pre-migration state.

---

# 5. Reconciliation Checks

The following checks must pass after simulation or migration to confirm success:

### 5.1 Baseline Records and Totals

* Record count for verified baseline file = 358 (or user-approved adjusted total).
* Financial totals match pre-migration values.
* VAT arithmetic is correct.

### 5.2 File Card / Report Parity

* Active file card record count = report-contributing record count.
* No records contributing from non-active files.

### 5.3 Non-Active and Test Exclusion

* Staged candidates do not contribute records.
* Test tenant records do not contribute to real tenant reports.
* Archived files do not contribute records.

### 5.4 Governance Request Integrity

* Request status unchanged (`APPROVED_AWAITING_EXECUTION`).
* Historical reference (hash) remains intact in database record.

---

# 6. Dependency on AG-02 Isolated Testing Infrastructure

> [!IMPORTANT]
> **No migration code or data transformation may be executed against production data** until AG-02 provides a verified isolated test environment.

### AG-02 Must Provide:
* **Isolated data directory**: Temporary copy of all data files for simulation.
* **Independent runtime**: Ability to run the application against copied data without affecting production.
* **Cleanup guarantee**: Automatic removal of temporary data after simulation.

---

# 7. AG-03 Isolated Simulation Requirements

Before AG-04 production implementation is authorised, AG-03 must produce simulation evidence including:
* **Pre-simulation snapshot** of files, records, and totals.
* **Post-migration snapshot** of the same metrics.
* **Reconciliation report** demonstrating all checks pass.
* **Rollback proof** showing pre-migration state restores exactly.

---

# 8. Explicit Non-Authorisation Statement

> [!CAUTION]
> This document designs a future migration approach. It does **not** authorise:
> - Any execution of migration stages
> - Any modification to production source code
> - Any modification to persistent data stores
> - Any resolver, endpoint, or ingestion engine modification
> - Any Copy file disposition action
> - Any test data cleanup
> - Any runtime restart, build, or test execution
> - Any governance request execution
>
> **Required sequence before production execution:**
> 1. ✅ AG-01-R1 design documents reviewed and approved (this phase)
> 2. ⬜ AG-02 isolated test harness designed and implemented (separate authorisation)
> 3. ⬜ AG-03 isolated simulation executed with accepted evidence (separate authorisation)
> 4. ⬜ AG-04 production implementation authorised with explicit user approval
