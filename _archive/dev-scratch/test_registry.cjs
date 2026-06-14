const fs = require('fs');
const path = require('path');
const UPLOADS_FILE = path.join(process.cwd(), 'data', 'erp_registry.json');
const rawData = fs.readFileSync(UPLOADS_FILE, 'utf-8');
const devMemoryDb = JSON.parse(rawData);

console.log("Journal Entries Count:", devMemoryDb.journalEntries.length);
if (devMemoryDb.journalEntries.length > 0) {
    const tenants = [...new Set(devMemoryDb.journalEntries.map(entry => entry.tenantId))];
    console.log("Tenants found:", tenants);
} else {
    console.log("No journal entries. Records?:", devMemoryDb.records.length);
}
