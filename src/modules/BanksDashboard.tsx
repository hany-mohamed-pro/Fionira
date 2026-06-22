import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { Upload, Users, Layers, ShieldAlert, Activity } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export const BanksDashboard = ({ banksData, anomaliesCount, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  const banksCount = banksData?.entities?.length || 0;
  const transactionsCount = banksData?.records?.length || 0;
  
  const banksChart = useMemo(() => {
    if (!banksData?.records) return [];
    const map: any = {};
    banksData.records.forEach((r: any) => {
       const key = r.Invoice_Date ? r.Invoice_Date.substring(0, 7) : 'غير محدد';
       if (!map[key]) map[key] = { name: key, deposit: 0, withdrawal: 0 };
       
       const amount = r.Total_Amount || r.Net_Amount || 0;
       // Often positive is deposit, negative is withdrawal in bank statements,
       // Or distinguished by columns (e.g., Deposit, Withdrawal)
       if (r.Deposit || amount > 0) {
           map[key].deposit += (r.Deposit || Math.abs(amount));
       } else if (r.Withdrawal || amount < 0) {
           map[key].withdrawal += (r.Withdrawal || Math.abs(amount));
       }
    });
    return Object.values(map).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [banksData]);
  
  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'banks');
  };

  const sections = [
    { id: 'upload', icon: Upload, title: isRTL ? 'رفع كشف حساب' : 'Upload Statement', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'grouped_purchases', icon: Users, title: isRTL ? 'قائمة الحسابات البنكية' : 'Bank Accounts List', color: 'bg-blue-50 text-blue-600' },
    { id: 'categories_summary', icon: Layers, title: isRTL ? 'حركة الحسابات' : 'Account Movements', color: 'bg-purple-50 text-purple-600' },
    { id: 'bank_reconciliation', icon: ShieldAlert, title: isRTL ? 'مطابقة البنوك' : 'Bank Reconciliation', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[20px]">
        {sections.map(sec => (
          <button key={sec.id} onClick={() => handleQuickAction(sec.id)} className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-300 hover:shadow-md transition-all group h-[145px]">
            <div className={`w-12 h-12 rounded-[12px] ${sec.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <sec.icon className="w-6 h-6" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800">{sec.title}</h3>
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'حركة الحسابات' : 'Account Movements'}</h3>
          </div>
          <div className="flex-1 w-full relative">
          {banksCount > 0 ? (
             <div className="h-full flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <p className="text-[12px] font-bold text-slate-500 mb-1">{isRTL ? 'عدد الحسابات' : 'Accounts Count'}</p>
                    <h3 className="text-[20px] font-black text-slate-800">{banksCount}</h3>
                  </div>
                  <div className="text-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <p className="text-[12px] font-bold text-slate-500 mb-1">{isRTL ? 'عدد الحركات' : 'Transactions Count'}</p>
                    <h3 className="text-[20px] font-black text-slate-800">{transactionsCount}</h3>
                  </div>
                </div>
                {banksChart.length > 0 && (
                   <div className="flex-1 min-h-[140px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={banksChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} width={isRTL ? 100 : 80} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `${val / 1000}k`} />
                         <RechartsTooltip cursor={{fill: '#EEF3F8', opacity: 0.5}} formatter={(value: number) => formatCurrency(value)} />
                         <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                         <Bar dataKey="deposit" name={isRTL ? 'إيداعات' : 'Deposits'} fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} onClick={((data: any) => { if (onNavigateToTab) onNavigateToTab('categories_summary', undefined, data.name, 'banks'); }) as any} cursor="pointer" />
                         <Bar dataKey="withdrawal" name={isRTL ? 'سحوبات' : 'Withdrawals'} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} onClick={((data: any) => { if (onNavigateToTab) onNavigateToTab('categories_summary', undefined, data.name, 'banks'); }) as any} cursor="pointer" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                )}
             </div>
          ) : (
             <div className="flex-1 w-full relative border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6 h-full">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-800 mb-1">
                  {isRTL ? 'لا توجد بيانات بنكية كافية' : 'Insufficient bank data'}
                </h3>
                <p className="text-[11px] text-slate-500 max-w-[250px] mx-auto mb-4">
                  {isRTL ? 'ابدأ برفع كشف حساب بنكي لعرض الحركات والتحليلات.' : 'Start by uploading a bank statement to view movements and analytics.'}
                </p>
                <button onClick={() => handleQuickAction('upload')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-blue-600 hover:bg-slate-50 transition-colors shadow-sm">
                  {isRTL ? 'رفع كشف حساب' : 'Upload Statement'}
                </button>
             </div>
          )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
           <h3 className="text-base font-bold text-rose-600 mb-4 flex items-center gap-2">
             <ShieldAlert className="w-5 h-5" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-6">
              {anomaliesCount > 0 ? (
                <div className="w-full text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-3">
                    <span className="text-3xl font-black text-rose-600">{anomaliesCount}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    {isRTL ? 'أخطاء وحركات تحتاج للمراجعة' : 'Anomalies need review'}
                  </p>
                  <button onClick={() => handleQuickAction('anomalies_report')} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[13px] py-2 rounded-lg transition-colors border border-rose-100">
                     {isRTL ? 'مراجعة الأخطاء' : 'Review Errors'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-[14px] font-bold text-slate-800 mb-1">
                    {isRTL ? 'لا توجد أخطاء حالياً' : 'No errors currently'}
                  </h3>
                  <p className="text-[12px] font-medium text-slate-400">
                    {isRTL ? 'الحسابات مطابقة ولا توجد حركات غير متوقعة' : 'Accounts are reconciled and no unexpected movements'}
                  </p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
