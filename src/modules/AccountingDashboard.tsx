import React, { useState, useEffect, useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthProvider';
import { BookOpen, Scale, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';

export const AccountingDashboard = ({ incomeStatement, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  let accountsCount = 0;
  let topAccounts: any[] = [];
  
  if (incomeStatement) {
     const allAccs = [
         ...(incomeStatement.revBreakdown || []).map((x: any) => ({ account: x[0], balance: x[1] })),
         ...(incomeStatement.cogsBreakdown || []).map((x: any) => ({ account: x[0], balance: x[1] })),
         ...(incomeStatement.opexBreakdown || []).map((x: any) => ({ account: x[0], balance: -x[1] }))
     ];
     
     accountsCount = allAccs.length;
     topAccounts = allAccs.sort((a,b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5);
  }

  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'accounting');
  };

  const sections = [
    { id: 'general_ledger', icon: BookOpen, title: isRTL ? 'دفتر الأستاذ' : 'General Ledger', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'trial_balance', icon: Scale, title: isRTL ? 'ميزان المراجعة' : 'Trial Balance', color: 'bg-blue-50 text-blue-600' },
    { id: 'tax_declaration', icon: BookOpen, title: isRTL ? 'الإقرار الضريبي' : 'Tax Declaration', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-[20px]">
        {sections.map(sec => (
          <div key={sec.id} className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-2">
               <div className={`w-10 h-10 rounded-[12px] ${sec.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                 <sec.icon className="w-5 h-5" />
               </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold text-slate-800 mb-2">{sec.title}</h3>
            </div>
            <button onClick={() => handleQuickAction(sec.id)} className="w-full flex items-center justify-between mt-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg transition-colors group-hover:text-indigo-600">
               {isRTL ? 'فتح السجل' : 'Open Ledger'}
               <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'حركة الحسابات النشطة' : 'Active Accounts'}</h3>
          </div>
          <div className="flex-1 w-full relative">
             {accountsCount > 0 ? (
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl min-w-[120px]">
                         <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRTL ? 'عدد الحسابات' : 'Total Accounts'}</span>
                         <span className="text-xl font-black text-slate-800">{accountsCount}</span>
                      </div>
                   </div>
                   <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
                      {topAccounts.map((a: any, i: number) => (
                         <div key={i} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => { if(onNavigateToTab) onNavigateToTab('trial_balance', undefined, a.account, 'accounting'); }}>
                            <span className="text-sm font-bold text-slate-700">{a.account}</span>
                            <span className={`text-sm font-black ${a.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(a.balance)}</span>
                         </div>
                      ))}
                   </div>
                </div>
             ) : (
                <div className="flex-1 w-full relative border border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center p-6 min-h-[220px]">
                   <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                     <BookOpen className="w-8 h-8 text-slate-400" />
                   </div>
                   <h3 className="text-sm font-bold text-slate-800 mb-1">
                     {isRTL ? 'لا توجد بيانات حسابات' : 'No account data'}
                   </h3>
                   <p className="text-xs text-slate-500 max-w-[250px] mx-auto mb-4">
                     {isRTL ? 'ابدأ بترحيل السجلات أو فتح دفتر الأستاذ لمراجعة الحسابات.' : 'Start by posting records or opening the ledger to review accounts.'}
                   </p>
                </div>
             )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col xl:col-span-1">
           <h3 className="text-base font-bold text-rose-600 mb-4 flex items-center gap-2">
             <AlertTriangle className="w-4 h-4" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6">
              <p className="text-xs font-bold text-slate-400 text-center">
                {isRTL ? 'لا توجد قيود غير متزنة.' : 'No unbalanced entries.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
