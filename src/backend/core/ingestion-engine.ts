import { processExpenses } from './processors/expenses-processor';
import { processRevenues } from './processors/revenues-processor';
import { processPayroll } from './processors/payroll-processor';
import { processBanks } from './processors/bank-processor';
import { processInventory } from './processors/inventory-processor';
import * as XLSX from 'xlsx';
import { analyzeBatch } from './operational-intelligence/detection-engine';

export interface MasterData {
  customers: { id: string; name: string; type: 'customer'; balance: number }[];
  vendors: { id: string; name: string; type: 'vendor'; balance: number }[];
  items: { id: string; name: string; type: 'item' }[];
}

// Central guard: a row is an empty/partial artifact (not a real record) only when it
// has NEITHER identity (entity/invoice/description/date) NOR any money (every amount
// field null-or-zero). Such rows slip past the processors' hasNumbers check via a
// stray digit and would otherwise surface as fake "غير محدد / 0 / غير متوفرة" errors.
// Rows with a real entity but a zero amount (intentional zero) are KEPT. Rows with no
// identity but real money are KEPT (flagged later as MISSING_VENDOR).
const nilOrZero = (v: any) => v === null || v === undefined || v === 0;

export function isEmptyPartialRow(r: any): boolean {
  const hasIdentity =
    (r.Entity_Name && r.Entity_Name !== 'غير محدد' && r.Entity_Name !== 'UNKNOWN_ENTITY') ||
    !!r.Invoice_Number ||
    (r.Item_Description && String(r.Item_Description).trim() !== '') ||
    !!r.Invoice_Date;
  const hasMoney = ![r.Total_Amount, r.Taxable_Amount, r.NonTaxable_Amount, r.VAT_Amount, r.Net_Amount]
    .every(nilOrZero);
  return !hasIdentity && !hasMoney;
}

export interface IngestionSession {
  sessionId: string;
  files: string[];
  records: any[];
  skippedRows: any[];
  rejectedRecords?: any[];
  masterData: MasterData;
  debugTraces: any[];
}

function detectModuleType(buffer: ArrayBuffer, fileName: string): 'expenses' | 'revenues' | 'payroll' | 'banks' | 'inventory' | null {
   try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let scoreExpenses = 0;
      let scoreRevenues = 0;
      let scorePayroll = 0;
      let scoreBanks = 0;

      const lowerName = fileName.toLowerCase();
      if (lowerName.includes('expense') || lowerName.includes('مصروف')) scoreExpenses += 10;
      if (lowerName.includes('revenue') || lowerName.includes('بيع') || lowerName.includes('ايراد')) scoreRevenues += 10;
      if (lowerName.includes('payroll') || lowerName.includes('راتب') || lowerName.includes('رواتب')) scorePayroll += 10;
      if (lowerName.includes('bank') || lowerName.includes('بنك') || lowerName.includes('كشف')) scoreBanks += 10;

      for (let i = 0; i < Math.min(25, data.length); i++) {
         const row = data[i] as any[];
         if (!row || row.length === 0) continue;
         const rowStr = row.join(' ').toLowerCase();
         
         if (rowStr.match(/(مورد|vendor|supplier|مشتريات|مصروف|purchase)/)) scoreExpenses += 2;
         if (rowStr.match(/(عميل|customer|client|مبيعات|ايراد|revenue|sales)/)) scoreRevenues += 2;
         if (rowStr.match(/(راتب|بدل|خصم|موظف|salary|employee|allowance|deduction)/)) scorePayroll += 5;
         if (rowStr.match(/(رصيد|دائن|مدين|سحب|ايداع|balance|credit|debit|deposit|withdrawal)/)) scoreBanks += 2;
      }
      
      const maxScore = Math.max(scoreExpenses, scoreRevenues, scorePayroll, scoreBanks);
      if (maxScore < 5) return null; // Fallback to provided type
      if (maxScore === scorePayroll) return 'payroll';
      if (maxScore === scoreExpenses) return 'expenses';
      if (maxScore === scoreRevenues) return 'revenues';
      if (maxScore === scoreBanks) return 'banks';
   } catch (e) {
      console.warn("Failed to auto-detect file type", e);
   }
   return null;
}

export const processUploadBatch = async (
  files: { buffer: ArrayBuffer; name: string; fileHash?: string }[], 
  moduleType: 'expenses' | 'revenues' | 'payroll' | 'banks' | 'inventory',
  onProgress?: (msg: string) => void
): Promise<IngestionSession> => {
  const sessionId = crypto.randomUUID();
  let allRecords: any[] = [];
  let allSkipped: any[] = [];
  let allRejected: any[] = [];
  let allDebugTraces: any[] = [];
  
  const customers = new Map();
  const vendors = new Map();
  const items = new Map();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(`جاري معالجة ${file.name}...`);
    
    let result = { records: [], skipped: [], debugTrace: {}, columnMap: {} };
    try {
       const detectedModule = moduleType; // Disabled detectModuleType(file.buffer, file.name)
       console.log(`[INGESTION] Processing file ${file.name} as ${detectedModule}`);
       
       if (detectedModule === 'expenses') result = processExpenses(file.buffer, file.name) as any;
       else if (detectedModule === 'revenues') result = processRevenues(file.buffer, file.name) as any;
       else if (detectedModule === 'payroll') result = processPayroll(file.buffer, file.name) as any;
       else if (detectedModule === 'banks') result = processBanks(file.buffer, file.name) as any;
       else if (detectedModule === 'inventory') result = processInventory(file.buffer, file.name) as any;
       
       // Force update the records directly to have the detected moduleType
       if (result && result.records) {
          result.records.forEach((r: any) => r.moduleType = detectedModule);
       }
    } catch (e: any) {
       console.error(`Error processing file ${file.name}:`, e);
       continue;
    }

    // fallback when processor doesn't return 'records'
    if (!result || !result.records) {
       continue;
    }

    // Build Master Data FIRST
    result.records.forEach((rec: any) => {
       const entityName = rec.Entity_Name || rec.Raw_Entity;
       const recordModule = rec.moduleType || moduleType;
       if (entityName && entityName !== 'غير محدد') {
          if (recordModule === 'revenues') {
             if (!customers.has(entityName)) customers.set(entityName, { id: crypto.randomUUID(), name: entityName, type: 'customer', balance: 0 });
             rec.Entity_ID = customers.get(entityName).id;
             rec.Entity_Normalized_Name = entityName;
          } else if (recordModule === 'expenses') {
             if (!vendors.has(entityName)) vendors.set(entityName, { id: crypto.randomUUID(), name: entityName, type: 'vendor', balance: 0 });
             rec.Entity_ID = vendors.get(entityName).id;
             rec.Entity_Normalized_Name = entityName;
          } else if (recordModule === 'inventory') {
             if (!items.has(entityName)) items.set(entityName, { id: crypto.randomUUID(), name: entityName, type: 'item' });
             rec.Entity_ID = items.get(entityName).id;
             rec.Entity_Normalized_Name = entityName;
          } else {
             if (!vendors.has(entityName)) vendors.set(entityName, { id: crypto.randomUUID(), name: entityName, type: 'vendor', balance: 0 });
             rec.Entity_ID = vendors.get(entityName).id;
             rec.Entity_Normalized_Name = entityName;
          }
       } else {
          // If entity is completely unknown
          rec.Entity_ID = 'UNKNOWN_ENTITY';
          rec.Entity_Normalized_Name = 'UNKNOWN_ENTITY';
       }
    });

    const currentFileId = file.fileHash || file.name;
    const finalRecordsAll = result.records.map((r: any) => ({ ...r, sessionId, fileId: currentFileId, _sourceFile: currentFileId }));

    // Central partial-row guard (Fix A): keep real records; divert empty/partial
    // artifacts to skippedRows (traceable, not deleted, not shown as fake errors).
    const finalRecords = finalRecordsAll.filter((r: any) => !isEmptyPartialRow(r));
    const partialSkipped = finalRecordsAll
      .filter((r: any) => isEmptyPartialRow(r))
      .map((r: any) => ({ rowIndex: r._originalRowIndex, reason: 'Structural: صف فارغ بلا هوية ولا مبالغ', sessionId, fileId: currentFileId, _sourceFile: currentFileId, rawData: r.rawData || r }));

    // We NO LONGER RUN operational engine here, it's replaced by the domain intelligence orchestrator
    // inside pre-validation-engine.ts module.

    allRecords = [...allRecords, ...finalRecords];
    const skippedArr = [...(result.skipped || []), ...partialSkipped];
    
    const normalSkipped: any[] = [];
    const integrityRejected: any[] = [];
    
    skippedArr.forEach((s: any) => {
       const mappedSkipped = { ...s, sessionId, fileId: currentFileId, _sourceFile: currentFileId };
       if (s.reason && s.reason.startsWith('Integrity:')) {
          const rejectedRecord = {
             id: crypto.randomUUID(),
             record: mappedSkipped.rawData || mappedSkipped,
             errors: [s.reason],
             category: s.category || "UNKNOWN",
             severity: s.severity || "LOW",
             source: "processor",
             moduleType: result.records[0]?.moduleType || moduleType,
             timestamp: new Date().toISOString(),
             status: "PENDING_APPROVAL",
             proposedFix: s.proposedFix || mappedSkipped.proposedFix,
             createdBy: "upload_process",
             approvals: []
          };
          console.log("[REJECTED RECORD PUSHED]", rejectedRecord);
          integrityRejected.push(rejectedRecord);
       } else {
          normalSkipped.push(mappedSkipped);
       }
    });

    allSkipped = [...allSkipped, ...normalSkipped];
    allRejected = [...allRejected, ...integrityRejected];
    
    if (result.debugTrace) {
        allDebugTraces.push(result.debugTrace);
    }
  }

  return {
    sessionId,
    files: files.map(f => f.name),
    records: allRecords,
    skippedRows: allSkipped,
    rejectedRecords: allRejected,
    masterData: {
      customers: Array.from(customers.values()),
      vendors: Array.from(vendors.values()),
      items: Array.from(items.values())
    },
    debugTraces: allDebugTraces
  };
};
