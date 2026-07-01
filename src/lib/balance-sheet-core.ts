/**
 * Balance-Sheet core (Foundation — Phase A, READ-ONLY).
 *
 * Builds a REAL balance sheet from the actual double-entry journal entries that
 * `erp-engine.ts` already generates — NOT from estimated ratios. The per-account
 * aggregation replicates `TrialBalance.tsx` EXACTLY (single source of truth,
 * including the VAT input/output handling), then classifies each account by type
 * (chart-of-accounts.ts) and groups into Assets / Liabilities / Equity.
 *
 * Equity = Capital + (Retained earnings = Σ Revenue − Σ Expense, real, from the
 * journal entries) − Drawings. **No plug.** Because every journal entry balances
 * (Σ debit = Σ credit), `Assets = Liabilities + Equity` holds by real construction;
 * any non-zero difference equals the sum of UNCLASSIFIED account balances and is
 * surfaced — exactly like the bank-reconciliation gate.
 *
 * Does NOT touch erp-engine.ts or categorization-engine.ts.
 */

import { classifyAccount, AccountType } from './chart-of-accounts';

export interface JournalEntryLike {
  debitAccount: string;
  creditAccount: string;
  amount: number;
  taxAmount?: number;
  moduleType?: string;
  isActive?: boolean;
}

export interface BSAccountRow {
  account: string;
  type: AccountType;
  subtype: string;
  debit: number;
  credit: number;
  signed: number; // debit − credit
}

export interface BalanceSheetCore {
  accounts: BSAccountRow[];
  // Totals (all positive, presentation-signed):
  totalAssets: number;
  totalLiabilities: number;
  capital: number;
  retainedEarnings: number; // = net income from journals (Σ revenue − Σ expense)
  drawings: number;
  totalEquity: number; // capital + retainedEarnings − drawings
  netIncomeFromJournals: number; // alias of retainedEarnings (for the computePnLCore reconciliation)
  // Identity check (no plug):
  difference: number; // totalAssets − (totalLiabilities + totalEquity)  → equals −Σ(unclassified)
  balanced: boolean;
  unclassifiedTotal: number;
  subtypeBreakdown: Record<AccountType, { subtype: string; amount: number }[]>;
}

/** Replicates TrialBalance.tsx aggregation exactly (incl. VAT input/output). */
function aggregate(entries: JournalEntryLike[]): Record<string, { debit: number; credit: number }> {
  const balances: Record<string, { debit: number; credit: number }> = {};
  const ensure = (a: string) => { if (!balances[a]) balances[a] = { debit: 0, credit: 0 }; };

  entries.filter(e => e && e.isActive !== false).forEach(e => {
    ensure(e.debitAccount); ensure(e.creditAccount);
    balances[e.debitAccount].debit += e.amount;
    balances[e.creditAccount].credit += e.amount;

    const tax = e.taxAmount || 0;
    if (tax > 0) {
      if (e.moduleType === 'expenses') {
        ensure('ضريبة المدخلات (VAT Input)');
        balances['ضريبة المدخلات (VAT Input)'].debit += tax;
        balances[e.creditAccount].credit += tax;
      } else if (e.moduleType === 'revenues') {
        ensure('ضريبة المخرجات (VAT Output)');
        balances['ضريبة المخرجات (VAT Output)'].credit += tax;
        balances[e.debitAccount].debit += tax;
      } else {
        ensure('الضرائب');
        balances['الضرائب'].debit += tax;
        balances[e.creditAccount].credit += tax;
      }
    }
  });
  return balances;
}

export function computeBalanceSheetCore(entries: JournalEntryLike[]): BalanceSheetCore {
  const balances = aggregate(Array.isArray(entries) ? entries : []);

  let totalAssets = 0, totalLiabilities = 0, capital = 0, drawings = 0, revenue = 0, expense = 0, unclassifiedTotal = 0;
  const accounts: BSAccountRow[] = [];
  const subtypeBreakdown: Record<AccountType, { subtype: string; amount: number }[]> = {
    asset: [], liability: [], equity: [], revenue: [], expense: [], unclassified: [],
  };

  for (const [account, b] of Object.entries(balances)) {
    const signed = b.debit - b.credit;
    const { type, subtype } = classifyAccount(account);
    // Presentation amount: assets/expense are debit-natured (positive = signed);
    // liabilities/equity/revenue are credit-natured (positive = −signed).
    let presented = 0;
    if (type === 'asset') { presented = signed; totalAssets += signed; }
    else if (type === 'liability') { presented = -signed; totalLiabilities += -signed; }
    else if (type === 'equity') {
      if (subtype === 'مسحوبات الملاك') { presented = signed; drawings += signed; }
      else { presented = -signed; capital += -signed; }
    }
    else if (type === 'revenue') { presented = -signed; revenue += -signed; }
    else if (type === 'expense') { presented = signed; expense += signed; }
    else { presented = signed; unclassifiedTotal += signed; }

    accounts.push({ account, type, subtype, debit: b.debit, credit: b.credit, signed });
    subtypeBreakdown[type].push({ subtype, amount: presented });
  }

  const retainedEarnings = revenue - expense; // real net income from the journals
  const totalEquity = capital + retainedEarnings - drawings;
  const difference = totalAssets - (totalLiabilities + totalEquity);

  accounts.sort((a, b) => a.account.localeCompare(b.account));

  return {
    accounts,
    totalAssets,
    totalLiabilities,
    capital,
    retainedEarnings,
    drawings,
    totalEquity,
    netIncomeFromJournals: retainedEarnings,
    difference,
    balanced: Math.abs(difference) < 0.01,
    unclassifiedTotal,
    subtypeBreakdown,
  };
}
