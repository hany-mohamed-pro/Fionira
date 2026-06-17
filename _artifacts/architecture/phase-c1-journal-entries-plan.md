# Phase C1 — `journal_entries` Postgres Schema Plan

> **Planning artifact only. No code wired, no SQL executed, no data migrated.**
> Accounting Bundle (dedup, double-entry enforcement, VAT posting) **remains blocked**
> pending review of this plan.
> **Generated:** 2026-06-16 · **Base commit:** `f2a60a4` · **Read-only audit + plan.**

---

## TASK 1 — Audit findings (evidence-based)

### A) Exact shape of a journal entry today
From the `JournalEntry` interface ([erp-engine.ts:3-24](../../src/backend/core/erp-engine.ts)) and the actual constructed objects ([erp-engine.ts:59-143](../../src/backend/core/erp-engine.ts)), plus fields added at edit/sync time:

| Field | Type (runtime) | Notes / evidence |
|---|---|---|
| `id` | string | `je_<uuid>`, versioned `…_v2` ([erp-engine.ts:44](../../src/backend/core/erp-engine.ts), [server.ts:1115](../../server.ts)) |
| `date` | string\|null | from `Invoice_Date` ([erp-engine.ts:61](../../src/backend/core/erp-engine.ts)) |
| `description` | string | Arabic ([erp-engine.ts:62](../../src/backend/core/erp-engine.ts)) |
| `debitAccount` | string | **free-text Arabic account NAME**, e.g. `مصروف راتب أساسي` ([erp-engine.ts:85](../../src/backend/core/erp-engine.ts)) |
| `creditAccount` | string | free-text Arabic name ([erp-engine.ts:101](../../src/backend/core/erp-engine.ts)) |
| `amount` | number | ([erp-engine.ts:45-51](../../src/backend/core/erp-engine.ts)) |
| `taxAmount` | number | from `VAT_Amount` ([erp-engine.ts:53](../../src/backend/core/erp-engine.ts)) |
| `moduleType` | enum string | `expenses\|revenues\|payroll\|banks\|inventory` ([erp-engine.ts:12](../../src/backend/core/erp-engine.ts)) |
| `tenantId` | string\|null | Firebase-style id e.g. `KWkguo4RS4ZmZQL4l5UMM6sC8DX2` ([server.ts:603](../../server.ts)) |
| `sourceRecordId` | string\|null | legacy ([erp-engine.ts:11,67](../../src/backend/core/erp-engine.ts)) |
| `fileId` | string\|null | legacy ([erp-engine.ts:14](../../src/backend/core/erp-engine.ts)) |
| `sourceFileId` | string\|null | links to a file ([erp-engine.ts:70](../../src/backend/core/erp-engine.ts)) |
| `sourceRowId` | string\|null | ([erp-engine.ts:69](../../src/backend/core/erp-engine.ts)) |
| `originalInvoiceNumber` | string\|null | ([erp-engine.ts:71](../../src/backend/core/erp-engine.ts)) |
| `timestamp` | string\|null | mirrors date ([erp-engine.ts:72](../../src/backend/core/erp-engine.ts)) |
| `entityId` | string\|null | often `UNKNOWN_ENTITY` ([erp-engine.ts:73](../../src/backend/core/erp-engine.ts)) |
| `entityName` | string\|null | free-text Arabic ([erp-engine.ts:74](../../src/backend/core/erp-engine.ts)) |
| `version` | number | starts at 1 ([erp-engine.ts:76](../../src/backend/core/erp-engine.ts)) |
| `originalEntryId` | string\|null | v1 id ([server.ts:1114](../../server.ts)) |
| `isActive` | boolean | ([erp-engine.ts:75](../../src/backend/core/erp-engine.ts)) |
| `lastEditedBy` | string | added on edit ([server.ts:1128](../../server.ts)) |
| `lastEditedAt` | ISO string | added on edit ([server.ts:1129](../../server.ts)) |
| `sessionId` | string | present in synced/persisted data (observed in `erp_registry.json` samples) |

**Critical:** accounts are **free-text strings**, not IDs. There is no chart-of-accounts and no entity master populated. Entries are **single-row** (one debit + one credit + one amount per row), not header+lines.

### B) Immutable-versioning pattern ([server.ts:1111-1141](../../server.ts))
```
const currentVersion = oldData.version || 1;
const newVersion = currentVersion + 1;
const originalEntryId = oldData.originalEntryId || id;
const newEntryId = `${originalEntryId}_v${newVersion}`;
// new row: { ...oldData, id:newEntryId, version:newVersion, isActive:true, originalEntryId }
devMemoryDb.journalEntries[entryIndex].isActive = false;   // deactivate old
devMemoryDb.journalEntries.push(newData);                  // append new version
```
Append-only: edits never mutate the prior row; they deactivate it (`isActive=false`) and append a new `_v{n}` row sharing `originalEntryId`. The "current" entry is the active row of a given `originalEntryId`.

### C) Does `phase3c_schema_draft.sql` match the actual shape? — **No, it diverges fundamentally.**
The draft ([docs/database/phase3c_schema_draft.sql:78-106](../../docs/database/phase3c_schema_draft.sql)) is a **normalized double-entry ideal**. Mismatches vs the actual data:

| # | Draft (`phase3c_schema_draft.sql`) | Actual current data | Impact |
|---|---|---|---|
| 1 | `journal_lines.account_id UUID → accounts(id)` | `debitAccount`/`creditAccount` are free-text Arabic strings; no `accounts` table populated | Draft needs a chart-of-accounts that doesn't exist |
| 2 | header + N lines (split sides) | **single row holds both debit & credit + amount** | Structural transform required to fit the draft |
| 3 | **no** `version`/`is_active`/`original_entry_id` | immutable `_v{n}` versioning is core | Draft cannot represent current ledger history |
| 4 | `entity_id UUID → entities(id)` | `entityName` free-text, `entityId` often `UNKNOWN_ENTITY` | Draft assumes a populated entity master |
| 5 | UUID PKs everywhere (`uuid_generate_v4()`) | string ids (`je_…_v2`), Firebase-string tenantIds | Type mismatch; ids aren't UUIDs |
| 6 | `tenant_id UUID → tenants(id)` | live `db.ts` uses `VARCHAR(128)` tenant_id, **no `tenants` table exists** | Draft doesn't even match the live `db.ts` schema |
| 7 | absent: `module_type, source_row_id, original_invoice_number, timestamp, session_id, last_edited_by/at` | all present | Data loss if forced into the draft |

**Conclusion:** the draft is an aspirational normalized target for a *future* accounting redesign — it is **not** a safe landing zone for the existing data, and it does not match the live `db.ts` conventions (VARCHAR(128) ids, no `tenants`/`accounts`/`entities` tables).

### D) Read/write paths today
**Writes** (all → `devMemoryDb` JSON; none → Postgres):
- `dev/sync` ingests entries from the frontend ([server.ts:602-605](../../server.ts))
- edit/version route ([server.ts:1100-1141](../../server.ts))
- delete-by-file routes ([server.ts:3277, 3299](../../server.ts))

**Reads** (all from `devMemoryDb` JSON):
- entity/file/module/invoice filters ([server.ts:1017, 1026, 1031, 1037, 1043](../../server.ts)), raw/debug ([server.ts:1170, 1184, 1197](../../server.ts))
- Frontend reads the Firestore `journalEntries` collection directly (per `data-plane-map.md`).

**Postgres involvement: zero.** `db.ts` has no `journal_entries` table; no `INSERT/SELECT … journal_entries` exists anywhere in `server.ts`.

### E) Cross-references to journalEntries
- `audit_logs` references the JE by id (`entityType:'journalEntry'`, `entityId: originalEntryId`) ([server.ts:1146-1149](../../server.ts)) — **loose string reference, no FK**.
- JE → `uploaded_files` via `sourceFileId`/`fileId` (string).
- JE → source records via `sourceRecordId`/`sourceRowId` (string).
- `rejected_records` is independent (validation rejects), no JE FK.
- No formal foreign keys exist today (JSON store).

---

## 1. Proposed Postgres schema — **SINGLE denormalized table** (recommended)

**Recommendation: a single `journal_entries` table that mirrors the existing object 1:1**, NOT the normalized header/lines design.

**Justification (from TASK 1 evidence, not assumption):**
- The live data is **single-row, denormalized** (one debit + one credit + amount per row, A1/C-#2). A normalized model would require **splitting every entry into lines, building a chart-of-accounts, and mapping free-text Arabic names → account_ids** — that is a *data transformation with accounting semantics*, explicitly **out of scope** for this phase ("no accounting logic, no posting rules").
- The **immutable `_v{n}` versioning** (B) needs `version`/`original_entry_id`/`is_active` columns, which fit cleanly only in a row-per-entry model. The normalized draft has no place for them (C-#3).
- The table must integrate with the **live `db.ts` schema** (VARCHAR(128) ids, no `tenants`/`accounts`/`entities` tables), not the idealized UUID draft (C-#5/#6).
- Goal of C1 is a **lossless relational mirror** of the ledger so a relational source of truth exists — normalization is a *future Accounting-Bundle* concern, not C1.

The concrete `CREATE TABLE` is in [docs/database/journal_entries_schema.sql](../../docs/database/journal_entries_schema.sql). Highlights: `id VARCHAR(128) PK`, `tenant_id VARCHAR(128) NOT NULL` (+index), `amount/tax_amount NUMERIC(15,4)`, free-text `debit_account/credit_account VARCHAR(255)`, full versioning columns, `source_file_id VARCHAR(128) REFERENCES uploaded_files(id)`, indexes on `(tenant_id,is_active)`, `(tenant_id,source_file_id)`, `(tenant_id,module_type)`, `(original_entry_id)`.

> **Orphan caveat:** some existing entries may carry a `sourceFileId` that has no row in `uploaded_files` (legacy/JSON). A strict FK will reject those on backfill. Mitigation in C2: migrate `uploaded_files` first, then NULL any still-orphaned `source_file_id` before insert (logged), or make the FK `NOT VALID`/deferrable initially. Flagged here so it's a conscious decision at cutover.

---

## 2. Migration strategy (2 options — 1 recommended)

> Neither is executed in C1. C1 only creates the (unwired) table. This is the C2 plan.

**Option A — Dual-write, then flip reads (RECOMMENDED).**
During transition, every JE write also writes to `journal_entries` (additive), while reads stay on the current store. Once a parity check confirms Postgres matches the JSON/Firestore ledger, flip reads to Postgres, then retire the old writers.
- **Risk: Medium.** Two writers must stay in sync; mitigated because the PG write is *additive* and nothing reads it until verified.
- **Rollback:** stop reading Postgres; the old store is untouched and authoritative. The table is isolated (no existing path depends on it), so rollback = revert the read flip. Lowest blast radius for a financial ledger.

**Option B — One-time backfill + hard cutover.**
Migrate all existing entries from `erp_registry.json`/Firestore into `journal_entries`, then switch all reads/writes to Postgres in one step.
- **Risk: High.** Single moment of truth-switch; any backfill gap or orphan FK = ledger discrepancy with no live fallback.
- **Rollback:** revert code to the old store; backfilled rows become stale — riskier reconciliation.

**Recommendation: Option A (dual-write).** For the core financial ledger, additive dual-write with a verifiable parity gate and trivial rollback is the responsible path.

---

## 3. What does NOT change in this phase (C1)
- ❌ No existing route behavior changes.
- ❌ No existing read/write path changes — JEs still flow through `devMemoryDb`/Firestore exactly as today.
- ❌ `db.ts` / `runStartupMigration` are **not** touched; the table is **not** auto-created.
- ✅ C1 only *authors* the `CREATE TABLE` (draft, unexecuted) + this plan. The table is not wired into any code path.

---

## 4. Files that WILL change in Phase C2 (cutover) — scope visible, NOT implemented now

| File | C2 change (future) |
|---|---|
| `src/backend/utils/db.ts` | add `journal_entries` to `initializeSchema()`; add backfill into `runStartupMigration()` |
| `server.ts` — `dev/sync` ([:602](../../server.ts)) | dual-write entries to Postgres |
| `server.ts` — edit/version ([:1100-1141](../../server.ts)) | write the new version row to Postgres |
| `server.ts` — delete routes ([:3277, 3299](../../server.ts)) | mirror deletes to Postgres |
| `server.ts` — read routes ([:1017-1043, 1170-1197](../../server.ts)) | flip reads to Postgres (after parity) |
| (new) `src/backend/core/journal-entries-repo.ts` | a thin DAO so routes don't inline SQL (recommended) |
| Frontend `src/lib/*` journalEntries Firestore access | eventual move to API (broader architecture, likely a later phase) |

---

## Status gate
- ✅ C1 deliverables: this plan + the unexecuted `CREATE TABLE` draft.
- 🔒 **Accounting Bundle stays blocked** until this plan is reviewed/approved.
- ⏭️ C2 (table creation + dual-write + backfill + read-flip) requires a **separate, explicitly approved** command. Nothing in C1 wires the table into the app.
