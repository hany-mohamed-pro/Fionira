import React from 'react';
import { useUI } from '../contexts/UIContext';
import { Activity, Upload, FileText, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Users, CheckCircle, BarChart2, PieChart, AlertCircle, Wallet, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/formatters';
export const GlobalDashboard = ({
  incomeStatement,
  handleNavClick,
  totalAnomaliesCount,
  chartDataRaw,
  revenuesData,
  expensesData,
  stagedFilesCount = 0,
  cashClosing = null,
  cashHasData = false
}: any) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  


  const totalRevenue = incomeStatement?.totalRevenue || 0;
  const totalExpenses = (incomeStatement?.totalOPEX || 0) + (incomeStatement?.totalCOGS || 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const vendorsCount = expensesData?.entities?.length || 0;
  const customersCount = revenuesData?.entities?.length || 0;
  const expensesTransactions = expensesData?.records?.length || 0;
  const revenuesTransactions = revenuesData?.records?.length || 0;
  const totalTransactions = expensesTransactions + revenuesTransactions;

  const revenueChart = React.useMemo(() => {
    if (!chartDataRaw) return [];
    return chartDataRaw.map((d: any) => ({
      name: d.name,
      'الإيرادات': d.totalRevenue || d.الإيرادات || 0,
      'المصروفات': d.totalExpenses || d.المصروفات || 0,
    }));
  }, [chartDataRaw]);

  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null;
  const attentionItems: string[] = [];
  if (stagedFilesCount > 0) attentionItems.push(`${stagedFilesCount} ملف بانتظار الاعتماد`);
  if (totalAnomaliesCount > 0) attentionItems.push(`${totalAnomaliesCount} ملاحظة تحتاج مراجعة`);

  return (
    <div className="space-y-4 w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* OWNER HOME — plain-language summary band (ADDITIVE: all existing KPIs/chart/cards remain below, unchanged) */}
      {isRTL && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-[20px]">
        {/* ربحك هذا الشهر */}
        <button onClick={() => handleNavClick('reports', 'income_statement')} className="text-right bg-white rounded-[18px] border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-1.5 h-full ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <p className="text-[13px] font-bold text-slate-500 mb-2">ربحك هذا الشهر</p>
          <h3 className={`text-[26px] leading-none font-black tracking-tight mb-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">{formatCurrency(netProfit)}</h3>
          <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
            {netProfit >= 0
              ? `ربحت ${formatCurrency(netProfit)} هذا الشهر${profitMargin != null ? ` بهامش ${profitMargin}%` : ''}.`
              : `خسرت ${formatCurrency(Math.abs(netProfit))} هذا الشهر — راجع المصروفات.`}
          </p>
        </button>

        {/* النقدية لديك */}
        <button onClick={() => handleNavClick('reports', 'cash_flow')} className="text-right bg-white rounded-[18px] border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-indigo-500" /><p className="text-[13px] font-bold text-slate-500">النقدية لديك</p></div>
          <h3 className="text-[26px] leading-none font-black tracking-tight text-slate-800 mb-2" dir="ltr">{cashHasData && cashClosing != null ? formatCurrency(cashClosing) : '—'}</h3>
          <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
            {cashHasData ? 'الرصيد النقدي الفعلي وفق كشوف البنوك المطابَقة.' : 'ارفع كشف حساب بنكي لعرض رصيدك النقدي الفعلي.'}
          </p>
        </button>

        {/* ما يحتاج انتباهك */}
        <button onClick={() => handleNavClick('expenses', 'upload')} className="text-right bg-white rounded-[18px] border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-1.5 h-full ${attentionItems.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          <div className="flex items-center gap-2 mb-2">{attentionItems.length > 0 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}<p className="text-[13px] font-bold text-slate-500">ما يحتاج انتباهك</p></div>
          {attentionItems.length > 0 ? (
            <div className="space-y-1.5 mt-1">
              {attentionItems.map((it, i) => (
                <p key={i} className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{it}</p>
              ))}
              <p className="text-[11px] text-indigo-600 font-bold flex items-center gap-1 pt-1">عرض التفاصيل <ArrowLeft className="w-3 h-3" /></p>
            </div>
          ) : (
            <>
              <h3 className="text-[20px] leading-none font-black tracking-tight text-emerald-600 mb-2">كل شيء على ما يرام</h3>
              <p className="text-[12px] font-medium text-slate-500">لا يوجد ما يحتاج انتباهك حالياً.</p>
            </>
          )}
        </button>
      </div>
      )}

      {stagedFilesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4" dir="rtl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-amber-900 text-lg">ملفات تنتظر اعتمادك</h3>
              <p className="text-amber-800 text-sm font-medium">{stagedFilesCount} ملف مرفوع قيد المراجعة — لا يؤثر على تقاريرك حتى تعتمده</p>
            </div>
          </div>
          <button onClick={() => handleNavClick('expenses', 'upload')} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap">
            مراجعة الملفات ←
          </button>
        </div>
      )}
      {/* SECTION B - KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[20px] md:gap-[24px]">
        <div className="bg-white rounded-[18px] border border-slate-200 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between h-[155px] group hover:border-[#22C55E]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#22C55E]/10 flex items-center justify-center shrink-0">
               <TrendingUp className="w-[18px] h-[18px] text-[#22C55E]" />
            </div>
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenues'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[28px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalRevenue || 0)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[12px] text-[#22C55E] font-bold flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5 ml-1.5 inline-block"></span>
                 {isRTL ? 'هذا الشهر' : 'This Month'}
               </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between h-[155px] group hover:border-[#1E3A8A]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
               <TrendingUp className="w-[18px] h-[18px] text-[#1E3A8A] rotate-180" />
            </div>
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[28px] leading-none font-black text-slate-800 tracking-tight">{formatCurrency(totalExpenses || 0)}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[12px] text-[#1E3A8A] font-bold flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] mr-1.5 ml-1.5 inline-block"></span>
                 {isRTL ? 'هذا الشهر' : 'This Month'}
               </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between h-[155px] group hover:border-[#3B82F6]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
               <span className="font-black text-[16px] text-[#3B82F6]">$</span>
            </div>
            {(totalRevenue > 0) && (
              <div className="bg-[#10B981]/10 text-[#10B981] text-[11px] font-bold px-2 py-0.5 rounded-md">
                {Math.round((netProfit / totalRevenue) * 100)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-500 mb-1">{isRTL ? 'صافي الربح' : 'Net Profit'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className={`text-[28px] leading-none font-black tracking-tight ${netProfit < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                 {formatCurrency(netProfit || 0)}
               </h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[12px] text-[#3B82F6] font-bold flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mr-1.5 ml-1.5 inline-block"></span>
                 {isRTL ? 'هامش الربح' : 'Profit Margin'}
               </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between h-[155px] group hover:border-[#F59E0B]/30 hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
               <FileText className="w-[18px] h-[18px] text-[#F59E0B]" />
            </div>
            {totalAnomaliesCount > 0 && (
              <div className="bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalAnomaliesCount}
              </div>
            )}
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-500 mb-1">{isRTL ? 'المعاملات' : 'Transactions'}</p>
            <div className="flex items-baseline gap-1 mb-2">
               <h3 className="text-[28px] leading-none font-black text-slate-800 tracking-tight">{totalTransactions}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
               <span className="text-[12px] text-slate-400 font-bold flex items-center opacity-70">
                 {totalTransactions > 0 ? (isRTL ? 'معاملات مسجلة' : 'Recorded transactions') : (isRTL ? 'لا توجد بيانات كافية' : 'Insufficient data')}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C - MAIN ANALYTICS AND QUICK ACTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[20px] md:gap-[24px]">
        <div className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-[340px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">{isRTL ? 'نظرة عامة مالية' : 'Financial Overview'}</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[3px] bg-[#22C55E]"></div>
                <span className="text-[12px] font-bold text-slate-500">{isRTL ? 'الإيرادات' : 'Revenues'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[3px] bg-[#1E3A8A]"></div>
                <span className="text-[12px] font-bold text-slate-500">{isRTL ? 'المصروفات' : 'Expenses'}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
              {revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 'bold'}} dy={10} width={isRTL ? 100 : 80} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: 'bold'}} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip cursor={{fill: '#EEF3F8', opacity: 0.5}} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="الإيرادات" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="المصروفات" fill="#1E3A8A" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[12px] bg-slate-50/50 p-6 text-center z-10 border border-slate-100/50">
                  <div className="w-14 h-14 bg-white border border-slate-100 rounded-full shadow-sm flex items-center justify-center mb-4 text-[#1E3A8A]">
                     <BarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-[16px] font-black text-slate-800 mb-1.5 tracking-tight">
                    {isRTL ? 'تحليل السيولة والموازنة' : 'Liquidity and Budget Analysis'}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 max-w-[280px] mx-auto mb-6 leading-relaxed">
                    {isRTL ? 'يُرجى رفع ملفات الإيرادات والمصروفات أولاً لإنشاء المخططات والتحليلات الآلية الخاصة بك.' : 'Please upload revenues and expenses files first to generate your automated charts and analytics.'}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleNavClick('expenses', 'upload')} className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-[10px] text-[13px] font-bold text-slate-700 hover:text-slate-900 transition-colors shadow-sm flex items-center">
                      <Upload className="w-3.5 h-3.5 ml-2 mr-2 rtl:ml-2 rtl:mr-0 text-slate-400" />
                      {isRTL ? 'رفع المصروفات' : 'Upload Expenses'}
                    </button>
                    <button onClick={() => handleNavClick('revenues', 'upload')} className="px-5 py-2.5 bg-[#1E3A8A] border border-transparent rounded-[10px] text-[13px] font-bold text-white hover:bg-[#1E40AF] transition-colors shadow-[0_2px_8px_rgb(30,58,138,0.25)] flex items-center">
                      <Upload className="w-3.5 h-3.5 ml-2 mr-2 rtl:ml-2 rtl:mr-0 text-white/80" />
                      {isRTL ? 'رفع الإيرادات' : 'Upload Revenues'}
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col xl:col-span-1 h-[340px]">
          <h3 className="text-[16px] font-black text-slate-800 tracking-tight mb-6">{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-[16px] flex-1 content-start">
            <button onClick={() => handleNavClick('revenues', 'upload')} className="bg-[#22C55E] text-white p-4 rounded-[16px] hover:bg-[#16A34A] transition-all flex flex-col items-center justify-center text-center group shadow-[0_2px_8px_rgb(34,197,94,0.25)] hover:shadow-[0_4px_12px_rgb(34,197,94,0.35)] h-[104px]">
              <TrendingUp className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'الإيرادات' : 'Revenues'}</span>
            </button>
            <button onClick={() => handleNavClick('expenses', 'upload')} className="bg-[#1E3A8A] text-white p-4 rounded-[16px] hover:bg-[#1E40AF] transition-all flex flex-col items-center justify-center text-center group shadow-[0_2px_8px_rgb(30,58,138,0.25)] hover:shadow-[0_4px_12px_rgb(30,58,138,0.35)] h-[104px]">
              <Activity className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'المصروفات' : 'Expenses'}</span>
            </button>
            <button onClick={() => handleNavClick('invoices', 'smart_invoice')} className="bg-[#F97316] text-white p-4 rounded-[16px] hover:bg-[#EA580C] transition-all flex flex-col items-center justify-center text-center group shadow-[0_2px_8px_rgb(249,115,22,0.25)] hover:shadow-[0_4px_12px_rgb(249,115,22,0.35)] h-[104px]">
              <FileText className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'الفواتير' : 'Invoices'}</span>
            </button>
            <button onClick={() => handleNavClick('payroll', 'upload')} className="bg-[#A855F7] text-white p-4 rounded-[16px] hover:bg-[#9333EA] transition-all flex flex-col items-center justify-center text-center group shadow-[0_2px_8px_rgb(168,85,247,0.25)] hover:shadow-[0_4px_12px_rgb(168,85,247,0.35)] h-[104px]">
              <Users className="w-[24px] h-[24px] mb-2 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-bold text-[14px]">{isRTL ? 'الرواتب' : 'Payroll'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D - LOWER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[20px] md:gap-[24px] pb-4">
        
        {/* Purple Card: العملاء */}
        <div className="bg-[#A855F7] rounded-[16px] p-6 text-white flex flex-col justify-between relative overflow-hidden group h-[220px] shadow-[0_2px_10px_rgb(168,85,247,0.2)] hover:shadow-[0_4px_15px_rgb(168,85,247,0.3)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10 w-full">
            <div></div>
            <div className="w-12 h-12 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
              <Users className="w-[22px] h-[22px] text-white" />
            </div>
          </div>
          <div className="text-start relative z-10 mt-auto">
            <h4 className="text-[15px] font-bold text-white mb-2">{isRTL ? 'العملاء' : 'Customers'}</h4>
            <p className="text-[40px] font-black leading-none mb-3">{customersCount}</p>
            <p className="text-[13px] font-medium text-white/70">
               {customersCount > 0 ? (isRTL ? 'لا توجد بيانات شهرية' : 'No monthly data') : (isRTL ? 'لا توجد بيانات كافية' : 'Insufficient data')}
            </p>
          </div>
        </div>

        {/* Orange Card: الفواتير */}
        <div className="bg-[#F97316] rounded-[16px] p-6 text-white flex flex-col justify-between relative overflow-hidden group h-[220px] shadow-[0_2px_10px_rgb(249,115,22,0.2)] hover:shadow-[0_4px_15px_rgb(249,115,22,0.3)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10 w-full">
            <div></div>
            <div className="w-12 h-12 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
              <FileText className="w-[22px] h-[22px] text-white" />
            </div>
          </div>
          <div className="text-start relative z-10 mt-auto">
            <h4 className="text-[15px] font-bold text-white mb-2">{isRTL ? 'الموردون' : 'Vendors'}</h4>
            <p className="text-[40px] font-black leading-none mb-3">{vendorsCount}</p>
            <p className="text-[13px] font-medium text-white/70">
               {vendorsCount > 0 ? (isRTL ? 'الموردون المسجلون' : 'Registered vendors') : (isRTL ? 'لا توجد بيانات كافية' : 'Insufficient data')}
            </p>
          </div>
        </div>

        {/* Blue Card: المعاملات */}
        <div className="bg-[#3B82F6] rounded-[16px] p-6 text-white flex flex-col justify-between relative overflow-hidden group h-[220px] shadow-[0_2px_10px_rgb(59,130,246,0.2)] hover:shadow-[0_4px_15px_rgb(59,130,246,0.3)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10 w-full">
            <div></div>
            <div className="w-12 h-12 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
              <Activity className="w-[22px] h-[22px] text-white" />
            </div>
          </div>
          <div className="text-start relative z-10 mt-auto">
            <h4 className="text-[15px] font-bold text-white mb-2">{isRTL ? 'إجمالي المعاملات' : 'Total Transactions'}</h4>
            <p className="text-[40px] font-black leading-none mb-3">{totalTransactions}</p>
            <p className="text-[13px] font-medium text-white/70">
               {totalTransactions > 0 ? (isRTL ? 'في جميع الأقسام' : 'Across all modules') : (isRTL ? 'لا توجد مقارنة متاحة' : 'No comparison available')}
            </p>
          </div>
        </div>

        {/* White Card: النشاط الأخير */}
        <div className="bg-white rounded-[16px] border border-slate-200 p-5 flex flex-col h-[220px] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">{isRTL ? 'النشاط الأخير' : 'Recent Activity'}</h3>
          </div>
          
          <div className="flex-1 overflow-auto rounded-[12px]">
          {totalAnomaliesCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-[12px] bg-amber-50 text-amber-900 border border-amber-100">
                <div className="bg-amber-100 text-amber-600 rounded-full p-1.5 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold">{isRTL ? `تم اكتشاف ${totalAnomaliesCount} شذوذ` : `Detected ${totalAnomaliesCount} anomalies`}</h4>
                  <p className="text-[11px] text-amber-700/80 mt-1 font-medium">{isRTL ? 'تحتاج للمراجعة' : 'Requires review'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-[12px] bg-slate-50/50 p-6">
               <div className="text-center mt-2">
                 <div className="w-12 h-12 bg-white border border-slate-100 rounded-full shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex items-center justify-center mb-3 mx-auto">
                    <Activity className="w-5 h-5 text-slate-400" />
                 </div>
                 <h3 className="text-[13px] font-bold text-slate-700 mb-1">
                   {isRTL ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500">
                   {isRTL ? 'الأحداث الأخيرة ستظهر هنا' : 'Recent events will appear here'}
                 </p>
               </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
