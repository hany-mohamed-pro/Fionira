import React from 'react';
import { useUI } from '../contexts/UIContext';
import { FileText, Coins, Scale, Calendar, AlertTriangle, ArrowRight, PieChart, Activity, GitBranch, Target } from 'lucide-react';

export const ReportsDashboard = ({ incomeStatement, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'reports');
  };

  const reports = [
    { id: 'income_statement', icon: FileText, title: isRTL ? 'قائمة الدخل' : 'Income Statement', desc: isRTL ? 'إجمالي الإيرادات والمصروفات وصافي الربح' : 'Total revenues, expenses and net profit', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'budget_vs_actual', icon: Target, title: isRTL ? 'الموازنة مقابل الفعلي' : 'Budget vs Actual', desc: isRTL ? 'قارن خطتك بالأداء الفعلي' : 'Compare your plan vs actual', color: 'bg-amber-50 text-amber-600' },
    { id: 'balance_sheet', icon: Scale, title: isRTL ? 'الميزانية العمومية' : 'Balance Sheet', desc: isRTL ? 'الأصول والخصوم وحقوق الملكية' : 'Assets, liabilities and equity', color: 'bg-blue-50 text-blue-600' },
    { id: 'cash_flow', icon: Coins, title: isRTL ? 'التدفقات النقدية' : 'Cash Flow', desc: isRTL ? 'حركة النقد الداخل والخارج' : 'Cash inflows and outflows', color: 'bg-purple-50 text-purple-600' },
    { id: 'branch_comparison', icon: GitBranch, title: isRTL ? 'مقارنة الفروع' : 'Branch Comparison', desc: isRTL ? 'أداء كل فرع جنباً إلى جنب' : 'Side-by-side performance per branch', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'yearly_comparison', icon: Calendar, title: isRTL ? 'المقارنة السنوية' : 'Yearly Comparison', desc: isRTL ? 'مقارنة الأداء بين السنوات المالية' : 'Performance comparison across years', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* SECTION B - REPORTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] md:gap-[20px]">
        {reports.map((rep, idx) => {
          const hoverColors = ['hover:border-emerald-500/30', 'hover:border-blue-500/30', 'hover:border-purple-500/30', 'hover:border-pink-500/30', 'hover:border-indigo-500/30', 'hover:border-cyan-500/30', 'hover:border-orange-500/30'];
          
          let hasData = false;
          if (incomeStatement && (incomeStatement.totalRevenue > 0 || incomeStatement.totalOPEX > 0)) {
              hasData = true; 
          }
          
          return (
          <div key={rep.id} className={`bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group ${hoverColors[idx]} hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
               <div className={`w-10 h-10 rounded-[12px] ${rep.color} flex items-center justify-center shrink-0`}>
                 <rep.icon className="w-[20px] h-[20px]" />
               </div>
               {!hasData && (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-[6px] shrink-0">
                     {isRTL ? 'لا توجد بيانات كافية' : 'Insufficient Data'}
                  </span>
               )}
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800 mb-1">{rep.title}</p>
              <div className="flex items-baseline gap-1 mb-2 h-[16px]">
                 <span className="text-[11px] font-medium text-slate-500 leading-none">{rep.desc}</span>
              </div>
              <div className="flex items-center pt-2 border-t border-slate-100">
                <button onClick={() => handleQuickAction(rep.id)} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  {isRTL ? 'عرض التقرير' : 'View Report'}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* SECTION C - MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[16px] md:gap-[20px]">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'آخر التقارير المنشأة' : 'Recently Generated Reports'}</h3>
          </div>
          <div className="flex-1 w-full relative border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
             <h3 className="text-[13px] font-bold text-slate-800 mb-1">
               {isRTL ? 'لا توجد تقارير منشأة حديثًا.' : 'No recently generated reports.'}
             </h3>
             <p className="text-[11px] text-slate-500">
               {isRTL ? 'قم برفع البيانات المالية أو افتح أحد التقارير المتاحة.' : 'Upload financial data or open one of the available reports.'}
             </p>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
           <h3 className="text-base font-bold text-rose-600 mb-6 flex items-center gap-2">
             <AlertTriangle className="w-[20px] h-[20px]" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-4">
              <p className="text-[12px] font-bold text-slate-400 text-center">
                {isRTL ? 'التقارير الحالية محدثة ولا توجد نواقص.' : 'Current reports are up to date.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
