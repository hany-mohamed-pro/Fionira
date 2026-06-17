-- =============================================================================
-- DRAFT — NOT YET EXECUTED.
-- Created in Phase C1 for review. Execution requires explicit approval.
-- =============================================================================
-- Single, denormalized journal_entries table that mirrors the EXISTING runtime
-- JournalEntry shape 1:1 (see src/backend/core/erp-engine.ts:3-24 and the
-- immutable-versioning logic in server.ts:1111-1141). It preserves the _v{n}
-- append-only versioning (version / original_entry_id / is_active) and loses no
-- field currently produced or synced.
--
-- Conventions match the LIVE schema in src/backend/utils/db.ts (VARCHAR(128) ids,
-- VARCHAR(128) tenant_id, NUMERIC(15,4) money) — NOT the idealized UUID design in
-- phase3c_schema_draft.sql. Accounts/entities remain free-text here because no
-- chart-of-accounts or entity master exists yet (normalization is a future,
-- separately-approved Accounting-Bundle concern, not Phase C1).
--
-- This phase does NOT: execute this SQL, add it to runStartupMigration, modify
-- db.ts, or wire the table into any read/write path.
-- =============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    -- identity & tenancy
    id                       VARCHAR(128) PRIMARY KEY,          -- e.g. je_<uuid>, je_<uuid>_v2
    tenant_id                VARCHAR(128) NOT NULL,             -- Firebase-style tenant id (string)

    -- core posting (single-row double entry; accounts are free-text NAMES today)
    entry_date               DATE,                              -- JournalEntry.date (nullable in source)
    description              TEXT,
    debit_account            VARCHAR(255),                      -- free-text Arabic account name
    credit_account           VARCHAR(255),
    amount                   NUMERIC(15,4) NOT NULL DEFAULT 0,
    tax_amount               NUMERIC(15,4) NOT NULL DEFAULT 0,
    module_type              VARCHAR(50)  NOT NULL,             -- expenses|revenues|payroll|banks|inventory

    -- source linkage (string references; only source_file_id is an FK)
    source_file_id           VARCHAR(128),                      -- -> uploaded_files(id)
    source_record_id         VARCHAR(128),                      -- legacy sourceRecordId
    source_row_id            VARCHAR(128),                      -- sourceRowId
    original_invoice_number  VARCHAR(100),
    entity_id                VARCHAR(128),                      -- often 'UNKNOWN_ENTITY' (free text)
    entity_name              VARCHAR(255),                      -- free-text Arabic name
    entry_timestamp          VARCHAR(64),                       -- JournalEntry.timestamp (string, stored as-is)
    session_id               VARCHAR(128),                      -- present in synced data

    -- immutable versioning (append-only; edits add a new _v{n} row, deactivate old)
    version                  INTEGER NOT NULL DEFAULT 1,
    original_entry_id        VARCHAR(128),                      -- v1 id shared across a version chain
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    last_edited_by           VARCHAR(128),
    last_edited_at           TIMESTAMP WITH TIME ZONE,

    created_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Source file integrity. NOTE: some legacy entries may reference a file id absent
    -- from uploaded_files; Phase C2 backfill must migrate files first or NULL orphans
    -- before insert (see phase-c1 plan §1 "Orphan caveat").
    CONSTRAINT fk_journal_entries_source_file
        FOREIGN KEY (source_file_id) REFERENCES uploaded_files (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_je_tenant_active       ON journal_entries (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_je_tenant_source_file  ON journal_entries (tenant_id, source_file_id);
CREATE INDEX IF NOT EXISTS idx_je_tenant_module       ON journal_entries (tenant_id, module_type);
CREATE INDEX IF NOT EXISTS idx_je_original_entry      ON journal_entries (original_entry_id);

-- =============================================================================
-- END DRAFT — review required before any execution (Phase C2).
-- =============================================================================
