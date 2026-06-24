import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Wallet, Briefcase, Activity, BookOpen, Settings as SettingsIcon, Users, ArrowLeft, ArrowUpRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (mode: string, tab: string) => void;
  appMode?: string;
  dataSummary?: any; // To show quick stats maybe
}

export function CommandPalette({ isOpen, onClose, onNavigate, appMode }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K toggle is owned by App (single source of truth). Here we
      // only close on Escape to avoid a double-toggle race.
      if (e.key === 'Escape') {
         onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'exp_dash', group: 'المشتريات', title: 'الاحصائيات والتحليل', subtitle: 'نظرة عامة على المشتريات والمصروفات', mode: 'expenses', tab: 'dashboard', icon: ShoppingCart },
    { id: 'exp_upload', group: 'المشتريات', title: 'استيراد ورصد البيانات', subtitle: 'رفع فواتير أو إدخال قيد', mode: 'expenses', tab: 'upload', icon: ShoppingCart },
    { id: 'exp_supp', group: 'المشتريات', title: 'سجل الموردين المجمع', subtitle: 'استعراض الحركات المالية للموردين', mode: 'expenses', tab: 'grouped_purchases', icon: Users },
    
    { id: 'rev_dash', group: 'المبيعات', title: 'الاحصائيات والتحليل', subtitle: 'نظرة عامة على المبيعات والإيرادات', mode: 'revenues', tab: 'dashboard', icon: Wallet },
    { id: 'rev_upload', group: 'المبيعات', title: 'استيراد البيانات', subtitle: 'رفع فواتير أو إدخال قيد', mode: 'revenues', tab: 'upload', icon: Wallet },
    { id: 'rev_invoice', group: 'المبيعات', title: 'مولد الفاتورة الذكي', subtitle: 'إنشاء وطباعة فاتورة جديدة', mode: 'revenues', tab: 'smart_invoice', icon: Wallet },
    
    { id: 'pr_dash', group: 'الرواتب والأجور', title: 'التحليل المالي للرواتب', subtitle: 'نظرة عامة', mode: 'payroll', tab: 'dashboard', icon: Briefcase },
    
    { id: 'bnk_dash', group: 'البنوك', title: 'التدفقات النقدية (البنوك)', subtitle: 'مراقبة حركة الحسابات', mode: 'banks', tab: 'dashboard', icon: Activity },
    
    { id: 'rep_inc', group: 'التقارير', title: 'قائمة الدخل (P&L)', subtitle: 'الأرباح والخسائر الشاملة', mode: 'reports', tab: 'income_statement', icon: BookOpen },
    { id: 'rep_bal', group: 'التقارير', title: 'قائمة المركز المالي', subtitle: 'الميزانية العمومية', mode: 'reports', tab: 'balance_sheet', icon: BookOpen },
    
    { id: 'set_users', group: 'الإدارة', title: 'إدارة المستخدمين', subtitle: 'الصلاحيات والمشرفين', mode: 'settings', tab: 'user_management', icon: SettingsIcon },
    
    { id: 'mig_rev', group: 'الهيكلة', title: 'مراجعة الجاهزية المحاسبية', subtitle: 'استعراض التوحيد والفروقات', mode: 'dashboard', tab: 'migration_review', icon: Activity },
  ];

  const filtered = search.trim() === '' 
    ? actions 
    : actions.filter(a => 
       a.title.includes(search) || a.subtitle.includes(search) || a.group.includes(search)
      );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border border-slate-200" dir="rtl">
         <div className="flex items-center px-4 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              ref={inputRef}
              className="flex-1 bg-transparent border-none outline-none py-4 px-4 text-base placeholder:text-slate-400 text-slate-800"
              placeholder="ابحث عن صفحة، وظيفة، تقرير، مورد، أو أمر (Ctrl+K)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded" onClick={() => setSearch('')}>مسح</button>
            )}
         </div>

         <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
               <div className="py-12 text-center text-slate-500">
                  لا توجد نتائج مطابقة لبحثك "{search}"
               </div>
            ) : (
               <div className="space-y-1">
                 {filtered.map(action => (
                    <button
                      key={action.id}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 group text-right transition-colors"
                      onClick={() => {
                         onNavigate(action.mode, action.tab);
                         onClose();
                      }}
                    >
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 shrink-0">
                            <action.icon className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-900">{action.title}</div>
                            <div className="text-xs text-slate-500 group-hover:text-indigo-700/80">{action.subtitle} • <span className="opacity-75">{action.group}</span></div>
                         </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                 ))}
               </div>
            )}
         </div>

         <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1"><span>للتنقل</span> <b>↑↓</b></span>
               <span className="flex items-center gap-1"><span>للإغلاق</span> <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200">Esc</kbd></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> بحث النظام الذكي
            </div>
         </div>
      </div>
    </div>
  );
}
