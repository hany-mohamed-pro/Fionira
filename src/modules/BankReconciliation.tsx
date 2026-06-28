import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, AlertTriangle, Wallet, ListChecks, ChevronDown, ChevronLeft, Landmark } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';
import { computeAccount, dirOf } from '../lib/bank-cashflow-core';

// Bank-native reconciliation — segmented PER BANK ACCOUNT.
// A bank statement reconciles as: opening balance + credits − debits = closing
// balance, validated against the statement's running balance. Crucially,
// balances from different bank accounts are NEVER merged into one running
// balance — each account reconciles independently. A single-account dataset
// renders exactly one account section (identical to the prior behaviour).

// Reconciliation math (computeAccount) and the credit/debit resolver (dirOf) now
// live in ../lib/bank-cashflow-core — the single source shared with the Cash Flow
// Statement so the cash position can never drift between the two pages.

const AccountSection = ({ acc, isRTL, tr }: any) => {
  const [openGl, setOpenGl] = useState<string | null>(null);
  const r = acc.recon;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Account header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark className="w-5 h-5" /></div>
        <div>
          <h3 className="text-[15px] font-black text-slate-800">{acc.bankName || acc.accountLabel || tr('حساب بنكي', 'Bank Account')}</h3>
          <p className="text-[12px] text-slate-500">
            {acc.accountNumber ? `${tr('رقم الحساب', 'Account')}: ${acc.accountNumber}` : tr('بدون رقم حساب', 'No account number')}
            {acc.accountLabel && acc.bankName ? ` · ${acc.accountLabel}` : ''} · {r.count} {tr('حركة', 'txns')}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* per-account KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { l: tr('عدد الحركات', 'Transactions'), v: String(r.count), c: 'text-slate-700 bg-slate-100', I: ListChecks },
            { l: tr('إجمالي المدين', 'Total Debit'), v: formatCurrency(r.totalDebit), c: 'text-rose-600 bg-rose-50', I: ArrowUpRight },
            { l: tr('إجمالي الدائن', 'Total Credit'), v: formatCurrency(r.totalCredit), c: 'text-emerald-600 bg-emerald-50', I: ArrowDownLeft },
            { l: tr('صافي الحركة', 'Net'), v: formatCurrency(r.net), c: r.net >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50', I: Scale },
          ].map((k, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <div className={`w-8 h-8 rounded-lg ${k.c} flex items-center justify-center mb-2`}><k.I className="w-4 h-4" /></div>
              <p className="text-[11px] font-bold text-slate-500 mb-0.5">{k.l}</p>
              <h4 className="text-[16px] font-black text-slate-800">{k.v}</h4>
            </div>
          ))}
        </div>

        {/* balance reconciliation */}
        {r.hasBalances ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[12px] font-bold text-slate-500 mb-1">{tr('الرصيد الافتتاحي', 'Opening')}</p><h4 className="text-[16px] font-black text-slate-800">{r.openingBalance != null ? formatCurrency(r.openingBalance) : '—'}</h4></div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[12px] font-bold text-slate-500 mb-1">{tr('الختامي المحسوب', 'Computed Closing')}</p><h4 className="text-[16px] font-black text-slate-800">{r.computedClosing != null ? formatCurrency(r.computedClosing) : '—'}</h4></div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100"><p className="text-[12px] font-bold text-slate-500 mb-1">{tr('رصيد الكشف الختامي', 'Statement Closing')}</p><h4 className="text-[16px] font-black text-slate-800">{r.closingBalance != null ? formatCurrency(r.closingBalance) : '—'}</h4></div>
            </div>
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${r.reconciled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              {r.reconciled ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
              <div>
                <p className={`text-[14px] font-bold ${r.reconciled ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {r.reconciled ? tr('الكشف مطابق ✓ — الرصيد المحسوب يساوي رصيد الكشف', 'Reconciled ✓') : tr(`يوجد فرق في المطابقة: ${r.diff != null ? formatCurrency(r.diff) : ''}`, `Difference: ${r.diff != null ? formatCurrency(r.diff) : ''}`)}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">{tr(`تسلسل الرصيد الجاري: ${r.chainOk}/${r.chainChecked} حركة متطابقة`, `Continuity: ${r.chainOk}/${r.chainChecked}`)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            <p className="text-[13px] text-slate-600">{tr('لا يحتوي الكشف على عمود رصيد جارٍ — تُعرض الإجماليات فقط.', 'No running-balance column — totals only.')}</p>
          </div>
        )}

        {/* GL nature → account → drill-down */}
        <div>
          <h4 className="text-[14px] font-bold text-slate-800 mb-1">{tr('المطابقة حسب طبيعة الحساب المحاسبي (GL)', 'By GL Account Nature')}</h4>
          <p className="text-[12px] text-slate-400 mb-3">{tr('اضغط على أي حساب لعرض حركاته التفصيلية.', 'Click any account to drill into its transactions.')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="text-slate-500 border-b border-slate-200">
                <th className={`py-2 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>{tr('الحساب / الطبيعة', 'Account / Nature')}</th>
                <th className="py-2 text-center font-bold">{tr('عدد', 'Count')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('مدين', 'Debit')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('دائن', 'Credit')}</th>
                <th className={`py-2 ${isRTL ? 'text-left' : 'text-right'} font-bold`}>{tr('الصافي', 'Net')}</th>
              </tr></thead>
              <tbody>
                {r.natureGroups.map((g: any) => (
                  <React.Fragment key={g.nature}>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td className={`py-2.5 ${isRTL ? 'text-right' : 'text-left'} font-black text-slate-800`}>{g.nature}</td>
                      <td className="py-2.5 text-center font-bold text-slate-500">{g.count}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold text-rose-600`}>{g.debit ? formatCurrency(g.debit) : '—'}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold text-emerald-600`}>{g.credit ? formatCurrency(g.credit) : '—'}</td>
                      <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-black ${g.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(g.net)}</td>
                    </tr>
                    {g.accounts.map((a: any) => {
                      const open = openGl === a.account;
                      return (
                        <React.Fragment key={a.account}>
                          <tr onClick={() => setOpenGl(open ? null : a.account)} className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer">
                            <td className={`py-2.5 ${isRTL ? 'text-right pr-6' : 'text-left pl-6'} font-semibold text-slate-700`}>
                              <span className="inline-flex items-center gap-1.5">{open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 ${isRTL ? '' : 'rotate-180'}`} />}{a.account}</span>
                            </td>
                            <td className="py-2.5 text-center text-slate-500">{a.count}</td>
                            <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-rose-600`}>{a.debit ? formatCurrency(a.debit) : '—'}</td>
                            <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} text-emerald-600`}>{a.credit ? formatCurrency(a.credit) : '—'}</td>
                            <td className={`py-2.5 ${isRTL ? 'text-left' : 'text-right'} font-bold ${a.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(a.net)}</td>
                          </tr>
                          {open && (
                            <tr><td colSpan={5} className="p-0"><div className="bg-slate-50/70 px-4 py-3">
                              <table className="w-full text-[12px]">
                                <thead><tr className="text-slate-400">
                                  <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التاريخ', 'Date')}</th>
                                  <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('التفاصيل', 'Details')}</th>
                                  <th className={`py-1 ${isRTL ? 'text-right' : 'text-left'}`}>{tr('الطرف المقابل', 'Counterparty')}</th>
                                  <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('المبلغ', 'Amount')}</th>
                                  <th className={`py-1 ${isRTL ? 'text-left' : 'text-right'}`}>{tr('الرصيد', 'Balance')}</th>
                                </tr></thead>
                                <tbody>
                                  {a.txns.slice(0, 100).map((t: any) => (
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
                              {a.txns.length > 100 && <p className="text-[11px] text-slate-400 mt-2">{tr(`عرض أول 100 من ${a.txns.length} حركة`, `Showing first 100 of ${a.txns.length}`)}</p>}
                            </div></td></tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BankReconciliation = ({ records = [] }: { records: any[] }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  const { accounts, portfolio } = useMemo(() => {
    const txns = (records || []).filter((r: any) => r && r.moduleType === 'banks');
    // Segment by bank account — balances are NEVER merged across accounts.
    const groups = new Map<string, any[]>();
    txns.forEach((r: any) => {
      const key = String(r.Account_Key || r.Account_Number || r._sourceFile || 'unknown');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    const accounts = [...groups.entries()].map(([key, list]) => {
      const f = list[0] || {};
      return {
        accountKey: key,
        accountNumber: f.Account_Number || '',
        bankName: f.Bank_Name || '',
        accountLabel: f.Account_Label || '',
        recon: computeAccount(list, tr('غير مصنّف', 'Unclassified')),
      };
    }).sort((a, b) => b.recon.count - a.recon.count);

    const portfolio = {
      accountCount: accounts.length,
      txCount: txns.length,
      totalDebit: accounts.reduce((s, a) => s + a.recon.totalDebit, 0),
      totalCredit: accounts.reduce((s, a) => s + a.recon.totalCredit, 0),
    };
    return { accounts, portfolio };
  }, [records, isRTL]);

  return (
    <div className="space-y-5 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* PORTFOLIO SUMMARY — aggregate totals are additive; balances stay per-account below */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { l: tr('عدد الحسابات البنكية', 'Bank Accounts'), v: String(portfolio.accountCount), c: 'text-blue-600 bg-blue-50', I: Landmark },
          { l: tr('إجمالي الحركات', 'Total Transactions'), v: String(portfolio.txCount), c: 'text-slate-700 bg-slate-100', I: ListChecks },
          { l: tr('إجمالي المدين (كل الحسابات)', 'Total Debit (all)'), v: formatCurrency(portfolio.totalDebit), c: 'text-rose-600 bg-rose-50', I: ArrowUpRight },
          { l: tr('إجمالي الدائن (كل الحسابات)', 'Total Credit (all)'), v: formatCurrency(portfolio.totalCredit), c: 'text-emerald-600 bg-emerald-50', I: ArrowDownLeft },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${k.c} flex items-center justify-center mb-3`}><k.I className="w-5 h-5" /></div>
            <p className="text-[12px] font-bold text-slate-500 mb-1">{k.l}</p>
            <h3 className="text-[19px] font-black text-slate-800">{k.v}</h3>
          </div>
        ))}
      </div>

      {portfolio.accountCount > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[13px] text-blue-800">
          <Wallet className="w-4 h-4" />
          {tr(`يوجد ${portfolio.accountCount} حسابات بنكية — كل حساب يُطابَق على حدة (لا يتم دمج الأرصدة).`,
              `${portfolio.accountCount} bank accounts — each reconciled independently (balances are not merged).`)}
        </div>
      )}

      {accounts.map((acc) => <AccountSection key={acc.accountKey} acc={acc} isRTL={isRTL} tr={tr} />)}
      {accounts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">{tr('لا توجد حركات بنكية', 'No bank transactions')}</div>
      )}
    </div>
  );
};
