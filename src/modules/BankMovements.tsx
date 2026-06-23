import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowDownLeft, ArrowUpRight, Layers, Users, ChevronDown, ChevronLeft, Landmark } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';

// Bank-native "Account Movements" — replaces the expense chart-of-accounts view
// for the banks module, and segments BY BANK ACCOUNT. Each account is analysed
// by the NATURE of the movement (transaction type) and by the COUNTERPARTY.
// Accounts are never blended; a single-account dataset renders one section.
type View = 'type' | 'counterparty';

const dirOf = (r: any): 'debit' | 'credit' =>
  r.Flow_Direction === 'credit' || r.Flow_Direction === 'debit'
    ? r.Flow_Direction
    : (typeof r.Category === 'string' && r.Category.includes('إيداع') ? 'credit' : 'debit');

const AccountMovements = ({ txns, isRTL, tr, header }: any) => {
  const [view, setView] = useState<View>('type');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const data = useMemo(() => {
    const keyType = (r: any) => r.Transaction_Type || r.Category || tr('غير مصنّف', 'Unclassified');
    const keyCparty = (r: any) => r.Counterparty || r.Entity_Name || tr('غير محدد', 'Unknown');
    let totalIn = 0, totalOut = 0;
    const build = (keyFn: (r: any) => string) => {
      const m: Record<string, { debit: number; credit: number; count: number; txns: any[] }> = {};
      txns.forEach((r: any) => {
        const k = keyFn(r);
        m[k] = m[k] || { debit: 0, credit: 0, count: 0, txns: [] };
        m[k].count++; m[k].txns.push(r);
        const amt = Number(r.Total_Amount) || 0;
        if (dirOf(r) === 'credit') m[k].credit += amt; else m[k].debit += amt;
      });
      return Object.entries(m).map(([key, v]) => ({ key, ...v, net: v.credit - v.debit, volume: v.debit + v.credit })).sort((a, b) => b.volume - a.volume);
    };
    txns.forEach((r: any) => { const amt = Number(r.Total_Amount) || 0; if (dirOf(r) === 'credit') totalIn += amt; else totalOut += amt; });
    return { count: txns.length, totalIn, totalOut, byType: build(keyType), byCparty: build(keyCparty) };
  }, [txns, isRTL]);

  const rows = view === 'type' ? data.byType : data.byCparty.slice(0, 50);
  const grandVolume = rows.reduce((a, r) => a + r.volume, 0) || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark className="w-5 h-5" /></div>
        <div>
          <h3 className="text-[15px] font-black text-slate-800">{header.bankName || header.accountLabel || tr('حساب بنكي', 'Bank Account')}</h3>
          <p className="text-[12px] text-slate-500">{header.accountNumber ? `${tr('رقم الحساب', 'Account')}: ${header.accountNumber}` : tr('بدون رقم حساب', 'No account number')} · {data.count} {tr('حركة', 'txns')}</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* per-account cash-flow KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 p-4"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><ArrowDownLeft className="w-4 h-4" /></div><p className="text-[11px] font-bold text-slate-500 mb-0.5">{tr('الداخل', 'In')}</p><h4 className="text-[16px] font-black text-emerald-700">{formatCurrency(data.totalIn)}</h4></div>
          <div className="rounded-xl border border-slate-100 p-4"><div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2"><ArrowUpRight className="w-4 h-4" /></div><p className="text-[11px] font-bold text-slate-500 mb-0.5">{tr('الخارج', 'Out')}</p><h4 className="text-[16px] font-black text-rose-700">{formatCurrency(data.totalOut)}</h4></div>
          <div className="rounded-xl border border-slate-100 p-4"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Layers className="w-4 h-4" /></div><p className="text-[11px] font-bold text-slate-500 mb-0.5">{tr('صافي التدفق', 'Net Flow')}</p><h4 className={`text-[16px] font-black ${data.totalIn - data.totalOut >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(data.totalIn - data.totalOut)}</h4></div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="text-[14px] font-bold text-slate-800">{tr('حركة الحساب', 'Account Movements')}</h4>
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => { setView('type'); setOpenKey(null); }} className={`px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 ${view === 'type' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Layers className="w-4 h-4" /> {tr('حسب نوع الحركة', 'By Type')}</button>
            <button onClick={() => { setView('counterparty'); setOpenKey(null); }} className={`px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 ${view === 'counterparty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Users className="w-4 h-4" /> {tr('حسب الطرف المقابل', 'By Counterparty')}</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="text-slate-500 border-b border-slate-200">
              <th className={`py-2 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>{view === 'type' ? tr('نوع الحركة', 'Type') : tr('الطرف المقابل', 'Counterparty')}</th>
              <th className="py-2 text-center font-bold">{tr('عدد', 'Count')}</th>
              <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('داخل', 'In')}</th>
              <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('خارج', 'Out')}</th>
              <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('الصافي', 'Net')}</th>
              <th className="py-2 w-[120px] font-bold">{tr('الحجم', 'Share')}</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const open = openKey === r.key;
                return (
                  <React.Fragment key={r.key}>
                    <tr onClick={() => setOpenKey(open ? null : r.key)} className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer">
                      <td className={`py-2.5 ${isRTL ? 'text-right' : 'text-left'} font-semibold text-slate-700 max-w-[280px] truncate`} title={r.key}>
                        <span className="inline-flex items-center gap-1.5">{open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 ${isRTL ? '' : 'rotate-180'}`} />}{r.key}</span>
                      </td>
                      <td className="py-2.5 text-center text-slate-500">{r.count}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-emerald-600`}>{r.credit ? formatCurrency(r.credit) : '—'}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-rose-600`}>{r.debit ? formatCurrency(r.debit) : '—'}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold ${r.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(r.net)}</td>
                      <td className="py-2.5"><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.max(2, (r.volume / grandVolume) * 100)}%` }} /></div></td>
                    </tr>
                    {open && (
                      <tr><td colSpan={6} className="p-0"><div className="bg-slate-50/70 px-4 py-3 overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead><tr className="text-slate-400">
                            <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التاريخ', 'Date')}</th>
                            <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التفاصيل', 'Details')}</th>
                            <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('الطرف المقابل', 'Counterparty')}</th>
                            <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('المبلغ', 'Amount')}</th>
                            <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('الرصيد', 'Balance')}</th>
                          </tr></thead>
                          <tbody>
                            {r.txns.slice(0, 100).map((t: any) => (
                              <tr key={t.id} className="border-t border-slate-200/60">
                                <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-500 whitespace-nowrap`}>{t.Invoice_Date || '—'}</td>
                                <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-700`}>{t.Entity_Name || '—'}</td>
                                <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-500 max-w-[260px] truncate`} title={t.Counterparty || t.Narrative || ''}>{t.Counterparty || t.Narrative || '—'}</td>
                                <td className={`py-1.5 ${isRTL ? 'text-left' : 'text-right'} font-semibold ${dirOf(t) === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(Number(t.Total_Amount) || 0)}</td>
                                <td className={`py-1.5 ${isRTL ? 'text-left' : 'text-right'} text-slate-500`}>{t.Running_Balance != null ? formatCurrency(Number(t.Running_Balance)) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {r.txns.length > 100 && <p className="text-[11px] text-slate-400 mt-2">{tr(`عرض أول 100 من ${r.txns.length} حركة`, `Showing first 100 of ${r.txns.length}`)}</p>}
                      </div></td></tr>
                    )}
                  </React.Fragment>
                );
              })}
              {rows.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-slate-400">{tr('لا توجد حركات', 'No transactions')}</td></tr>)}
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

export const BankMovements = ({ records = [] }: { records: any[] }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  const accounts = useMemo(() => {
    const txns = (records || []).filter((r: any) => r && r.moduleType === 'banks');
    const groups = new Map<string, any[]>();
    txns.forEach((r: any) => {
      const key = String(r.Account_Key || r.Account_Number || r._sourceFile || 'unknown');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    return [...groups.entries()].map(([key, list]) => {
      const f = list[0] || {};
      return { accountKey: key, accountNumber: f.Account_Number || '', bankName: f.Bank_Name || '', accountLabel: f.Account_Label || '', txns: list };
    }).sort((a, b) => b.txns.length - a.txns.length);
  }, [records]);

  return (
    <div className="space-y-5 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {accounts.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[13px] text-blue-800">
          <Landmark className="w-4 h-4" />
          {tr(`يوجد ${accounts.length} حسابات بنكية — حركة كل حساب معروضة على حدة.`, `${accounts.length} bank accounts — each account's movements shown separately.`)}
        </div>
      )}
      {accounts.map((a) => <AccountMovements key={a.accountKey} txns={a.txns} isRTL={isRTL} tr={tr} header={a} />)}
      {accounts.length === 0 && (<div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">{tr('لا توجد حركات بنكية', 'No bank transactions')}</div>)}
    </div>
  );
};
