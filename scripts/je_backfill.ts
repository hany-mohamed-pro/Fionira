/**
 * Phase B-أ-1 — one-time JE backfill.
 *
 * Regenerates ALL journal entries from the CURRENT records in
 * data/erp_registry.json, replacing the stale stored set entirely.
 * Manual isActive edits on the old JEs are intentionally NOT preserved
 * (the freshly generated entries are the source of truth).
 *
 * Dry-run by default (prints the acceptance gates with real numbers,
 * writes nothing). Pass --apply to actually write the registry.
 *
 * Acceptance gates:
 *   1. Balance identity:  Assets = Liabilities + Equity  (to the halala).
 *   2. NI reconciliation: NI(from JEs) vs NI(computePnLCore) within the
 *      known 54.78 payroll-VAT delta only.
 */
import fs from 'fs';
import path from 'path';
import { generateJournalEntries } from '../src/backend/core/erp-engine';
import { computeBalanceSheetCore } from '../src/lib/balance-sheet-core';
import { computePnLCore } from '../src/lib/pnl-core';

const APPLY = process.argv.includes('--apply');
const KNOWN_DELTA = 54.78;
const EPS = 0.01;
const REG = path.join(process.cwd(), 'data', 'erp_registry.json');

const MODS = ['expenses', 'revenues', 'payroll', 'banks', 'inventory'] as const;
type Mod = typeof MODS[number];

const db = JSON.parse(fs.readFileSync(REG, 'utf-8'));
const records: any[] = db.records || [];
const oldJEs: any[] = db.journalEntries || [];

// Only records with a valid module type participate (the 1 orphan record with
// no module/tenant/fileId is excluded from BOTH JEs and P&L, keeping them aligned).
const valid = records.filter(r => (MODS as readonly string[]).includes(r.moduleType));
const skipped = records.length - valid.length;

// Group by (tenantId, moduleType) and regenerate.
const newJEs: any[] = [];
const groups = new Map<string, any[]>();
for (const r of valid) {
  const key = `${r.tenantId || 'UNKNOWN'}::${r.moduleType}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(r);
}
for (const [key, recs] of groups) {
  const [tenantId, mod] = key.split('::');
  const gen = generateJournalEntries(recs, mod as Mod);
  gen.forEach(je => { je.tenantId = tenantId; je.isActive = true; });
  newJEs.push(...gen);
}

// Gate 1 — balance identity from the NEW JEs.
const bs = computeBalanceSheetCore(newJEs as any);

// Gate 2 — NI(JE) vs NI(P&L). NI(JE) = retained earnings the BS derives from the
// entries (Σ revenue − Σ expense). NI(P&L) = computePnLCore on the same records.
const expenses = valid.filter(r => r.moduleType === 'expenses');
const revenues = valid.filter(r => r.moduleType === 'revenues');
const payroll  = valid.filter(r => r.moduleType === 'payroll');
const pnl = computePnLCore(expenses, revenues, payroll);
const niJE = bs.retainedEarnings;
const niPnL = pnl.netOperatingIncome;
const delta = niJE - niPnL;

const gate1 = Math.abs(bs.difference) < EPS;
const gate2 = Math.abs(delta) <= KNOWN_DELTA + EPS;

const f = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log('════════════════════════════════════════════════════════════');
console.log('  Phase B-أ-1 — JE BACKFILL  ' + (APPLY ? '[APPLY]' : '[DRY-RUN]'));
console.log('════════════════════════════════════════════════════════════');
console.log(`  records total ............... ${records.length}`);
console.log(`  records used (valid module) . ${valid.length}   (skipped orphan: ${skipped})`);
console.log(`  OLD journal entries ......... ${oldJEs.length}`);
console.log(`  NEW journal entries ......... ${newJEs.length}`);
console.log('  ---- expenses/revenues/payroll: ' + `${expenses.length}/${revenues.length}/${payroll.length}`);
console.log('────────────────────────────────────────────────────────────');
console.log('  GATE 1 — Balance identity (from NEW JEs):');
console.log(`    Total Assets .............. ${f(bs.totalAssets)}`);
console.log(`    Total Liabilities ......... ${f(bs.totalLiabilities)}`);
console.log(`    Total Equity .............. ${f(bs.totalEquity)}`);
console.log(`      capital ................. ${f(bs.capital)}`);
console.log(`      retained earnings ....... ${f(bs.retainedEarnings)}`);
console.log(`      drawings ................ ${f(bs.drawings)}`);
console.log(`    L + E ..................... ${f(bs.totalLiabilities + bs.totalEquity)}`);
console.log(`    difference (A-(L+E)) ...... ${f(bs.difference)}`);
console.log(`    => ${gate1 ? 'PASS ✓ (balanced to the halala)' : 'FAIL ✗'}`);
console.log('────────────────────────────────────────────────────────────');
console.log('  GATE 2 — NI reconciliation (NEW JEs vs computePnLCore):');
console.log(`    NI from JEs (retained) .... ${f(niJE)}`);
console.log(`    NI from computePnLCore .... ${f(niPnL)}`);
console.log(`    delta ..................... ${f(delta)}   (allowed |Δ| <= ${KNOWN_DELTA})`);
console.log(`    => ${gate2 ? 'PASS ✓ (within known payroll-VAT delta)' : 'FAIL ✗'}`);
console.log('════════════════════════════════════════════════════════════');

if (APPLY) {
  if (!gate1 || !gate2) {
    console.log('  ✗ Gates failed — NOT writing registry. Aborting apply.');
    process.exit(1);
  }
  db.journalEntries = newJEs;
  fs.writeFileSync(REG, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`  ✓ APPLIED — data/erp_registry.json journalEntries replaced (${oldJEs.length} -> ${newJEs.length}).`);
} else {
  console.log('  DRY-RUN — nothing written. Re-run with --apply to persist.');
}
