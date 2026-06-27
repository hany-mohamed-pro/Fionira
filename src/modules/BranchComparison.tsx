import React, { useMemo } from 'react';
import { GitBranch, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/formatters';

/**
 * Dedicated "مقارنة الفروع" view — the single place to compare branch-A vs branch-B.
 * Branches are columns, P&L lines are rows, with a consolidated "كل الفروع" column.
 * Pure presentation of the per-branch `computePnLCore` results computed in App.tsx.
 */
export const BranchComparison = ({ branchComparison }: any) => {
  const branches: any[] = Array.isArray(branchComparison) ? branchComparison : [];

  // Consolidated column: sum the additive totals; recompute margins from the sums.
  const total = useMemo(() => {
    const t = { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, totalOPEX: 0, totalPayroll: 0, netOperatingIncome: 0, recordCount: 0 };
    branches.forEach(b => {
      t.totalRevenue += b.totalRevenue || 0;
      t.totalCOGS += b.totalCOGS || 0;
      t.grossProfit += b.grossProfit || 0;
      t.totalOPEX += b.totalOPEX || 0;
      t.totalPayroll += b.totalPayroll || 0;
      t.netOperatingIncome += b.netOperatingIncome || 0;
      t.recordCount += b.recordCount || 0;
    });
    return {
      ...t,
      grossMargin: t.totalRevenue > 0 ? (t.grossProfit / t.totalRevenue) * 100 : 0,
      netMargin: t.totalRevenue > 0 ? (t.netOperatingIncome / t.totalRevenue) * 100 : 0,
    };
  }, [branches]);

  if (branches.length <= 1) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">لا توجد فروع متعددة للمقارنة</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          عرّف فرعين أو أكثر من «الإعدادات ← الفروع»، وأسند الملفات إلى الفروع عند الرفع.
          ستظهر هنا مقارنة جنباً إلى جنب لأداء كل فرع.
        </p>
      </div>
    );
  }

  const rows: { label: string; key: string; kind: 'currency' | 'percent'; emphasis?: boolean; sub?: boolean }[] = [
    { label: 'إجمالي المبيعات', key: 'totalRevenue', kind: 'currency' },
    { label: 'تكلفة المبيعات (COGS)', key: 'totalCOGS', kind: 'currency' },
    { label: 'مجمل الربح', key: 'grossProfit', kind: 'currency', emphasis: true },
    { label: 'نسبة مجمل الربح', key: 'grossMargin', kind: 'percent', sub: true },
    { label: 'المصاريف التشغيلية (OPEX)', key: 'totalOPEX', kind: 'currency' },
    { label: 'منها صافي الرواتب', key: 'totalPayroll', kind: 'currency', sub: true },
    { label: 'صافي الربح', key: 'netOperatingIncome', kind: 'currency', emphasis: true },
    { label: 'نسبة صافي الربح', key: 'netMargin', kind: 'percent', sub: true },
  ];

  const fmt = (v: number, kind: 'currency' | 'percent') => kind === 'percent' ? formatPercent(v || 0) : formatCurrency(v || 0);
  const valueColor = (key: string, v: number) =>
    (key === 'netOperatingIncome' || key === 'grossProfit' || key === 'netMargin' || key === 'grossMargin')
      ? (v >= 0 ? 'text-emerald-600' : 'text-rose-600')
      : 'text-slate-800';

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-10" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">مقارنة الفروع</h2>
            <p className="text-xs text-slate-500">أداء كل فرع جنباً إلى جنب — مشتق من نفس حسابات قائمة الدخل.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right font-bold text-slate-600 px-4 py-3 sticky right-0 bg-slate-50 min-w-[180px]">البند</th>
                {branches.map(b => (
                  <th key={b.id} className="text-left font-black text-slate-800 px-4 py-3 min-w-[140px] whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      {b.name}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{b.recordCount} سجل</div>
                  </th>
                ))}
                <th className="text-left font-black text-white px-4 py-3 min-w-[150px] bg-indigo-600 whitespace-nowrap">
                  كل الفروع (مجمّع)
                  <div className="text-[10px] font-medium text-white/70 mt-0.5">{total.recordCount} سجل</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className={`border-b border-slate-100 ${row.emphasis ? 'bg-slate-50/60' : ''}`}>
                  <td className={`text-right px-4 py-3 sticky right-0 ${row.emphasis ? 'bg-slate-50' : 'bg-white'} ${row.sub ? 'text-slate-400 text-xs pr-7' : 'text-slate-600 font-bold'}`}>
                    {row.label}
                  </td>
                  {branches.map(b => (
                    <td key={b.id} className={`text-left px-4 py-3 tabular-nums ${row.emphasis ? 'font-black' : 'font-bold'} ${valueColor(row.key, b[row.key])}`} dir="ltr">
                      {fmt(b[row.key], row.kind)}
                    </td>
                  ))}
                  <td className={`text-left px-4 py-3 tabular-nums bg-indigo-50/70 ${row.emphasis ? 'font-black' : 'font-bold'} ${valueColor(row.key, (total as any)[row.key])}`} dir="ltr">
                    {fmt((total as any)[row.key], row.kind)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
        ملاحظة: النِّسب في عمود «كل الفروع» محسوبة من الإجماليات المجمّعة، لا من متوسط نِسب الفروع.
        الأرقام تتبع نفس فترة التصفية المطبّقة على التقارير.
      </p>
    </div>
  );
};
