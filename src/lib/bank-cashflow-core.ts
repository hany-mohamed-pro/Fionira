/**
 * Shared bank reconciliation + direct-method cash-flow core.
 *
 * SINGLE SOURCE OF TRUTH for per-account opening/closing/net so the Bank
 * Reconciliation page and the Cash Flow Statement can NEVER drift on the cash
 * position. `computeAccount` is extracted verbatim from BankReconciliation.tsx;
 * `computeAccountCashFlow` reclassifies the SAME reconciled movements into a
 * direct-method statement.
 *
 * This is pure aggregation over already-classified bank records. It does NOT
 * classify anything and does NOT touch categorization-engine.ts / erp-engine.ts.
 *
 * The hard guarantee: every transaction lands in exactly one cash-flow section,
 * so Σ(section nets) === net === closing − opening. Therefore the statement's
 * ending cash equals the reconciliation's actual statement-closing balance BY
 * CONSTRUCTION — the same validation gate the bank pages already enforce.
 */

import { glNature } from '../backend/core/processors/bank-classification';

export const dirOf = (r: any): 'debit' | 'credit' =>
  r.Flow_Direction === 'credit' || r.Flow_Direction === 'debit'
    ? r.Flow_Direction
    : (typeof r.Category === 'string' && r.Category.includes('إيداع') ? 'credit' : 'debit');

export const signedAmount = (r: any) => (dirOf(r) === 'credit' ? 1 : -1) * (Number(r.Total_Amount) || 0);

export interface NatureGroup {
  nature: string;
  accounts: { account: string; debit: number; credit: number; count: number; net: number; txns: any[] }[];
  debit: number; credit: number; count: number; net: number;
}

export interface AccountRecon {
  count: number;
  totalDebit: number;
  totalCredit: number;
  net: number;
  hasBalances: boolean;
  openingBalance: number | null;
  closingBalance: number | null;
  computedClosing: number | null;
  diff: number | null;
  reconciled: boolean;
  chainChecked: number;
  chainOk: number;
  natureGroups: NatureGroup[];
}

/** Extracted verbatim from BankReconciliation.tsx — the reconciliation math. */
export function computeAccount(txns: any[], unclassified: string): AccountRecon {
  const glOf = (r: any): string => r.GL_Account || r.Category || unclassified;
  const signed = (r: any) => signedAmount(r);

  let totalDebit = 0, totalCredit = 0;
  txns.forEach((r: any) => {
    const amt = Number(r.Total_Amount) || 0;
    if (dirOf(r) === 'credit') totalCredit += amt; else totalDebit += amt;
  });
  const net = totalCredit - totalDebit;

  const sorted = [...txns].sort((a, b) => {
    const da = String(a.Invoice_Date || ''), db = String(b.Invoice_Date || '');
    if (da !== db) return da < db ? -1 : 1;
    return (b._originalRowIndex || 0) - (a._originalRowIndex || 0);
  });
  const hasBalances = sorted.some((r: any) => r.Running_Balance != null);
  const earliest = sorted[0], latest = sorted[sorted.length - 1];
  const closingBalance = hasBalances && latest?.Running_Balance != null ? Number(latest.Running_Balance) : null;
  const openingBalance = hasBalances && earliest?.Running_Balance != null ? Number(earliest.Running_Balance) - signed(earliest) : null;
  const computedClosing = openingBalance != null ? openingBalance + net : null;
  const diff = (computedClosing != null && closingBalance != null) ? computedClosing - closingBalance : null;
  const reconciled = diff != null && Math.abs(diff) < 0.01;

  let chainChecked = 0, chainOk = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1], cur = sorted[i];
    if (prev.Running_Balance == null || cur.Running_Balance == null) continue;
    chainChecked++;
    const expected = Number(prev.Running_Balance) + signed(cur);
    if (Math.abs(expected - Number(cur.Running_Balance)) < 0.01) chainOk++;
  }

  const glMap: Record<string, { debit: number; credit: number; count: number; txns: any[] }> = {};
  txns.forEach((r: any) => {
    const k = glOf(r);
    glMap[k] = glMap[k] || { debit: 0, credit: 0, count: 0, txns: [] };
    glMap[k].count++; glMap[k].txns.push(r);
    const amt = Number(r.Total_Amount) || 0;
    if (dirOf(r) === 'credit') glMap[k].credit += amt; else glMap[k].debit += amt;
  });
  const accts = Object.entries(glMap).map(([account, v]) => ({ account, ...v, net: v.credit - v.debit }));
  const natureMap: Record<string, { accounts: typeof accts; debit: number; credit: number; count: number }> = {};
  accts.forEach((a) => {
    const nat = glNature(a.account);
    natureMap[nat] = natureMap[nat] || { accounts: [], debit: 0, credit: 0, count: 0 };
    natureMap[nat].accounts.push(a); natureMap[nat].debit += a.debit; natureMap[nat].credit += a.credit; natureMap[nat].count += a.count;
  });
  const natureGroups = Object.entries(natureMap)
    .map(([nature, v]) => ({ nature, ...v, net: v.credit - v.debit, accounts: v.accounts.sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit)) }))
    .sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit));

  return { count: txns.length, totalDebit, totalCredit, net, hasBalances, openingBalance, closingBalance, computedClosing, diff, reconciled, chainChecked, chainOk, natureGroups };
}

// ── Direct-method cash-flow classification ──────────────────────────────────
// Maps each GL accounting nature (from bank-classification.ts) to a cash-flow
// section. Investing (fixed-asset purchases) and Financing (owner capital /
// drawings / loans) are NOT separable from bank data today — the bank classifier
// has no fixed-asset / owner-capital / loan categories, so such movements are
// bucketed as ordinary payments or transfers. We therefore do NOT fabricate
// those sections (per the confirmed "honest, fully accurate" design): operating
// flows are itemised; genuinely intermediary movements (inter-account transfers,
// outgoing remittances, opening-balance lines, unknown) go to a clearly-labelled
// "transfers & other" section. Both sum to the exact net change in cash.
const OPERATING_NATURES = new Set([
  'نقدية وما يعادلها',
  'إيرادات ومقبوضات',
  'مصروفات ورسوم',
  'ضرائب',
  'رواتب وأجور',
]);

export type CashFlowSectionKey = 'operating' | 'transfers';

export const cashFlowSectionOf = (nature: string): CashFlowSectionKey =>
  OPERATING_NATURES.has(nature) ? 'operating' : 'transfers';

export interface CashFlowLine {
  nature: string;
  inflow: number;   // credits
  outflow: number;  // debits
  net: number;
  count: number;
}

export interface CashFlowSection {
  key: CashFlowSectionKey;
  inflow: number;
  outflow: number;
  net: number;
  lines: CashFlowLine[];
}

export interface AccountCashFlow {
  accountKey: string;
  accountNumber: string;
  bankName: string;
  accountLabel: string;
  recon: AccountRecon;
  hasBalances: boolean;
  openingBalance: number | null;
  closingBalance: number | null;
  operating: CashFlowSection;
  transfers: CashFlowSection;
  netChange: number;          // operating.net + transfers.net === recon.net
  computedEndingCash: number | null;   // opening + netChange
  reconciledToClosing: boolean;        // computedEndingCash === statement closing
  closingDiff: number | null;
}

function buildSections(recon: AccountRecon): { operating: CashFlowSection; transfers: CashFlowSection } {
  const make = (key: CashFlowSectionKey): CashFlowSection => ({ key, inflow: 0, outflow: 0, net: 0, lines: [] });
  const operating = make('operating');
  const transfers = make('transfers');

  recon.natureGroups.forEach((g) => {
    const target = cashFlowSectionOf(g.nature) === 'operating' ? operating : transfers;
    target.inflow += g.credit;
    target.outflow += g.debit;
    target.net += g.net;
    target.lines.push({ nature: g.nature, inflow: g.credit, outflow: g.debit, net: g.net, count: g.count });
  });
  operating.lines.sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));
  transfers.lines.sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));
  return { operating, transfers };
}

/** Build the direct-method cash-flow view for a single bank account. */
export function computeAccountCashFlow(account: {
  accountKey: string; accountNumber: string; bankName: string; accountLabel: string; recon: AccountRecon;
}): AccountCashFlow {
  const { recon } = account;
  const { operating, transfers } = buildSections(recon);
  const netChange = operating.net + transfers.net; // === recon.net by construction
  const computedEndingCash = recon.openingBalance != null ? recon.openingBalance + netChange : null;
  const closingDiff = (computedEndingCash != null && recon.closingBalance != null)
    ? computedEndingCash - recon.closingBalance : null;
  const reconciledToClosing = closingDiff != null && Math.abs(closingDiff) < 0.01;

  return {
    accountKey: account.accountKey,
    accountNumber: account.accountNumber,
    bankName: account.bankName,
    accountLabel: account.accountLabel,
    recon,
    hasBalances: recon.hasBalances,
    openingBalance: recon.openingBalance,
    closingBalance: recon.closingBalance,
    operating,
    transfers,
    netChange,
    computedEndingCash,
    reconciledToClosing,
    closingDiff,
  };
}

export interface BankAccountGroup {
  accountKey: string; accountNumber: string; bankName: string; accountLabel: string; recon: AccountRecon;
}

/** Segment bank records per account (balances never merged) and reconcile each. */
export function groupBankAccounts(records: any[], unclassified: string): BankAccountGroup[] {
  const txns = (records || []).filter((r: any) => r && r.moduleType === 'banks');
  const groups = new Map<string, any[]>();
  txns.forEach((r: any) => {
    const key = String(r.Account_Key || r.Account_Number || r._sourceFile || 'unknown');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });
  return [...groups.entries()].map(([key, list]) => {
    const f = list[0] || {};
    return {
      accountKey: key,
      accountNumber: f.Account_Number || '',
      bankName: f.Bank_Name || '',
      accountLabel: f.Account_Label || '',
      recon: computeAccount(list, unclassified),
    };
  }).sort((a, b) => b.recon.count - a.recon.count);
}

export interface PortfolioCashFlow {
  accounts: AccountCashFlow[];
  accountCount: number;
  txCount: number;
  hasBalances: boolean;             // every account with a running-balance column
  openingBalance: number | null;   // Σ per-account opening (additive cash position)
  closingBalance: number | null;   // Σ per-account statement closing
  operatingNet: number;
  transfersNet: number;
  netChange: number;
  computedEndingCash: number | null;
  reconciledToClosing: boolean;
  closingDiff: number | null;
}

/** Build the consolidated, multi-account cash-flow portfolio from bank records. */
export function computePortfolioCashFlow(records: any[], unclassified = 'غير مصنّف'): PortfolioCashFlow {
  const groups = groupBankAccounts(records, unclassified);
  const accounts = groups.map(computeAccountCashFlow);

  const txCount = accounts.reduce((s, a) => s + a.recon.count, 0);
  const everyHasBalances = accounts.length > 0 && accounts.every(a => a.hasBalances);
  const openingBalance = everyHasBalances ? accounts.reduce((s, a) => s + (a.openingBalance || 0), 0) : null;
  const closingBalance = everyHasBalances ? accounts.reduce((s, a) => s + (a.closingBalance || 0), 0) : null;
  const operatingNet = accounts.reduce((s, a) => s + a.operating.net, 0);
  const transfersNet = accounts.reduce((s, a) => s + a.transfers.net, 0);
  const netChange = operatingNet + transfersNet;
  const computedEndingCash = openingBalance != null ? openingBalance + netChange : null;
  const closingDiff = (computedEndingCash != null && closingBalance != null) ? computedEndingCash - closingBalance : null;
  const reconciledToClosing = closingDiff != null && Math.abs(closingDiff) < 0.01;

  return {
    accounts,
    accountCount: accounts.length,
    txCount,
    hasBalances: everyHasBalances,
    openingBalance,
    closingBalance,
    operatingNet,
    transfersNet,
    netChange,
    computedEndingCash,
    reconciledToClosing,
    closingDiff,
  };
}
