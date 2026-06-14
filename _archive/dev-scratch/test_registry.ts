import fs from 'fs';
import path from 'path';

const REGISTRY_FILE = path.join(process.cwd(), 'data', 'erp_registry.json');
const rawData = fs.readFileSync(REGISTRY_FILE, 'utf-8');
const devMemoryDb = JSON.parse(rawData);

console.log("Journal Entries Count:", devMemoryDb.journalEntries.length);
if (devMemoryDb.journalEntries.length > 0) {
    console.log("First Entry:", JSON.stringify(devMemoryDb.journalEntries[0], null, 2));
} else {
    console.log("No journal entries. Records?:", devMemoryDb.records.length);
}
