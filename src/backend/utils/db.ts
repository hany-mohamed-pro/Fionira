import pg from 'pg';

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'rapid_s1',
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 10000,
  max: 10
};

let pool: any = null;
let dbConnected = false;

export function isConnected(): boolean {
  return dbConnected;
}

export async function connectDb(): Promise<boolean> {
  console.log("🐘 [DATABASE] Attempting connection to PostgreSQL...");
  try {
    pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    client.release();
    
    dbConnected = true;
    console.log("✅ [DATABASE] PostgreSQL connection established successfully.");
    
    // Create schemas if they do not exist
    await initializeSchema();
    return true;
  } catch (err: any) {
    dbConnected = false;
    pool = null;
    console.warn(`⚠️ [DATABASE] PostgreSQL connection failed (Error: ${err.message}).`);
    console.warn("⚠️ [DATABASE] Falling back to volatile local JSON database.");
    return false;
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  if (!dbConnected || !pool) {
    throw new Error("Database not connected. Falling back to local file operations.");
  }
  return pool.query(text, params);
}

export async function transaction(callback: (client: any) => Promise<any>): Promise<any> {
  if (!dbConnected || !pool) {
    throw new Error("Database not connected. Transactions not available.");
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function initializeSchema() {
  if (!pool) return;
  console.log("⚙️ [DATABASE] Initializing schemas if not present...");
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_users (
      id VARCHAR(128) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      name VARCHAR(255),
      tenant_id VARCHAR(128) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id VARCHAR(128) PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      original_file_name VARCHAR(255) NOT NULL,
      file_hash VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(128) NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      storage_path VARCHAR(512),
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP WITH TIME ZONE,
      meta_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS records (
      id VARCHAR(128) PRIMARY KEY,
      tenant_id VARCHAR(128) NOT NULL,
      file_id VARCHAR(128) NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      invoice_number VARCHAR(100),
      invoice_date DATE,
      entity_name VARCHAR(255),
      total_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
      vat_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
      taxable_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
      nontaxable_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
      net_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
      category VARCHAR(255),
      raw_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rejected_records (
      id VARCHAR(128) PRIMARY KEY,
      tenant_id VARCHAR(128) NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      errors TEXT[] NOT NULL,
      severity VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      created_by VARCHAR(128) NOT NULL,
      record JSONB NOT NULL,
      proposed_fix JSONB,
      approvals JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(128) PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      user_id VARCHAR(128),
      user_name VARCHAR(255),
      module_type VARCHAR(50),
      record_id VARCHAR(128),
      previous_hash CHAR(64) NOT NULL,
      current_hash CHAR(64) NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      tenant_id VARCHAR(128),
      meta_data JSONB
    );
  `);
  console.log("⚙️ [DATABASE] Schemas checked and verified.");
}

export async function runStartupMigration(memoryDb: any) {
  if (!dbConnected || !pool) return;
  console.log("🚛 [DATABASE] Checking if startup data migration is required...");
  try {
    // 1. Check if uploaded_files is empty
    const filesCountRes = await pool.query("SELECT COUNT(*) FROM uploaded_files");
    const filesCount = parseInt(filesCountRes.rows[0].count);
    if (filesCount === 0 && memoryDb.uploadedFiles && memoryDb.uploadedFiles.length > 0) {
      console.log(`🚛 [DATABASE] Migrating ${memoryDb.uploadedFiles.length} files from uploads.json...`);
      for (const f of memoryDb.uploadedFiles) {
        await pool.query(`
          INSERT INTO uploaded_files (id, file_name, original_file_name, file_hash, tenant_id, module_type, status, storage_path, is_deleted, deleted_at, meta_data, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [
          f.id,
          f.fileName || 'unknown',
          f.originalFileName || f.fileName || 'unknown',
          f.fileHash || f.id || 'unknown',
          f.tenantId || 'test-user',
          f.moduleType || f.fileType || 'expenses',
          f.status || 'processed',
          f.storagePath || null,
          f.isDeleted || false,
          f.deletedAt || null,
          JSON.stringify({
            displayName: f.displayName,
            processedFileName: f.processedFileName,
            periodYear: f.periodYear,
            recordCount: f.recordCount,
            skippedRowCount: f.skippedRowCount,
            uploadedBy: f.uploadedBy,
            uploadDate: f.uploadDate,
            processed: f.processed,
            processingVersion: f.processingVersion,
            sessionId: f.sessionId
          }),
          f.createdAt || f.uploadDate || new Date().toISOString()
        ]);
      }
    }

    // 2. Check if records is empty
    const recordsCountRes = await pool.query("SELECT COUNT(*) FROM records");
    const recordsCount = parseInt(recordsCountRes.rows[0].count);
    if (recordsCount === 0 && memoryDb.records && memoryDb.records.length > 0) {
      console.log(`🚛 [DATABASE] Migrating ${memoryDb.records.length} records from erp_registry.json...`);
      for (const r of memoryDb.records) {
        const netAmt = r.Net_Amount || r.net_amount || 0;
        const vatAmt = r.VAT_Amount || r.vat_amount || 0;
        const totalAmt = r.Total_Amount || r.total_amount || 0;
        const taxAmt = r.Taxable_Amount || r.taxable_amount || 0;
        const nontaxAmt = r.Nontaxable_Amount || r.nontaxable_amount || 0;

        await pool.query(`
          INSERT INTO records (id, tenant_id, file_id, module_type, invoice_number, invoice_date, entity_name, total_amount, vat_amount, taxable_amount, nontaxable_amount, net_amount, category, raw_data, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO NOTHING
        `, [
          r.id || crypto.randomUUID(),
          r.tenantId || 'test-user',
          r.fileId || r.fileHash || 'unknown',
          r.moduleType || 'expenses',
          r.Invoice_Number || r.invoice_number || null,
          r.Invoice_Date || r.invoice_date || null,
          r.Entity_Name || r.Vendor_Name || r.entity_name || null,
          totalAmt,
          vatAmt,
          taxAmt,
          nontaxAmt,
          netAmt,
          r.Category || r.category || null,
          JSON.stringify(r),
          r.created_at || r.createdAt || new Date().toISOString()
        ]);
      }
    }

    // 3. Check if rejected_records is empty
    const rejectedCountRes = await pool.query("SELECT COUNT(*) FROM rejected_records");
    const rejectedCount = parseInt(rejectedCountRes.rows[0].count);
    if (rejectedCount === 0 && memoryDb.rejectedRecords && memoryDb.rejectedRecords.length > 0) {
      console.log(`🚛 [DATABASE] Migrating ${memoryDb.rejectedRecords.length} rejected records...`);
      for (const rr of memoryDb.rejectedRecords) {
        await pool.query(`
          INSERT INTO rejected_records (id, tenant_id, module_type, errors, severity, status, created_by, record, proposed_fix, approvals, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          rr.id,
          rr.tenantId,
          rr.moduleType || 'expenses',
          rr.errors || [],
          rr.severity || 'LOW',
          rr.status || 'PENDING',
          rr.createdBy || 'system',
          JSON.stringify(rr.record || {}),
          rr.proposedFix ? JSON.stringify(rr.proposedFix) : null,
          rr.approvals ? JSON.stringify(rr.approvals) : '[]',
          rr.createdAt || rr.timestamp || new Date().toISOString()
        ]);
      }
    }

    // 4. Check if audit_logs is empty
    const auditCountRes = await pool.query("SELECT COUNT(*) FROM audit_logs");
    const auditCount = parseInt(auditCountRes.rows[0].count);
    if (auditCount === 0 && memoryDb.auditLogs && memoryDb.auditLogs.length > 0) {
      console.log(`🚛 [DATABASE] Migrating ${memoryDb.auditLogs.length} audit logs...`);
      for (const al of memoryDb.auditLogs) {
        await pool.query(`
          INSERT INTO audit_logs (id, action, details, user_id, user_name, module_type, record_id, previous_hash, current_hash, timestamp, tenant_id, meta_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [
          al.id || crypto.randomUUID(),
          al.action || 'UNKNOWN',
          al.details || null,
          al.userId || al.performedBy || null,
          al.userName || al.performedByName || null,
          al.moduleType || null,
          al.recordId || null,
          al.previousHash || '0000000000000000000000000000000000000000000000000000000000000000',
          al.currentHash || '0000000000000000000000000000000000000000000000000000000000000000',
          al.timestamp || al.performedAt || new Date().toISOString(),
          al.tenantId || null,
          JSON.stringify({
            before: al.before,
            after: al.after,
            changeSet: al.changeSet,
            entityType: al.entityType,
            entityId: al.entityId,
            source: al.source
          })
        ]);
      }
    }
    console.log("✅ [DATABASE] Startup data migration checked/completed.");
  } catch (err: any) {
    console.error(`❌ [DATABASE] Startup data migration failed: ${err.message}`);
  }
}

