import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings as SettingsIcon, LogOut, Grid, ChevronRight, Home, Briefcase, FileText, ShieldAlert, Users, Layers, Activity, BookOpen, ChevronDown, ChevronLeft, PieChart, Calendar, Box, Upload, Scale, Coins, AlertTriangle, CheckCircle } from 'lucide-react';
import { AppConfig } from '../config/appConfig';
import { useUI } from '../contexts/UIContext';
import { getTranslation, Language } from '../i18n/ui-text';

interface NewAppShellProps {
  user: any;
  profile: any;
  settings: any;
  logout: () => void;
  appMode: string;
  activeTab: string;
  handleNavClick: (mode: string, tab: string) => void;
  totalAnomaliesCount: number;
  mainContent: React.ReactNode;
  contentHeader: React.ReactNode;
}

export function NewAppShell({
  user, profile, settings, logout, appMode, activeTab, handleNavClick, totalAnomaliesCount, mainContent, contentHeader
}: NewAppShellProps) {
  const { language, setLanguage } = useUI();
  const t = getTranslation(language);
  const isRTL = language === 'ar';
  
  const TopNavItems = [
    { name: isRTL ? 'لوحة التحكم' : 'Dashboard', mode: 'dashboard', tab: 'dashboard' },
    { name: isRTL ? 'المصروفات' : 'Expenses', mode: 'expenses', tab: 'dashboard' },
    { name: isRTL ? 'الإيرادات' : 'Revenues', mode: 'revenues', tab: 'dashboard' },
    { name: isRTL ? 'البنوك' : 'Banks', mode: 'banks', tab: 'dashboard' },
    { name: isRTL ? 'الرواتب' : 'Payroll', mode: 'payroll', tab: 'dashboard' },
    { name: isRTL ? 'الفواتير' : 'Invoices', mode: 'invoices', tab: 'dashboard' },
    { name: isRTL ? 'التقارير' : 'Reports', mode: 'reports', tab: 'dashboard' },
    { name: isRTL ? 'المحاسبة' : 'Accounting', mode: 'accounting', tab: 'dashboard' },
    { name: isRTL ? 'الإعدادات' : 'Settings', mode: 'settings', tab: 'settings' },
  ];

  const getSubNavItems = (mode: string) => {
    switch(mode) {
      case 'dashboard':
        return [];
      case 'expenses':
        return [
          {
            title: isRTL ? 'العمليات' : 'Operations',
            items: [
              { id: 'dashboard', label: isRTL ? 'لوحة المصروفات' : 'Dashboard', icon: Activity, desc: isRTL ? 'الملخص والتحليلات' : 'Summary & analytics' },
              { id: 'upload', label: isRTL ? 'رفع ملفات المصروفات' : 'Upload', icon: Upload, desc: isRTL ? 'رفع فواتير الموردين' : 'Upload vendor invoices' },
              { id: 'anomalies_report', label: isRTL ? 'الأخطاء والتشخيص' : 'Audit', icon: ShieldAlert, showBadge: true, desc: isRTL ? 'مراجعة الملاحظات' : 'Review invoice notes' },
            ]
          },
          {
            title: isRTL ? 'البيانات الأساسية' : 'Master Data',
            items: [
              { id: 'grouped_purchases', label: isRTL ? 'الموردون' : 'Vendors', icon: Users, desc: isRTL ? 'قاعدة الموردين' : 'Vendor records' },
              { id: 'categories_summary', label: isRTL ? 'التصنيفات' : 'Categories', icon: Layers, desc: isRTL ? 'حسابات المصروفات' : 'Expense accounts' },
              { id: 'items_directory', label: isRTL ? 'دليل الأصناف' : 'Items', icon: Box, desc: isRTL ? 'المنتجات المشتراة' : 'Purchased products' },
            ]
          },
          {
            title: isRTL ? 'التقارير' : 'Reports',
            items: [
               { id: 'monthly_summary', label: isRTL ? 'الملخص الشهري' : 'Monthly Summary', icon: Calendar, desc: isRTL ? 'أداء المصروفات' : 'Performance analysis' },
               { id: 'statement_of_account', label: isRTL ? 'كشف الحساب' : 'Statement', icon: FileText, desc: isRTL ? 'حركة الموردين' : 'Vendor statements' },
            ]
          }
        ];
      case 'revenues':
        return [
          {
             title: isRTL ? 'العمليات' : 'Operations',
             items: [
                { id: 'dashboard', label: isRTL ? 'لوحة الإيرادات' : 'Dashboard', icon: Activity, desc: isRTL ? 'تحليلات المبيعات' : 'Sales analytics' },
                { id: 'upload', label: isRTL ? 'رفع الإيرادات' : 'Upload', icon: Upload, desc: isRTL ? 'رفع ملفات مبيعات' : 'Upload sales data' },
                { id: 'anomalies_report', label: isRTL ? 'مراجعة الإيرادات' : 'Audit', icon: ShieldAlert, showBadge: true, desc: isRTL ? 'التشخيص والاعتماد' : 'Diagnostics & approval' },
             ]
          },
          {
             title: isRTL ? 'البيانات الأساسية' : 'Master Data',
             items: [
                { id: 'grouped_purchases', label: isRTL ? 'العملاء' : 'Customers', icon: Users, desc: isRTL ? 'قاعدة العملاء' : 'Customer database' },
                { id: 'items_directory', label: isRTL ? 'مسارات الإيرادات' : 'Revenue Streams', icon: Box, desc: isRTL ? 'تحليل مصادر الدخل' : 'Income sources' },
             ]
          },
          {
             title: isRTL ? 'التقارير' : 'Reports',
             items: [
                { id: 'monthly_summary', label: isRTL ? 'الملخص الشهري' : 'Monthly Summary', icon: Calendar, desc: isRTL ? 'أداء الإيرادات' : 'Revenue performance' },
                { id: 'statement_of_account', label: isRTL ? 'كشف حساب' : 'Statement', icon: FileText, desc: isRTL ? 'حركة العملاء' : 'Customer financial history' },
             ]
          }
        ];
      case 'banks':
        return [
          {
             title: isRTL ? 'العمليات' : 'Operations',
             items: [
                { id: 'dashboard', label: isRTL ? 'لوحة البنوك' : 'Dashboard', icon: Activity, desc: isRTL ? 'ملخص الحسابات' : 'Accounts summary' },
                { id: 'upload', label: isRTL ? 'رفع كشف الحساب' : 'Upload Statement', icon: Upload, desc: isRTL ? 'رفع ملفات البنوك' : 'Upload bank files' },
                { id: 'anomalies_report', label: isRTL ? 'مطابقة البنوك' : 'Bank Reconciliation', icon: ShieldAlert, showBadge: true, desc: isRTL ? 'مراجعة أخطاء البنوك' : 'Review bank errors' },
             ]
          },
          {
             title: isRTL ? 'الحسابات البنكية' : 'Bank Accounts',
             items: [
                { id: 'grouped_purchases', label: isRTL ? 'قائمة الحسابات' : 'Banks List', icon: Users, desc: isRTL ? 'بيانات البنوك' : 'Banks information' },
                { id: 'categories_summary', label: isRTL ? 'حركة الحسابات' : 'Account Movements', icon: Layers, desc: isRTL ? 'تقرير الحركات' : 'Movements report' },
             ]
          },
          {
             title: isRTL ? 'التقارير' : 'Reports',
             items: [
                { id: 'monthly_summary', label: isRTL ? 'الملخص الشهري' : 'Monthly Summary', icon: Calendar, desc: isRTL ? 'أداء الحسابات' : 'Accounts performance' },
                { id: 'statement_of_account', label: isRTL ? 'كشف الحساب' : 'Statement', icon: FileText, desc: isRTL ? 'حركة تفصيلية' : 'Detailed movement' },
             ]
          }
        ];
      case 'payroll':
         return [
            {
               title: isRTL ? 'العمليات' : 'Operations',
               items: [
                 { id: 'dashboard', label: isRTL ? 'لوحة الرواتب' : 'Dashboard', icon: Activity, desc: isRTL ? 'ملخص الرواتب والأجور' : 'Payroll and wages summary' },
                 { id: 'upload', label: isRTL ? 'رفع مسير الرواتب' : 'Upload Runs', icon: Upload, desc: isRTL ? 'رفع ملف الرواتب' : 'Upload payroll sheet' },
                 { id: 'anomalies_report', label: isRTL ? 'مراجعة الرواتب' : 'Audit', icon: ShieldAlert, showBadge: true, desc: isRTL ? 'تشخيص المسير المرفوع' : 'Diagnostics for payroll' },
               ]
            },
            {
               title: isRTL ? 'البيانات' : 'Data',
               items: [
                 { id: 'grouped_purchases', label: isRTL ? 'الموظفون' : 'Employees', icon: Users, desc: isRTL ? 'دليل بيانات الموظفين' : 'Employees info directory' },
               ]
            },
            {
               title: isRTL ? 'التقارير' : 'Reports',
               items: [
                 { id: 'monthly_payroll', label: isRTL ? 'المسير الشهري' : 'Monthly Payroll', icon: FileText, desc: isRTL ? 'تفاصيل المسير' : 'Detailed payroll run' },
                 { id: 'payroll_allocations', label: isRTL ? 'توزيع الرواتب' : 'Allocations', icon: PieChart, desc: isRTL ? 'توزيعات الرواتب' : 'Salary allocations' },
               ]
            }
         ];
      case 'invoices':
         return [
            {
               title: isRTL ? 'الفواتير وعروض الأسعار' : 'Core Actions',
               items: [
                 { id: 'dashboard', label: isRTL ? 'لوحة الفواتير' : 'Invoices Dashboard', icon: Activity, desc: isRTL ? 'ملخص تحصيل الفواتير' : 'Invoice collection summary' },
                 { id: 'smart_invoice', label: isRTL ? 'فاتورة إلكترونية' : 'Smart Invoice', icon: FileText, desc: isRTL ? 'إنشاء فواتير ضريبية' : 'Create electronic invoices' },
                 { id: 'quotations', label: isRTL ? 'عروض الأسعار' : 'Quotations', icon: FileText, desc: isRTL ? 'إصدار عروض أسعار' : 'Issue valid quotations' },
               ]
            }
         ];
      case 'reports':
          return [
            {
               title: isRTL ? 'التقارير الإدارية' : 'Management',
               items: [
                 { id: 'dashboard', label: isRTL ? 'لوحة التقارير' : 'Dashboard', icon: Activity, desc: isRTL ? 'مركز التقارير الموحد' : 'Unified reports center' },
                 { id: 'owners_summary', label: isRTL ? 'ملخص الملاك' : 'Owners Summary', icon: PieChart, desc: isRTL ? 'أداء ملاك الأعمال' : 'Business owners performance' },
                 { id: 'visual_dashboard', label: isRTL ? 'التحليل الرسومي' : 'Visual Analytics', icon: Activity, desc: isRTL ? 'أداء مرئي تفصيلي' : 'Detailed visual performance' },
               ]
            },
            {
               title: isRTL ? 'القوائم المالية' : 'Financials',
               items: [
                 { id: 'income_statement', label: isRTL ? 'قائمة الدخل' : 'Income Statement', icon: FileText, desc: isRTL ? 'الأرباح والخسائر' : 'Profit and loss' },
                 { id: 'balance_sheet', label: isRTL ? 'الميزانية العمومية' : 'Balance Sheet', icon: Scale, desc: isRTL ? 'المركز المالي الشامل' : 'Financial position' },
                 { id: 'cash_flow', label: isRTL ? 'التدفقات النقدية' : 'Cash Flow', icon: Coins, desc: isRTL ? 'حركة السيولة' : 'Cash liquidity' },
               ]
            },
            {
               title: isRTL ? 'مقارنات' : 'Comparisons',
               items: [
                 { id: 'yearly_comparison', label: isRTL ? 'المقارنة السنوية' : 'Yearly Comparison', icon: Calendar, desc: isRTL ? 'مقارنة أداء الفترات' : 'Period performance comparison' },
               ]
            }
          ];
      case 'accounting':
          return [
            {
               title: isRTL ? 'العمليات' : 'Daily Operations',
               items: [
                  { id: 'dashboard', label: isRTL ? 'لوحة المحاسبة' : 'Dashboard', icon: Activity, desc: isRTL ? 'نظرة عامة محاسبية' : 'Accounting overview' },
                  { id: 'tax_declaration', label: isRTL ? 'الإقرار الضريبي' : 'Tax Declaration', icon: FileText, desc: isRTL ? 'مستندات الإقرارات الضريبية' : 'Tax declarations documents' },
               ]
            },
            {
               title: isRTL ? 'السجلات' : 'Ledgers',
               items: [
                  { id: 'general_ledger', label: isRTL ? 'دفتر الأستاذ' : 'General Ledger', icon: BookOpen, desc: isRTL ? 'تسجيلات الحسابات المجمعة' : 'Account registers' },
                  { id: 'trial_balance', label: isRTL ? 'ميزان المراجعة' : 'Trial Balance', icon: Scale, desc: isRTL ? 'موازين الحسابات الختامية' : 'Accounts balances' },
               ]
            }
          ];
      case 'settings':
         return [
            {
               title: isRTL ? 'إعدادات النظام' : 'System',
               items: [
                 { id: 'settings', label: isRTL ? 'إعدادات الشركة' : 'Company Settings', icon: SettingsIcon, desc: isRTL ? 'تفضيلات الشركة' : 'Basic company info' },
                 { id: 'user_management', label: isRTL ? 'المستخدمون والصلاحيات' : 'Users & Roles', icon: Users, desc: isRTL ? 'إدارة المستخدمين' : 'Manage users and access' },
               ]
            },
            {
               title: isRTL ? 'السجلات' : 'Monitoring',
               items: [
                 { id: 'audit_log', label: isRTL ? 'سجل التدقيق' : 'Audit Log', icon: ShieldAlert, desc: isRTL ? 'سجل عمليات النظام' : 'System operations log' },
               ]
            }
         ];
      default:
        return [];
    }
  };

  const isPlainView = appMode === 'dashboard';

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (mode: string) => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setActiveMenu(mode);
  };

  const handleMouseLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  };

  const onMenuSelect = (mode: string, tab: string) => {
    setActiveMenu(null);
    handleNavClick(mode, tab);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.mega-menu-container')) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#F3F6FA] font-sans text-[#0F172A] flex flex-col overflow-x-hidden">
      {/* LEVEL 1: Top Primary Navigation */}
      <header className="bg-white h-[60px] flex items-center w-full shrink-0 relative z-[60] border-b border-transparent">
         <div className="max-w-[1440px] mx-auto w-full px-6 xl:px-8 flex items-center justify-between h-full">
            {/* Start (Right in RTL, Left in LTR) -> Brand Lockup */}
            <div className="flex items-center gap-8 h-full">
               <div className={`flex flex-col justify-center text-${isRTL ? 'right' : 'left'}`}>
                  <div className={`flex items-center gap-1.5 justify-${isRTL ? 'start' : 'start'}`}>
                     {settings?.logo || AppConfig.logo ? (
                        <img src={settings?.logo || AppConfig.logo} alt="Logo" className="w-6 h-6 object-contain" />
                     ) : null}
                     <span className="text-2xl font-black tracking-tight text-[#0F172A] leading-none">{AppConfig.appName}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#1E3A8A]/80 tracking-wide mt-0.5 whitespace-nowrap">
                     {AppConfig.appSubtitle || 'Intelligent Finance, Simplified'}
                  </span>
               </div>
            </div>

            {/* End (Left in RTL, Right in LTR) -> User controls */}
            <div className="flex items-center gap-4">
               <div className="relative hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-transparent focus-within:border-[#1E3A8A]/30 focus-within:bg-white transition-all">
                  <Search className="w-4 h-4 text-[#64748B]" />
                  <input 
                     type="text" 
                     placeholder={isRTL ? 'بحث شامل...' : 'Search...'} 
                     className={`bg-transparent border-none text-sm text-[#0F172A] ${isRTL ? 'mr-2' : 'ml-2'} focus:outline-none w-[280px]`}
                  />
               </div>
               
               <button 
                 onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} 
                 className="flex items-center justify-center font-bold text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] transition-colors h-[38px]"
               >
                 {language === 'ar' ? 'English' : 'عربي'}
               </button>

               <button className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-full relative transition-colors h-[38px] w-[38px] flex items-center justify-center">
                  <Bell className="w-[18px] h-[18px]" />
                  {totalAnomaliesCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] border-2 border-white rounded-full"></span>}
               </button>
               <button onClick={logout} className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-full relative transition-colors h-[38px] w-[38px] flex items-center justify-center" title={t.common.logout}>
                  <LogOut className="w-[18px] h-[18px]" />
               </button>
               
               <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

               <button 
                  onClick={() => handleNavClick('settings', 'settings')}
                  className="flex items-center gap-3 hover:bg-slate-50 border border-[#E2E8F0] px-2 py-1.5 sm:px-3 rounded-[12px] transition-all hover:border-[#1E3A8A]/30 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                  title={isRTL ? 'إعدادات الشركة' : 'Company Settings'}
               >
                  <div className={`flex flex-col items-${isRTL ? 'end' : 'start'} hidden sm:flex`}>
                     <p className="text-[14px] font-bold text-[#0F172A] max-w-[160px] truncate leading-tight tracking-tight">
                        {settings?.companyName && settings.companyName.trim() !== '' ? settings.companyName : (isRTL ? 'الشركة' : 'Company')}
                     </p>
                     <p className="text-[11px] text-[#64748B] font-medium leading-tight truncate max-w-[160px] mt-0.5">
                        {user?.email || (profile?.role === 'admin' ? (isRTL ? 'مسؤول النظام' : 'Admin') : (isRTL ? 'مشاهد' : 'Viewer'))}
                     </p>
                  </div>
                  <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white font-black text-sm shadow-sm shrink-0">
                     {(settings?.companyName && settings.companyName.trim() !== '' ? settings.companyName : (user?.email || 'U'))[0]?.toUpperCase()}
                  </div>
               </button>
            </div>
         </div>
      </header>

      {/* Nav Bar with Mega Menus */}
      <div className="sticky top-0 z-[50] h-[48px] w-full border-b border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgb(0,0,0,0.02)] overflow-visible">
         <div className="max-w-[1440px] mx-auto w-full px-6 xl:px-8 h-full">
            <nav className="flex items-center h-full space-x-2 rtl:space-x-reverse min-w-max mega-menu-container">
            {TopNavItems.map(item => {
              const isActive = appMode === item.mode;
              const subItems = getSubNavItems(item.mode);
              const isMegaMenuOpen = activeMenu === item.mode && subItems.length > 0;
                 
              return (
              <div 
                 key={item.name} 
                 className="relative h-full flex items-center"
                 onMouseEnter={() => handleMouseEnter(item.mode)}
                 onMouseLeave={handleMouseLeave}
              >
                <button 
                   onClick={() => onMenuSelect(item.mode, item.tab)}
                   className={`h-9 px-4 text-[15px] rounded-[12px] transition-all flex items-center whitespace-nowrap
                      ${isActive ? 'font-bold bg-slate-900 text-white shadow-sm border border-transparent' : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}
                      ${isMegaMenuOpen && !isActive ? 'bg-slate-50 text-slate-900 border border-transparent' : ''}
                   `}
                >
                   {item.name}
                </button>
                
                {/* Grouped Hover Mega Menu */}
                {isMegaMenuOpen && (
                   <div 
                      className={`absolute top-[100%] mt-0 left-0 rtl:right-0 rtl:left-auto pt-2 z-[100] transition-opacity duration-200 animate-in fade-in slide-in-from-top-1`}
                   >
                     <div className="bg-white rounded-[16px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-[#E2E8F0] p-4 w-[560px] max-h-[380px] overflow-y-auto grid grid-cols-2 gap-x-5 gap-y-4">
                        {subItems.map((group, gIdx) => (
                           <div key={gIdx} className="flex flex-col">
                              {group.title && (
                                 <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{group.title}</h4>
                              )}
                              <div className="flex flex-col gap-0">
                                 {group.items.map(nav => (
                                    <button 
                                       key={nav.id}
                                       onClick={() => onMenuSelect(item.mode, nav.id)}
                                       className={`flex items-start gap-2.5 p-1.5 rounded-[10px] transition-all text-left rtl:text-right group/item
                                          ${appMode === item.mode && activeTab === nav.id 
                                             ? 'bg-[#1F497D]/5' 
                                             : 'hover:bg-slate-50'
                                          }
                                       `}
                                    >
                                       <div className={`flex items-center justify-center w-[36px] h-[36px] rounded-[10px] shrink-0 transition-colors
                                          ${appMode === item.mode && activeTab === nav.id 
                                             ? 'bg-[#1F497D]/10 text-[#1F497D]' 
                                             : 'bg-[#F8FAFC] text-slate-500 border border-slate-200 shadow-[0_1px_2px_rgb(0,0,0,0.02)] group-hover/item:text-[#1F497D] group-hover/item:border-[#1F497D]/20 group-hover/item:bg-white'
                                          }
                                       `}>
                                          <nav.icon className="w-[18px] h-[18px]" strokeWidth={2.5} /> 
                                       </div>
                                       <div className="flex flex-col flex-1 min-w-0 justify-center min-h-[36px]">
                                          <div className="flex items-center gap-2">
                                             <span className={`text-[14px] font-bold truncate leading-tight ${appMode === item.mode && activeTab === nav.id ? 'text-[#1F497D]' : 'text-slate-700 group-hover/item:text-[#0F172A]'}`}>
                                                {nav.label}
                                             </span>
                                             {nav.showBadge && totalAnomaliesCount > 0 && (
                                                <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0 rounded-[4px] font-bold leading-tight">
                                                   {totalAnomaliesCount}
                                                </span>
                                             )}
                                          </div>
                                          {nav.desc && (
                                             <span className="text-[12px] text-slate-500 truncate leading-tight mt-0.5 group-hover/item:text-slate-600">
                                                {nav.desc}
                                             </span>
                                          )}
                                       </div>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                )}
              </div>
            )})}
         </nav>
         </div>
      </div>

      <div className="flex-1 flex flex-row relative">
         {/* Main Workspace Content */}
         <div className="flex-1 flex flex-col min-w-0 bg-[#F3F6FA] w-full">
            {/* The existing content header (filters, date pickers) */}
            {contentHeader && (
               <div className="bg-transparent border-[#E2E8F0] z-[5]">
                  <div className="max-w-[1440px] mx-auto w-full px-0 md:px-2">
                    {contentHeader}
                  </div>
               </div>
            )}

            {/* The main workspace content */}
            <div className="flex-1 overflow-x-hidden pt-0 pb-8">
               <div className="max-w-[1440px] mx-auto w-full px-6 xl:px-8">
                 {mainContent}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

