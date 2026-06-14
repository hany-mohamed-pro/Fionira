# AG-01 — Canonical Source-File Identity and Authority Design

> **Document Version**: 1.1  
> **Phase**: AG-01 — Source Identity, Data Authority, and Current-State Disposition Design Only  
> **Date**: 2026-06-01  
> **Status**: DRAFT — Awaiting User Review  
> **Governing Documents**: Master Blueprint v1.1 §6.1, Antigravity Roadmap v1.1

---

> [!CAUTION]
> This document is a **design artifact only**. It does not authorise implementation, migration, data modification, or any state-changing action. Implementation requires separate authorisation under Phase AG-04, following successful isolated simulation in AG-03.

---

# Revision History

| Version | Date | Description |
| :--- | :--- | :--- |
| **1.0** | 2026-06-01 | Initial design draft presenting canonical identity models and current findings. |
| **1.1** | 2026-06-01 | Revised to reconcile active/staged data contradictions, remove destructive Copy file removal, require legacy field compatibility analysis, preserve historical requests, and clarify that no migration mapping is approved yet. |

---

# 1. Target Canonical Identity Model

Per Master Blueprint v1.1 §6.1, all Fionira workspaces must adopt a canonical source-file identity contract. The following defines the target model for the Antigravity workspace.

## 1.1 `SourceFileId` — Primary Canonical Identity

| Property | Definition |
| :--- | :--- |
| **Type** | UUID v4 string |
| **Generation** | Assigned exactly once at upload time by the backend via `crypto.randomUUID()` |
| **Immutability** | Never changes for the lifetime of the source file entry, regardless of lifecycle status transitions |
| **Scope** | Uniquely identifies a single upload event and its resulting source file entry |
| **Canonical usage** | This is the **sole authoritative key** for connecting all system components to a source file |

### `SourceFileId` invariants:

1. Every source file entry MUST have exactly one `SourceFileId`, assigned at upload, never modified.
2. `SourceFileId` uniquely identifies the upload event — two uploads of byte-identical content produce two distinct `SourceFileId` values.
3. `SourceFileId` is the target key to be used for: file lifecycle registry lookups, parsed record association, active-source resolution, report contribution, audit/history entries, governance request targeting, and version lineage references.
4. No other identifier may substitute for `SourceFileId` when determining which records contribute to live reports.

## 1.2 `ContentHash` — Binary Evidence Only

| Property | Definition |
| :--- | :--- |
| **Type** | SHA-256 hex string (target; currently mixed formats exist) |
| **Generation** | Computed from the uploaded file's binary content at upload time |
| **Immutability** | Computed once; never changes (the file content is immutable) |
| **Scope** | Describes the file's binary content; identical content produces identical hashes |

### `ContentHash` permitted uses:

| Use | Permitted |
| :--- | :---: |
| Binary equality check (is this the exact same file content?) | ✅ |
| Duplicate upload detection (has this exact content been uploaded before?) | ✅ |
| Integrity verification (has the stored file been corrupted?) | ✅ |
| Supporting evidence in classification (informational) | ✅ |
| **Record-file association key in persistence stores** | ❌ |
| **Active-source resolver key** | ❌ |
| **Report contribution authority key** | ❌ |
| **Substitute for `SourceFileId` in any association** | ❌ |

### `ContentHash` identity boundary:

A `ContentHash` match does **not** imply identity equivalence. Two distinct uploads of byte-identical content are distinct source files with distinct `SourceFileId` values, distinct lifecycle states, and independent audit histories.

## 1.3 `VersionLineageId` and `PreviousVersionSourceFileId` — Replacement History

| Property | Definition |
| :--- | :--- |
| **`PreviousVersionSourceFileId`** | The `SourceFileId` of the file that this file replaced. Stored on the replacing (newer) file entry. |
| **`ReplacedBySourceFileId`** | The `SourceFileId` of the file that replaced this file. Stored on the replaced (older) file entry. |
| **Lineage traversal** | Following `PreviousVersionSourceFileId` backward and `ReplacedBySourceFileId` forward produces the complete version chain for any source. |

---

# 2. Current Antigravity Identity Architecture — Verified Findings

> [!WARNING]
> This section describes the current identity patterns at a semantic level. No actual internal identifiers, hashes, paths, or data values are exposed.

## 2.1 Data Store Structures

### File Registry (`uploads.json`)

- **Structure**: Top-level JSON array of file entry objects.
- **Total entries**: 11 entries.
- **Identity fields per entry**: `id` (primary key) and `fileHash` (content identity).
- **Identity format inconsistency**: The `id` and `fileHash` fields use mixed formats across entries:
  - Legacy test stubs: simple slug strings for both `id` and `fileHash`
  - Newer entries: UUID v4 for `id`; UUID v4 OR SHA-256 hex for `fileHash`
  - One older real entry: SHA-256 hex for both `id` and `fileHash`
- **Tenant distribution**: 6 test/dev tenant entries, 5 real user entries.
- **Status distribution**: 1 active (persisted as not deleted), 10 persisted as archived/deleted.

### Record Registry (`erp_registry.json`)

- **Structure**: Single top-level JSON object with **named collection arrays** (NOT hash-keyed).
- **Top-level keys**: `journalEntries`, `records`, `auditLogs`, `skippedRows`, `rejectedRecords`, `candidateReplacements`, `settings`
- **Record-file association**: Individual records carry association fields:
  - `records` array: `fileId` and `_sourceFile` fields — both set to the file's `fileHash` value at ingestion time
  - `journalEntries` array: `sourceFileId` field — set to the file's `fileHash` value
- **Record count**: ~1,500+ parsed records, ~1,180+ journal entries

### Governance Requests (`governance_requests.json`)

- **Structure**: JSON array of request objects.
- **File reference**: `fileId` field — currently stores a SHA-256 hash value matching the target file's `fileHash`
- **Count**: 1 entry, status `APPROVED_AWAITING_EXECUTION`

### Audit Logs (within `erp_registry.json`)

- **File reference**: `entityId` field — references the file's `id` (UUID) from `uploads.json`
- **Also stores**: `after.fileHash` — the file's hash value

### Staged Files (`data/staged-files/`)

- **Total**: 9 files in the staging directory.
- **Test artifacts**: 5 files (~50 bytes each, simple CSV test data)
- **Real uploads**: 4 files (~36-52 KB each, binary xlsx)

## 2.2 Active-State and Identity Reconciliation

A critical contradiction exists between the persisted registry status and user-visible runtime behavior regarding active files:

1. **Persisted Registry Status**: In `uploads.json`, only **1 file** is currently persisted as active/processed (`status: "processed"`, `isDeleted: false`):
   - File: `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` (ID: `24cbd279-066e-4ebf-9b7f-db74b63d7f7d`, 374 records).
   - The file `مشتريات الفترة من يناير وحتى مارس 2026 - Copy.xlsx` is persisted as **archived/deleted** (`status: "archived"`, `isDeleted: true`).
2. **User-Visible UI/Report State**: At runtime, **2 files** appear active in the UI (`2 ملفات نشطة`), and the Copy file is marked as `نشط في التقارير`.
3. **Reconciliation**: This discrepancy is caused by the **Identity Split Pattern**. The file `Copy.xlsx` was archived/deleted by its registry `id` (UUID). However, the ingestion engine stamped its associated records with its `fileHash`. The active-source resolver matches records using a fallback chain that resolves the record's file association back to the file's hash. Because the files are matched by hash fallbacks at runtime, the Copy file's records are still included in reports, creating the visible active-state contradiction where a persisted-deleted file remains active in runtime reports.

## 2.3 The Identity Split Pattern

```
File Registry (uploads.json):
  entry.id = UUID or slug or SHA-256 (mixed formats)
  entry.fileHash = UUID or SHA-256 (mixed formats)
       │
       │ These are DIFFERENT values (except in legacy stubs)
       │
       ▼
Ingestion Engine stamps records with:
  record.fileId = file.fileHash (NOT file.id)
  record._sourceFile = file.fileHash (NOT file.id)
  journalEntry.sourceFileId = file.fileHash (NOT file.id)
       │
       ▼
Active-Source Resolver:
  getFileIdentifier(file) → returns file.id first (UUID)
  filterRecordsByActiveFiles() →
    builds activeFileIds set from getFileIdentifier (= file.id = UUID)
    matches against record.fileId (= file.fileHash)
    → fallback checks match record.fileId against file.fileHash
    → MISMATCH when matching strictly by ID, but fallback matches by hash
```

## 2.4 Resolver Function Analysis

**`getFileIdentifier`** (active-file-registry.ts):
- Resolution order: `file.id` → `file.fileHash` → `file.originalId`
- Returns the first truthy value — typically UUID for real files

**`filterRecordsByActiveFiles`** (active-file-registry.ts):
- File side: builds `activeFileIds` Set from `getFileIdentifier()` results (= file.id values)
- Record side: resolves `record.fileId || record.fileHash || record.sourceFileId || record._sourceFile`
- Match: `activeFileIds.has(recordFileId)`
- **Defect**: If `file.id` is a UUID and `record.fileId` is a hash, strict ID matching fails, but broad fallback logic allows matching against the hash, causing archived/deleted data to contribute to reports if the record-file link is not resolved cleanly.

---

# 3. Required Association Rules — Target State

The target design requires transitioning to a clean single-key association. 

> [!IMPORTANT]
> To prevent data corruption or display issues, a detailed **compatibility analysis** must be conducted before overwriting or retiring existing legacy association fields (`fileId`, `_sourceFile`, `sourceFileId`). This analysis will determine whether legacy fields must remain as read-only historical trace evidence, be dual-written temporarily, or can eventually be safely migrated and retired.

| System Component | Current Key | Target Key | Change Required |
| :--- | :--- | :--- | :---: |
| **File registry entry identification** | `id` (mixed formats) | `SourceFileId` (UUID only) | Normalize legacy entries (design only) |
| **Record `sourceFileId`** | `fileHash` value | `SourceFileId` (UUID) | **Target canonical field** |
| **Record `fileId` / `_sourceFile`** | `fileHash` value | Compatibility-dependent | Subject to compatibility analysis |
| **Journal entry `sourceFileId`** | `fileHash` value | `SourceFileId` (UUID) | **Target canonical field** |
| **Active-source resolver** (`getFileIdentifier`) | `id` first (UUID) | `SourceFileId` only | Simplify code (design only) |
| **Record-file matcher** (`filterRecordsByActiveFiles`) | Multi-field fallback chain | `SourceFileId` only | Simplify code (design only) |
| **Activation endpoint** (record stamping) | `staged.fileHash` | `newActiveFile.id` (SourceFileId) | Update backend logic (design only) |
| **Replacement endpoint** | Matches/stamps by hash | SourceFileId only | Update backend logic (design only) |
| **Delete endpoint** (record removal) | Matches ID or Hash | SourceFileId only | Update backend logic (design only) |
| **File listing** (record lookup) | `fileHash || id` | SourceFileId only | Update backend logic (design only) |
| **Governance request** (`fileId`) | SHA-256 hash | Preserve historical ref | Preserve original ref; add link |
| **Audit log** (`entityId`) | UUID | `SourceFileId` (same) | Already correct |
| **Staged candidate** (`fileHash`) | UUID or hash | Evidence field only | Clarify role (design only) |

---

# 4. Backward-Compatibility and Migration Principles

### 4.1 Mandatory Preservation

1. The accepted 358-record financial baseline must remain **exactly preserved** unless the user explicitly approves a different total.
2. All legitimate file entries, audit histories, governance requests, and version lineage must remain intact.
3. No migration step may cause legitimate active data to disappear from UI or reports.

### 4.2 Required Migration Safeguards

* **Pre-migration backup**: Complete backup of all persistent data stores.
* **Isolated simulation (AG-03)**: Demonstrate migration on copied data before production.
* **Rollback capability**: Restore to pre-migration state if unexpected results occur.
* **Reconciliation verification**: Record counts, financial totals, active file associations all correct.

### 4.3 Conceptual Implementation Scope

> [!WARNING]
> **No migration mapping or data modification is approved at this stage.** 
> Future migration scope must be narrowed to the minimum legitimate, report-relevant active data necessary for source-of-truth alignment. Archived, test, or staged files must not be broadly re-stamped or normalized in the same operation.

---

# 5. Capabilities Frozen and Preserved During Future Implementation

| # | Capability | Preservation Constraint |
| :---: | :--- | :--- |
| 1 | Dashboard financial KPIs | Must reflect same active-source data before and after |
| 2 | All financial report components | Calculation inputs must not change unless approved |
| 3 | File upload and staging path | Must continue generating UUID + hash correctly |
| 4 | Original file binary storage | Physical files on disk must not be moved or deleted |
| 5 | Categorization engine | Must operate on same record set |
| 6 | Export engines (PDF, Excel) | Must export same data as on-screen reports |
| 7 | Company/settings/auth | Completely unaffected |
| 8 | Existing audit log entries | All historical entries preserved |
| 9 | Governance request | Existing request preserved unchanged and unexecuted |
| 10 | Version lineage | Preserved as-is |

---

# 6. Explicit Non-Authorisation Statement

> [!CAUTION]
> This document defines a **target design** and **migration principles** only. It does **not** authorise any implementation, data modification, or state-changing action. Implementation requires AG-02, AG-03 simulation evidence, then separate user authorisation of AG-04.
