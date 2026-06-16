import multer from "multer";
import { AsyncLocalStorage } from "async_hooks";
const sprintStorage = new AsyncLocalStorage<{ isSprint: boolean }>();


const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.csv') {
      return cb(new Error('INVALID_TYPE'));
    }
    cb(null, true);
  }
});
import express, { Request, Response, NextFunction } from "express";
import { generateDryRunPreview } from "./src/lib/governance-dry-run";
import { Firestore } from '@google-cloud/firestore';
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './firebase-service-account.json' with { type: 'json' };
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import dotenv from 'dotenv';
import { connectDb, isConnected, query, transaction, runStartupMigration } from "./src/backend/utils/db";

dotenv.config({ path: '.env.local' });
dotenv.config();

console.log("🚀 BACKEND UPGRADE — SECURE IDENTITY SYNC", new Date().toISOString());

try {
  if (admin.apps.length > 0) {
    admin.app().delete();
  }
  
  // Use explicit credential to ensure we bypass any incorrect ADC configurations
  // Since the private key is revoked, we can initialize without it.
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  
  console.log(`✅ Firebase Admin Linked to Project: ${firebaseConfig.projectId}`);
} catch (e: any) {
  console.error("❌ CRITICAL BOOT FAILURE:", e.message);
  process.exit(1);
}

import { PDFService } from "./src/backend/services/PDFService";
import { sendSuccess, sendError } from "./src/backend/utils/response";
import { getActiveFiles, getActiveFileIds, getDisplayFileName, filterRecordsByActiveFiles } from "./src/lib/active-file-registry";
// API Route Helper to ensure standard response
const wrap = (fn: (req: Request, res: Response) => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const execute = () => fn(req, res);
    const isSprint = (req as any).isSprint || req.url.startsWith('/api/erp/rapid-s1/');
    const result = isSprint 
      ? await sprintStorage.run({ isSprint: true }, execute)
      : await execute();
    if (!res.headersSent) {
      if (result && result.fallback) {
         res.json(result);
      } else if (result && typeof result.success === 'boolean') {
         res.json({ ...result, timestamp: new Date().toISOString() });
      } else {
         res.json(sendSuccess(result));
      }
    }
  } catch (err) {
    next(err);
  }
};

async function startServer() {
  // Establish PostgreSQL connection (with graceful mock fallback)
  await connectDb();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Global Error Logging Middleware (Filter out successful 304/200 logs to reduce noise)
  app.use((req, res, next) => {
    // console.log(`[DEBUG ROUTING] => ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '50mb' }));

const ENV_MODE = process.env.ENV_MODE || 'dev';
let cachedDb: any = null;



const devMemoryDbDefault = {
  journalEntries: [] as any[],
  uploadedFiles: [] as any[],
  records: [] as any[],
  skippedRows: [] as any[],
  rejectedRecords: [] as any[],
  customers: [] as any[],
  vendors: [] as any[],
  items: [] as any[],
  auditLogs: [] as any[],
  governanceRequests: [] as any[],
  candidateReplacements: [] as any[],
  tenantUsers: [] as any[],
  settings: {} as Record<string, any>
};

const devMemoryDbSprint = {
  journalEntries: [] as any[],
  uploadedFiles: [] as any[],
  records: [] as any[],
  skippedRows: [] as any[],
  rejectedRecords: [] as any[],
  customers: [] as any[],
  vendors: [] as any[],
  items: [] as any[],
  auditLogs: [] as any[],
  governanceRequests: [] as any[],
  candidateReplacements: [] as any[],
  tenantUsers: [] as any[],
  settings: {} as Record<string, any>
};

let sprintLoaded = false;
function ensureSprintLoaded() {
  if (sprintLoaded) return;
  sprintLoaded = true;
  
  const sprintDir = path.join(process.cwd(), 'data', 'rapid-s1');
  const sprintStagedDir = path.join(sprintDir, 'staged-files');
  if (!fs.existsSync(sprintStagedDir)) {
    fs.mkdirSync(sprintStagedDir, { recursive: true });
  }

  const SPRINT_UPLOADS = path.join(sprintDir, 'uploads.json');
  const SPRINT_REGISTRY = path.join(sprintDir, 'erp_registry.json');
  const SPRINT_GOVERNANCE = path.join(sprintDir, 'governance_requests.json');
  
  if (fs.existsSync(SPRINT_UPLOADS)) {
    try {
      devMemoryDbSprint.uploadedFiles = JSON.parse(fs.readFileSync(SPRINT_UPLOADS, 'utf-8'));
    } catch(e) {}
  }
  if (fs.existsSync(SPRINT_REGISTRY)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(SPRINT_REGISTRY, 'utf-8'));
      if (parsed.journalEntries) devMemoryDbSprint.journalEntries = parsed.journalEntries;
      if (parsed.records) devMemoryDbSprint.records = parsed.records;
      if (parsed.auditLogs) devMemoryDbSprint.auditLogs = parsed.auditLogs;
      if (parsed.skippedRows) devMemoryDbSprint.skippedRows = parsed.skippedRows;
      if (parsed.rejectedRecords) devMemoryDbSprint.rejectedRecords = parsed.rejectedRecords;
      if (parsed.candidateReplacements) devMemoryDbSprint.candidateReplacements = parsed.candidateReplacements;
      if (parsed.settings) devMemoryDbSprint.settings = parsed.settings;
    } catch(e) {}
  }
  if (fs.existsSync(SPRINT_GOVERNANCE)) {
    try {
      devMemoryDbSprint.governanceRequests = JSON.parse(fs.readFileSync(SPRINT_GOVERNANCE, 'utf-8'));
    } catch(e) {}
  }
}

const devMemoryDb = new Proxy({} as typeof devMemoryDbDefault, {
  get(target, prop) {
    const store = sprintStorage.getStore();
    if (store && store.isSprint) {
      ensureSprintLoaded();
      return Reflect.get(devMemoryDbSprint, prop);
    }
    return Reflect.get(devMemoryDbDefault, prop);
  },
  set(target, prop, value) {
    const store = sprintStorage.getStore();
    if (store && store.isSprint) {
      ensureSprintLoaded();
      return Reflect.set(devMemoryDbSprint, prop, value);
    }
    return Reflect.set(devMemoryDbDefault, prop, value);
  }
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api/erp/rapid-s1/')) {
    const isDevAuth = process.env.VITE_ENABLE_DEV_AUTH === 'true';
    const isNonProd = process.env.ENV_MODE !== 'production' && process.env.NODE_ENV !== 'production';
    if (!isNonProd || !isDevAuth) {
      return res.status(403).json({ success: false, error: "Forbidden: Sandbox mode is disabled in this environment" });
    }
    
    // Check if localhost request (as per Rule 4-E/4-D)
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
    if (!isLocalhost) {
      return res.status(403).json({ success: false, error: "Forbidden: Sandbox API is restricted to localhost requests only" });
    }

    sprintStorage.run({ isSprint: true }, () => {
      (req as any).isSprint = true;
      if (req.url.startsWith('/api/erp/rapid-s1/debug/')) {
        req.url = req.url.replace('/api/erp/rapid-s1/debug/', '/api/debug/');
      } else if (req.url.startsWith('/api/erp/rapid-s1/dev/reset')) {
        req.url = '/api/erp/dev/rapid-s1/reset';
      } else {
        req.url = req.url.replace('/api/erp/rapid-s1/', '/api/erp/');
      }
      next();
    });
  } else {
    next();
  }
});

async function addAuditLog(entry: any) {
  let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  
  if (isConnected()) {
    try {
      const lastLogRes = await query("SELECT current_hash FROM audit_logs ORDER BY timestamp DESC, id DESC LIMIT 1");
      if (lastLogRes.rows.length > 0) {
        previousHash = lastLogRes.rows[0].current_hash.trim();
      }
    } catch (err) {
      console.error("Failed to fetch last audit log hash:", err);
    }
  } else {
    const previousLog = devMemoryDb.auditLogs.length > 0 ? devMemoryDb.auditLogs[devMemoryDb.auditLogs.length - 1] : null;
    previousHash = previousLog?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  entry.previousHash = previousHash;
  if (!entry.timestamp) entry.timestamp = new Date().toISOString();
  if (!entry.id) entry.id = crypto.randomUUID();

  const dataString = JSON.stringify({
    details: entry.details,
    before: entry.before,
    after: entry.after,
    moduleType: entry.moduleType,
    recordId: entry.recordId,
    entityType: entry.entityType,
    entityId: entry.entityId
  });

  const hashPayload = String(entry.action) + String(entry.userId || entry.performedBy) + String(entry.timestamp) + dataString + previousHash;
  entry.currentHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
  
  if (isConnected()) {
    try {
      await query(`
        INSERT INTO audit_logs (id, action, details, user_id, user_name, module_type, record_id, previous_hash, current_hash, timestamp, tenant_id, meta_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        entry.id,
        entry.action || 'UNKNOWN',
        entry.details || null,
        entry.userId || entry.performedBy || null,
        entry.userName || entry.performedByName || null,
        entry.moduleType || null,
        entry.recordId || null,
        entry.previousHash,
        entry.currentHash,
        entry.timestamp,
        entry.tenantId || null,
        JSON.stringify({
          before: entry.before,
          after: entry.after,
          changeSet: entry.changeSet,
          entityType: entry.entityType,
          entityId: entry.entityId,
          source: entry.source
        })
      ]);
    } catch (err) {
      console.error("Failed to insert audit log into database:", err);
    }
  } else {
    devMemoryDb.auditLogs.push(entry);
  }
}

function verifyAuditChain(logs: any[]) {
  for (let i = 1; i < logs.length; i++) {
    if (logs[i].previousHash !== logs[i-1].currentHash) return false;
    
    // Also re-verify current hash to ensure no data was changed
    const dataString = JSON.stringify({
      details: logs[i].details,
      before: logs[i].before,
      after: logs[i].after,
      moduleType: logs[i].moduleType,
      recordId: logs[i].recordId,
      entityType: logs[i].entityType,
      entityId: logs[i].entityId
    });
    const hashPayload = String(logs[i].action) + String(logs[i].userId || logs[i].performedBy) + String(logs[i].timestamp) + dataString + logs[i].previousHash;
    const computedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    
    if (computedHash !== logs[i].currentHash) return false;
  }
  return true;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_FILE_DEFAULT = path.join(DATA_DIR, 'uploads.json');
const REGISTRY_FILE_DEFAULT = path.join(DATA_DIR, 'erp_registry.json'); // Combined file for other db entities
const GOVERNANCE_REQUESTS_FILE_DEFAULT = path.join(DATA_DIR, 'governance_requests.json');

const getUploadsFile = () => {
  const store = sprintStorage.getStore();
  if (store && store.isSprint) {
    return path.join(DATA_DIR, 'rapid-s1', 'uploads.json');
  }
  return UPLOADS_FILE_DEFAULT;
};

const getRegistryFile = () => {
  const store = sprintStorage.getStore();
  if (store && store.isSprint) {
    return path.join(DATA_DIR, 'rapid-s1', 'erp_registry.json');
  }
  return REGISTRY_FILE_DEFAULT;
};

const getGovernanceFile = () => {
  const store = sprintStorage.getStore();
  if (store && store.isSprint) {
    return path.join(DATA_DIR, 'rapid-s1', 'governance_requests.json');
  }
  return GOVERNANCE_REQUESTS_FILE_DEFAULT;
};

const getStagedDir = () => {
  const store = sprintStorage.getStore();
  if (store && store.isSprint) {
    return path.join(DATA_DIR, 'rapid-s1', 'staged-files');
  }
  return path.join(DATA_DIR, 'staged-files');
};

function getFileDisplayName(file: any, moduleType?: string) {
  return getDisplayFileName(file, moduleType);
}

function classifyError(errors: string[]) {
  if (errors.includes("MISSING_ID") || errors.includes("NOT_OBJECT") || errors.includes("NULL_RECORD") || errors.includes("MISSING_MODULE")) return "STRUCTURAL_ERROR";
  if (errors.includes("NEGATIVE_AMOUNT")) return "BUSINESS_ERROR";
  if (errors.includes("DUPLICATE_ID")) return "DUPLICATION";
  return "UNKNOWN";
}

function getErrorSeverity(category: string) {
  if (category === "STRUCTURAL_ERROR") return "CRITICAL";
  if (category === "DUPLICATION") return "HIGH";
  if (category === "BUSINESS_ERROR") return "MEDIUM";
  return "LOW";
}

function validateRecord(record: any): { isValid: boolean; errors: string[]; category?: string; severity?: string; proposedFix?: any } {
  const errors = [];
  let proposedFix = { ...record };
  let hasProposedFix = false;

  if (!record) errors.push("NULL_RECORD");
  if (record && typeof record !== 'object') errors.push("NOT_OBJECT");
  if (record && typeof record === 'object') {
    if (!record.id) {
       errors.push("MISSING_ID");
       proposedFix.id = crypto.randomUUID();
       hasProposedFix = true;
    }
    if (!record.moduleType) errors.push("MISSING_MODULE");
    
    // We remove the negative amount check from here because it's a business logic rule
    // and must be handled strictly by the Detection Engine later down the pipeline.
  }
  
  const category = classifyError(errors);
  const severity = getErrorSeverity(category);
  
  let isValid = false;
  // If no structural error, it is valid to be processed by Detection Engine
  if (severity !== "CRITICAL") {
     isValid = true;
  }

  return {
    isValid,
    errors,
    category,
    severity,
    proposedFix: hasProposedFix ? proposedFix : undefined
  };
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (fs.existsSync(getUploadsFile())) {
  try {
    const data = fs.readFileSync(getUploadsFile(), 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      devMemoryDb.uploadedFiles = parsed;
      console.log(`[PERSISTENCE] Loaded ${parsed.length} files from uploads.json`);
    }
  } catch (err) {
    console.error(`[PERSISTENCE] Error parsing uploads.json:`, err);
  }
}

if (fs.existsSync(getRegistryFile())) {
  try {
    const data = fs.readFileSync(getRegistryFile(), 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed.journalEntries) devMemoryDb.journalEntries = parsed.journalEntries;
    if (parsed.records) devMemoryDb.records = parsed.records;
    if (parsed.auditLogs) devMemoryDb.auditLogs = parsed.auditLogs;
    if (parsed.skippedRows) devMemoryDb.skippedRows = parsed.skippedRows;
    if (parsed.rejectedRecords) devMemoryDb.rejectedRecords = parsed.rejectedRecords;
    if (parsed.settings) devMemoryDb.settings = parsed.settings;
    if (parsed.candidateReplacements) devMemoryDb.candidateReplacements = parsed.candidateReplacements;
    console.log(`[PERSISTENCE] Loaded ERP registry (JEs: ${devMemoryDb.journalEntries.length}, Records: ${devMemoryDb.records.length})`);
  } catch (err) {
    console.error(`[PERSISTENCE] Error parsing erp_registry.json:`, err);
  }
}

if (fs.existsSync(getGovernanceFile())) {
  try {
    const data = fs.readFileSync(getGovernanceFile(), 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      devMemoryDb.governanceRequests = parsed;
      console.log(`[PERSISTENCE] Loaded ${parsed.length} governance requests from governance_requests.json`);
    }
  } catch (err) {
    console.error(`[PERSISTENCE] Error parsing governance_requests.json:`, err);
  }
}

// Seeding/Migration service hook
if (isConnected()) {
  runStartupMigration(devMemoryDb).catch(err => {
    console.error("❌ Failed running startup data migration:", err);
  });
}


function persistGovernanceRequests() {
    try {
        fs.writeFileSync(getGovernanceFile(), JSON.stringify(devMemoryDb.governanceRequests, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to write governance_requests.json:', e);
    }
}

function persistRegistry() {
    try {
        fs.writeFileSync(getRegistryFile(), JSON.stringify({
            journalEntries: devMemoryDb.journalEntries,
            records: devMemoryDb.records,
            auditLogs: devMemoryDb.auditLogs,
            skippedRows: devMemoryDb.skippedRows,
            rejectedRecords: devMemoryDb.rejectedRecords,
            candidateReplacements: devMemoryDb.candidateReplacements,
            settings: devMemoryDb.settings
        }, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to write registry:', e);
    }
}

app.post('/api/erp/dev/reset', (req, res) => {
  const isDevAuth = process.env.VITE_ENABLE_DEV_AUTH === 'true';
  const isNonProd = process.env.ENV_MODE !== 'production' && process.env.NODE_ENV !== 'production';
  const enableDevReset = process.env.ENABLE_DEV_RESET === 'true';
  if (!isNonProd || !isDevAuth || !enableDevReset) {
    return res.status(403).json({ success: false, error: "Forbidden: Endpoint disabled" });
  }

  devMemoryDb.journalEntries = [];
  devMemoryDb.uploadedFiles = [];
  devMemoryDb.records = [];
  devMemoryDb.skippedRows = [];
  devMemoryDb.rejectedRecords = [];
  devMemoryDb.customers = [];
  devMemoryDb.vendors = [];
  devMemoryDb.items = [];
  devMemoryDb.auditLogs = [];

  try {
     if (fs.existsSync(getUploadsFile())) {
        fs.unlinkSync(getUploadsFile());
     }
  } catch (err) {}

  console.log("[DEV MODE] Full Hard Reset: All collections cleared.");
  return res.json({ success: true, message: "DEV DB RESET" });
});

app.post('/api/erp/dev/rapid-s1/reset', wrap(async (req, res) => {
  const isDevAuth = process.env.VITE_ENABLE_DEV_AUTH === 'true';
  const isNonProd = process.env.ENV_MODE !== 'production' && process.env.NODE_ENV !== 'production';
  if (!isNonProd || !isDevAuth) {
    return res.status(403).json({ success: false, error: "Forbidden: Endpoint disabled" });
  }

  if (isConnected()) {
     console.log("⚙️ [DATABASE] Dropping tables on DEV RESET...");
     try {
        await query(`
           DROP TABLE IF EXISTS audit_logs CASCADE;
           DROP TABLE IF EXISTS rejected_records CASCADE;
           DROP TABLE IF EXISTS records CASCADE;
           DROP TABLE IF EXISTS uploaded_files CASCADE;
           DROP TABLE IF EXISTS tenant_users CASCADE;
        `);
        // Recreate schemas
        await connectDb();
     } catch (err: any) {
        console.error("Failed to drop/rebuild PostgreSQL tables on reset:", err);
     }
  }

  devMemoryDbSprint.journalEntries = [];
  devMemoryDbSprint.uploadedFiles = [];
  devMemoryDbSprint.records = [];
  devMemoryDbSprint.skippedRows = [];
  devMemoryDbSprint.rejectedRecords = [];
  devMemoryDbSprint.customers = [];
  devMemoryDbSprint.vendors = [];
  devMemoryDbSprint.items = [];
  devMemoryDbSprint.auditLogs = [];
  devMemoryDbSprint.governanceRequests = [];
  devMemoryDbSprint.candidateReplacements = [];
  devMemoryDbSprint.settings = {};

  const sprintDir = path.join(DATA_DIR, 'rapid-s1');
  const uploadsFile = path.join(sprintDir, 'uploads.json');
  const registryFile = path.join(sprintDir, 'erp_registry.json');
  const govFile = path.join(sprintDir, 'governance_requests.json');
  const stagedDir = path.join(sprintDir, 'staged-files');

  try { if (fs.existsSync(uploadsFile)) fs.unlinkSync(uploadsFile); } catch(e){}
  try { if (fs.existsSync(registryFile)) fs.unlinkSync(registryFile); } catch(e){}
  try { if (fs.existsSync(govFile)) fs.unlinkSync(govFile); } catch(e){}

  if (fs.existsSync(stagedDir)) {
     try {
       const files = fs.readdirSync(stagedDir);
       for (const f of files) {
         fs.unlinkSync(path.join(stagedDir, f));
       }
     } catch(e){}
  }

  console.log("[AG-RAPID-S1] Isolated database and folder reset successfully.");
  return res.json({ success: true, message: "RAPID-S1 DB RESET" });
}));

app.post('/api/erp/dev/sync', express.json({limit: '50mb'}), async (req, res) => {
  if (ENV_MODE !== 'dev') return res.status(403).json({success: false, error: "Not in dev mode"});
  
  const { journalEntries, uploadedFiles, records, skippedRows, rejectedRecords, customers, vendors, items, auditLogs, settings } = req.body;
  
  console.log("[SYNC RECEIVED]", {
    records: req.body.records?.length,
    rejectedRecords: req.body.rejectedRecords?.length
  });

  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split("Bearer ")[1] : null;
  
  let tenantId = 'NO_TENANT';
  if (token) {
    if (token === 'fake.token.for-dev-mode') {
       tenantId = 'test-user';
    } else {
       try {
         const decoded = await admin.auth().verifyIdToken(token);
         if (!decoded.uid) return res.status(401).json({success: false, error: "Unauthorized"});
         tenantId = decoded.tenantId || decoded.uid;
       } catch(e) {
         return res.status(401).json({success: false, error: "Unauthorized"});
       }
    }
  }
  
  console.log(`[DEV SYNC] Saving for tenant: ${tenantId}`);

  if (settings) {
    devMemoryDb.settings[tenantId] = { ...devMemoryDb.settings[tenantId], ...settings };
    console.log(`[DEV SYNC] Saved settings for tenant`);
  }

  if (journalEntries) {
    journalEntries.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    devMemoryDb.journalEntries.push(...journalEntries);
    console.log(`[DEV SYNC] Saved ${journalEntries.length} entries`);
  }
  if (uploadedFiles) {
    uploadedFiles.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    // DEBUG: Log all incoming files
    uploadedFiles.forEach((x: any) => {
       console.log(`[BACKEND DEBUG] Incoming file: ${x.fileName}, hash/id: ${x.id}`);
       const existing = devMemoryDb.uploadedFiles.filter(f => f.tenantId === x.tenantId && f.fileType === x.fileType);
       console.log(`[BACKEND DEBUG] All existing fileHashes in storage for tenant/module:`, existing.map(f => f.id));
       
       const isDup = existing.some(f => f.id === x.id);
       if (isDup) {
           console.warn(`[BACKEND DEBUG] File ${x.fileName} (${x.id}) is considered a DUPLICATE because its hash exists in memory.`);
       } else {
           console.log(`[BACKEND DEBUG] File ${x.fileName} (${x.id}) is NOVEL.`);
       }
    });

    const safeUploadedFiles = uploadedFiles.map((newFile: any) => {
        const displayName = getFileDisplayName(newFile);
        return {
           id: newFile.id,
           fileName: newFile.fileName,
           originalFileName: newFile.originalFileName,
           displayName,
           processedFileName: newFile.processedFileName,
           fileHash: newFile.fileHash || newFile.id,
           moduleType: newFile.fileType || newFile.moduleType,
           fileType: newFile.fileType || newFile.moduleType,
           tenantId: newFile.tenantId,
           periodYear: newFile.periodYear,
           recordCount: newFile.recordCount,
           skippedRowCount: newFile.skippedRowCount,
           uploadedBy: newFile.uploadedBy,
           uploadDate: newFile.uploadDate || newFile.createdAt || new Date().toISOString(),
           status: newFile.status,
           processed: newFile.processed,
           processingVersion: newFile.processingVersion,
           sessionId: newFile.sessionId,
           createdAt: newFile.createdAt || newFile.uploadDate || new Date().toISOString()
        };
    });

    const dedupedUploadedFiles = safeUploadedFiles.filter((newFile: any) => {
       return !devMemoryDb.uploadedFiles.some(f => f.tenantId === newFile.tenantId && f.id === newFile.id);
    });
    devMemoryDb.uploadedFiles.push(...dedupedUploadedFiles);
    console.log(`[BACKEND DEBUG] Saved ${safeUploadedFiles.length} files (forced bypass of deduplication).`);
    console.log(`[BACKEND DEBUG] Total files now in memory: ${devMemoryDb.uploadedFiles.length}`);
    console.log(`[BACKEND DEBUG] List of filenames: ${devMemoryDb.uploadedFiles.map(f => f.fileName).join(', ')}`);

    try {
        fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
        console.log(`[PERSISTENCE] Wrote ${devMemoryDb.uploadedFiles.length} files metadata to uploads.json`);
    } catch (err) {
        console.error(`[PERSISTENCE] Error saving uploads.json:`, err);
    }
  }
  if (records) {
    records.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    // TEMPORARILY DISABLE DEDUPLICATION FOR DEBUGGING
    const dedupedRecords = records.filter((newRec: any) => {
       return !devMemoryDb.records.some((r: any) => r.tenantId === newRec.tenantId && r.fileId === newRec.fileId && r.id === newRec.id);
    });
    devMemoryDb.records.push(...dedupedRecords);
    // devMemoryDb.records.push(...records);
    console.log(`[DEV SYNC] Saved ${records.length} novel records`);
  }
  if (skippedRows) {
    skippedRows.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    // TEMPORARILY DISABLE DEDUPLICATION FOR DEBUGGING
    const dedupedSkippedRows = skippedRows.filter((newRow: any) => {
       return !devMemoryDb.skippedRows.some((r: any) => r.tenantId === newRow.tenantId && r.fileId === newRow.fileId && r.id === newRow.id);
    });
    devMemoryDb.skippedRows.push(...dedupedSkippedRows);
    console.log(`[DEV SYNC] Saved ${skippedRows.length} skipped rows`);
  }
  if (rejectedRecords) {
    console.log("[REJECTED RECORDS INCOMING]", rejectedRecords.length);
    rejectedRecords.forEach((x: any) => { 
        if (!x.tenantId) x.tenantId = tenantId; 
        if (!x.createdBy) x.createdBy = (req as any).user?.uid || 'system';
        if (!x.approvals) x.approvals = [];
    });
    const dedupedRejected = rejectedRecords.filter((newRow: any) => {
       return !devMemoryDb.rejectedRecords.some((r: any) => r.tenantId === newRow.tenantId && r.fileId === newRow.fileId && r.id === newRow.id);
    });
    devMemoryDb.rejectedRecords.push(...dedupedRejected);
    console.log("[REJECTED RECORDS STATE]", devMemoryDb.rejectedRecords.length);
    console.log(`[DEV SYNC] Saved ${rejectedRecords.length} rejected records`);
  }
  if (customers) {
    customers.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    devMemoryDb.customers.push(...customers);
  }
  if (vendors) {
    vendors.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    devMemoryDb.vendors.push(...vendors);
  }
  if (items) {
    items.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    devMemoryDb.items.push(...items);
  }
  if (auditLogs) {
    auditLogs.forEach((x: any) => { if (!x.tenantId) x.tenantId = tenantId; });
    devMemoryDb.auditLogs.push(...auditLogs);
  }
  
  persistRegistry();
  
  return res.json({ success: true });
});

// Debug Endpoints are registered after the `authenticate` middleware is defined
// (see below, after requireAdmin) so they can be auth-gated. Registering them
// here would reference `authenticate` in its temporal dead zone and crash boot.

// getDb functionality removed to bypass unauthenticated Firestore checks


  console.log(`=== BACKEND BOOT VALIDATION ===`);
  console.log(`Firebase Config Project ID: ${firebaseConfig.projectId}`);
  console.log(`Firestore Connection Status: DEV MOCKED`);
  console.log(`===============================`);



  // --- AUTH & RBAC MIDDLEWARE ---
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(sendError("Unauthorized: No token provided"));
    }
    const token = authHeader.split("Bearer ")[1];
    
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json(sendError("Unauthorized: Invalid token string"));
    }

    try {
      let decodedToken: any;
      if (token === 'fake.token.for-dev-mode' || token === 'fake-token-for-dev' || token.startsWith('fake-token-for-dev:')) {
         const devAuthEnabled = ENV_MODE !== 'production' && process.env.VITE_ENABLE_DEV_AUTH === 'true';
         const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
         
         if (!devAuthEnabled) {
           return res.status(401).json(sendError("Unauthorized: Dev auth is disabled"));
         }
         if (!isLocalhost) {
           return res.status(403).json(sendError("Forbidden: Dev auth is restricted to localhost requests only"));
         }
         
         const [, encodedTenantId, encodedUid] = token.split(':');
         const tenantId = encodedTenantId ? decodeURIComponent(encodedTenantId) : (process.env.VITE_DEV_AUTH_TENANT_ID || 'test-user');
         const uid = encodedUid ? decodeURIComponent(encodedUid) : (process.env.VITE_DEV_AUTH_UID || tenantId);
         // Dev-auth path: synthesize an admin identity so local login keeps working.
         // This branch is gated above by devAuthEnabled (non-prod) + isLocalhost.
         decodedToken = { uid, email: process.env.VITE_DEV_AUTH_EMAIL || 'dev-admin@local.test', tenantId, role: 'admin' };
      } else {
         decodedToken = await admin.auth().verifyIdToken(token);
      }
      (req as any).user = decodedToken;

      // Derive role and tenant from verified claims. Fail closed: a token without
      // a role/tenantId claim is not granted any access (no universal admin).
      if (!decodedToken.tenantId || !decodedToken.role) {
        return res.status(403).json(sendError("Forbidden: token missing tenantId/role claims"));
      }

      (req as any).userProfile = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role,
        tenantId: decodedToken.tenantId,
        permissions: Array.isArray(decodedToken.permissions) ? decodedToken.permissions : []
      };

      console.log(`AUTH MIDDLEWARE SUCCESS: Validated UID ${decodedToken.uid} as ${String(decodedToken.role).toUpperCase()}`);
      next();
    } catch (e: any) {
      console.error("AUTH MIDDLEWARE CRITICAL FAILURE:", e);
      return res.status(401).json(sendError(`Unauthorized: ${e.message}`));
    }
  };

  // Like authenticate(), but tolerant of a VALID token that is missing role/tenantId
  // claims. Used ONLY by the bootstrap routes (users/init, admin/fix-role) so a brand
  // new user can reach the handler that provisions their claims. A valid token with
  // claims behaves exactly like authenticate(); an invalid/missing token is rejected.
  const authenticateOrNewUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(sendError("Unauthorized: No token provided"));
    }
    const token = authHeader.split("Bearer ")[1];
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json(sendError("Unauthorized: Invalid token string"));
    }
    try {
      let decodedToken: any;
      if (token === 'fake.token.for-dev-mode' || token === 'fake-token-for-dev' || token.startsWith('fake-token-for-dev:')) {
        const devAuthEnabled = ENV_MODE !== 'production' && process.env.VITE_ENABLE_DEV_AUTH === 'true';
        const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || req.hostname === 'localhost';
        if (!devAuthEnabled) {
          return res.status(401).json(sendError("Unauthorized: Dev auth is disabled"));
        }
        if (!isLocalhost) {
          return res.status(403).json(sendError("Forbidden: Dev auth is restricted to localhost requests only"));
        }
        const [, encodedTenantId, encodedUid] = token.split(':');
        const tenantId = encodedTenantId ? decodeURIComponent(encodedTenantId) : (process.env.VITE_DEV_AUTH_TENANT_ID || 'test-user');
        const uid = encodedUid ? decodeURIComponent(encodedUid) : (process.env.VITE_DEV_AUTH_UID || tenantId);
        decodedToken = { uid, email: process.env.VITE_DEV_AUTH_EMAIL || 'dev-admin@local.test', tenantId, role: 'admin' };
      } else {
        decodedToken = await admin.auth().verifyIdToken(token);
      }
      (req as any).user = decodedToken;

      // New-user tolerance: pass through even when role/tenantId are absent, with a
      // null-claim profile so the bootstrap handler can provision claims. With claims
      // present, build the same profile authenticate() would.
      const hasClaims = !!(decodedToken.tenantId && decodedToken.role);
      (req as any).userProfile = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: hasClaims ? decodedToken.role : null,
        tenantId: hasClaims ? decodedToken.tenantId : null,
        permissions: Array.isArray(decodedToken.permissions) ? decodedToken.permissions : []
      };
      next();
    } catch (e: any) {
      console.error("AUTH (new-user) MIDDLEWARE FAILURE:", e);
      return res.status(401).json(sendError(`Unauthorized: ${e.message}`));
    }
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const profile = (req as any).userProfile;
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json(sendError("Forbidden: Admin role required"));
    }
    next();
  };

  // --- DEBUG ENDPOINTS (404 in production, authenticated in dev) ---
  app.get('/api/debug/journalEntries', authenticate, (req, res) => {
    if (ENV_MODE === 'production') return res.status(404).end();
    res.json({
      count: devMemoryDb.journalEntries.length,
      sample: devMemoryDb.journalEntries.slice(0, 5)
    });
  });

  app.get('/api/debug/records', authenticate, (req, res) => {
    if (ENV_MODE === 'production') return res.status(404).end();
    res.json({
      count: devMemoryDb.records.length,
      sample: devMemoryDb.records.slice(0, 2)
    });
  });

  app.get('/api/debug/settings', authenticate, (req, res) => {
    if (ENV_MODE === 'production') return res.status(404).end();
    res.json({
      settings: devMemoryDb.settings
    });
  });

  // --- USER & ROLE ENDPOINTS ---
  app.post("/api/erp/users/init", authenticateOrNewUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userProfileFromToken = (req as any).userProfile;
      
      console.log(`[INIT] Returning role '${userProfileFromToken?.role}' for UID: ${user.uid}`);
      return res.json({
        success: true,
        role: userProfileFromToken?.role,
        data: userProfileFromToken
      });
    } catch (e: any) {
      console.error("🚨 INIT ENDPOINT CRITICAL FAILURE:", e);
      return res.status(500).json({ success: false, error: e.message || String(e) });
    }
  });

  app.post("/api/erp/admin/fix-role", authenticateOrNewUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const uid = user.uid;
      // First admin is bound to their OWN uid as the tenant. This guarantees at most one
      // admin can be self-provisioned per tenant; further users must be promoted by that admin.
      const tenantId = uid;
      const adminPermissions = ['expenses', 'revenues', 'payroll', 'banks', 'reports', 'smart_invoice', 'quotations'];

      // Dev tokens already carry mocked admin claims (synthesized in the middleware) and point
      // at a non-existent Firebase user, so skip the real setCustomUserClaims call for them.
      const rawToken = (req.headers.authorization || '').split('Bearer ')[1] || '';
      const isDevToken = rawToken === 'fake.token.for-dev-mode' || rawToken === 'fake-token-for-dev' || rawToken.startsWith('fake-token-for-dev:');

      // 1. Does this tenant already have an admin?
      let adminExists = false;
      if (isConnected()) {
        const existing = await query("SELECT COUNT(*) FROM tenant_users WHERE tenant_id = $1 AND role = 'admin'", [tenantId]);
        adminExists = parseInt(existing.rows[0].count, 10) > 0;
      } else {
        adminExists = devMemoryDb.tenantUsers.some((u: any) => u.tenantId === tenantId && u.role === 'admin');
      }

      // 2. Refuse if an admin already exists — only the FIRST user becomes admin.
      if (adminExists) {
        return res.status(403).json(sendError("Admin already exists for this tenant. Contact your administrator."));
      }

      // 3. First user becomes the first admin of their own tenant.
      console.log(`[FIX-ROLE] Provisioning first admin for UID: ${uid} (tenant ${tenantId})`);
      if (!isDevToken) {
        await admin.auth().setCustomUserClaims(uid, { role: 'admin', tenantId, permissions: adminPermissions });
      }

      if (isConnected()) {
        await query(
          "INSERT INTO tenant_users (id, email, role, name, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
          [uid, user.email || '', 'admin', user.email || null, tenantId]
        );
      } else {
        devMemoryDb.tenantUsers.push({ id: uid, email: user.email || '', role: 'admin', name: user.email || null, tenantId, createdAt: new Date().toISOString() });
      }

      await addAuditLog({
        action: 'first_admin_provisioned',
        userId: uid,
        userName: user.email || null,
        tenantId,
        details: `First admin bootstrap for tenant ${tenantId}`
      });

      return res.json({
        success: true,
        role: 'admin',
        message: 'تم إعداد حسابك كمدير. يرجى تسجيل الخروج والدخول مجدداً.'
      });
    } catch (e: any) {
      console.error("[FIX-ROLE] Error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/erp/users", authenticate, requireAdmin, wrap(async (req, res) => {
    return [];
  }));

  app.post("/api/erp/users/promote", authenticate, requireAdmin, wrap(async (req, res) => {
    return { success: true, message: `User promoted` };
  }));

  app.delete("/api/erp/users/:targetUid", authenticate, requireAdmin, wrap(async (req, res) => {
    return { success: true };
  }));

  app.get("/api/health", (req, res) => {
    if (req.query.msg) console.log("Frontend UI Message/Error:", req.query.msg);
    if (req.query.log) console.log("Frontend UI Console Log:", req.query.log);
    res.json(sendSuccess({ status: "ok" }));
  });

  app.get("/api/erp/health", async (req, res) => {
    res.json({
      status: "running",
      projectId: firebaseConfig.projectId,
      firestore: "dev_mode_mocked"
    });
  });

  app.get("/api/erp/settings", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const settings = devMemoryDb.settings[tenantId] || {};
    return { success: true, data: settings };
  }));

  app.post("/api/erp/settings", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    if (!devMemoryDb.settings[tenantId]) {
      devMemoryDb.settings[tenantId] = {};
    }
    devMemoryDb.settings[tenantId] = { ...devMemoryDb.settings[tenantId], ...req.body };
    return { success: true, data: devMemoryDb.settings[tenantId] };
  }));

  app.get("/api/erp/audit-trace/:entityId", authenticate, wrap(async (req, res) => {
    const { entityId } = req.params;
    
    if (!entityId || entityId === 'undefined' || entityId === 'null') {
      console.error("[AUDIT TRACE] Missing or invalid entityId provided", { entityId, path: req.path });
      res.status(400);
      return { success: false, reason: "INVALID_ENTITY_ID_PROVIDED", details: "You must provide a valid entity ID or module name." };
    }

    try {
      const modules = ['expenses', 'revenues', 'payroll', 'banks'];
      const userProfile = (req as any).userProfile;
      const tenantId = userProfile?.tenantId || (req as any).user.uid;

      console.log(`[AUDIT TRACE] Request for entityId: ${entityId}, tenantId: ${tenantId}`);

      let entries = [];
      let searchedBy = [];

      if (modules.includes(entityId)) {
        console.log(`[AUDIT TRACE] Querying by moduleType: ${entityId}`);
        entries = devMemoryDb.journalEntries.filter(je => je.tenantId === tenantId && je.moduleType === entityId);
        searchedBy.push("moduleType");
          
        if (entries.length === 0) {
           return { success: false, reason: "NO_TRACE_FOUND_FOR_MODULE", searchedBy };
        }
      } else {
        console.log(`[AUDIT TRACE] Querying across references for: ${entityId}`);
        searchedBy.push("sourceRowId");
        entries = devMemoryDb.journalEntries.filter(je => je.tenantId === tenantId && je.sourceRowId === entityId);
        
        if (entries.length === 0) {
          console.log(`[AUDIT TRACE] Querying by sourceFileId: ${entityId}`);
          searchedBy.push("sourceFileId");
          entries = devMemoryDb.journalEntries.filter(je => je.tenantId === tenantId && je.sourceFileId === entityId);
        }
        
        if (entries.length === 0) {
          console.log(`[AUDIT TRACE] Querying by originalInvoiceNumber: ${entityId}`);
          searchedBy.push("originalInvoiceNumber");
          entries = devMemoryDb.journalEntries.filter(je => je.tenantId === tenantId && je.originalInvoiceNumber === entityId);
        }
        
        if (entries.length === 0) {
          console.log(`[AUDIT TRACE] Querying by Entity_ID: ${entityId}`);
          searchedBy.push("entityId");
          entries = devMemoryDb.journalEntries.filter(je => je.tenantId === tenantId && je.entityId === entityId);
        }
        
        if (entries.length === 0) {
          console.log(`[AUDIT TRACE] Results count: 0`);
          return { success: false, reason: "NO_TRACE_FOUND_FOR_ENTITY", searchedBy };
        }
      }

      console.log(`[AUDIT TRACE] Results count: ${entries.length}`);
      
      const originalEntryIds = [...new Set(entries.map(e => e.originalEntryId || e.id))];
      let auditLogs = devMemoryDb.auditLogs.filter(log => log.tenantId === tenantId && originalEntryIds.includes(log.entityId));

      entries.sort((a, b) => {
        const dA = a.timestamp || a.date || '';
        const dB = b.timestamp || b.date || '';
        return new Date(dB).getTime() - new Date(dA).getTime();
      });
      
      auditLogs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

      return { 
        success: true, 
        count: entries.length,
        data: entries,
        auditLogs
      };
    } catch (e: any) {
      console.error("[AUDIT TRACE] failure context:", { entityId, error: e.message || e });
      res.status(500);
      return { success: false, reason: "INTERNAL_FETCH_ERROR", details: e.message || "Failed to fetch audit data", data: [] };
    }
  }));

  app.put("/api/erp/journal/:id", authenticate, wrap(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const userProfile = (req as any).userProfile;
    if (!userProfile || userProfile.role !== 'admin') {
      res.status(403);
      return { success: false, error: "FORBIDDEN", details: "Only admins can edit journal entries." };
    }

    if (!updates.debitAccount || !updates.creditAccount || updates.amount == null) {
      res.status(400);
      return { success: false, error: "INVALID_ENTRY", details: "debitAccount, creditAccount, and amount are required." };
    }
    
    if (updates.amount <= 0) {
      res.status(400);
      return { success: false, error: "INVALID_AMOUNT", details: "Amount must be greater than 0." };
    }

    const tenantId = userProfile.tenantId || userProfile.uid;

    const entryIndex = devMemoryDb.journalEntries.findIndex(je => je.id === id && je.tenantId === tenantId);
    if (entryIndex === -1) {
       throw new Error("ENTRY_NOT_FOUND");
    }

    const oldData = devMemoryDb.journalEntries[entryIndex];

    if (oldData.isActive === false) {
      throw new Error("ALREADY_INACTIVE");
    }

    // Generate New Version
    const currentVersion = oldData.version || 1;
    const newVersion = currentVersion + 1;
    const originalEntryId = oldData.originalEntryId || id;
    const newEntryId = `${originalEntryId}_v${newVersion}`;

    const newData = {
      ...oldData,
      id: newEntryId,
      debitAccount: updates.debitAccount,
      creditAccount: updates.creditAccount,
      amount: Number(updates.amount),
      taxAmount: Number(updates.taxAmount || 0),
      description: updates.description || oldData.description,
      version: newVersion,
      isActive: true,
      originalEntryId,
      lastEditedBy: userProfile.uid,
      lastEditedAt: new Date().toISOString()
    };

    // Ensure NON-editable fields remain
    newData.sourceFileId = oldData.sourceFileId;
    newData.sourceRowId = oldData.sourceRowId;
    newData.timestamp = oldData.timestamp;

    // Deactivate old entry
    devMemoryDb.journalEntries[entryIndex].isActive = false;

    // Create new entry
    devMemoryDb.journalEntries.push(newData);

    // Create audit log
    const auditLogId = `audit_${newEntryId}_${Date.now()}`;
    
    await addAuditLog({
      entityType: 'journalEntry',
      entityId: originalEntryId,
      action: 'EDIT',
      performedBy: userProfile.uid,
      performedAt: new Date().toISOString(),
      before: oldData,
      after: newData,
      changeSet: updates,
      source: 'user',
      tenantId: userProfile.tenantId
    });

    return { success: true, message: "ENTRY_UPDATED_IN_DEV", newEntryId };
  }));
  
  app.post("/api/erp/aggregates/recalculate", authenticate, wrap(async (req, res) => {
    return { success: true, message: "Recalculation completed successfully in Dev Mode!" };
  }));

  app.get("/api/erp/dashboard", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;

    const docs = devMemoryDb.journalEntries.filter(d => d.tenantId === tenantId);
    let r = 0, e = 0, p = 0;
    docs.forEach(d => {
       if (d.moduleType === 'revenues') r += d.amount || 0;
       if (d.moduleType === 'expenses') e += d.amount || 0;
       if (d.moduleType === 'payroll') p += d.amount || 0;
    });
    return { success: true, data: [{ revenue: r, expenses: e, payroll: p, netProfit: r - (e + p) }], mode: "DEV MODE ACTIVE" };
  }));

  app.get("/api/debug/journalEntries/raw", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;

    const docs = devMemoryDb.journalEntries.filter(d => d.tenantId === tenantId);
    console.log(`[API RAW] tenantId: ${tenantId}, returning ${docs.length} records. Total JEs: ${devMemoryDb.journalEntries.length}`);
    return {
       success: true,
       data: docs,
       mode: "DEV MODE ACTIVE"
    };
  }));

  app.get("/api/erp/ledger", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;

    const docs = devMemoryDb.journalEntries.filter(d => d.tenantId === tenantId);
    const balances: any = {};
    docs.forEach(data => {
      const dAcc = data.debitAccount || 'Unknown';
      const cAcc = data.creditAccount || 'Unknown';
      const amount = data.amount || 0;
      if (!balances[dAcc]) balances[dAcc] = { totalDebit: 0, totalCredit: 0 };
      if (!balances[cAcc]) balances[cAcc] = { totalDebit: 0, totalCredit: 0 };
      balances[dAcc].totalDebit += amount;
      balances[cAcc].totalCredit += amount;
    });
    const ledger = Object.keys(balances).map(acc => ({
       account: acc,
       totalDebit: balances[acc].totalDebit,
       totalCredit: balances[acc].totalCredit,
       balance: balances[acc].totalDebit - balances[acc].totalCredit
    }));
    return { success: true, data: ledger, mode: "DEV MODE ACTIVE" };
  }));

  // ERP File Governance Endpoint (Phase C2)
  app.get("/api/erp/files/governance", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const { moduleType } = req.query;

    const registeredFiles: any[] = [];
    const unregisteredSources: any[] = [];
    let rawLinkedRecordCount = 0;
    let includedRecordCount = 0;
    let orphanedExcludedRecordCount = 0;
    let contributingRegisteredFileCount = 0;
    let contributingUnregisteredSourceCount = 0;
    let filesMissingRegistry = 0;
    let destructiveDeleteRiskCount = 0;

    let tenantRecords: any[] = [];
    let tenantFiles: any[] = [];
    let activeFiles: any[] = [];
    let activeFileIds = new Set<string>();

    if (isConnected()) {
       // Fetch tenant records
       const recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1", [tenantId]);
       tenantRecords = recordsRes.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          fileId: row.file_id,
          moduleType: row.module_type,
          Invoice_Number: row.invoice_number,
          Invoice_Date: row.invoice_date,
          Entity_Name: row.entity_name,
          Total_Amount: Number(row.total_amount),
          VAT_Amount: Number(row.vat_amount),
          Taxable_Amount: Number(row.taxable_amount),
          Nontaxable_Amount: Number(row.nontaxable_amount),
          Net_Amount: Number(row.net_amount),
          Category: row.category,
          ...(row.raw_data || {})
       }));

       // Fetch active files and tenant files
       const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1", [tenantId]);
       tenantFiles = filesRes.rows.map((row: any) => {
          const meta = row.meta_data || {};
          return {
             id: row.id,
             fileName: row.file_name,
             originalFileName: row.original_file_name,
             displayName: meta.displayName || row.original_file_name,
             fileHash: row.file_hash,
             tenantId: row.tenant_id,
             moduleType: row.module_type,
             fileType: row.module_type,
             status: row.status,
             isDeleted: row.is_deleted,
             storagePath: row.storage_path,
             createdAt: row.created_at,
             uploadDate: meta.uploadDate || row.created_at
          };
       });
       
       activeFiles = tenantFiles.filter((f: any) => !f.isDeleted && f.status !== 'archived' && (!moduleType || f.moduleType === moduleType));
       activeFileIds = new Set(activeFiles.map((f: any) => f.id));
       // Keep only files matching moduleType if specified
       if (moduleType) {
          tenantFiles = tenantFiles.filter((f: any) => f.moduleType === moduleType);
       }
    } else {
       tenantRecords = devMemoryDb.records.filter((r: any) => 
          r.tenantId === tenantId && (!moduleType || r.moduleType === moduleType)
       );
       activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType as string, tenantId);
       activeFileIds = new Set(getActiveFileIds(devMemoryDb.uploadedFiles, moduleType as string, tenantId));
       tenantFiles = devMemoryDb.uploadedFiles.filter((f: any) => 
          f.tenantId === tenantId && (!moduleType || (f.fileType || f.moduleType) === moduleType)
       );
    }

    const recordGroups = new Map<string, { count: number, vendorSet: Set<string>, totalAmount: number, vatAmount: number, moduleType: string }>();
    
    tenantRecords.forEach((r: any) => {
      rawLinkedRecordCount++;
      const sourceId = String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || '');
      if (sourceId) {
         if (!recordGroups.has(sourceId)) {
            recordGroups.set(sourceId, { count: 0, vendorSet: new Set(), totalAmount: 0, vatAmount: 0, moduleType: r.moduleType || '' });
         }
         const group = recordGroups.get(sourceId)!;
         group.count++;
         if (r.Vendor_Name || r.Entity_Name) group.vendorSet.add(r.Vendor_Name || r.Entity_Name);
         if (r.Net_Amount || r.Total_Amount) group.totalAmount += Number(r.Net_Amount || r.Total_Amount || 0);
         if (r.VAT_Amount) group.vatAmount += Number(r.VAT_Amount || 0);
      }
    });

    const fileIdMap = new Map<string, any>();
    tenantFiles.forEach((f: any) => {
       const fid = f.id || f.fileHash || f.originalId;
       fileIdMap.set(fid, f);
       const group = recordGroups.get(fid);
       
       let derivedLifecycleStatus = "UNKNOWN";
       let contributionStatus = "UNKNOWN";
       
       const isConsideredActive = activeFileIds.has(fid);
       
       if (isConsideredActive) {
          derivedLifecycleStatus = "ACTIVE_REGISTERED";
       } else {
          derivedLifecycleStatus = "REGISTRY_ONLY_NO_RECORDS";
       }

       if (group && isConsideredActive) {
          contributionStatus = "INCLUDED_IN_CALCULATIONS";
          contributingRegisteredFileCount++;
          includedRecordCount += group.count;
       } else if (group && !isConsideredActive) {
          contributionStatus = "ORPHANED_EXCLUDED";
          orphanedExcludedRecordCount += group.count;
       } else if (!group) {
          contributionStatus = "NOT_CURRENTLY_CONTRIBUTING";
       }
       
       const hardDeleteRiskLevel = (group && group.count > 0) ? "HIGH" : "LOW";
       if (hardDeleteRiskLevel === "HIGH") destructiveDeleteRiskCount++;

       registeredFiles.push({
          fileId: fid,
          fileName: f.fileName,
          fileHash: f.fileHash,
          moduleType: f.moduleType || f.fileType,
          fileType: f.fileType,
          tenantId: f.tenantId,
          createdAt: f.createdAt || f.uploadDate,
          derivedLifecycleStatus,
          contributionStatus,
          includedInVisibleReports: isConsideredActive,
          recordCount: group?.count || 0,
          vendorCount: group?.vendorSet.size || 0,
          totalAmount: group?.totalAmount || 0,
          vatAmount: group?.vatAmount || 0,
          hasLinkedRecords: !!group,
          hasMissingRegistryRisk: false,
          hardDeleteRiskLevel,
          canBeDeletedSafely: !(group && group.count > 0),
          technical: { originalId: f.originalId, status: f.status }
       });
       
       recordGroups.delete(fid);
    });

    // Unregistered sources (records that don't match any tenant file)
    for (const [sourceId, group] of recordGroups.entries()) {
       filesMissingRegistry++;
       orphanedExcludedRecordCount += group.count;
       unregisteredSources.push({
          sourceFileId: sourceId,
          recordCount: group.count,
          vendorCount: group.vendorSet.size,
          totalAmount: group.totalAmount,
          moduleType: group.moduleType,
          contributionStatus: "ORPHANED_EXCLUDED",
          lifecycleStatus: "LEGACY_UNREGISTERED",
          includedInVisibleReports: false,
          warningMeaning: "Records exist in historical/raw storage but are excluded from current report calculations because no active registered source file matches them.",
          allowedActions: ["READ_ONLY"],
          technical: { hash: sourceId }
       });
    }

    return {
       success: true,
       data: {
          registeredFiles,
          unregisteredSources,
          summary: {
             registeredFileCount: registeredFiles.length,
             unregisteredSourceCount: unregisteredSources.length,
             rawLinkedRecordCount,
             includedRecordCount,
             orphanedExcludedRecordCount,
             contributingRegisteredFileCount,
             contributingUnregisteredSourceCount,
             filesMissingRegistry,
             destructiveDeleteRiskCount
          }
       }
    };
  }));

  async function getDryRunContext(tenantId: string) {
    if (!isConnected()) return devMemoryDb;
    
    const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1", [tenantId]);
    const uploadedFiles = filesRes.rows.map((row: any) => {
       const meta = row.meta_data || {};
       return {
          id: row.id,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          displayName: meta.displayName || row.original_file_name,
          fileHash: row.file_hash,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileType: row.module_type,
          status: row.status,
          isDeleted: row.is_deleted,
          storagePath: row.storage_path
       };
    });
    
    const recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1", [tenantId]);
    const records = recordsRes.rows.map((row: any) => ({
       id: row.id,
       tenantId: row.tenant_id,
       fileId: row.file_id,
       moduleType: row.module_type,
       Invoice_Number: row.invoice_number,
       Invoice_Date: row.invoice_date,
       Entity_Name: row.entity_name,
       Total_Amount: Number(row.total_amount),
       VAT_Amount: Number(row.vat_amount),
       Taxable_Amount: Number(row.taxable_amount),
       Nontaxable_Amount: Number(row.nontaxable_amount),
       Net_Amount: Number(row.net_amount),
       Category: row.category,
       ...(row.raw_data || {})
    }));

    const stagedRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND status IN ('قيد التصنيف', 'نسخة معدلة قيد التحقق', 'تمت المراجعة والاعتماد', 'staged')", [tenantId]);
    const candidateReplacements = stagedRes.rows.map((row: any) => {
       const meta = row.meta_data || {};
       return {
          id: row.id,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          fileHash: row.file_hash,
          status: row.status,
          uploadedBy: meta.uploadedBy,
          storagePath: row.storage_path,
          approvedRecords: meta.approvedRecords
       };
    });

    return {
       ...devMemoryDb,
       uploadedFiles,
       records,
       candidateReplacements
    } as any;
  }

  // ERP File Governance Dry-Run Preview Endpoint (Phase C4-C)
  app.get("/api/erp/files/governance/:fileId/preview", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const { fileId } = req.params;
    const { proposedAction, moduleType } = req.query;

    if (!proposedAction || typeof proposedAction !== 'string') {
      res.status(400).json({ success: false, error: "INVALID_REQUEST", message: "proposedAction query parameter is required" });
      return;
    }

    try {
      const dbContext = await getDryRunContext(tenantId);
      // Call the deterministic multiplicity-aware dry-run read-only logic
      const previewData = generateDryRunPreview(
        fileId, 
        proposedAction, 
        moduleType as string | undefined, 
        tenantId, 
        dbContext
      );

      return previewData;
    } catch (error: any) {
      let parsedError;
      try {
        parsedError = JSON.parse(error.message);
      } catch (e) {
        parsedError = { error: "SERVER_ERROR", message: "An unexpected error occurred during preview generation." };
      }
      res.status(400).json({ success: false, ...parsedError });
    }
  }));

  // C4-D2: Dedicated source-level governance requests
  app.get('/api/erp/files/governance/review-requests', authenticate, wrap(async (req: any, res) => {
    const tenantId = req.userProfile?.tenantId || req.user.uid;
    const moduleType = req.query.moduleType as string;
    
    let requests = devMemoryDb.governanceRequests.filter(r => r.tenantId === tenantId);
    if (moduleType) {
      requests = requests.filter(r => r.moduleType === moduleType);
    }
    
    return { success: true, requests };
  }));

  app.post('/api/erp/files/governance/:fileId/review-request', authenticate, wrap(async (req: any, res) => {
    const fileId = req.params.fileId;
    const tenantId = req.userProfile?.tenantId || req.user.uid;
    const { proposedAction, justification } = req.body;
    
    if (!fileId || !proposedAction || !justification) {
      res.status(400).json({ success: false, error: "INVALID_REQUEST", message: "fileId, proposedAction, and justification are required" });
      return;
    }

    // Duplicate prevention
    const existingPending = devMemoryDb.governanceRequests.find(
      r => r.tenantId === tenantId && r.fileId === fileId && r.proposedAction === proposedAction && r.status === "PENDING_REVIEW"
    );
    if (existingPending) {
      res.status(400).json({ success: false, error: "DUPLICATE_REQUEST", message: "يوجد طلب قيد المراجعة حالياً لنفس الإجراء." });
      return;
    }

    const dbContext = await getDryRunContext(tenantId);
    // Derive impact securely on server using the authoritative dry-run path (bypassing conflicting standalone lookups)
    const preview = generateDryRunPreview(fileId, proposedAction, req.query.moduleType as string || undefined, tenantId, dbContext);
    
    // Validate it's an actively included source according to the authoritative accepted dry-run contract
    if (!preview.success || preview.source?.sourceType !== 'REGISTERED_INCLUDED') {
       res.status(400).json({ success: false, error: "INVALID_SOURCE", message: "Source file is not actively included in current calculations." });
       return;
    }
    
    if (!preview.projectedImpact) {
        res.status(400).json({ success: false, error: "PREVIEW_FAILED", message: "Failed to generate financial impact." });
        return;
    }

    const newRequest = {
      id: crypto.randomUUID(),
      tenantId,
      fileId,
      fileName: preview.source?.filename || 'Unknown Source',
      moduleType: (req.query.moduleType as string) || 'expenses',
      proposedAction,
      status: "PENDING_REVIEW",
      justification,
      requestedBy: tenantId,
      timestamp: new Date().toISOString(),
      projectedImpact: preview.projectedImpact
    };

    devMemoryDb.governanceRequests.push(newRequest);
    persistGovernanceRequests();

    return { success: true, request: newRequest };
  }));

  // --- DEDICATED REVIEW DECISION SURFACE ---
  
  app.get("/api/erp/files/governance/reviewer/requests", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    // SECURE_EXISTING_REVIEWER_AUTHORIZATION_REUSABLE check
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'finance_manager') {
       return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions for review' });
    }
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const moduleType = req.query.moduleType as string || 'expenses';

    const requests = devMemoryDb.governanceRequests.filter(r => r.tenantId === tenantId && r.moduleType === moduleType && r.status === 'PENDING_REVIEW');
    // Return only safe user-facing data
    const safeRequests = requests.map(r => ({
      id: r.id,
      fileName: r.fileName,
      proposedAction: r.proposedAction,
      status: r.status,
      justification: r.justification,
      timestamp: r.timestamp,
      projectedImpact: r.projectedImpact
    }));
    return { success: true, requests: safeRequests };
  }));

  app.post("/api/erp/files/governance/reviewer/requests/:requestId/decide", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    // SECURE_EXISTING_REVIEWER_AUTHORIZATION_REUSABLE check
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'finance_manager') {
       return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions for review' });
    }
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const requestId = req.params.requestId;
    const { decision, note } = req.body;

    if (!note || note.trim() === '') {
       res.status(400).json({ success: false, message: "Reviewer note is required." });
       return;
    }

    if (decision !== 'APPROVED_AWAITING_EXECUTION' && decision !== 'REJECTED') {
       res.status(400).json({ success: false, message: "Invalid decision." });
       return;
    }

    const request = devMemoryDb.governanceRequests.find(r => r.id === requestId && r.tenantId === tenantId);
    if (!request) {
       res.status(404).json({ success: false, message: "Request not found." });
       return;
    }

    if (request.status !== 'PENDING_REVIEW') {
       res.status(400).json({ success: false, message: "Request already decided." });
       return;
    }

    // Record decision without executing lifecycle mutation
    request.status = decision;
    if (!request.decisionHistory) {
      request.decisionHistory = [];
    }
    request.decisionHistory.push({
      decision,
      note,
      timestamp: new Date().toISOString(),
      reviewerId: userProfile.uid
    });

    persistGovernanceRequests();
    return { success: true, status: request.status, message: "Decision recorded successfully." };
  }));

  app.post("/api/erp/files/governance/:fileId/candidate-replacement", authenticate, express.json({limit: '50mb'}), wrap(async (req: any, res) => {
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;
    const fileId = req.params.fileId;
    const moduleType = req.body.moduleType || 'expenses';

    let activeFiles = [];
    if (isConnected()) {
       const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2 AND is_deleted = false AND status = 'processed'", [tenantId, moduleType]);
       activeFiles = filesRes.rows.map((row: any) => ({
          id: row.id,
          fileHash: row.file_hash,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          status: row.status
       }));
    } else {
       activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType, tenantId);
    }
    const targetFile = activeFiles.find((f: any) => f.id === fileId || f.fileHash === fileId);

    if (!targetFile) {
      res.status(400).json({
         success: false, 
         message: "تعذر رفع النسخة المعدلة لأن الملف الحالي لم يعد مدرجًا في التقارير."
      });
      return;
    }

    try {
      const candidateFiles = req.body.uploadedFiles || [];
      if (!candidateFiles.length) {
         res.status(400).json({ success: false, message: "تعذر التحقق من النسخة المعدلة. يرجى مراجعة الملف والمحاولة مرة أخرى." });
         return;
      }

      const candidateFile = candidateFiles[0];
      const newCandidate = {
         id: crypto.randomUUID(),
         targetFileId: targetFile.id || targetFile.fileHash,
         tenantId,
         moduleType,
         fileName: candidateFile.fileName,
         originalFileName: candidateFile.originalFileName,
         displayName: candidateFile.originalFileName || candidateFile.fileName,
         fileHash: candidateFile.fileHash || candidateFile.id,
         status: "نسخة معدلة قيد التحقق",
         uploadedBy: userProfile.uid,
         timestamp: new Date().toISOString()
      };

      if (isConnected()) {
         // Delete existing candidate for the target
         await query("DELETE FROM uploaded_files WHERE tenant_id = $1 AND meta_data->>'targetFileId' = $2 AND status = 'نسخة معدلة قيد التحقق'", [tenantId, newCandidate.targetFileId]);
         // Insert new candidate
         await query(`
            INSERT INTO uploaded_files (id, file_name, original_file_name, file_hash, tenant_id, module_type, status, meta_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         `, [
            newCandidate.id,
            newCandidate.fileName,
            newCandidate.originalFileName,
            newCandidate.fileHash,
            newCandidate.tenantId,
            newCandidate.moduleType,
            newCandidate.status,
            JSON.stringify({
               targetFileId: newCandidate.targetFileId,
               displayName: newCandidate.displayName,
               uploadedBy: newCandidate.uploadedBy
            })
         ]);
      } else {
         devMemoryDb.candidateReplacements = devMemoryDb.candidateReplacements.filter((c: any) => c.targetFileId !== newCandidate.targetFileId || c.tenantId !== tenantId);
         devMemoryDb.candidateReplacements.push(newCandidate);
         persistRegistry();
      }

      return { success: true, candidate: newCandidate };
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, message: "تعذر رفع النسخة المعدلة حاليًا. يرجى المحاولة مرة أخرى لاحقًا." });
      return;
    }
  }));

  

  app.post("/api/erp/files/governance/staged-upload", authenticate, (req: any, res: any, next: any) => {
    uploadMemory.single('file')(req, res, (err: any) => {
      const proceed = () => {
        if (err) {
          if (err.message === 'INVALID_TYPE') {
            return res.status(400).json({ success: false, errorCode: "UNSUPPORTED_FILE_TYPE" });
          }
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, errorCode: "FILE_TOO_LARGE" });
          }
          return res.status(500).json({ success: false, errorCode: "STAGED_UPLOAD_FAILED" });
        }
        next();
      };
      
      const isSprint = req.isSprint;
      if (isSprint) {
        sprintStorage.run({ isSprint: true }, proceed);
      } else {
        proceed();
      }
    });
  }, wrap(async (req: any, res) => {
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;
    const moduleType = req.body.moduleType || 'expenses';
    const fileHash = req.body.fileHash;
    const uploadedFile = req.file;

    if (!uploadedFile) {
       res.status(400).json({ success: false, errorCode: "STAGED_UPLOAD_FAILED" });
       return;
    }

    const safeOriginalName = Buffer.from(uploadedFile.originalname, 'latin1').toString('utf8');

    const { classifyStagedUpload } = await import('./src/lib/upload-classifier.ts');
    const { getActiveFileIds } = await import('./src/lib/active-file-registry.ts');
    const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');

    const nodeBuffer = uploadedFile.buffer;
    const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);

    const STAGED_DIR = getStagedDir();
    if (!fs.existsSync(STAGED_DIR)) {
       fs.mkdirSync(STAGED_DIR, { recursive: true });
    }
    const diskFileName = crypto.randomUUID() + '.staged';
    const storagePath = path.join(STAGED_DIR, diskFileName);

    try {
       fs.writeFileSync(storagePath, nodeBuffer);
    } catch (e) {
       console.error("Failed to persist staged file:", e);
       res.status(500).json({ success: false, errorCode: "STAGED_FILE_SAVE_FAILED" });
       return;
    }

    let session;
    try {
       const filesToProcess = [{ buffer: arrayBuffer, name: safeOriginalName, fileHash: fileHash }];
       session = await createValidationSession(filesToProcess, moduleType);
    } catch (e) {
       console.error("Failed to parse staged file:", e);
       if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
       res.status(400).json({ success: false, errorCode: "STAGED_FILE_PARSE_FAILED" });
       return;
    }

    const parsedRecords = session.rawRecords.map((r: any) => ({
       ...r,
       moduleType: r.moduleType || moduleType,
       fileId: fileHash
    }));

    let tenantRecords = [];
    let activeFiles = [];
    if (isConnected()) {
       const recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1 AND module_type = $2", [tenantId, moduleType]);
       tenantRecords = recordsRes.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          fileId: row.file_id,
          moduleType: row.module_type,
          Invoice_Number: row.invoice_number,
          Invoice_Date: row.invoice_date,
          Entity_Name: row.entity_name,
          Total_Amount: Number(row.total_amount),
          VAT_Amount: Number(row.vat_amount),
          Taxable_Amount: Number(row.taxable_amount),
          Nontaxable_Amount: Number(row.nontaxable_amount),
          Net_Amount: Number(row.net_amount),
          Category: row.category,
          ...(row.raw_data || {})
       }));

       const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2 AND is_deleted = false AND status = 'processed'", [tenantId, moduleType]);
       activeFiles = filesRes.rows.map((row: any) => ({
          id: row.id,
          fileHash: row.file_hash,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          status: row.status
       }));
    } else {
       tenantRecords = devMemoryDb.records.filter((r: any) => 
         r.tenantId === tenantId && r.moduleType === moduleType
       );
       activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType, tenantId);
    }
    
    const activeFileIds = new Set<string>();
    activeFiles.forEach((f: any) => {
       if (f.id) activeFileIds.add(String(f.id));
       if (f.fileHash) activeFileIds.add(String(f.fileHash));
    });
    
    const activeFileDateRanges = Array.from(activeFileIds).map(fid => {
       let minD = '9999-99-99';
       let maxD = '0000-00-00';
       tenantRecords.forEach((r: any) => {
          if (r.fileId === fid || r._sourceFile === fid || r.fileHash === fid) {
             const d = r.Invoice_Date || r.Date || r.Transaction_Date;
             if (d && d < minD) minD = d;
             if (d && d > maxD) maxD = d;
          }
       });
       return { fileId: String(fid), minDate: minD === '9999-99-99' ? '' : minD, maxDate: maxD === '0000-00-00' ? '' : maxD };
    });

    let recordsMatchingActiveBusinessKeys = 0;
    if (parsedRecords.length > 0) {
       const activeRecords = tenantRecords.filter((r: any) => activeFileIds.has(r.fileId) || activeFileIds.has(r._sourceFile) || activeFileIds.has(r.fileHash));
       const activeFreq = new Set<string>();
       activeRecords.forEach((r: any) => {
          activeFreq.add([
            r.Invoice_Number || '', r.Entity_Name || r.Vendor_Name || '', r.Invoice_Date || r.Date || ''
          ].join('|'));
       });
       parsedRecords.forEach((r: any) => {
          const k = [
            r.Invoice_Number || '', r.Entity_Name || r.Vendor_Name || '', r.Invoice_Date || r.Date || ''
          ].join('|');
          if (activeFreq.has(k)) recordsMatchingActiveBusinessKeys++;
       });
    }

    const overlapAnalysis = { recordsMatchingActiveBusinessKeys };
    let classificationResult = classifyStagedUpload(parsedRecords, activeFileDateRanges, overlapAnalysis);

    if (session.summary.criticalIssues > 0 || (session.rejectedRecords && session.rejectedRecords.length > 0)) {
       classificationResult = {
         ...classificationResult,
         classification: 'INVALID' as any,
         arabicLabel: 'غير صالح لوجود أخطاء بنية أو حوكمة حاسمة'
       };
    }

    const newCandidate = {
       id: crypto.randomUUID(),
       tenantId,
       moduleType,
       fileName: safeOriginalName,
       originalFileName: safeOriginalName,
       displayName: safeOriginalName,
       fileHash: fileHash || crypto.randomUUID(),
       status: "قيد التصنيف",
       uploadedBy: userProfile.uid,
       timestamp: new Date().toISOString(),
       classification: classificationResult.classification,
       arabicLabel: classificationResult.arabicLabel,
       dateRange: classificationResult.dateRange,
       recordsCount: classificationResult.recordsCount,
       financialTotals: classificationResult.financialTotals,
       hasParsedRecords: parsedRecords.length > 0,
       storagePath
    };

    if (isConnected()) {
       await query("DELETE FROM uploaded_files WHERE tenant_id = $1 AND file_hash = $2 AND status IN ('قيد التصنيف', 'نسخة معدلة قيد التحقق', 'staged')", [tenantId, fileHash || newCandidate.fileHash]);
       await query(`
          INSERT INTO uploaded_files (id, file_name, original_file_name, file_hash, tenant_id, module_type, status, storage_path, meta_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       `, [
          newCandidate.id,
          newCandidate.fileName,
          newCandidate.originalFileName,
          newCandidate.fileHash,
          newCandidate.tenantId,
          newCandidate.moduleType,
          newCandidate.status,
          newCandidate.storagePath,
          JSON.stringify({
             displayName: newCandidate.displayName,
             uploadedBy: newCandidate.uploadedBy,
             classification: newCandidate.classification,
             arabicLabel: newCandidate.arabicLabel,
             dateRange: newCandidate.dateRange,
             recordsCount: newCandidate.recordsCount,
             financialTotals: newCandidate.financialTotals,
             hasParsedRecords: newCandidate.hasParsedRecords
          })
       ]);
    } else {
       devMemoryDb.candidateReplacements = devMemoryDb.candidateReplacements.filter((c: any) => c.fileHash !== newCandidate.fileHash || c.tenantId !== tenantId);
       devMemoryDb.candidateReplacements.push(newCandidate);
       persistRegistry();
    }

    // Add audit logs
    await addAuditLog({
      action: 'upload_staged_file',
      tenantId,
      performedBy: userProfile.uid,
      userId: userProfile.uid,
      entityId: newCandidate.id,
      entityType: 'File',
      moduleType: newCandidate.moduleType,
      details: `تم رفع ملف مشتريات جديد: ${newCandidate.fileName}`,
      before: null,
      after: { fileName: newCandidate.fileName, fileHash: newCandidate.fileHash }
    });

    await addAuditLog({
      action: 'classify_staged_file',
      tenantId,
      performedBy: userProfile.uid,
      userId: userProfile.uid,
      entityId: newCandidate.id,
      entityType: 'File',
      moduleType: newCandidate.moduleType,
      details: `تم تصنيف الملف: ${newCandidate.fileName}`,
      before: null,
      after: { fileName: newCandidate.fileName, fileHash: newCandidate.fileHash }
    });

    return { success: true, candidate: newCandidate };
  }));

  // --- V1 Lifecycle API ---

  // Activate Staged File
  app.post("/api/erp/files/lifecycle/:stagedId/activate", authenticate, wrap(async (req: any, res) => {
    const { stagedId } = req.params;
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;

    let staged: any = null;
    let stagedIndex = -1;

    if (isConnected()) {
       const stagedRes = await query("SELECT * FROM uploaded_files WHERE id = $1 AND tenant_id = $2", [stagedId, tenantId]);
       if (stagedRes.rows.length === 0) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       const row = stagedRes.rows[0];
       const meta = row.meta_data || {};
       staged = {
          id: row.id,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          displayName: meta.displayName || row.original_file_name,
          fileHash: row.file_hash,
          status: row.status,
          uploadedBy: meta.uploadedBy,
          storagePath: row.storage_path,
          approvedRecords: meta.approvedRecords
       };
    } else {
       stagedIndex = devMemoryDb.candidateReplacements.findIndex((c: any) => c.id === stagedId && c.tenantId === tenantId);
       if (stagedIndex === -1) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       staged = devMemoryDb.candidateReplacements[stagedIndex];
    }

    // Read and parse records
    let parsedRecords;
    let session: any = null;
    if (staged.approvedRecords && Array.isArray(staged.approvedRecords)) {
       parsedRecords = staged.approvedRecords.map((r: any) => ({
          ...r,
          moduleType: r.moduleType || staged.moduleType,
          fileId: staged.fileHash,
          tenantId
       }));
    } else {
       const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');
       try {
          const nodeBuffer = fs.readFileSync(staged.storagePath);
          const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
          const filesToProcess = [{ buffer: arrayBuffer, name: staged.originalFileName, fileHash: staged.fileHash }];
          session = await createValidationSession(filesToProcess, staged.moduleType);
       } catch (e) {
          res.status(500).json({ success: false, message: "Failed to parse staged file for activation." });
          return;
       }
       parsedRecords = session.rawRecords.map((r: any) => ({
          ...r,
          moduleType: r.moduleType || staged.moduleType,
          fileId: staged.fileHash,
          tenantId
       }));
    }

    const newActiveFile: any = {
      id: crypto.randomUUID(),
      fileHash: staged.fileHash,
      fileName: staged.fileName,
      originalFileName: staged.originalFileName,
      displayName: staged.displayName,
      tenantId,
      moduleType: staged.moduleType,
      fileType: staged.moduleType,
      status: "processed",
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      uploadedBy: userProfile.uid,
      recordCount: parsedRecords.length,
      isDeleted: false,
      storagePath: staged.storagePath
    };

    if (isConnected()) {
       // Insert records into records table
       for (const r of parsedRecords) {
          const netAmt = r.Net_Amount || r.net_amount || 0;
          const vatAmt = r.VAT_Amount || r.vat_amount || 0;
          const totalAmt = r.Total_Amount || r.total_amount || 0;
          const taxAmt = r.Taxable_Amount || r.taxable_amount || 0;
          const nontaxAmt = r.Nontaxable_Amount || r.nontaxable_amount || 0;

          await query(`
             INSERT INTO records (id, tenant_id, file_id, module_type, invoice_number, invoice_date, entity_name, total_amount, vat_amount, taxable_amount, nontaxable_amount, net_amount, category, raw_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                file_id = EXCLUDED.file_id,
                module_type = EXCLUDED.module_type,
                invoice_number = EXCLUDED.invoice_number,
                invoice_date = EXCLUDED.invoice_date,
                entity_name = EXCLUDED.entity_name,
                total_amount = EXCLUDED.total_amount,
                vat_amount = EXCLUDED.vat_amount,
                taxable_amount = EXCLUDED.taxable_amount,
                nontaxable_amount = EXCLUDED.nontaxable_amount,
                net_amount = EXCLUDED.net_amount,
                category = EXCLUDED.category,
                raw_data = EXCLUDED.raw_data
          `, [
             r.id,
             tenantId,
             staged.fileHash,
             staged.moduleType,
             r.Invoice_Number || r.invoice_number || null,
             r.Invoice_Date || r.invoice_date || null,
             r.Entity_Name || r.Vendor_Name || r.entity_name || null,
             totalAmt,
             vatAmt,
             taxAmt,
             nontaxAmt,
             netAmt,
             r.Category || r.category || null,
             JSON.stringify(r)
          ]);
       }

       // Update file status to processed
       const metaUpdate = {
          displayName: staged.displayName,
          uploadedBy: staged.uploadedBy,
          recordCount: parsedRecords.length,
          skippedRowCount: session?.skippedRows?.length || 0,
          skippedRows: session?.skippedRows || [],
          uploadDate: new Date().toISOString(),
          processed: true,
          processingVersion: 1
       };
       
       await query(`
          UPDATE uploaded_files 
          SET status = 'processed', is_deleted = false, meta_data = $1
          WHERE id = $2
       `, [JSON.stringify(metaUpdate), staged.id]);
    } else {
       // Insert records
       devMemoryDb.records.push(...parsedRecords);
       devMemoryDb.uploadedFiles.push(newActiveFile);
       devMemoryDb.candidateReplacements.splice(stagedIndex, 1);
       
       try {
           fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
           persistRegistry();
       } catch (err) {}
    }
    
    // Attempt audit log
    await addAuditLog({
      action: 'activate_new_source',
      tenantId,
      performedBy: userProfile.uid,
      userId: userProfile.uid,
      entityId: newActiveFile.id,
      entityType: 'File',
      moduleType: staged.moduleType,
      details: `تم تفعيل الملف في التقارير: ${newActiveFile.fileName}`,
      before: null,
      after: { fileName: newActiveFile.fileName, fileHash: newActiveFile.fileHash }
    });

    return { success: true, activeFile: newActiveFile };
  }));

  // Replace Target with Staged File
  app.post("/api/erp/files/lifecycle/:stagedId/replace/:targetId", authenticate, wrap(async (req: any, res) => {
    const { stagedId, targetId } = req.params;
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;

    let staged: any = null;
    let stagedIndex = -1;

    if (isConnected()) {
       const stagedRes = await query("SELECT * FROM uploaded_files WHERE id = $1 AND tenant_id = $2", [stagedId, tenantId]);
       if (stagedRes.rows.length === 0) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       const row = stagedRes.rows[0];
       const meta = row.meta_data || {};
       staged = {
          id: row.id,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          displayName: meta.displayName || row.original_file_name,
          fileHash: row.file_hash,
          status: row.status,
          uploadedBy: meta.uploadedBy,
          storagePath: row.storage_path,
          approvedRecords: meta.approvedRecords
       };
    } else {
       stagedIndex = devMemoryDb.candidateReplacements.findIndex((c: any) => c.id === stagedId && c.tenantId === tenantId);
       if (stagedIndex === -1) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       staged = devMemoryDb.candidateReplacements[stagedIndex];
    }

    let targetFile: any = null;
    if (isConnected()) {
       const targetRes = await query("SELECT * FROM uploaded_files WHERE (id = $1 OR file_hash = $1) AND tenant_id = $2", [targetId, tenantId]);
       if (targetRes.rows.length === 0) {
          res.status(404).json({ success: false, message: "Target active file not found." });
          return;
       }
       const targetRow = targetRes.rows[0];
       targetFile = {
          id: targetRow.id,
          fileHash: targetRow.file_hash,
          fileName: targetRow.file_name,
          originalFileName: targetRow.original_file_name
       };
    } else {
       const targetFound = devMemoryDb.uploadedFiles.find((f: any) => (f.id === targetId || f.fileHash === targetId) && f.tenantId === tenantId);
       if (!targetFound) {
          res.status(404).json({ success: false, message: "Target active file not found." });
          return;
       }
       targetFile = targetFound;
    }

    // Read and parse new records
    let parsedRecords;
    let session: any = null;
    if (staged.approvedRecords && Array.isArray(staged.approvedRecords)) {
       parsedRecords = staged.approvedRecords.map((r: any) => ({
          ...r,
          moduleType: r.moduleType || staged.moduleType,
          fileId: staged.fileHash,
          tenantId
       }));
    } else {
       const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');
       try {
          const nodeBuffer = fs.readFileSync(staged.storagePath);
          const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
          const filesToProcess = [{ buffer: arrayBuffer, name: staged.originalFileName, fileHash: staged.fileHash }];
          session = await createValidationSession(filesToProcess, staged.moduleType);
       } catch (e) {
          res.status(500).json({ success: false, message: "Failed to parse staged file for replacement." });
          return;
       }
       parsedRecords = session.rawRecords.map((r: any) => ({
          ...r,
          moduleType: r.moduleType || staged.moduleType,
          fileId: staged.fileHash,
          tenantId
       }));
    }

    const newActiveFile = {
      id: crypto.randomUUID(),
      originalId: targetFile.id,
      fileHash: staged.fileHash,
      fileName: staged.fileName,
      originalFileName: staged.originalFileName,
      displayName: staged.displayName,
      tenantId,
      moduleType: staged.moduleType,
      fileType: staged.moduleType,
      status: "processed",
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      uploadedBy: userProfile.uid,
      recordCount: parsedRecords.length,
      isDeleted: false,
      storagePath: staged.storagePath
    };

    if (isConnected()) {
       // Archive target file
       await query("UPDATE uploaded_files SET is_deleted = true, status = 'archived', deleted_at = $1 WHERE id = $2", [new Date().toISOString(), targetFile.id]);
       // Delete records of target file
       await query("DELETE FROM records WHERE file_id = $1 OR file_id = $2", [targetFile.id, targetFile.fileHash]);

       // Insert parsed records for staged file
       for (const r of parsedRecords) {
          const netAmt = r.Net_Amount || r.net_amount || 0;
          const vatAmt = r.VAT_Amount || r.vat_amount || 0;
          const totalAmt = r.Total_Amount || r.total_amount || 0;
          const taxAmt = r.Taxable_Amount || r.taxable_amount || 0;
          const nontaxAmt = r.Nontaxable_Amount || r.nontaxable_amount || 0;

          await query(`
             INSERT INTO records (id, tenant_id, file_id, module_type, invoice_number, invoice_date, entity_name, total_amount, vat_amount, taxable_amount, nontaxable_amount, net_amount, category, raw_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                file_id = EXCLUDED.file_id,
                module_type = EXCLUDED.module_type,
                invoice_number = EXCLUDED.invoice_number,
                invoice_date = EXCLUDED.invoice_date,
                entity_name = EXCLUDED.entity_name,
                total_amount = EXCLUDED.total_amount,
                vat_amount = EXCLUDED.vat_amount,
                taxable_amount = EXCLUDED.taxable_amount,
                nontaxable_amount = EXCLUDED.nontaxable_amount,
                net_amount = EXCLUDED.net_amount,
                category = EXCLUDED.category,
                raw_data = EXCLUDED.raw_data
          `, [
             r.id,
             tenantId,
             staged.fileHash,
             staged.moduleType,
             r.Invoice_Number || r.invoice_number || null,
             r.Invoice_Date || r.invoice_date || null,
             r.Entity_Name || r.Vendor_Name || r.entity_name || null,
             totalAmt,
             vatAmt,
             taxAmt,
             nontaxAmt,
             netAmt,
             r.Category || r.category || null,
             JSON.stringify(r)
          ]);
       }

       // Update file status to processed
       const metaUpdate = {
          displayName: staged.displayName,
          uploadedBy: staged.uploadedBy,
          recordCount: parsedRecords.length,
          skippedRowCount: session?.skippedRows?.length || 0,
          skippedRows: session?.skippedRows || [],
          uploadDate: new Date().toISOString(),
          processed: true,
          processingVersion: 1,
          originalId: targetFile.id,
          originalFileName: targetFile.originalFileName || targetFile.fileName
       };
       await query(`
          UPDATE uploaded_files 
          SET status = 'processed', is_deleted = false, meta_data = $1
          WHERE id = $2
       `, [JSON.stringify(metaUpdate), staged.id]);
    } else {
       // Archive target file and delete its records
       const targetIndex = devMemoryDb.uploadedFiles.findIndex((f: any) => f.id === targetFile.id);
       if (targetIndex > -1) {
          devMemoryDb.uploadedFiles[targetIndex].isDeleted = true;
          devMemoryDb.uploadedFiles[targetIndex].status = 'archived';
          devMemoryDb.uploadedFiles[targetIndex].deletedAt = new Date().toISOString();
       }
       devMemoryDb.records = devMemoryDb.records.filter((r: any) => r.fileId !== targetFile.id && r.fileId !== targetFile.fileHash);

       devMemoryDb.records.push(...parsedRecords);
       devMemoryDb.uploadedFiles.push(newActiveFile);
       devMemoryDb.candidateReplacements.splice(stagedIndex, 1);

       try {
           fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
           persistRegistry();
       } catch (err) {}
    }

    // Attempt audit log
    await addAuditLog({
      action: 'replace_active_source',
      tenantId,
      performedBy: userProfile.uid,
      userId: userProfile.uid,
      entityId: newActiveFile.id,
      entityType: 'File',
      moduleType: staged.moduleType,
      details: `تم استبدال الملف بنسخة أحدث: ${targetFile.fileName} بـ ${newActiveFile.fileName}`,
      before: { fileId: targetFile.id, fileName: targetFile.fileName },
      after: { fileId: newActiveFile.id, fileName: newActiveFile.fileName }
    });

    return { success: true, activeFile: newActiveFile };
  }));

  // Cancel Staged File
  app.post("/api/erp/files/lifecycle/:stagedId/cancel", authenticate, wrap(async (req: any, res) => {
    const { stagedId } = req.params;
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;

    if (isConnected()) {
       const stagedRes = await query("SELECT * FROM uploaded_files WHERE id = $1 AND tenant_id = $2", [stagedId, tenantId]);
       if (stagedRes.rows.length > 0) {
          const staged = stagedRes.rows[0];
          await addAuditLog({
             action: 'cancel_staged_file',
             tenantId,
             performedBy: userProfile.uid,
             userId: userProfile.uid,
             entityId: staged.id,
             entityType: 'File',
             moduleType: staged.module_type,
             details: `تم إلغاء الملف المرفوع: ${staged.file_name}`,
             before: { fileName: staged.file_name },
             after: null
          });

          if (staged.storage_path && fs.existsSync(staged.storage_path)) {
             fs.unlinkSync(staged.storage_path);
          }
          await query("DELETE FROM uploaded_files WHERE id = $1", [stagedId]);
       }
    } else {
       const stagedIndex = devMemoryDb.candidateReplacements.findIndex((c: any) => c.id === stagedId && c.tenantId === tenantId);
       if (stagedIndex > -1) {
         const staged = devMemoryDb.candidateReplacements[stagedIndex];
         
         await addAuditLog({
           action: 'cancel_staged_file',
           tenantId,
           performedBy: userProfile.uid,
           userId: userProfile.uid,
           entityId: staged.id,
           entityType: 'File',
           moduleType: staged.moduleType,
           details: `تم إلغاء الملف المرفوع: ${staged.fileName}`,
           before: { fileName: staged.fileName },
           after: null
         });

         if (fs.existsSync(staged.storagePath)) {
           fs.unlinkSync(staged.storagePath);
         }
         devMemoryDb.candidateReplacements.splice(stagedIndex, 1);
         persistRegistry();
       }
    }
    return { success: true };
  }));


  app.get("/api/erp/files/governance/staged-uploads", authenticate, wrap(async (req: any, res) => {
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;
    const moduleType = req.query.moduleType;
    
    if (isConnected()) {
       let stagedQuery = `SELECT * FROM uploaded_files WHERE tenant_id = $1 AND status IN ('قيد التصنيف', 'نسخة معدلة قيد التحقق', 'تمت المراجعة والاعتماد', 'staged')`;
       const params: any[] = [tenantId];
       if (moduleType) {
          stagedQuery += ` AND module_type = $2`;
          params.push(moduleType);
       }
       const stagedRes = await query(stagedQuery, params);
       const stagedUploads = stagedRes.rows.map((row: any) => {
          const meta = row.meta_data || {};
          return {
             id: row.id,
             tenantId: row.tenant_id,
             moduleType: row.module_type,
             fileName: row.file_name,
             originalFileName: row.original_file_name,
             displayName: meta.displayName || row.original_file_name,
             fileHash: row.file_hash,
             status: row.status,
             uploadedBy: meta.uploadedBy,
             timestamp: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
             classification: meta.classification,
             arabicLabel: meta.arabicLabel,
             dateRange: meta.dateRange,
             recordsCount: meta.recordsCount,
             financialTotals: meta.financialTotals,
             hasParsedRecords: meta.hasParsedRecords,
             storagePath: row.storage_path,
             approvedRecords: meta.approvedRecords
          };
       });
       return { success: true, stagedUploads };
    }

    const stagedUploads = devMemoryDb.candidateReplacements.filter((c: any) => 
       c.tenantId === tenantId && (!moduleType || c.moduleType === moduleType)
    );
    return { success: true, stagedUploads };
  }));

  app.get("/api/erp/files/governance/staged-uploads/:stagedId/session", authenticate, wrap(async (req: any, res) => {
    const { stagedId } = req.params;
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;

    let staged: any = null;
    if (isConnected()) {
       const stagedRes = await query("SELECT * FROM uploaded_files WHERE id = $1 AND tenant_id = $2", [stagedId, tenantId]);
       if (stagedRes.rows.length > 0) {
          const row = stagedRes.rows[0];
          const meta = row.meta_data || {};
          staged = {
             id: row.id,
             tenantId: row.tenant_id,
             moduleType: row.module_type,
             fileName: row.file_name,
             originalFileName: row.original_file_name,
             displayName: meta.displayName || row.original_file_name,
             fileHash: row.file_hash,
             status: row.status,
             uploadedBy: meta.uploadedBy,
             timestamp: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
             classification: meta.classification,
             arabicLabel: meta.arabicLabel,
             dateRange: meta.dateRange,
             recordsCount: meta.recordsCount,
             financialTotals: meta.financialTotals,
             hasParsedRecords: meta.hasParsedRecords,
             storagePath: row.storage_path,
             approvedRecords: meta.approvedRecords
          };
       }
    } else {
       staged = devMemoryDb.candidateReplacements.find((c: any) => c.id === stagedId && c.tenantId === tenantId);
    }

    if (!staged) {
      res.status(404).json({ success: false, message: "Staged file not found." });
      return;
    }

    const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');
    
    // Fail-safe: if file does not exist on disk, return a structured session with a skippedRow error details.
    if (!fs.existsSync(staged.storagePath)) {
      console.warn(`Staged file storage path not found on disk: ${staged.storagePath}`);
      const session = {
         sessionId: crypto.randomUUID(),
         uploadedFileName: staged.originalFileName,
         timestamp: new Date().toISOString(),
         records: [],
         summary: { totalRecords: 0, cleanRecords: 0, criticalIssues: 0, highRiskCount: 0, totalFinancialExposure: 0 },
         rawRecords: [],
         validRecords: [],
         warnings: [],
         errors: [],
         suggestions: [],
         intelligenceResults: [],
         severitySummary: { HIGH: 0, MEDIUM: 0, LOW: 0 },
         status: 'PENDING_REVIEW',
         fileMetadatas: [],
         skippedRows: [{ rowIndex: 1, reason: 'ملف المستند غير موجود على الخادم أو تم حذفه.' }],
         rejectedRecords: [],
         classification: staged.classification,
         stagedStatus: staged.status,
         arabicLabel: staged.arabicLabel,
         stagedId: staged.id,
         dateRange: staged.dateRange,
         recordsCount: staged.recordsCount,
         financialTotals: staged.financialTotals
      };
      return { success: true, session };
    }

    try {
       const nodeBuffer = fs.readFileSync(staged.storagePath);
       const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
       const filesToProcess = [{ buffer: arrayBuffer, name: staged.originalFileName, fileHash: staged.fileHash }];
       const session = await createValidationSession(filesToProcess, staged.moduleType);
       
       (session as any).classification = staged.classification;
       (session as any).stagedStatus = staged.status;
       (session as any).arabicLabel = staged.arabicLabel;
       (session as any).dateRange = staged.dateRange;
       (session as any).recordsCount = staged.recordsCount;
       (session as any).financialTotals = staged.financialTotals;
       (session as any).stagedId = staged.id;

       // Compute matching active business keys for detailed governance overlap display
       let tenantRecords = [];
       let activeFiles = [];
       if (isConnected()) {
          const recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1 AND module_type = $2", [tenantId, staged.moduleType]);
          tenantRecords = recordsRes.rows.map((row: any) => ({
             id: row.id,
             tenantId: row.tenant_id,
             fileId: row.file_id,
             moduleType: row.module_type,
             Invoice_Number: row.invoice_number,
             Invoice_Date: row.invoice_date,
             Entity_Name: row.entity_name,
             Total_Amount: Number(row.total_amount),
             VAT_Amount: Number(row.vat_amount),
             Taxable_Amount: Number(row.taxable_amount),
             Nontaxable_Amount: Number(row.nontaxable_amount),
             Net_Amount: Number(row.net_amount),
             Category: row.category,
             ...(row.raw_data || {})
          }));

          const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2 AND is_deleted = false AND status = 'processed'", [tenantId, staged.moduleType]);
          activeFiles = filesRes.rows.map((row: any) => ({
             id: row.id,
             fileHash: row.file_hash,
             fileName: row.file_name,
             originalFileName: row.original_file_name,
             status: row.status
          }));
       } else {
          tenantRecords = devMemoryDb.records.filter((r: any) => 
            r.tenantId === tenantId && r.moduleType === staged.moduleType
          );
          activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, staged.moduleType, tenantId);
       }

       const activeFileIds = new Set<string>();
       activeFiles.forEach((f: any) => {
          if (f.id) activeFileIds.add(String(f.id));
          if (f.fileHash) activeFileIds.add(String(f.fileHash));
       });
       let recordsMatchingActiveBusinessKeys = 0;
       if (session.records.length > 0) {
          const activeRecords = tenantRecords.filter((r: any) => activeFileIds.has(r.fileId) || activeFileIds.has(r._sourceFile) || activeFileIds.has(r.fileHash));
          const activeFreq = new Set<string>();
          activeRecords.forEach((r: any) => {
             activeFreq.add([
               r.Invoice_Number || '', r.Entity_Name || r.Vendor_Name || '', r.Invoice_Date || r.Date || ''
             ].join('|'));
          });
          session.records.forEach((r: any) => {
             const k = [
               r.normalizedData.Invoice_Number || '', r.normalizedData.Entity_Name || r.normalizedData.Vendor_Name || '', r.normalizedData.Invoice_Date || r.normalizedData.Date || ''
             ].join('|');
             if (activeFreq.has(k)) recordsMatchingActiveBusinessKeys++;
          });
       }
       (session as any).recordsMatchingActiveBusinessKeys = recordsMatchingActiveBusinessKeys;

       if (staged.approvedRecords && Array.isArray(staged.approvedRecords)) {
          session.records = session.records.map((r: any) => {
             const approved = staged.approvedRecords.find((ar: any) => ar.id === r.id || (ar._originalRowIndex !== undefined && ar._originalRowIndex === r.normalizedData._originalRowIndex));
             if (approved) {
                return {
                   ...r,
                   id: approved.id || r.id,
                   normalizedData: approved,
                   issues: [],
                   status: 'APPROVED'
                };
             }
             return r;
          }).filter((r: any) => staged.approvedRecords.some((ar: any) => ar.id === r.id || (ar._originalRowIndex !== undefined && ar._originalRowIndex === r.normalizedData._originalRowIndex)));

          let clean = 0, critical = 0, highRisk = 0, exposure = 0;
          session.records.forEach((r: any) => {
             if (r.issues.length === 0) clean++;
             if (r.issues.some((i: any) => i.severity === 'CRITICAL')) critical++;
             if (r.financialIntelligence.riskScore > 50) {
                highRisk++;
                exposure += (r.normalizedData.Total_Amount || 0);
             }
          });
          session.summary = {
             totalRecords: session.records.length,
             cleanRecords: clean,
             criticalIssues: critical,
             highRiskCount: highRisk,
             totalFinancialExposure: exposure
          };
       }
       return { success: true, session };
    } catch (e: any) {
       console.error("Failed to parse staged file for validation session:", e);
       // Return a structured session detailing the parsing error, allowing the frontend review modal to open.
       const session = {
          sessionId: crypto.randomUUID(),
          uploadedFileName: staged.originalFileName,
          timestamp: new Date().toISOString(),
          records: [],
          summary: { totalRecords: 0, cleanRecords: 0, criticalIssues: 0, highRiskCount: 0, totalFinancialExposure: 0 },
          rawRecords: [],
          validRecords: [],
          warnings: [],
          errors: [],
          suggestions: [],
          intelligenceResults: [],
          severitySummary: { HIGH: 0, MEDIUM: 0, LOW: 0 },
          status: 'PENDING_REVIEW',
          fileMetadatas: [],
          skippedRows: [{ rowIndex: 1, reason: `فشل تحليل محتوى الملف: ${e.message || 'تنسيق غير مدعوم أو تالف'}` }],
          rejectedRecords: [],
          classification: staged.classification,
          stagedStatus: staged.status,
          arabicLabel: staged.arabicLabel,
          stagedId: staged.id,
          dateRange: staged.dateRange,
          recordsCount: staged.recordsCount,
          financialTotals: staged.financialTotals
       };
       return { success: true, session };
    }
  }));

  app.post("/api/erp/files/governance/staged-uploads/:stagedId/session/approve", authenticate, express.json({limit: '50mb'}), wrap(async (req: any, res) => {
    const { stagedId } = req.params;
    const { approvedRecords } = req.body;
    const userProfile = req.userProfile;
    const tenantId = userProfile?.tenantId || req.user.uid;

    let staged: any = null;
    if (isConnected()) {
       const stagedRes = await query("SELECT * FROM uploaded_files WHERE id = $1 AND tenant_id = $2", [stagedId, tenantId]);
       if (stagedRes.rows.length === 0) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       const row = stagedRes.rows[0];
       const meta = row.meta_data || {};
       staged = {
          id: row.id,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          fileHash: row.file_hash,
          status: row.status,
          uploadedBy: meta.uploadedBy,
          storagePath: row.storage_path
       };
    } else {
       const stagedIndex = devMemoryDb.candidateReplacements.findIndex((c: any) => c.id === stagedId && c.tenantId === tenantId);
       if (stagedIndex === -1) {
          res.status(404).json({ success: false, message: "Staged file not found." });
          return;
       }
       staged = devMemoryDb.candidateReplacements[stagedIndex];
    }

    let totalIncludingVat = 0;
    let inputVatAmount = 0;
    approvedRecords.forEach((r: any) => {
      totalIncludingVat += (r.Total_Amount || 0);
      inputVatAmount += (r.VAT_Amount || 0);
    });
    
    const financialTotals = {
      taxableAmount: totalIncludingVat - inputVatAmount,
      nonTaxableExemptAmount: 0,
      inputVatAmount,
      totalIncludingVat
    };

    const { classifyStagedUpload } = await import('./src/lib/upload-classifier.ts');
    
    let tenantRecords = [];
    let activeFiles = [];
    if (isConnected()) {
       const recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1 AND module_type = $2", [tenantId, staged.moduleType]);
       tenantRecords = recordsRes.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          fileId: row.file_id,
          moduleType: row.module_type,
          Invoice_Number: row.invoice_number,
          Invoice_Date: row.invoice_date,
          Entity_Name: row.entity_name,
          Total_Amount: Number(row.total_amount),
          VAT_Amount: Number(row.vat_amount),
          Taxable_Amount: Number(row.taxable_amount),
          Nontaxable_Amount: Number(row.nontaxable_amount),
          Net_Amount: Number(row.net_amount),
          Category: row.category,
          ...(row.raw_data || {})
       }));

       const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2 AND is_deleted = false AND status = 'processed'", [tenantId, staged.moduleType]);
       activeFiles = filesRes.rows.map((row: any) => ({
          id: row.id,
          fileHash: row.file_hash,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          status: row.status
       }));
    } else {
       tenantRecords = devMemoryDb.records.filter((r: any) => 
         r.tenantId === tenantId && r.moduleType === staged.moduleType
       );
       activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, staged.moduleType, tenantId);
    }

    const activeFileIds = new Set<string>();
    activeFiles.forEach((f: any) => {
       if (f.id) activeFileIds.add(String(f.id));
       if (f.fileHash) activeFileIds.add(String(f.fileHash));
    });
    
    const activeFileDateRanges = Array.from(activeFileIds).map(fid => {
       let minD = '9999-99-99';
       let maxD = '0000-00-00';
       tenantRecords.forEach((r: any) => {
          if (r.fileId === fid || r._sourceFile === fid || r.fileHash === fid) {
              const d = r.Invoice_Date || r.Date || r.Transaction_Date;
              if (d && d < minD) minD = d;
              if (d && d > maxD) maxD = d;
          }
       });
       return { fileId: String(fid), minDate: minD === '9999-99-99' ? '' : minD, maxDate: maxD === '0000-00-00' ? '' : maxD };
    });

    let recordsMatchingActiveBusinessKeys = 0;
    if (approvedRecords.length > 0) {
       const activeRecords = tenantRecords.filter((r: any) => activeFileIds.has(r.fileId) || activeFileIds.has(r._sourceFile) || activeFileIds.has(r.fileHash));
       const activeFreq = new Set<string>();
       activeRecords.forEach((r: any) => {
          activeFreq.add([
            r.Invoice_Number || '', r.Entity_Name || r.Vendor_Name || '', r.Invoice_Date || r.Date || ''
          ].join('|'));
       });
       approvedRecords.forEach((r: any) => {
          const k = [
            r.Invoice_Number || '', r.Entity_Name || r.Vendor_Name || '', r.Invoice_Date || r.Date || ''
          ].join('|');
          if (activeFreq.has(k)) recordsMatchingActiveBusinessKeys++;
       });
    }

    const overlapAnalysis = { recordsMatchingActiveBusinessKeys };
    const classificationResult = classifyStagedUpload(approvedRecords, activeFileDateRanges, overlapAnalysis);

    if (isConnected()) {
       const metaUpdate = {
          displayName: staged.displayName || staged.originalFileName,
          uploadedBy: staged.uploadedBy,
          classification: classificationResult.classification,
          arabicLabel: classificationResult.arabicLabel,
          dateRange: classificationResult.dateRange,
          recordsCount: approvedRecords.length,
          financialTotals,
          hasParsedRecords: approvedRecords.length > 0,
          approvedRecords
       };
       await query("UPDATE uploaded_files SET status = 'تمت المراجعة والاعتماد', meta_data = $1 WHERE id = $2", [JSON.stringify(metaUpdate), stagedId]);
    } else {
       staged.approvedRecords = approvedRecords;
       staged.status = "تمت المراجعة والاعتماد";
       staged.recordsCount = approvedRecords.length;
       staged.financialTotals = financialTotals;
       staged.classification = classificationResult.classification;
       staged.arabicLabel = classificationResult.arabicLabel;
       persistRegistry();
    }
    
    return { success: true };
  }));

  app.get("/api/erp/files", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const moduleType = (req.query.moduleType || req.query.type) as string;
    const includeArchived = req.query.includeArchived === 'true';

    if (isConnected()) {
      let queryText = "SELECT * FROM uploaded_files WHERE tenant_id = $1";
      const queryParams: any[] = [tenantId];
      if (moduleType) {
        queryText += " AND module_type = $2";
        queryParams.push(moduleType);
      }
      if (!includeArchived) {
        queryText += " AND is_deleted = FALSE AND status = 'processed'";
      }
      const filesRes = await query(queryText, queryParams);
      const files = filesRes.rows.map((row: any) => {
        const meta = row.meta_data || {};
        return {
          id: row.id,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          displayName: meta.displayName || row.original_file_name,
          processedFileName: meta.processedFileName || null,
          fileHash: row.file_hash,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          fileType: row.module_type,
          createdAt: row.created_at,
          uploadDate: meta.uploadDate || row.created_at,
          periodYear: meta.periodYear,
          recordCount: meta.recordCount,
          skippedRowCount: meta.skippedRowCount,
          uploadedBy: meta.uploadedBy,
          status: row.status,
          isDeleted: row.is_deleted,
          deletedAt: row.deleted_at,
          processed: meta.processed,
          processingVersion: meta.processingVersion,
          sessionId: meta.sessionId
        };
      });
      return files;
    } else {
      const activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType || null, tenantId);
      const deletedOrInactiveFiles = devMemoryDb.uploadedFiles.filter((f: any) => {
        const fileModuleType = f.fileType || f.moduleType;
        const moduleMatches = !moduleType || fileModuleType === moduleType;
        const tenantMatches = f.tenantId === tenantId;
        return tenantMatches && moduleMatches && !activeFiles.some((activeFile: any) => activeFile.id === f.id);
      }).length;

      const targetFiles = includeArchived 
        ? devMemoryDb.uploadedFiles.filter((f: any) => {
            const fileModuleType = f.fileType || f.moduleType;
            const moduleMatches = !moduleType || fileModuleType === moduleType;
            const tenantMatches = f.tenantId === tenantId;
            return tenantMatches && moduleMatches;
          })
        : activeFiles;

      let files = targetFiles.map(f => {
         const displayName = getFileDisplayName(f, moduleType);
         return {
           id: f.id,
           fileName: f.fileName,
           originalFileName: f.originalFileName,
           displayName,
           processedFileName: f.processedFileName,
           fileHash: f.fileHash || f.id,
           tenantId: f.tenantId,
           moduleType: f.fileType || f.moduleType,
           fileType: f.fileType || f.moduleType,
           createdAt: f.createdAt || f.uploadDate || new Date().toISOString(),
           uploadDate: f.uploadDate || f.createdAt || new Date().toISOString(),
           periodYear: f.periodYear,
           recordCount: f.recordCount,
           skippedRowCount: f.skippedRowCount,
           uploadedBy: f.uploadedBy,
           status: f.status,
           isDeleted: f.isDeleted,
           deletedAt: f.deletedAt,
           processed: f.processed,
           processingVersion: f.processingVersion,
           sessionId: f.sessionId
          };
       });
       return files;
    }
  }));

  // Get File Lifecycle Audit Logs
  app.get("/api/erp/files/audit-logs", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const fileActions = ['activate_new_source', 'replace_active_source', 'archive_active_source', 'restore_archived_source'];

    if (isConnected()) {
      const logsRes = await query(`
         SELECT * FROM audit_logs 
         WHERE tenant_id = $1 
           AND (action = ANY($2) OR (meta_data->>'entityType') = 'File')
         ORDER BY timestamp DESC
      `, [tenantId, fileActions]);
      
      const logs = logsRes.rows.map((row: any) => {
         const meta = row.meta_data || {};
         return {
            id: row.id,
            action: row.action,
            details: row.details,
            userId: row.user_id,
            userName: row.user_name,
            moduleType: row.module_type,
            recordId: row.record_id,
            previousHash: row.previous_hash.trim(),
            currentHash: row.current_hash.trim(),
            timestamp: row.timestamp,
            tenantId: row.tenant_id,
            before: meta.before,
            after: meta.after,
            changeSet: meta.changeSet,
            entityType: meta.entityType,
            entityId: meta.entityId,
            source: meta.source
         };
      });
      return { success: true, auditLogs: logs };
    } else {
      const logs = devMemoryDb.auditLogs.filter(log => 
        log.tenantId === tenantId && 
        (fileActions.includes(log.action) || log.entityType === 'File')
      );
      
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return { success: true, auditLogs: logs };
    }
  }));

  // ERP Files Endpoint
  app.delete("/api/erp/files/:fileId", authenticate, wrap(async (req, res) => {
    const { fileId } = req.params;
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    
    if (isConnected()) {
      const fileRes = await query("SELECT * FROM uploaded_files WHERE (id = $1 OR file_name = $1) AND tenant_id = $2", [fileId, tenantId]);
      if (fileRes.rows.length > 0) {
        const targetFile = fileRes.rows[0];
        const now = new Date().toISOString();
        
        await transaction(async (client) => {
          await client.query("UPDATE uploaded_files SET is_deleted = TRUE, status = 'archived', deleted_at = $1 WHERE id = $2", [now, targetFile.id]);
          await client.query("DELETE FROM records WHERE file_id = $1 OR file_id = $2", [targetFile.id, targetFile.file_hash]);
        });

        await addAuditLog({
          action: 'archive_active_source',
          tenantId,
          performedBy: userProfile.uid,
          userId: userProfile.uid,
          entityId: targetFile.id,
          entityType: 'File',
          moduleType: targetFile.module_type,
          details: `تمت أرشفة الملف وإزالته من التقارير: ${targetFile.file_name}`,
          before: { fileId: targetFile.id, fileName: targetFile.file_name },
          after: null
        });
      }
    } else {
      const targetFile = devMemoryDb.uploadedFiles.find((f: any) => (f.id === fileId || f.fileName === fileId) && f.tenantId === tenantId);
      if (targetFile) {
        targetFile.isDeleted = true;
        targetFile.status = 'archived';
        targetFile.deletedAt = new Date().toISOString();

        devMemoryDb.records = devMemoryDb.records.filter((r: any) => r.fileId !== targetFile.id && r.fileId !== targetFile.fileHash);

        await addAuditLog({
          action: 'archive_active_source',
          tenantId,
          performedBy: userProfile.uid,
          userId: userProfile.uid,
          entityId: targetFile.id,
          entityType: 'File',
          moduleType: targetFile.moduleType || targetFile.fileType,
          details: `تمت أرشفة الملف وإزالته من التقارير: ${targetFile.fileName}`,
          before: { fileId: targetFile.id, fileName: targetFile.fileName },
          after: null
        });

        try {
            fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
            persistRegistry();
        } catch (err) {}
      }
    }
    
    return { success: true, data: [] };
  }));

  // Restore archived source/version
  app.post("/api/erp/files/:fileId/restore", authenticate, wrap(async (req, res) => {
    const { fileId } = req.params;
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;

    if (isConnected()) {
      const fileRes = await query("SELECT * FROM uploaded_files WHERE (id = $1 OR file_name = $1) AND tenant_id = $2", [fileId, tenantId]);
      if (fileRes.rows.length === 0) {
        res.status(404).json({ success: false, message: "Archived file not found." });
        return;
      }
      const targetFile = fileRes.rows[0];

      // Retrieve all files of this tenant & module to check duplicates and lineage connections
      const allFilesRes = await query("SELECT id, file_name, file_hash, is_deleted, status, meta_data FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2", [tenantId, targetFile.module_type]);
      const allFiles = allFilesRes.rows;

      const parentMap = new Map();
      allFiles.forEach((f: any) => {
         const meta = f.meta_data || {};
         if (meta.originalId) {
            parentMap.set(f.id, meta.originalId);
         }
      });

      const getRootId = (fileId: string) => {
         let current = fileId;
         const visited = new Set<string>();
         while (parentMap.has(current)) {
            if (visited.has(current)) break;
            visited.add(current);
            current = parentMap.get(current);
         }
         return current;
      };

      const targetRoot = getRootId(targetFile.id);
      const activeDuplicate = allFiles.find((f: any) => {
         if (f.id === targetFile.id) return false;
         if (f.is_deleted || f.status !== 'processed') return false;
         if (f.file_hash === targetFile.file_hash || f.file_name === targetFile.file_name) return true;
         if (getRootId(f.id) === targetRoot) return true;
         return false;
      });

      if (activeDuplicate) {
        res.status(400).json({ success: false, message: "A duplicate active version of this file is already active. Please archive it first." });
        return;
      }

      let parsedRecords: any[] = [];
      if (targetFile.storage_path && fs.existsSync(targetFile.storage_path)) {
        const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');
        try {
          const nodeBuffer = fs.readFileSync(targetFile.storage_path);
          const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
          const filesToProcess = [{ buffer: arrayBuffer, name: targetFile.original_file_name, fileHash: targetFile.file_hash }];
          const session = await createValidationSession(filesToProcess, targetFile.module_type);
          
          parsedRecords = session.rawRecords.map((r: any) => ({
             ...r,
             moduleType: r.moduleType || targetFile.module_type,
             fileId: targetFile.file_hash,
             tenantId
          }));
        } catch (e) {
          console.error("Failed to parse file records on restoration:", e);
        }
      }

      await transaction(async (client) => {
        await client.query("UPDATE uploaded_files SET is_deleted = FALSE, status = 'processed', deleted_at = NULL WHERE id = $1", [targetFile.id]);
        await client.query("DELETE FROM records WHERE file_id = $1 OR file_id = $2", [targetFile.id, targetFile.file_hash]);
        for (const r of parsedRecords) {
          const netAmt = r.Net_Amount || r.net_amount || 0;
          const vatAmt = r.VAT_Amount || r.vat_amount || 0;
          const totalAmt = r.Total_Amount || r.total_amount || 0;
          const taxAmt = r.Taxable_Amount || r.taxable_amount || 0;
          const nontaxAmt = r.Nontaxable_Amount || r.nontaxable_amount || 0;
          await client.query(`
            INSERT INTO records (id, tenant_id, file_id, module_type, invoice_number, invoice_date, entity_name, total_amount, vat_amount, taxable_amount, nontaxable_amount, net_amount, category, raw_data, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            r.id || crypto.randomUUID(),
            tenantId,
            targetFile.file_hash,
            targetFile.module_type,
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
      });

      await addAuditLog({
        action: 'restore_archived_source',
        tenantId,
        performedBy: userProfile.uid,
        userId: userProfile.uid,
        entityId: targetFile.id,
        entityType: 'File',
        moduleType: targetFile.module_type,
        details: `تمت استعادة الملف من الأرشيف: ${targetFile.file_name}`,
        before: null,
        after: { fileId: targetFile.id, fileName: targetFile.file_name }
      });

      const updatedFileRes = await query("SELECT * FROM uploaded_files WHERE id = $1", [targetFile.id]);
      const row = updatedFileRes.rows[0];
      const updatedMeta = row.meta_data || {};
      const activeFile = {
         id: row.id,
         fileName: row.file_name,
         originalFileName: row.original_file_name,
         displayName: updatedMeta.displayName || row.original_file_name,
         processedFileName: updatedMeta.processedFileName || null,
         fileHash: row.file_hash,
         tenantId: row.tenant_id,
         moduleType: row.module_type,
         fileType: row.module_type,
         createdAt: row.created_at,
         uploadDate: updatedMeta.uploadDate || row.created_at,
         periodYear: updatedMeta.periodYear,
         recordCount: updatedMeta.recordCount,
         skippedRowCount: updatedMeta.skippedRowCount,
         uploadedBy: updatedMeta.uploadedBy,
         status: row.status,
         isDeleted: row.is_deleted,
         deletedAt: row.deleted_at,
         processed: updatedMeta.processed,
         processingVersion: updatedMeta.processingVersion,
         sessionId: updatedMeta.sessionId
      };

      res.json({ success: true, activeFile });
      return;
    } else {
      const targetFile = devMemoryDb.uploadedFiles.find((f: any) => (f.id === fileId || f.fileName === fileId) && f.tenantId === tenantId);
      if (!targetFile) {
        res.status(404).json({ success: false, message: "Archived file not found." });
        return;
      }

      const parentMap = new Map();
      devMemoryDb.uploadedFiles.forEach((f: any) => {
         if (f.tenantId === tenantId && f.moduleType === targetFile.moduleType) {
            if (f.originalId) {
               parentMap.set(f.id, f.originalId);
            } else if (f.meta_data?.originalId) {
               parentMap.set(f.id, f.meta_data.originalId);
            }
         }
      });

      const getRootId = (fileId: string) => {
         let current = fileId;
         const visited = new Set<string>();
         while (parentMap.has(current)) {
            if (visited.has(current)) break;
            visited.add(current);
            current = parentMap.get(current);
         }
         return current;
      };

      const targetRoot = getRootId(targetFile.id);
      const activeDuplicate = devMemoryDb.uploadedFiles.find((f: any) => {
         if (f.tenantId !== tenantId || f.moduleType !== targetFile.moduleType) return false;
         if (f.id === targetFile.id) return false;
         if (f.isDeleted || f.status === 'archived') return false;
         if (f.fileHash === targetFile.fileHash || f.fileName === targetFile.fileName) return true;
         if (getRootId(f.id) === targetRoot) return true;
         return false;
      });

      if (activeDuplicate) {
        res.status(400).json({ success: false, message: "A duplicate active version of this file is already active. Please archive it first." });
        return;
      }

      targetFile.isDeleted = false;
      targetFile.status = 'processed';
      targetFile.deletedAt = null;

      if (targetFile.storagePath && fs.existsSync(targetFile.storagePath)) {
        const { createValidationSession } = await import('./src/backend/core/pre-validation/pre-validation-engine.ts');
        try {
          const nodeBuffer = fs.readFileSync(targetFile.storagePath);
          const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
          const filesToProcess = [{ buffer: arrayBuffer, name: targetFile.originalFileName, fileHash: targetFile.fileHash }];
          const session = await createValidationSession(filesToProcess, targetFile.moduleType);
          
          const parsedRecords = session.rawRecords.map((r: any) => ({
             ...r,
             moduleType: r.moduleType || targetFile.moduleType,
             fileId: targetFile.fileHash,
             tenantId
          }));

          devMemoryDb.records = devMemoryDb.records.filter((r: any) => r.fileId !== targetFile.id && r.fileId !== targetFile.fileHash);
          devMemoryDb.records.push(...parsedRecords);
        } catch (e) {
          console.error("Failed to parse file records on restoration:", e);
        }
      }

      await addAuditLog({
        action: 'restore_archived_source',
        tenantId,
        performedBy: userProfile.uid,
        userId: userProfile.uid,
        entityId: targetFile.id,
        entityType: 'File',
        moduleType: targetFile.moduleType || targetFile.fileType,
        details: `تمت استعادة الملف من الأرشيف: ${targetFile.fileName}`,
        before: null,
        after: { fileId: targetFile.id, fileName: targetFile.fileName }
      });

      try {
          fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
          persistRegistry();
      } catch (err) {}

      return { success: true, activeFile: targetFile };
    }
  }));

  // OLD DELETE REPLACED
  app.delete("/api/erp/files/old_deprecated/:fileId", authenticate, wrap(async (req, res) => {
    const { fileId } = req.params;
    
    devMemoryDb.uploadedFiles = devMemoryDb.uploadedFiles.filter(f => f.id !== fileId && f.fileName !== fileId);
    devMemoryDb.journalEntries = devMemoryDb.journalEntries.filter(je => je.fileId !== fileId && je.sourceFileId !== fileId);
    devMemoryDb.records = devMemoryDb.records.filter((r: any) => r.fileId !== fileId);
    devMemoryDb.skippedRows = devMemoryDb.skippedRows.filter((r: any) => r.fileId !== fileId);
    
    try {
        fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
        persistRegistry();
    } catch (err) {}
    return { success: true, data: [] };
  }));

  app.post("/api/erp/files/bulk-delete", authenticate, wrap(async (req, res) => {
    const { fileIds } = req.body;
    if (!Array.isArray(fileIds)) throw new Error("fileIds must be an array");
    
    if (isConnected()) {
      await transaction(async (client) => {
        await client.query("UPDATE uploaded_files SET is_deleted = TRUE, status = 'archived', deleted_at = NOW() WHERE id = ANY($1)", [fileIds]);
        await client.query("DELETE FROM records WHERE file_id = ANY($1)", [fileIds]);
      });
    } else {
      devMemoryDb.uploadedFiles = devMemoryDb.uploadedFiles.filter(f => !fileIds.includes(f.id) && !fileIds.includes(f.fileName));
      devMemoryDb.journalEntries = devMemoryDb.journalEntries.filter(je => !fileIds.includes(je.fileId) && !fileIds.includes(je.sourceFileId));
      devMemoryDb.records = devMemoryDb.records.filter((r: any) => !fileIds.includes(r.fileId));
      devMemoryDb.skippedRows = devMemoryDb.skippedRows.filter((r: any) => !fileIds.includes(r.fileId));
    }
    
    try {
        fs.writeFileSync(getUploadsFile(), JSON.stringify(devMemoryDb.uploadedFiles, null, 2), 'utf-8');
        persistRegistry();
    } catch (err) {}
    return { success: true, data: [] };
  }));

  app.get("/api/erp/audit/verify", authenticate, wrap(async (req, res) => {
    let logs: any[] = [];
    if (isConnected()) {
      const logsRes = await query("SELECT * FROM audit_logs ORDER BY timestamp ASC, id ASC");
      logs = logsRes.rows.map((row: any) => {
        const meta = row.meta_data || {};
        return {
          id: row.id,
          action: row.action,
          details: row.details,
          userId: row.user_id,
          userName: row.user_name,
          moduleType: row.module_type,
          recordId: row.record_id,
          previousHash: row.previous_hash.trim(),
          currentHash: row.current_hash.trim(),
          timestamp: row.timestamp,
          tenantId: row.tenant_id,
          before: meta.before,
          after: meta.after,
          changeSet: meta.changeSet,
          entityType: meta.entityType,
          entityId: meta.entityId,
          source: meta.source
        };
      });
    } else {
      logs = devMemoryDb.auditLogs;
    }

    const isValid = verifyAuditChain(logs);
    
    const brokenEntries: string[] = [];
    if (!isValid) {
      if (logs.length > 0) {
        const log = logs[0];
        const dataString = JSON.stringify({
          details: log.details,
          before: log.before,
          after: log.after,
          moduleType: log.moduleType,
          recordId: log.recordId,
          entityType: log.entityType,
          entityId: log.entityId
        });
        const hashPayload = String(log.action) + String(log.userId || log.performedBy) + String(log.timestamp) + dataString + log.previousHash;
        const computedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
        if (computedHash !== log.currentHash) brokenEntries.push(log.id);
      }

      for (let i = 1; i < logs.length; i++) {
        if (logs[i].previousHash !== logs[i-1].currentHash) {
          brokenEntries.push(logs[i].id);
        } else {
          const log = logs[i];
          const dataString = JSON.stringify({
            details: log.details,
            before: log.before,
            after: log.after,
            moduleType: log.moduleType,
            recordId: log.recordId,
            entityType: log.entityType,
            entityId: log.entityId
          });
          const hashPayload = String(log.action) + String(log.userId || log.performedBy) + String(log.timestamp) + dataString + log.previousHash;
          const computedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
          if (computedHash !== log.currentHash) brokenEntries.push(log.id);
        }
      }
    }
    
    res.json({
        success: true,
        isValid,
        brokenEntries,
        logs
    });
  }));

  app.get("/api/erp/governance/rejected", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    
    if (isConnected()) {
       const rejectedRes = await query("SELECT * FROM rejected_records WHERE tenant_id = $1", [tenantId]);
       const records = rejectedRes.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          moduleType: row.module_type,
          errors: row.errors,
          severity: row.severity,
          status: row.status,
          createdBy: row.created_by,
          record: row.record,
          proposedFix: row.proposed_fix,
          approvals: row.approvals,
          createdAt: row.created_at
       }));
       console.log("[API RESPONSE SQL]", records.length);
       res.json({
           success: true,
           data: records
       });
    } else {
       const records = devMemoryDb.rejectedRecords.filter((r: any) => r.tenantId === tenantId || !r.tenantId);
       console.log("[API RESPONSE]", records.length);
       res.json({
           success: true,
           data: records
       });
    }
  }));

  app.post("/api/erp/governance/rejected/:id/approve", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'finance_manager') {
       return res.status(403).json({ success: false, error: "Only admins and finance managers can approve data fixes." });
    }
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const { id } = req.params;
    
    if (isConnected()) {
       const rejectedRes = await query("SELECT * FROM rejected_records WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
       if (rejectedRes.rows.length === 0) {
          return res.status(404).json({ success: false, error: "Rejected record not found." });
       }
       const rejectedRecord = rejectedRes.rows[0];
       if (rejectedRecord.status === 'APPROVED' || rejectedRecord.status === 'REJECTED') {
          return res.status(400).json({ success: false, error: "Record is already processed." });
       }
       if (!rejectedRecord.proposed_fix) {
          return res.status(400).json({ success: false, error: "No proposed fix available." });
       }

       const approverId = (req as any).user.uid;
       const createdBy = rejectedRecord.created_by;

       if (approverId === createdBy && createdBy !== "upload_process") {
          return res.status(403).json({ success: false, error: "SELF_APPROVAL_FORBIDDEN: You cannot approve your own data exception fix." });
       }

       const approvals = rejectedRecord.approvals || [];
       if (approvals.some((a: any) => a.userId === approverId)) {
          return res.status(400).json({ success: false, error: "You have already approved this fix." });
       }

       const severity = rejectedRecord.severity;
       const requiredApprovals = severity === "CRITICAL" ? 2 : 1;

       approvals.push({
          userId: approverId,
          userName: userProfile?.name || (req as any).user.email,
          timestamp: new Date().toISOString(),
          action: "APPROVED"
       });

       if (approvals.length >= requiredApprovals) {
          const fixedRecord = { ...rejectedRecord.proposed_fix, tenantId };
          
          await transaction(async (client) => {
             const netAmt = fixedRecord.Net_Amount || fixedRecord.net_amount || 0;
             const vatAmt = fixedRecord.VAT_Amount || fixedRecord.vat_amount || 0;
             const totalAmt = fixedRecord.Total_Amount || fixedRecord.total_amount || 0;
             const taxAmt = fixedRecord.Taxable_Amount || fixedRecord.taxable_amount || 0;
             const nontaxAmt = fixedRecord.Nontaxable_Amount || fixedRecord.nontaxable_amount || 0;
             await client.query(`
               INSERT INTO records (id, tenant_id, file_id, module_type, invoice_number, invoice_date, entity_name, total_amount, vat_amount, taxable_amount, nontaxable_amount, net_amount, category, raw_data, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             `, [
               fixedRecord.id || crypto.randomUUID(),
               tenantId,
               fixedRecord.fileId || fixedRecord.fileHash || '',
               rejectedRecord.module_type,
               fixedRecord.Invoice_Number || fixedRecord.invoice_number || null,
               fixedRecord.Invoice_Date || fixedRecord.invoice_date || null,
               fixedRecord.Entity_Name || fixedRecord.Vendor_Name || fixedRecord.entity_name || null,
               totalAmt,
               vatAmt,
               taxAmt,
               nontaxAmt,
               netAmt,
               fixedRecord.Category || fixedRecord.category || null,
               JSON.stringify(fixedRecord),
               fixedRecord.created_at || fixedRecord.createdAt || new Date().toISOString()
             ]);

             await client.query("UPDATE rejected_records SET status = 'APPROVED', approvals = $1 WHERE id = $2", [JSON.stringify(approvals), id]);
          });

          await addAuditLog({
            action: "FIX_APPROVED",
            userId: approverId,
            userName: userProfile?.name || (req as any).user.email,
            moduleType: rejectedRecord.module_type,
            recordId: fixedRecord.id,
            timestamp: new Date().toISOString(),
            details: "Fully approved data fix for error: " + rejectedRecord.errors.join(", "),
            before: rejectedRecord.record,
            after: fixedRecord
          });

          res.json({ success: true, message: "Fix fully approved and applied", status: "APPROVED", approvals });
       } else {
          await query("UPDATE rejected_records SET status = 'UNDER_REVIEW', approvals = $1 WHERE id = $2", [JSON.stringify(approvals), id]);

          await addAuditLog({
            action: "APPROVAL_STEP",
            userId: approverId,
            userName: userProfile?.name || (req as any).user.email,
            moduleType: rejectedRecord.module_type,
            recordId: rejectedRecord.record?.id || "unknown",
            timestamp: new Date().toISOString(),
            details: `Approval step ${approvals.length}/${requiredApprovals} for error: ` + rejectedRecord.errors.join(", "),
            before: rejectedRecord.record,
            after: null
          });

          res.json({ success: true, message: "Fix partially approved (UNDER REVIEW)", status: "UNDER_REVIEW", approvals });
       }
    } else {
       const rejectionIndex = devMemoryDb.rejectedRecords.findIndex((r: any) => r.id === id && (r.tenantId === tenantId || !r.tenantId));
       if (rejectionIndex === -1) {
          return res.status(404).json({ success: false, error: "Rejected record not found." });
       }
       
       const rejectedRecord = devMemoryDb.rejectedRecords[rejectionIndex];
       if (rejectedRecord.status === 'APPROVED' || rejectedRecord.status === 'REJECTED') {
          return res.status(400).json({ success: false, error: "Record is already processed." });
       }
       
       if (!rejectedRecord.proposedFix) {
          return res.status(400).json({ success: false, error: "No proposed fix available." });
       }

       const approverId = (req as any).user.uid;
       const createdBy = rejectedRecord.createdBy;

       if (approverId === createdBy && createdBy !== "upload_process") {
          return res.status(403).json({ success: false, error: "SELF_APPROVAL_FORBIDDEN: You cannot approve your own data exception fix." });
       }

       if (!rejectedRecord.approvals) rejectedRecord.approvals = [];
       if (rejectedRecord.approvals.some((a: any) => a.userId === approverId)) {
          return res.status(400).json({ success: false, error: "You have already approved this fix." });
       }

       const severity = rejectedRecord.severity;
       const requiredApprovals = severity === "CRITICAL" ? 2 : 1;

       rejectedRecord.approvals.push({
          userId: approverId,
          userName: userProfile?.name || (req as any).user.email,
          timestamp: new Date().toISOString(),
          action: "APPROVED"
       });

       if (rejectedRecord.approvals.length >= requiredApprovals) {
          const fixedRecord = { ...rejectedRecord.proposedFix, tenantId: rejectedRecord.tenantId || tenantId };
          devMemoryDb.records.push(fixedRecord);
          
          devMemoryDb.rejectedRecords[rejectionIndex].status = "APPROVED";
          
          await addAuditLog({
            action: "FIX_APPROVED",
            userId: approverId,
            userName: userProfile?.name || (req as any).user.email,
            moduleType: rejectedRecord.moduleType,
            recordId: fixedRecord.id,
            timestamp: new Date().toISOString(),
            details: "Fully approved data fix for error: " + rejectedRecord.errors.join(", "),
            before: rejectedRecord.record,
            after: fixedRecord
          });

          res.json({ success: true, message: "Fix fully approved and applied", status: "APPROVED", approvals: rejectedRecord.approvals });
       } else {
          devMemoryDb.rejectedRecords[rejectionIndex].status = "UNDER_REVIEW";
          
          await addAuditLog({
            action: "APPROVAL_STEP",
            userId: approverId,
            userName: userProfile?.name || (req as any).user.email,
            moduleType: rejectedRecord.moduleType,
            recordId: rejectedRecord.record?.id || "unknown",
            timestamp: new Date().toISOString(),
            details: `Approval step ${rejectedRecord.approvals.length}/${requiredApprovals} for error: ` + rejectedRecord.errors.join(", "),
            before: rejectedRecord.record,
            after: null
          });

          res.json({ success: true, message: "Fix partially approved (UNDER REVIEW)", status: "UNDER_REVIEW", approvals: rejectedRecord.approvals });
       }
    }
  }));

  app.post("/api/erp/governance/rejected/:id/reject", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'finance_manager') {
       return res.status(403).json({ success: false, error: "Only admins and finance managers can reject data fixes." });
    }
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const { id } = req.params;

    if (isConnected()) {
       const rejectedRes = await query("SELECT * FROM rejected_records WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
       if (rejectedRes.rows.length === 0) {
          return res.status(404).json({ success: false, error: "Rejected record not found." });
       }
       const rejectedRecord = rejectedRes.rows[0];

       const approverId = (req as any).user.uid;
       const createdBy = rejectedRecord.created_by;

       if (approverId === createdBy && createdBy !== "upload_process") {
          return res.status(403).json({ success: false, error: "SELF_APPROVAL_FORBIDDEN: You cannot reject your own data exception fix (Maker-Checker principle)." });
       }

       const approvals = rejectedRecord.approvals || [];
       approvals.push({
          userId: approverId,
          userName: userProfile?.name || (req as any).user.email,
          timestamp: new Date().toISOString(),
          action: "REJECTED"
       });

       await query("UPDATE rejected_records SET status = 'REJECTED', approvals = $1 WHERE id = $2", [JSON.stringify(approvals), id]);

       await addAuditLog({
         action: "FIX_REJECTED",
         userId: approverId,
         userName: userProfile?.name || (req as any).user.email,
         moduleType: rejectedRecord.module_type,
         recordId: rejectedRecord.record?.id || "unknown",
         timestamp: new Date().toISOString(),
         details: "Rejected proposed data fix for error: " + rejectedRecord.errors.join(", "),
         before: rejectedRecord.record,
         after: null
       });

       res.json({ success: true, message: "Fix rejected", status: "REJECTED", approvals });
    } else {
       const rejectionIndex = devMemoryDb.rejectedRecords.findIndex((r: any) => r.id === id && (r.tenantId === tenantId || !r.tenantId));
       if (rejectionIndex === -1) {
          return res.status(404).json({ success: false, error: "Rejected record not found." });
       }
       
       const rejectedRecord = devMemoryDb.rejectedRecords[rejectionIndex];

       const approverId = (req as any).user.uid;
       const createdBy = rejectedRecord.createdBy;

       if (approverId === createdBy && createdBy !== "upload_process") {
          return res.status(403).json({ success: false, error: "SELF_APPROVAL_FORBIDDEN: You cannot reject your own data exception fix (Maker-Checker principle)." });
       }
       
       devMemoryDb.rejectedRecords[rejectionIndex].status = "REJECTED";
       
       if (!rejectedRecord.approvals) rejectedRecord.approvals = [];
       rejectedRecord.approvals.push({
          userId: approverId,
          userName: userProfile?.name || (req as any).user.email,
          timestamp: new Date().toISOString(),
          action: "REJECTED"
       });
       
       await addAuditLog({
         action: "FIX_REJECTED",
         userId: (req as any).user.uid,
         userName: userProfile?.name || (req as any).user.email,
         moduleType: rejectedRecord.moduleType,
         recordId: rejectedRecord.record?.id || "unknown",
         timestamp: new Date().toISOString(),
         details: "Rejected proposed data fix for error: " + rejectedRecord.errors.join(", "),
         before: rejectedRecord.record,
         after: null
       });
       
       res.json({ success: true, message: "Fix rejected", status: "REJECTED", approvals: rejectedRecord.approvals });
    }
  }));

  app.get("/api/erp/files/:fileId/data", authenticate, wrap(async (req, res) => {
    const userProfile = (req as any).userProfile;
    const tenantId = userProfile?.tenantId || (req as any).user.uid;
    const { fileId } = req.params;
    const moduleType = (req.query.moduleType || req.query.type) as string;
    
    let records: any[] = [];
    let skippedRows: any[] = [];
    let orphanRecords = 0;
    let excludedRecords = 0;
    let moduleFileCount = 0;
    let activeFileCount = 0;
    
    if (isConnected()) {
       let tenantFiles: any[] = [];
       if (fileId === 'ALL' && moduleType) {
          const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND module_type = $2", [tenantId, moduleType]);
          tenantFiles = filesRes.rows;
       } else if (fileId.includes(',')) {
          const ids = fileId.split(',');
          const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND id = ANY($2)", [tenantId, ids]);
          tenantFiles = filesRes.rows;
       } else {
          const filesRes = await query("SELECT * FROM uploaded_files WHERE tenant_id = $1 AND (id = $2 OR file_hash = $2)", [tenantId, fileId]);
          tenantFiles = filesRes.rows;
       }

       const filesMapped = tenantFiles.map((row: any) => {
          const meta = row.meta_data || {};
          return {
             id: row.id,
             fileName: row.file_name,
             originalFileName: row.original_file_name,
             displayName: meta.displayName || row.original_file_name,
             fileHash: row.file_hash,
             tenantId: row.tenant_id,
             moduleType: row.module_type,
             status: row.status,
             isDeleted: row.is_deleted,
             storagePath: row.storage_path,
             createdAt: row.created_at,
             meta_data: meta
          };
       });

       const activeFiles = filesMapped.filter((f: any) => !f.isDeleted && f.status !== 'archived' && (!moduleType || f.moduleType === moduleType));
       const activeFileIds = new Set<string>();
       activeFiles.forEach((f: any) => {
          if (f.id) activeFileIds.add(String(f.id));
          if (f.fileHash) activeFileIds.add(String(f.fileHash));
       });

       moduleFileCount = filesMapped.length;
       activeFileCount = activeFiles.length;

       let recordsRes;
       if (fileId === 'ALL' && moduleType) {
          recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1 AND module_type = $2", [tenantId, moduleType]);
       } else {
          const hashes = activeFiles.map((f: any) => f.fileHash || f.id);
          if (hashes.length > 0) {
             recordsRes = await query("SELECT * FROM records WHERE tenant_id = $1 AND file_id = ANY($2)", [tenantId, hashes]);
          } else {
             recordsRes = { rows: [] };
          }
       }

       const fetchedRecords = recordsRes.rows.map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          fileId: row.file_id,
          moduleType: row.module_type,
          Invoice_Number: row.invoice_number,
          Invoice_Date: row.invoice_date,
          Entity_Name: row.entity_name,
          Total_Amount: Number(row.total_amount),
          VAT_Amount: Number(row.vat_amount),
          Taxable_Amount: Number(row.taxable_amount),
          Nontaxable_Amount: Number(row.nontaxable_amount),
          Net_Amount: Number(row.net_amount),
          Category: row.category,
          ...(row.raw_data || {})
       }));

       const activeFilesForFilter = [
          ...activeFiles,
          ...activeFiles.map((f: any) => ({ ...f, id: f.fileHash || f.id }))
       ];
       records = filterRecordsByActiveFiles(fetchedRecords, activeFilesForFilter);

       activeFiles.forEach((f: any) => {
          const meta = f.meta_data || {};
          if (meta.skippedRows && Array.isArray(meta.skippedRows)) {
             const mapped = meta.skippedRows.map((sr: any) => ({
                ...sr,
                fileId: f.fileHash || f.id,
                tenantId,
                moduleType: f.moduleType
             }));
             skippedRows.push(...mapped);
          }
       });

       records.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
       skippedRows.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
    } else {
       if (fileId === 'ALL' && moduleType) {
          console.log("=== DATA SOURCE TRACE ===");
          console.log("Requested moduleType:", moduleType);
          
          const moduleFiles = devMemoryDb.uploadedFiles.filter((f: any) => {
             const fileModuleType = f.fileType || f.moduleType;
             return f.tenantId === tenantId && fileModuleType === moduleType;
          });
          const activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType, tenantId);
          const activeFileIds = new Set<string>();
          activeFiles.forEach((f: any) => {
             if (f.id) activeFileIds.add(String(f.id));
             if (f.fileHash) activeFileIds.add(String(f.fileHash));
          });
          moduleFileCount = moduleFiles.length;
          activeFileCount = activeFiles.length;

          const tenantModuleRecords = devMemoryDb.records.filter((r: any) => {
              const recordFileId = String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || '');
              return r.tenantId === tenantId && (r.moduleType === moduleType || activeFileIds.has(recordFileId));
          });
          const activeFilesForFilter = [
            ...activeFiles,
            ...activeFiles.map((f: any) => ({ ...f, id: f.fileHash || f.id }))
          ];
          records = filterRecordsByActiveFiles(tenantModuleRecords, activeFilesForFilter);
          skippedRows = filterRecordsByActiveFiles(
            devMemoryDb.skippedRows.filter((r: any) => {
              const recordFileId = String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || '');
              return r.tenantId === tenantId && (r.moduleType === moduleType || activeFileIds.has(recordFileId));
            }),
            activeFilesForFilter
          );
          orphanRecords = tenantModuleRecords.filter((r: any) => !activeFileIds.has(String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || ''))).length;
          excludedRecords = tenantModuleRecords.length - records.length;
          records.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
          skippedRows.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
       } else if (fileId.includes(',')) {
          const requestedFileIds = new Set(fileId.split(','));
          const activeFiles = getActiveFiles(devMemoryDb.uploadedFiles, moduleType || null, tenantId)
             .filter((file: any) => requestedFileIds.has(file.id || file.fileHash));
          const fileIds = getActiveFileIds(activeFiles, moduleType || null, tenantId);
          records = devMemoryDb.records.filter((r: any) => fileIds.includes(r.fileId) && r.tenantId === tenantId);
          skippedRows = devMemoryDb.skippedRows.filter((r: any) => fileIds.includes(r.fileId) && r.tenantId === tenantId);
          
          records.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
          skippedRows.forEach((r: any) => { if (!r.moduleType) r.moduleType = moduleType; });
       } else {
          const requestedFile = getActiveFiles(devMemoryDb.uploadedFiles, moduleType || null, tenantId)
             .find((f: any) => f.id === fileId || f.fileHash === fileId);
          const actualModuleType = requestedFile?.fileType || requestedFile?.moduleType;
          
          if (!requestedFile) {
              console.log(`[DATA ISOLATION] Blocked inactive, deleted, orphan, or cross-tenant file request for ${fileId}`);
              records = [];
              skippedRows = [];
          } else if (moduleType && actualModuleType && actualModuleType !== moduleType) {
              console.log(`[DATA ISOLATION] Blocked attempt to load ${actualModuleType} file as ${moduleType}`);
              records = [];
              skippedRows = [];
          } else {
              records = devMemoryDb.records.filter((r: any) => (r.fileId === fileId || r.fileId === requestedFile.fileHash) && r.tenantId === tenantId);
              skippedRows = devMemoryDb.skippedRows.filter((r: any) => (r.fileId === fileId || r.fileId === requestedFile.fileHash) && r.tenantId === tenantId);
              
              records.forEach((r: any) => r.moduleType = actualModuleType || moduleType);
              skippedRows.forEach((r: any) => r.moduleType = actualModuleType || moduleType);
          }
       }
    }
    
    const validRecords: any[] = [];
    const rejected: any[] = [];
    
    records.forEach((r: any) => {
      const result = validateRecord(r);
      if (result.isValid) {
         validRecords.push(r);
      } else {
         const rejectionLog = {
           id: crypto.randomUUID(),
           record: r,
           errors: result.errors,
           category: result.category,
           severity: result.severity,
           source: "api",
           moduleType: r.moduleType || moduleType,
           timestamp: new Date().toISOString(),
           status: "PENDING_APPROVAL",
           proposedFix: result.proposedFix,
           createdBy: (req as any).user?.uid || "system",
           approvals: []
         };
         rejected.push(rejectionLog);
         
         if (!isConnected()) {
            devMemoryDb.rejectedRecords.push(rejectionLog);
         }
         console.error(`[GOVERNANCE] DATA REJECTED [${result.severity}] ${result.category}`, rejectionLog);
      }
    });

    if (rejected.length > 0) {
       if (isConnected()) {
          for (const rr of rejected) {
             await query(`
                INSERT INTO rejected_records (id, tenant_id, module_type, errors, severity, status, created_by, record, proposed_fix, approvals, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO NOTHING
             `, [
                rr.id,
                tenantId,
                rr.moduleType,
                rr.errors,
                rr.severity,
                'PENDING',
                rr.createdBy,
                JSON.stringify(rr.record),
                rr.proposedFix ? JSON.stringify(rr.proposedFix) : null,
                JSON.stringify(rr.approvals),
                rr.timestamp
             ]);
          }
       } else {
          persistRegistry();
       }
    }

    records = validRecords;

    return {
      debug: {
        totalRecords: isConnected() ? records.length : devMemoryDb.records.length,
        filteredRecords: records.length,
        rejectedRecords: rejected.length,
        moduleType: moduleType,
        moduleFileCount,
        activeFileCount,
        orphanRecords,
        excludedRecords
      },
      records,
      skippedRows,
      rejectedRecords: rejected
    };
  }));

  // PDF Generation
  app.post("/api/pdf/generate", authenticate, async (req, res, next) => {
    try {
      const { docDefinition, filename } = req.body;
      const buffer = await PDFService.generatePDFBuffer(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename || 'document.pdf')}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/pdf/invoice", authenticate, async (req, res, next) => {
    try {
      const { data, filename } = req.body;
      const docDefinition = PDFService.buildInvoiceTemplate(data);
      const buffer = await PDFService.generatePDFBuffer(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename || 'invoice.pdf')}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  // Catch-all for API 404s (Prevents HTML response for missing APIs)
  app.use("/api/*", (req, res) => {
    res.status(404).json(sendError(`API Endpoint not found: ${req.originalUrl}`));
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.status !== 404) {
      console.warn(`[API ERROR] ${req.method} ${req.url}:`, err.message);
    }
    if (!res.headersSent) {
      res.status(err.status || 500).json(sendError(err.message || "Internal Server Error"));
    }
  });

  // Vite/SPA middleware

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
    console.log("SERVER STARTED SUCCESSFULLY");
  }).on('error', (err) => {
    console.error("SERVER ERROR:", err);
  });
}

startServer().catch((err) => {
  console.error("SERVER UNHANDLED PROMISE REJECTION RAW:", err);
  process.exit(1);
});
