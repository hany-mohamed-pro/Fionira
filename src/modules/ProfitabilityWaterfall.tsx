import React from 'react';
import { Activity } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/formatters';

/**
 * Profitability Waterfall — the revenue → gross profit → net profit cascade as
 * progressive bars. Extracted verbatim from the retired OwnersSummary so this
 * unique visualization is preserved (IA Phase 2, per the "never lose a unique
 * visualization" gate). Pure presentation over the unified incomeStatement
 * (computePnLCore) — no recomputation.
 */
export const ProfitabilityWaterfall: React.FC<{ incomeStatement: any }> = ({ incomeStatement }) => {
  const totalRevenue = incomeStatement?.totalRevenue || 0;
  const grossProfit = incomeStatement?.grossProfit || 0;
  const netOperatingIncome = incomeStatement?.netOperatingIncome || 0;
  const netMargin = incomeStatement?.netMargin || 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
        <Activity className="w-5 h-5 ml-2 text-indigo-500" /> مسار تدفق الأرباح (Profitability Waterfall)
      </h3>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-bold text-slate-700 ml-4">1. إجمالي المبيعات المحصلة</span>
            <div className="flex gap-4">
              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(totalRevenue)}</span>
              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(100)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-bold text-slate-700 ml-4">2. مجمل الربح (بعد خصم تكلفة المواد)</span>
            <div className="flex gap-4">
              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(grossProfit)}</span>
              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-bold text-slate-700 ml-4">3. صافي الأرباح (بعد خصم كافة المصاريف التشغيلية)</span>
            <div className="flex gap-4">
              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(netOperatingIncome)}</span>
              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(netMargin)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className={`h-3 rounded-full ${netMargin >= 0 ? 'bg-indigo-600' : 'bg-red-500'}`} style={{ width: `${Math.max(0, netMargin)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
