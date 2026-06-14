-- ==============================================================================
-- FIONIRA ERP: PHASE 3C POSTGRESQL SCHEMA DRAFT
-- ==============================================================================
-- Note: This is a draft schema designed for Phase 3C planning.
-- Do not execute this directly in production.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CORE IDENTITY & ISOLATION
-- ------------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_tenants (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'accountant', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tenant_id)
);

-- ------------------------------------------------------------------------------
-- 2. FILE/SOURCE TRACKING
-- ------------------------------------------------------------------------------
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(255),
    module_type VARCHAR(50),
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. MASTER DATA
-- ------------------------------------------------------------------------------
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    type VARCHAR(50) NOT NULL, -- 'vendor', 'customer'
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, name) -- Prevents duplication of vendor names per tenant
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    is_active BOOLEAN DEFAULT TRUE,
    -- Note: No vendor-specific AP accounts. AP is a single liability account.
    UNIQUE (tenant_id, code)
);

-- ------------------------------------------------------------------------------
-- 4. ACCOUNTING (DOUBLE-ENTRY)
-- ------------------------------------------------------------------------------
CREATE TABLE journal_headers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    external_invoice_number VARCHAR(255), -- Nullable/CASH/etc.
    internal_reference VARCHAR(255) UNIQUE, -- Auto-generated robust ID
    source_file_id UUID REFERENCES uploaded_files(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    header_id UUID NOT NULL REFERENCES journal_headers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    entity_id UUID REFERENCES entities(id), -- Maps line to specific Vendor (for unified AP)
    is_debit BOOLEAN NOT NULL,
    amount_raw NUMERIC(15,4) NOT NULL, -- Auditable exact JSON imported value
    amount_normalized NUMERIC(15,2) NOT NULL -- Clean posted value
);

CREATE TABLE tax_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    journal_line_id UUID NOT NULL REFERENCES journal_lines(id) ON DELETE CASCADE,
    imported_tax_amount NUMERIC(15,4), -- Metadata from JSON
    generated_tax_amount NUMERIC(15,2) -- Actual VAT line item calculated
);

CREATE TABLE rounding_differences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    header_id UUID NOT NULL REFERENCES journal_headers(id) ON DELETE CASCADE,
    difference_amount NUMERIC(15,4) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_review'
    -- Note: Will not auto-post adjustments. Requires explicit user approval/reconciliation.
);

-- ------------------------------------------------------------------------------
-- 5. OPERATIONAL DATA
-- ------------------------------------------------------------------------------
-- Generic table for imported records before they become financial postings
CREATE TABLE expense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    source_file_id UUID REFERENCES uploaded_files(id),
    raw_data JSONB NOT NULL,
    mapped_header_id UUID REFERENCES journal_headers(id)
);
-- (Similar tables would exist for revenue_records, payroll_records, bank_transactions)

-- ------------------------------------------------------------------------------
-- 6. MIGRATION STAGING
-- ------------------------------------------------------------------------------
CREATE TABLE staging_json_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    raw_json JSONB NOT NULL,
    migration_status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE staging_entity_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    raw_name VARCHAR(255) NOT NULL,
    mapped_entity_id UUID REFERENCES entities(id),
    status VARCHAR(50) DEFAULT 'needs_review'
    -- Accountant explicitly maps "danub" and "danube" to the same mapped_entity_id
);

CREATE TABLE staging_validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    staging_record_id UUID REFERENCES staging_json_records(id),
    status VARCHAR(50),
    error_details TEXT
);

-- ------------------------------------------------------------------------------
-- 7. AUDIT & REPORTING
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    report_type VARCHAR(100) NOT NULL,
    snapshot_date DATE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_jheaders_tenant_date ON journal_headers(tenant_id, date);
CREATE INDEX idx_jlines_tenant_account ON journal_lines(tenant_id, account_id);
CREATE INDEX idx_jlines_tenant_entity ON journal_lines(tenant_id, entity_id);

-- ------------------------------------------------------------------------------
-- 9. DOUBLE-ENTRY CONSTRAINT STRATEGY
-- ------------------------------------------------------------------------------
/*
RECOMMENDED APPROACH:
PostgreSQL constraints cannot natively aggregate across rows at INSERT time reliably
without deferred triggers. 
Strategy:
1. Application-Level Validation: The Node.js backend MUST validate SUM(debits) == SUM(credits) BEFORE executing the INSERT transaction.
2. DB-Level Guard: Create a DEFERRED CONSTRAINT TRIGGER that runs at the end of the transaction.
   Example (Conceptual):
   CREATE CONSTRAINT TRIGGER check_double_entry
   AFTER INSERT OR UPDATE OR DELETE ON journal_lines
   DEFERRABLE INITIALLY DEFERRED
   FOR EACH ROW EXECUTE FUNCTION validate_journal_header_balance();
*/

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) DRAFT
-- ------------------------------------------------------------------------------
/*
STRATEGY:
Defense-in-depth isolation utilizing `current_setting('app.current_tenant_id')`.
The backend will set this session variable immediately after verifying the JWT.

-- Step 1: Enable RLS on all business tables
ALTER TABLE journal_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Step 2: Create universal isolation policy
CREATE POLICY tenant_isolation_policy ON journal_headers
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    
-- Note: Full RLS implementation requires middleware design in Phase 3E to inject the session variable safely.
*/
