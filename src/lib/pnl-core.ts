/**
 * Core P&L reduction — single source of truth for the profitability math.
 *
 * Extracted verbatim from App.tsx's `incomeStatement` useMemo so that BOTH the
 * consolidated Income Statement AND the per-branch comparison compute identical
 * figures (no drift). This is pure aggregation over already-classified records —
 * it does NOT classify anything and does NOT touch categorization-engine.ts.
 *
 * If the COGS/CAPEX category lists or the COGS/OPEX/payroll split logic ever
 * change, change them HERE only; both call sites stay in sync.
 */

export const COGS_CATEGORIES = [
  'تكلفة المبيعات - مواد خام ومكونات',
  'تكلفة المبيعات - مواد تعبئة وتغليف',
  'تكلفة المبيعات - مستهلكات تشغيلية',
  'تكلفة المبيعات - شحن ونقل للداخل',
  'تكلفة المبيعات - هدر وتلف إنتاج',   // D2 — production wastage
  'تكلفة المبيعات - هالك وعجز مخزون'   // D7 — inventory shrinkage
];

export const CAPEX_CATEGORIES = [
  'أصول ثابتة - أجهزة ومعدات',
  'أصول ثابتة - أثاث وتركيبات',
  'أصول ثابتة - أجهزة حاسب آلي',
  'أصول ثابتة - سيارات ووسائل نقل',
  'أصول غير ملموسة - برمجيات وتطبيقات'
];

export interface PnLCore {
  totalRevenue: number;
  totalRevenuesVAT: number;
  totalRevenuesGross: number;
  revBreakdown: Record<string, number>;
  totalCOGS: number;
  totalOPEX: number;
  totalCAPEX: number;
  totalPayroll: number;
  totalExpensesVAT: number;
  totalExpensesGross: number;
  cogsBreakdown: Record<string, number>;
  opexBreakdown: Record<string, number>;
  grossProfit: number;
  grossMargin: number;
  netOperatingIncome: number;
  netMargin: number;
}

/**
 * Reduce already-classified expense / revenue / payroll records into P&L totals.
 * Mirrors App.tsx incomeStatement lines 921-977 exactly.
 */
export function computePnLCore(
  expenses: any[],
  revenues: any[],
  payroll: any[]
): PnLCore {
  let totalRevenue = 0;
  let totalRevenuesVAT = 0;
  let totalRevenuesGross = 0;
  const revBreakdown: Record<string, number> = {};

  (Array.isArray(revenues) ? revenues : []).forEach((r: any) => {
    totalRevenue += (r.Net_Amount || 0);
    totalRevenuesVAT += (r.VAT_Amount || 0);
    totalRevenuesGross += (r.Total_Amount || 0);
    revBreakdown[r.Category] = (revBreakdown[r.Category] || 0) + (r.Net_Amount || 0);
  });

  let totalCOGS = 0;
  let totalOPEX = 0;
  let totalCAPEX = 0;
  let totalExpensesVAT = 0;
  let totalExpensesGross = 0;
  let totalPayroll = 0;
  const cogsBreakdown: Record<string, number> = {};
  const opexBreakdown: Record<string, number> = {};

  (Array.isArray(expenses) ? expenses : []).forEach((r: any) => {
    const cat = r.Category || 'غير مصنف';
    const isPayrollCategory = cat.includes('رواتب') || cat.includes('أجور') || cat.includes('بدلات');
    const amt = isPayrollCategory ? (r.Total_Amount || 0) : (r.Net_Amount || 0);

    if (isPayrollCategory) totalPayroll += amt;

    totalExpensesVAT += (r.VAT_Amount || 0);
    totalExpensesGross += (r.Total_Amount || 0);

    if (COGS_CATEGORIES.includes(cat)) {
      totalCOGS += amt;
      cogsBreakdown[cat] = (cogsBreakdown[cat] || 0) + amt;
    } else if (CAPEX_CATEGORIES.includes(cat)) {
      totalCAPEX += amt;
    } else {
      totalOPEX += amt;
      const displayCat = isPayrollCategory && !cat.includes('(صافي)') ? `${cat} (صافي)` : cat;
      opexBreakdown[displayCat] = (opexBreakdown[displayCat] || 0) + amt;
    }
  });

  (Array.isArray(payroll) ? payroll : []).forEach((r: any) => {
    const netExpense = (r.Total_Amount || 0);
    if (netExpense > 0) {
      totalOPEX += netExpense;
      totalPayroll += netExpense;
      opexBreakdown['رواتب وأجور وبدلات (صافي)'] = (opexBreakdown['رواتب وأجور وبدلات (صافي)'] || 0) + netExpense;
    }
  });

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netOperatingIncome = grossProfit - totalOPEX;
  const netMargin = totalRevenue > 0 ? (netOperatingIncome / totalRevenue) * 100 : 0;

  return {
    totalRevenue, totalRevenuesVAT, totalRevenuesGross, revBreakdown,
    totalCOGS, totalOPEX, totalCAPEX, totalPayroll,
    totalExpensesVAT, totalExpensesGross, cogsBreakdown, opexBreakdown,
    grossProfit, grossMargin, netOperatingIncome, netMargin
  };
}
