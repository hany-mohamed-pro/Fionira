import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowDownLeft, ArrowUpRight, Layers, Users } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';

// Bank-native "Account Movements" — replaces the expense chart-of-accounts view
// for the banks module. A bank statement is analysed by the NATURE of the
// movement (transaction type) and by the COUNTERPARTY, not by an expense
// category tree. Two toggleable groupings answer exactly that.
type View = 'type' | 'counterparty';

export const BankMovements = ({ records = [] }: { records: any[] }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);
  const [view, setView] = useState<View>('type');

  const data = useMemo(() => {
    const txns = (records || []).filter((r: any) => r && r.moduleType === 'banks');
    // Backward-compatible with records ingested before bank classification.
    const dirOf = (r: any): 'debit' | 'credit' =>
      r.Flow_Direction === 'credit' || r.Flow_Direction === 'debit'
        ? r.Flow_Direction
        : (typeof r.Category === 'string' && r.Category.includes('إيداع') ? 'credit' : 'debit');
    const keyType = (r: any) => r.Transaction_Type || r.Category || tr('غير مصنّف', 'Unclassified');
    const keyCparty = (r: any) => r.Counterparty || r.Entity_Name || tr('غير محدد', 'Unknown');

    let totalIn = 0, totalOut = 0;
    const build = (keyFn: (r: any) => string) => {
      const m: Record<string, { debit: number; credit: number; count: number }> = {};
      txns.forEach((r: any) => {
        const k = keyFn(r);
        m[k] = m[k] || { debit: 0, credit: 0, count: 0 };
        m[k].count++;
        const amt = Number(r.Total_Amount) || 0;
        if (dirOf(r) === 'credit') m[k].credit += amt; else m[k].debit += amt;
      });
      return Object.entries(m)
        .map(([key, v]) => ({ key, ...v, net: v.credit - v.debit, volume: v.debit + v.credit }))
        .sort((a, b) => b.volume - a.volume);
    };
    txns.forEach((r: any) => {
      const amt = Number(r.Total_Amount) || 0;
      if (dirOf(r) === 'credit') totalIn += amt; else totalOut += amt;
    });

    return { count: txns.length, totalIn, totalOut, byType: build(keyType), byCparty: build(keyCparty) };
  }, [records, isRTL]);

  const rows = view === 'type' ? data.byType : data.byCparty.slice(0, 50);
  const grandVolume = rows.reduce((a, r) => a + r.volume, 0) || 1;

  return (
    <div className="space-y-5 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3"><Layers className="w-5 h-5" /></div>
          <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('عدد الحركات', 'Transactions')}</p>
          <h3 className="text-[19px] font-black text-slate-800">{data.count}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><ArrowDownLeft className="w-5 h-5" /></div>
          <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('إجمالي الداخل (إيداعات)', 'Total In (Credits)')}</p>
          <h3 className="text-[19px] font-black text-emerald-700">{formatCurrency(data.totalIn)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3"><ArrowUpRight className="w-5 h-5" /></div>
          <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('إجمالي الخارج (سحوبات)', 'Total Out (Debits)')}</p>
          <h3 className="text-[19px] font-black text-rose-700">{formatCurrency(data.totalOut)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3"><Layers className="w-5 h-5" /></div>
          <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('صافي التدفق النقدي', 'Net Cash Flow')}</p>
          <h3 className={`text-[19px] font-black ${data.totalIn - data.totalOut >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(data.totalIn - data.totalOut)}</h3>
        </div>
      </div>

      {/* View toggle + table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-base font-bold text-slate-800">{tr('حركة الحسابات البنكية', 'Bank Account Movements')}</h3>
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setView('type')} className={`px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-all ${view === 'type' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <Layers className="w-4 h-4" /> {tr('حسب نوع الحركة', 'By Type')}
            </button>
            <button onClick={() => setView('counterparty')} className={`px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-all ${view === 'counterparty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <Users className="w-4 h-4" /> {tr('حسب الطرف المقابل', 'By Counterparty')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className={`py-2 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>{view === 'type' ? tr('نوع الحركة', 'Type') : tr('الطرف المقابل', 'Counterparty')}</th>
                <th className="py-2 text-center font-bold">{tr('عدد', 'Count')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('داخل', 'In')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('خارج', 'Out')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('الصافي', 'Net')}</th>
                <th className="py-2 w-[120px] font-bold">{tr('الحجم', 'Share')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className={`py-2.5 ${isRTL ? 'text-right' : 'text-left'} font-semibold text-slate-700 max-w-[280px] truncate`} title={r.key}>{r.key}</td>
                  <td className="py-2.5 text-center text-slate-500">{r.count}</td>
                  <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-emerald-600`}>{r.credit ? formatCurrency(r.credit) : '—'}</td>
                  <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-rose-600`}>{r.debit ? formatCurrency(r.debit) : '—'}</td>
                  <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold ${r.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(r.net)}</td>
                  <td className="py-2.5">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.max(2, (r.volume / grandVolume) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">{tr('لا توجد حركات', 'No transactions')}</td></tr>
              )}
            </tbody>
          </table>
          {view === 'counterparty' && data.byCparty.length > 50 && (
            <p className="text-[12px] text-slate-400 mt-3 text-center">{tr(`عرض أعلى 50 من ${data.byCparty.length} طرفًا`, `Showing top 50 of ${data.byCparty.length} counterparties`)}</p>
          )}
        </div>
      </div>
    </div>
  );
};
