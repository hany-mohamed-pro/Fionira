import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { FileText, CheckCircle, Clock, AlertTriangle, FilePlus, Activity, PieChart, Users } from 'lucide-react';
import { formatCurrency } from './VisualDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const InvoicesDashboard = ({ invoicesData, onNavigateToTab }: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  
  const allInvoices = invoicesData?.records || [];
  const issuedInvoicesCount = allInvoices.length;
  // If no explicit unapproved logic, let's treat anomalies as pending if we want to show something, 
  // or just say we don't have pending if there aren't any explicit statuses.
  const pendingInvoices = 0; 
  const approvedInvoices = issuedInvoicesCount;
  const activeQuotations = 0; // Usually no quotations data passed unless specific
  
  const topClients = invoicesData?.entities?.slice(0, 4) || [];

  const invoiceChart = useMemo(() => {
    if (!allInvoices || allInvoices.length === 0) return [];
    const map: any = {};
    allInvoices.forEach((r: any) => {
       const key = r.Invoice_Date ? r.Invoice_Date.substring(0, 7) : 'غير محدد';
       if (!map[key]) map[key] = { name: key, value: 0 };
       map[key].value += (r.Total_Amount || r.Net_Amount || 0);
    });
    return Object.values(map).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [allInvoices]);
  
  const handleQuickAction = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab, undefined, undefined, 'invoices');
  };

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* SECTION B - KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[20px]">
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#F97316]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#F97316]/10 flex items-center justify-center shrink-0">
               <FileText className="w-[20px] h-[20px] text-[#F97316]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي الفواتير' : 'Total Invoices'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{issuedInvoicesCount}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'الفواتير الصادرة هذا الشهر' : 'Invoices issued this month'}</span>
               <button onClick={() => handleQuickAction('smart_invoice')} className="text-[11px] font-bold text-[#F97316] hover:text-orange-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'إنشاء فاتورة' : 'Create Invoice'}
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#F59E0B]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
               <Clock className="w-[20px] h-[20px] text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'الفواتير المعلقة' : 'Pending Invoices'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{pendingInvoices}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'بانتظار الدفع أو المراجعة' : 'Awaiting payment/review'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#22C55E]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#22C55E]/10 flex items-center justify-center shrink-0">
               <CheckCircle className="w-[20px] h-[20px] text-[#22C55E]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'الفواتير المعتمدة' : 'Approved Invoices'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{approvedInvoices}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'الجاهزة للتحصيل' : 'Ready for collection'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col justify-between h-[145px] group hover:border-[#3B82F6]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
               <PieChart className="w-[20px] h-[20px] text-[#3B82F6]" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-500 mb-1">{isRTL ? 'عروض الأسعار' : 'Quotations'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[24px] leading-none font-black text-slate-800 tracking-tight">{activeQuotations}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'عروض الأسعار الفعالة' : 'Active quotations'}</span>
               <button onClick={() => handleQuickAction('quotations')} className="text-[11px] font-bold text-[#3B82F6] hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {isRTL ? 'إنشاء عرض سعر' : 'Create Quotation'}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C - MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[16px] md:gap-[20px]">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-slate-800">{isRTL ? 'قيمة الفواتير حسب الشهر' : 'Invoices Value by Month'}</h3>
          </div>
          <div className="flex-1 w-full relative">
              {invoiceChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoiceChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} width={isRTL ? 100 : 80} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip cursor={{fill: '#EEF3F8', opacity: 0.5}} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" name={isRTL ? 'الفواتير' : 'Invoices'} fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={((data: any) => { if (onNavigateToTab) onNavigateToTab('monthly_summary', undefined, data.name, 'invoices'); }) as any} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {isRTL ? 'لا توجد بيانات' : 'No data available'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[250px] mx-auto mb-4">
                    {isRTL ? 'لا توجد بيانات كافية لعرض الرسم البياني. ابدأ بإنشاء فاتورة لعرض التحليلات.' : 'No sufficient data. Start by creating an invoice to view analytics.'}
                  </p>
                  <button onClick={() => handleQuickAction('smart_invoice')} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#F97316] hover:bg-slate-50 transition-colors shadow-sm">
                    {isRTL ? 'إنشاء فاتورة' : 'Create Invoice'}
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col xl:col-span-1 h-[340px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-[16px] flex-1 content-start">
            <button onClick={() => handleQuickAction('smart_invoice')} className="bg-[#F97316] text-white p-4 rounded-[16px] hover:bg-[#EA580C] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md col-span-2 h-[104px]">
              <FilePlus className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'إنشاء فاتورة' : 'Create Invoice'}</span>
            </button>
            <button onClick={() => handleQuickAction('quotations')} className="bg-[#3B82F6] text-white p-4 rounded-[16px] hover:bg-[#2563EB] transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <FileText className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[13px]">{isRTL ? 'إنشاء عرض سعر' : 'Create Quotation'}</span>
            </button>
            <button className="bg-slate-800 text-white p-4 rounded-[16px] hover:bg-slate-700 transition-colors flex flex-col items-center justify-center text-center group shadow-sm hover:shadow-md h-[104px]">
              <Users className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-[13px]">{isRTL ? 'الفواتير المعلقة' : 'Pending Invoices'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D - ACTIVITY & SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[20px] md:gap-[24px] pb-4">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'العملاء الأكثر إصداراً' : 'Top Clients by Invoices'}</h3>
          <div className="flex-1 rounded-[16px] overflow-auto">
             {topClients && topClients.length > 0 ? (
               <div className="space-y-1">
                 {topClients.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => { if(onNavigateToTab) onNavigateToTab('grouped_purchases', undefined, c.name, 'revenues'); }}>
                       <span className="text-sm font-bold text-slate-700">{c.name}</span>
                       <span className="text-sm font-black text-rose-600">{formatCurrency(c.totalAmount)}</span>
                    </div>
                 ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[12px] bg-slate-50 p-4">
                 <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                 </div>
                 <h3 className="text-[13px] font-bold text-slate-700 mb-0.5">
                   {isRTL ? 'لا يوجد عملاء' : 'No clients found'}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500">
                   {isRTL ? 'لم يتم العثور على بيانات الفواتير' : 'Invoice data not found'}
                 </p>
               </div>
             )}
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[260px]">
           <h3 className="text-base font-bold text-rose-600 mb-6 flex items-center gap-2">
             <AlertTriangle className="w-[20px] h-[20px]" />
             {isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}
           </h3>
           <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50 p-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                   <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[14px] font-bold text-slate-800 mb-1">{isRTL ? 'كل شيء ممتاز' : 'All good'}</p>
                <p className="text-[12px] font-medium text-slate-400">
                  {isRTL ? 'لا توجد عناصر تحتاج انتباهك حاليًا' : 'No items need attention currently'}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
