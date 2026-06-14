import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { getTranslation } from '../i18n/ui-text';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, 
  Upload, UserPlus, FileText, Activity, AlertCircle, Calendar,
  Receipt, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 0
  }).format(value || 0) + ' ر.س';
};

interface VisualDashboardProps {
  chartDataRaw: any[];
  revPieData: any[];
  expPieData: any[];
  expBarData: any[];
  topEntitiesData: any[];
  topSuppliers?: any[];
  topCustomers?: any[];
  topEmployees?: any[];
  incomeStatement: any;
  onNavigateToTab?: (tab: string, anchor?: string, search?: string, targetMode?: string) => void;
  anomaliesCount: number;
  anomaliesSummary: any[];
  appMode: string;
  [key: string]: any;
}

export const VisualDashboard: React.FC<VisualDashboardProps> = (props) => {
  const { language } = useUI();
  const t = getTranslation(language);
  const isRTL = language === 'ar';

  const {
    chartDataRaw,
    incomeStatement,
    anomaliesCount,
    anomaliesSummary,
    onNavigateToTab
  } = props;

  // Real data extraction
  const totalRevenue = incomeStatement?.totalRevenue || 0;
  const totalExpenses = (incomeStatement?.totalOPEX || 0) + (incomeStatement?.totalCOGS || 0);
  const netProfit = totalRevenue - totalExpenses;

  // Chart data normalization
  const chartData = useMemo(() => {
    if (!chartDataRaw || chartDataRaw.length === 0) return [];
    
    // Sort array of months logically if they are formatted like 'YYYY-MM'
    const validData = chartDataRaw.filter(d => d.name);
    return validData.map(d => ({
      name: d.name,
      'الإيرادات': d.totalRevenue || d.الإيرادات || 0,
      'المصروفات': d.totalExps || d.المصروفات || 0,
    }));
  }, [chartDataRaw]);

  // Quick action helper
  const handleQuickAction = (mode: string, tab: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(tab, undefined, undefined, mode);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg text-slate-800 min-w-[200px]" dir={isRTL ? "rtl" : "ltr"}>
          <p className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-semibold">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold font-mono">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#F3F6FA] min-h-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full space-y-6">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* KPI 1: Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="bg-slate-50 text-slate-500 text-xs font-bold px-2 py-1 rounded-md">YTD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
              <h3 className="text-2xl font-black text-[#0F172A]">{formatCurrency(totalRevenue)}</h3>
            </div>
          </div>

          {/* KPI 2: Expenses */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className="bg-slate-50 text-slate-500 text-xs font-bold px-2 py-1 rounded-md">YTD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{isRTL ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
              <h3 className="text-2xl font-black text-[#0F172A]">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>

          {/* KPI 3: Net Profit */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#3B82F6] flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="bg-slate-50 text-slate-500 text-xs font-bold px-2 py-1 rounded-md">YTD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{isRTL ? 'صافي الربح' : 'Net Profit'}</p>
              <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-[#0F172A]' : 'text-[#EF4444]'}`}>{formatCurrency(netProfit)}</h3>
            </div>
          </div>

          {/* KPI 4: Pending / Review */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              {anomaliesCount > 0 && <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-md">{isRTL ? 'إجراء مطلوب' : 'Action Required'}</span>}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{isRTL ? 'سجلات تحتاج مراجعة' : 'Requires Review'}</p>
              <h3 className={`text-2xl font-black ${anomaliesCount > 0 ? 'text-[#F59E0B]' : 'text-[#0F172A]'}`}>
                {anomaliesCount} {isRTL ? 'سجل' : 'Records'}
              </h3>
            </div>
          </div>
        </div>

        {/* Chart & Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-[#0F172A] text-lg">{isRTL ? 'نظرة عامة مالية' : 'Financial Overview'}</h3>
            </div>
            <div className="flex-1 w-full min-h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#EEF3F8', opacity: 0.5}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="الإيرادات" name={isRTL ? 'الإيرادات' : 'Revenues'} fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="المصروفات" name={isRTL ? 'المصروفات' : 'Expenses'} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Activity className="w-12 h-12 text-slate-300 mb-3 opacity-50" />
                  <p className="font-bold">{isRTL ? 'لا توجد بيانات كافية لعرض الرسم البياني' : 'Not enough data to display chart'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
              <h3 className="font-extrabold text-[#0F172A] text-lg mb-4">{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleQuickAction('expenses', 'upload')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-[#F3F6FA] hover:bg-[#EEF2FF] hover:border-[#4F46E5]/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{isRTL ? 'رفع المصروفات' : 'Upload Expenses'}</span>
                </button>
                <button onClick={() => handleQuickAction('revenues', 'upload')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-[#F3F6FA] hover:bg-[#EEF2FF] hover:border-[#4F46E5]/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{isRTL ? 'رفع الإيرادات' : 'Upload Revenues'}</span>
                </button>
                <button onClick={() => handleQuickAction('payroll', 'dashboard')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-[#F3F6FA] hover:bg-[#EEF2FF] hover:border-[#4F46E5]/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#A855F7] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{isRTL ? 'مسير الرواتب' : 'Payroll'}</span>
                </button>
                <button onClick={() => handleQuickAction('revenues', 'smart_invoice')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-[#F3F6FA] hover:bg-[#EEF2FF] hover:border-[#4F46E5]/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-[#FFEDD5] text-[#F97316] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{isRTL ? 'إنشاء فاتورة' : 'Create Invoice'}</span>
                </button>
              </div>
            </div>

            {/* Smart Alerts */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col h-[calc(100%-250px)] min-h-[220px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-[#0F172A] text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  {isRTL ? 'تنبيهات ذكية' : 'Smart Alerts'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {anomaliesSummary && anomaliesSummary.length > 0 ? (
                  <div className="space-y-3">
                    {anomaliesSummary.slice(0, 4).map((alert, idx) => (
                      <div key={idx} className="p-3 bg-[#FEF3C7] border border-amber-100 rounded-xl flex items-start gap-3">
                        <div className="min-w-2 mt-1.5 w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                        <p className="text-sm font-bold text-[#475569] leading-snug">{alert.title || alert.description || alert.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] py-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6 text-[#22C55E]" />
                    </div>
                    <p className="font-bold text-sm text-center">{isRTL ? 'لا توجد تنبيهات حالية' : 'No pending alerts'}</p>
                    <p className="text-xs mt-1 text-[#94A3B8] text-center">{isRTL ? 'حالة السجلات ممتازة' : 'All records look good'}</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Lower Section: Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-8">
           <h3 className="font-extrabold text-[#0F172A] text-lg mb-6">{isRTL ? 'النشاط الحديث' : 'Recent Activity'}</h3>
           
           {/* Placeholder for actual activity - no fake data */}
           <div className="flex items-center justify-center py-12 flex-col">
              <Calendar className="w-10 h-10 text-slate-300 mb-4 opacity-70" />
              <p className="font-bold text-[#94A3B8]">{isRTL ? 'لا يوجد نشاط حديث حتى الآن' : 'No recent activity yet'}</p>
           </div>
        </div>

      </div>
    </div>
  );
};
export default VisualDashboard;
