import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, AlertTriangle, Wallet, ListChecks, ChevronDown, ChevronLeft } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';
import { glNature } from '../backend/core/processors/bank-classification';

// Bank-native reconciliation — NOT an expense chart-of-accounts view.
// A bank statement reconciles as: opening balance + credits − debits = closing
// balance, validated against the statement's own running balance, plus a
// running-balance continuity check that flags gaps/missing lines.
export const BankReconciliation = ({ records = [] }: { records: any[] }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  const recon = useMemo(() => {
    const txns = (records || []).filter((r: any) => r && r.moduleType === 'banks');
    // Backward-compatible: records ingested before bank-native classification
    // carry no Flow_Direction/GL_Account — derive direction from the legacy
    // Category ('إيداع بنكي' => credit) and fall back to Category for the GL.
    const dirOf = (r: any): 'debit' | 'credit' =>
      r.Flow_Direction === 'credit' || r.Flow_Direction === 'debit'
        ? r.Flow_Direction
        : (typeof r.Category === 'string' && r.Category.includes('إيداع') ? 'credit' : 'debit');
    const glOf = (r: any): string => r.GL_Account || r.Category || tr('غير مصنّف', 'Unclassified');
    const signed = (r: any) => (dirOf(r) === 'credit' ? 1 : -1) * (Number(r.Total_Amount) || 0);

    let totalDebit = 0, totalCredit = 0, debitCount = 0, creditCount = 0;
    txns.forEach((r: any) => {
      const amt = Number(r.Total_Amount) || 0;
      if (dirOf(r) === 'credit') { totalCredit += amt; creditCount++; }
      else { totalDebit += amt; debitCount++; }
    });
    const net = totalCredit - totalDebit;

    // Chronological order: date ascending; within the same date, original row
    // order is descending (Saudi exports list newest-first), so break ties by
    // original index descending to recover oldest → newest.
    const sorted = [...txns].sort((a, b) => {
      const da = String(a.Invoice_Date || ''), db = String(b.Invoice_Date || '');
      if (da !== db) return da < db ? -1 : 1;
      return (b._originalRowIndex || 0) - (a._originalRowIndex || 0);
    });

    const withBal = sorted.filter((r: any) => r.Running_Balance != null);
    const hasBalances = withBal.length > 0;
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];

    const closingBalance = hasBalances && latest?.Running_Balance != null ? Number(latest.Running_Balance) : null;
    const openingBalance = hasBalances && earliest?.Running_Balance != null
      ? Number(earliest.Running_Balance) - signed(earliest) : null;
    const computedClosing = openingBalance != null ? openingBalance + net : null;
    const diff = (computedClosing != null && closingBalance != null) ? computedClosing - closingBalance : null;
    const reconciled = diff != null && Math.abs(diff) < 0.01;

    // Running-balance continuity: each line's balance should equal the previous
    // line's balance plus the signed movement. Mismatches => possible gap.
    let chainChecked = 0, chainOk = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (prev.Running_Balance == null || cur.Running_Balance == null) continue;
      chainChecked++;
      const expected = Number(prev.Running_Balance) + signed(cur);
      if (Math.abs(expected - Number(cur.Running_Balance)) < 0.01) chainOk++;
    }

    // Per-GL-account roll-up, then grouped under accounting natures with
    // subtotals — the accountant's reading of the statement. Each account keeps
    // its constituent transactions for drill-down.
    const glMap: Record<string, { debit: number; credit: number; count: number; txns: any[] }> = {};
    txns.forEach((r: any) => {
      const k = glOf(r);
      glMap[k] = glMap[k] || { debit: 0, credit: 0, count: 0, txns: [] };
      glMap[k].count++;
      glMap[k].txns.push(r);
      const amt = Number(r.Total_Amount) || 0;
      if (dirOf(r) === 'credit') glMap[k].credit += amt; else glMap[k].debit += amt;
    });
    const accounts = Object.entries(glMap).map(([account, v]) => ({ account, ...v, net: v.credit - v.debit }));

    const natureMap: Record<string, { accounts: typeof accounts; debit: number; credit: number; count: number }> = {};
    accounts.forEach((a) => {
      const nat = glNature(a.account);
      natureMap[nat] = natureMap[nat] || { accounts: [], debit: 0, credit: 0, count: 0 };
      natureMap[nat].accounts.push(a);
      natureMap[nat].debit += a.debit;
      natureMap[nat].credit += a.credit;
      natureMap[nat].count += a.count;
    });
    const natureGroups = Object.entries(natureMap)
      .map(([nature, v]) => ({
        nature, ...v, net: v.credit - v.debit,
        accounts: v.accounts.sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit)),
      }))
      .sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit));

    return {
      count: txns.length, debitCount, creditCount, totalDebit, totalCredit, net,
      hasBalances, openingBalance, closingBalance, computedClosing, diff, reconciled,
      chainChecked, chainOk, natureGroups,
    };
  }, [records, isRTL]);

  // Drill-down: which GL account row is expanded to show its transactions.
  const [openAccount, setOpenAccount] = useState<string | null>(null);

  const kpi = [
    { label: tr('عدد الحركات', 'Transactions'), value: String(recon.count), icon: ListChecks, color: 'text-slate-700 bg-slate-100' },
    { label: tr('إجمالي المدين (سحب)', 'Total Debit'), value: formatCurrency(recon.totalDebit), icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50' },
    { label: tr('إجمالي الدائن (إيداع)', 'Total Credit'), value: formatCurrency(recon.totalCredit), icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50' },
    { label: tr('صافي الحركة', 'Net Movement'), value: formatCurrency(recon.net), icon: Scale, color: recon.net >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-5 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* KPI ROW */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpi.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center mb-3`}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-[12px] font-bold text-slate-500 mb-1">{k.label}</p>
            <h3 className="text-[19px] font-black text-slate-800">{k.value}</h3>
          </div>
        ))}
      </div>

      {/* RECONCILIATION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Wallet className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">{tr('مطابقة الرصيد البنكي', 'Bank Balance Reconciliation')}</h3>
        </div>

        {recon.hasBalances ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('الرصيد الافتتاحي', 'Opening Balance')}</p>
                <h4 className="text-[17px] font-black text-slate-800">{recon.openingBalance != null ? formatCurrency(recon.openingBalance) : '—'}</h4>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('الرصيد الختامي المحسوب', 'Computed Closing')}</p>
                <h4 className="text-[17px] font-black text-slate-800">{recon.computedClosing != null ? formatCurrency(recon.computedClosing) : '—'}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{tr('افتتاحي + صافي الحركة', 'opening + net movement')}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[12px] font-bold text-slate-500 mb-1">{tr('رصيد الكشف الختامي', 'Statement Closing')}</p>
                <h4 className="text-[17px] font-black text-slate-800">{recon.closingBalance != null ? formatCurrency(recon.closingBalance) : '—'}</h4>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border ${recon.reconciled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              {recon.reconciled
                ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
              <div>
                <p className={`text-[14px] font-bold ${recon.reconciled ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {recon.reconciled
                    ? tr('الكشف مطابق ✓ — الرصيد المحسوب يساوي رصيد الكشف', 'Reconciled ✓ — computed balance matches the statement')
                    : tr(`يوجد فرق في المطابقة: ${recon.diff != null ? formatCurrency(recon.diff) : ''}`, `Reconciliation difference: ${recon.diff != null ? formatCurrency(recon.diff) : ''}`)}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {tr(`تسلسل الرصيد الجاري: ${recon.chainOk}/${recon.chainChecked} حركة متطابقة`,
                      `Running-balance continuity: ${recon.chainOk}/${recon.chainChecked} consistent`)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            <p className="text-[13px] text-slate-600">
              {tr('لا يحتوي الكشف على عمود رصيد جارٍ — تُعرض الإجماليات وصافي الحركة فقط دون مطابقة رصيد.',
                  'Statement has no running-balance column — totals and net movement are shown without balance reconciliation.')}
            </p>
          </div>
        )}
      </div>

      {/* RECONCILIATION BY GL NATURE → ACCOUNT → (drill-down) TRANSACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-1">{tr('المطابقة حسب طبيعة الحساب المحاسبي (GL)', 'Reconciliation by GL Account Nature')}</h3>
        <p className="text-[12px] text-slate-400 mb-4">{tr('اضغط على أي حساب لعرض حركاته التفصيلية.', 'Click any account to drill into its transactions.')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className={`py-2 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>{tr('الحساب / الطبيعة', 'Account / Nature')}</th>
                <th className="py-2 text-center font-bold">{tr('عدد', 'Count')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('مدين', 'Debit')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('دائن', 'Credit')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('الصافي', 'Net')}</th>
              </tr>
            </thead>
            <tbody>
              {recon.natureGroups.map((g) => (
                <React.Fragment key={g.nature}>
                  {/* NATURE SUBTOTAL ROW */}
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <td className={`py-2.5 ${isRTL ? 'text-right' : 'text-left'} font-black text-slate-800`}>{g.nature}</td>
                    <td className="py-2.5 text-center font-bold text-slate-500">{g.count}</td>
                    <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold text-rose-600`}>{g.debit ? formatCurrency(g.debit) : '—'}</td>
                    <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold text-emerald-600`}>{g.credit ? formatCurrency(g.credit) : '—'}</td>
                    <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-black ${g.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(g.net)}</td>
                  </tr>
                  {g.accounts.map((a) => {
                    const open = openAccount === a.account;
                    return (
                      <React.Fragment key={a.account}>
                        <tr onClick={() => setOpenAccount(open ? null : a.account)} className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer">
                          <td className={`py-2.5 ${isRTL ? 'text-right pr-6' : 'text-left pl-6'} font-semibold text-slate-700`}>
                            <span className="inline-flex items-center gap-1.5">
                              {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : (isRTL ? <ChevronLeft className="w-3.5 h-3.5 text-slate-400" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-400 rotate-180" />)}
                              {a.account}
                            </span>
                          </td>
                          <td className="py-2.5 text-center text-slate-500">{a.count}</td>
                          <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-rose-600`}>{a.debit ? formatCurrency(a.debit) : '—'}</td>
                          <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-emerald-600`}>{a.credit ? formatCurrency(a.credit) : '—'}</td>
                          <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold ${a.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(a.net)}</td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="bg-slate-50/70 px-4 py-3">
                                <table className="w-full text-[12px]">
                                  <thead>
                                    <tr className="text-slate-400">
                                      <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التاريخ', 'Date')}</th>
                                      <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التفاصيل', 'Details')}</th>
                                      <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('الطرف المقابل', 'Counterparty')}</th>
                                      <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('المبلغ', 'Amount')}</th>
                                      <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('الرصيد', 'Balance')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {a.txns.slice(0, 100).map((t: any) => (
                                      <tr key={t.id} className="border-t border-slate-200/60">
                                        <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-500 whitespace-nowrap`}>{t.Invoice_Date || '—'}</td>
                                        <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-700`}>{t.Entity_Name || '—'}</td>
                                        <td className={`py-1.5 ${isRTL ? 'text-right' : 'text-left'} text-slate-500 max-w-[260px] truncate`} title={t.Counterparty || t.Narrative || ''}>{t.Counterparty || t.Narrative || '—'}</td>
                                        <td className={`py-1.5 ${isRTL ? 'text-left' : 'text-right'} font-semibold ${(t.Flow_Direction === 'credit' || (t.Category||'').includes('إيداع')) ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(Number(t.Total_Amount) || 0)}</td>
                                        <td className={`py-1.5 ${isRTL ? 'text-left' : 'text-right'} text-slate-500`}>{t.Running_Balance != null ? formatCurrency(Number(t.Running_Balance)) : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {a.txns.length > 100 && <p className="text-[11px] text-slate-400 mt-2">{tr(`عرض أول 100 من ${a.txns.length} حركة`, `Showing first 100 of ${a.txns.length}`)}</p>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
              {recon.natureGroups.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">{tr('لا توجد حركات', 'No transactions')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
