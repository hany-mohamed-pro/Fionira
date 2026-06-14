import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { getTranslation } from '../i18n/ui-text';
import { TrendingUp, Users, FileText, AlertTriangle, Upload, Activity, Layers, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCount } from '../lib/formatters';
export const RevenuesDashboard = ({ incomeStatement, revenuesData, chartDataRaw, anomaliesCount, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  const totalRevenue = incomeStatement?.totalRevenue || 0;
  const totalVAT = revenuesData?.records?.reduce((sum: number, rec: any) => sum + (rec.taxAmount || 0), 0) || 0;
  const customersCount = revenuesData?.entities?.length || 0;
  const transactionsCount = revenuesData?.records?.length || 0;

  // For charts
  const revenueChart = useMemo(() => {
    if (!chartDataRaw) return [];
    return chartDataRaw.map((d: any) => ({
      name: d.name,
      value: d.totalRevenue || d.الإيرادات || 0
    }));
  }, [chartDataRaw]);

  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'revenues');
  };

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* SECTION B - KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[20px]">
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#22C55E]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#22C55E]/10 flex items-center justify-center shrink-0">
               <TrendingUp className="w-[20px] h-[20px] text-[#22C55E]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenues'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] text-slate-400">{isRTL ? 'من واقع المبيعات' : 'From sales'}</span>
               <button onClick={() => { if(onNavigateToTab) onNavigateToTab('monthly_summary', undefined, undefined, 'revenues'); }} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'عرض التفاصيل' : 'View Details'}
                 <TrendingUp className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#64748B]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-slate-100 flex items-center justify-center shrink-0">
               <Tag className="w-[20px] h-[20px] text-slate-600" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'ضريبة المخرجات' : 'Output VAT'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalVAT)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] text-slate-400">{isRTL ? 'إجمالي الضريبة المستحقة' : 'Total VAT due'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#3B82F6]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
               <Users className="w-[20px] h-[20px] text-[#3B82F6]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'عدد العملاء' : 'Customers Count'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCount(customersCount)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] text-slate-400">{isRTL ? 'العملاء المسجلين' : 'Registered customers'}</span>
               <button onClick={() => handleQuickAction('grouped_purchases')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'عرض القائمة' : 'View List'}
                 <Users className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#F59E0B]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
               <FileText className="w-[20px] h-[20px] text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'عدد المعاملات' : 'Transactions Count'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{formatCount(transactionsCount)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] text-slate-400">{isRTL ? 'إجمالي حركات المبيعات' : 'Total sales transactions'}</span>
               <button onClick={() => handleQuickAction('upload')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'رفع المزيد' : 'Upload More'}
                 <Upload className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C - MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[16px] md:gap-[20px]">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'الإيرادات حسب الفترة' : 'Revenue by Period'}</h3>
          </div>
          <div className="flex-1 w-full relative">
              {revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip cursor={{fill: '#EEF3F8', opacity: 0.5}} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" name={isRTL ? 'الإيرادات' : 'Revenues'} fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={((data: any) => { if (onNavigateToTab) onNavigateToTab('monthly_summary', undefined, data.name, 'revenues'); }) as any} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {isRTL ? 'بيانات الإيرادات غير متوفرة' : 'Revenues Data Unavailable'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[250px] mx-auto mb-4">
                    {isRTL ? 'ابدأ برفع ملفات الإيرادات لعرض العملاء واتجاهات المبيعات.' : 'Start by uploading revenue files to view customers and sales trends.'}
                  </p>
                  <button onClick={() => handleQuickAction('upload')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#22C55E] hover:bg-slate-50 transition-colors shadow-sm">
                    {isRTL ? 'رفع إيرادات' : 'Upload Revenues'}
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col xl:col-span-1 h-[340px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-[16px] flex-1 content-start">
            <button onClick={() => handleQuickAction('upload')} className="bg-[#22C55E] text-white p-4 rounded-[16px] hover:bg-[#16A34A] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <Upload className="w-[28px] h-[28px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[15px]">{isRTL ? 'رفع ملفات الإيرادات' : 'Upload Revenues'}</span>
            </button>
            <button onClick={() => handleQuickAction('grouped_purchases')} className="bg-[#3B82F6] text-white p-4 rounded-[16px] hover:bg-[#2563EB] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <Users className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-sm">{isRTL ? 'فتح العملاء' : 'Open Customers'}</span>
            </button>
            <button onClick={() => { if(onNavigateToTab) onNavigateToTab('smart_invoice', undefined, undefined, 'invoices') }} className="bg-[#F59E0B] text-white p-4 rounded-[16px] hover:bg-[#D97706] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <FileText className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-sm">{isRTL ? 'إنشاء فاتورة' : 'Create Invoice'}</span>
            </button>
            <button onClick={() => { if(onNavigateToTab) onNavigateToTab('monthly_summary', undefined, undefined, 'revenues') }} className="bg-[#8B5CF6] text-white p-4 rounded-[16px] hover:bg-[#7C3AED] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <Activity className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-sm">{isRTL ? 'تحليل الإيرادات' : 'Revenue Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D - ACTIVITY & SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[20px] md:gap-[24px] pb-4">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'أفضل العملاء' : 'Top Customers'}</h3>
          <div className="flex-1 rounded-[16px] overflow-auto">
             {revenuesData?.entities && revenuesData.entities.length > 0 ? (
               <div className="space-y-1">
                 {revenuesData.entities.slice(0, 4).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => { if(onNavigateToTab) onNavigateToTab('grouped_purchases', undefined, c.name, 'revenues'); }}>
                       <span className="text-sm font-bold text-slate-700">{c.name}</span>
                       <span className="text-sm font-black text-emerald-600">{formatCurrency(c.totalAmount)}</span>
                    </div>
                 ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-6">
                 <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-slate-400" />
                 </div>
                 <h3 className="text-[13px] font-bold text-slate-700 mb-1">
                   {isRTL ? 'لا يوجد عملاء' : 'No customers found'}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500">
                   {isRTL ? 'لم يتم العثور على بيانات العملاء' : 'Customer data not found'}
                 </p>
               </div>
             )}
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
           <h3 className="text-base font-bold text-rose-600 mb-6 flex items-center gap-2">
             <AlertTriangle className="w-5 h-5" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-6">
              {anomaliesCount > 0 ? (
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-600">{isRTL ? 'أخطاء وشذوذ' : 'Anomalies & Errors'}</span>
                    <span className="text-lg font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full">{anomaliesCount}</span>
                  </div>
                  <button onClick={() => handleQuickAction('anomalies_report')} className="w-full mt-2 bg-white border border-slate-200 text-rose-600 font-bold text-xs py-2 rounded-lg hover:bg-rose-50 transition-colors">
                     {isRTL ? 'مراجعة الانتباهات' : 'Review Attention Items'}
                  </button>
                </div>
              ) : (
                <p className="text-[13px] font-medium text-slate-500 text-center max-w-[200px]">
                  {isRTL ? 'لا توجد عناصر تحتاج انتباهك حاليًا' : 'No items need attention currently'}
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
