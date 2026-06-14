import fs from 'fs';
import path from 'path';

const UPLOADS_FILE = path.join(process.cwd(), 'data', 'uploads.json');
const REGISTRY_FILE = path.join(process.cwd(), 'data', 'erp_registry.json');
const rawRecords = path.join(process.cwd(), 'data', 'records.json');

try {
    const uploadsData = fs.readFileSync(UPLOADS_FILE, 'utf-8');
    const uploadedFiles = JSON.parse(uploadsData);
    
    // valid file IDs
    const validFileIds = new Set(uploadedFiles.map((f: any) => f.id));
    
    let registryData;
    let registry: any = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      registryData = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      registry = JSON.parse(registryData);
    }
    
    const initialJEs = registry.journalEntries ? registry.journalEntries.length : 0;
    if (registry.journalEntries) {
        registry.journalEntries = registry.journalEntries.filter((je: any) => {
            if (je.sourceFileId && !validFileIds.has(je.sourceFileId)) {
                return false;
            }
            if (je.fileId && !validFileIds.has(je.fileId)) {
                return false;
            }
            return true;
        });
    }
    const finalJEs = registry.journalEntries ? registry.journalEntries.length : 0;
    
    const initialRecords = registry.records ? registry.records.length : 0;
    if (registry.records) {
        registry.records = registry.records.filter((r: any) => {
             if (r.fileId && !validFileIds.has(r.fileId)) return false;
             return true;
        });
    }
    const finalRecords = registry.records ? registry.records.length : 0;
    
    const initialSkipped = registry.skippedRows ? registry.skippedRows.length : 0;
    if (registry.skippedRows) {
        registry.skippedRows = registry.skippedRows.filter((r: any) => {
             if (r.fileId && !validFileIds.has(r.fileId)) return false;
             return true;
        });
    }
    const finalSkipped = registry.skippedRows ? registry.skippedRows.length : 0;

    console.log(`Cleaned up orphaned entries:`);
    console.log(`Journal Entries: ${initialJEs} -> ${finalJEs} (removed ${initialJEs - finalJEs})`);
    console.log(`Records: ${initialRecords} -> ${finalRecords} (removed ${initialRecords - finalRecords})`);
    console.log(`Skipped Rows: ${initialSkipped} -> ${finalSkipped} (removed ${initialSkipped - finalSkipped})`);

    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
    console.log('Registry saved successfully.');
    
} catch (e) {
    console.error("Cleanup error:", e);
}
