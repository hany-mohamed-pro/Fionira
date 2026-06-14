import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { Users, FileText, AlertTriangle, Upload, Activity, Layers, Coins, ShieldAlert, CheckCircle } from 'lucide-react';
import { formatCurrency, formatCount } from '../lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const PayrollDashboard = ({ payrollData, anomaliesCount, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  const employeesCount = payrollData?.entities?.length || 0;
  const totalPayroll = payrollData?.records?.reduce((sum: number, r: any) => sum + (r.grossSalary || r.netSalary || r.Net_Amount || r.Total_Amount || 0), 0) || 0;
  const totalDeductions = payrollData?.records?.reduce((sum: number, r: any) => sum + (r.deductions || 0), 0) || 0;
  
  const payrollChart = useMemo(() => {
    if (!payrollData?.records) return [];
    const map: any = {};
    payrollData.records.forEach((r: any) => {
       const key = r.Invoice_Date ? r.Invoice_Date.substring(0, 7) : 'غير محدد';
       if (!map[key]) map[key] = { name: key, value: 0 };
       map[key].value += (r.grossSalary || r.netSalary || r.Net_Amount || r.Total_Amount || 0);
    });
    return Object.values(map).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [payrollData]);

  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'payroll');
  };

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* SECTION B - KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[20px]">
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#3B82F6]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
               <Users className="w-[20px] h-[20px] text-[#3B82F6]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'عدد الموظفين' : 'Employees Count'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCount(employeesCount)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'مسجلين بالنظام' : 'Registered in system'}</span>
               <button onClick={() => handleQuickAction('grouped_purchases')} className="text-[11px] font-bold text-[#3B82F6] hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'عرض القائمة' : 'View List'}
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#8B5CF6]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
               <Coins className="w-[20px] h-[20px] text-[#8B5CF6]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي الرواتب' : 'Total Payroll'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalPayroll)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'من واقع المسيرات' : 'From payroll runs'}</span>
               <button onClick={() => handleQuickAction('upload')} className="text-[11px] font-bold text-[#8B5CF6] hover:text-purple-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'رفع مسير' : 'Upload Run'}
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#EF4444]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#EF4444]/10 flex items-center justify-center shrink-0">
               <Activity className="w-[20px] h-[20px] text-[#EF4444]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'الخصومات' : 'Deductions'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalDeductions)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'إجمالي الاستقطاعات' : 'Total deductions'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#F59E0B]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
               <ShieldAlert className="w-[20px] h-[20px] text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'تنبيهات الرواتب' : 'Payroll Alerts'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{anomaliesCount}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'طفرات وأخطاء محتملة' : 'Potential anomalies'}</span>
               <button onClick={() => handleQuickAction('anomalies_report')} className="text-[11px] font-bold text-[#F59E0B] hover:text-amber-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'مراجعة' : 'Review'}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C - MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[16px] md:gap-[20px]">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'تكلفة الرواتب عبر الزمن' : 'Payroll Cost Over Time'}</h3>
          </div>
          <div className="flex-1 w-full relative">
             {payrollChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} width={isRTL ? 100 : 80} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip cursor={{fill: '#EEF3F8', opacity: 0.5}} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" name={isRTL ? 'الرواتب' : 'Payroll'} fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={((data: any) => { if (onNavigateToTab) onNavigateToTab('monthly_payroll', undefined, data.name, 'payroll'); }) as any} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {isRTL ? 'لا يوجد مسير رواتب معتمد' : 'No approved payroll run'}
                  </h3>
                  <p className="text-[12px] text-slate-500 max-w-[250px] mx-auto mb-4">
                    {isRTL ? 'ابدأ برفع مسير الرواتب لعرض الموظفين والخصومات والتأمينات.' : 'Start by uploading payroll run to view employees, deductions, and insurance.'}
                  </p>
                  <button onClick={() => handleQuickAction('upload')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#8B5CF6] hover:bg-slate-50 transition-colors shadow-sm">
                    {isRTL ? 'رفع مسير الرواتب' : 'Upload Payroll Run'}
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col xl:col-span-1 h-[340px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-[16px] flex-1 content-start">
            <button onClick={() => handleQuickAction('upload')} className="bg-[#A855F7] text-white p-4 rounded-[16px] hover:bg-[#9333EA] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md col-span-2 h-[104px]">
              <Upload className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'رفع مسير الرواتب' : 'Upload Payroll Run'}</span>
            </button>
            <button onClick={() => handleQuickAction('grouped_purchases')} className="bg-[#3B82F6] text-white p-4 rounded-[16px] hover:bg-[#2563EB] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <Users className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[13px]">{isRTL ? 'فتح الموظفين' : 'Open Employees'}</span>
            </button>
            <button onClick={() => handleQuickAction('anomalies_report')} className="bg-[#EF4444] text-white p-4 rounded-[16px] hover:bg-[#DC2626] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <AlertTriangle className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[13px]">{isRTL ? 'مراجعة الرواتب' : 'Review Payroll'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D - ACTIVITY & SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[20px] md:gap-[24px] pb-4">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'تفاصيل الخصومات/التأمينات' : 'Deductions/GOSI'}</h3>
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-6">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
               <Layers className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-[13px] font-bold text-slate-700 mb-1">
               {isRTL ? 'لا توجد بيانات' : 'No data available'}
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
               {isRTL ? 'لا توجد بيانات كافية لعرضها' : 'No data available to display'}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
           <h3 className="text-base font-bold text-rose-600 mb-6 flex items-center gap-2">
             <AlertTriangle className="w-[20px] h-[20px]" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex flex-col justify-center">
              {anomaliesCount > 0 ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 mb-4">
                    <span className="text-4xl font-black text-rose-600">{anomaliesCount}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-4 text-center">
                    {isRTL ? 'أخطاء وشذوذ تحتاج للمراجعة' : 'Anomalies need review'}
                  </p>
                  <button onClick={() => handleQuickAction('anomalies_report')} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[13px] py-2.5 rounded-[12px] transition-colors border border-rose-100">
                     {isRTL ? 'مراجعة الأخطاء' : 'Review Errors'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                     <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-[14px] font-bold text-slate-800 mb-1">{isRTL ? 'كل شيء ممتاز' : 'All good'}</p>
                  <p className="text-[12px] font-medium text-slate-400">
                    {isRTL ? 'لا توجد خصومات غير مبررة' : 'No unexplained deductions'}
                  </p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
