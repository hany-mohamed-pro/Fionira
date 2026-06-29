import React from 'react';
import { useUI } from '../contexts/UIContext';
import { HardHat, Layers, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../shared/Card';
import { formatCurrency } from '../lib/formatters';

interface ProjectRow {
  id: string; name: string; status: 'active' | 'completed'; branchId: string;
  startDate?: string; expectedCompletion?: string;
  cost: number; revenue: number; profit: number; costCount: number; revCount: number;
}

interface ProjectCostingProps {
  projects: ProjectRow[];   // already branch-scoped + costed by App
  wipTotal: number;         // sum of ACTIVE-project costs (deferred from P&L)
  branchScoped?: boolean;
}

export const ProjectCosting: React.FC<ProjectCostingProps> = ({ projects, wipTotal, branchScoped = false }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';

  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="p-10 text-center">
          <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-700 mb-1">لا توجد مشاريع مُعرّفة</h3>
          <p className="text-sm text-slate-500">
            عرّف مشاريعك من الإعدادات ← المشاريع. تتراكم تكاليف كل مشروع نشط كأعمال تحت التنفيذ (WIP) — مؤجَّلة عن قائمة الدخل — وتُعترف كتكلفة مبيعات عند إغلاق المشروع.
          </p>
        </Card>
      </div>
    );
  }

  const active = projects.filter(p => p.status === 'active');
  const completed = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* WIP summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm"><Layers className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm font-bold text-amber-700">أعمال تحت التنفيذ (WIP)</p>
              <p className="text-2xl font-black text-slate-900" dir="ltr">{formatCurrency(wipTotal)}</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-2">تكاليف مشاريع نشطة، مؤجَّلة عن قائمة الدخل حتى الإغلاق.</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-slate-500" /></div>
            <div><p className="text-sm font-bold text-slate-500">مشاريع نشطة</p><p className="text-2xl font-black text-slate-900">{active.length}</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
            <div><p className="text-sm font-bold text-slate-500">مشاريع مكتملة</p><p className="text-2xl font-black text-slate-900">{completed.length}</p></div>
          </div>
        </Card>
      </div>

      {branchScoped && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[13px] text-blue-800">
          <HardHat className="w-4 h-4 shrink-0" /> عرض مُصفّى حسب الفرع — تظهر مشاريع/تكاليف الفرع المختار فقط.
        </div>
      )}

      {/* Per-project table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <HardHat className="w-5 h-5 text-indigo-500" /><h3 className="font-black text-slate-800">تكلفة المشاريع (طريقة العقد المكتمل)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>المشروع</th>
                <th className="py-3 px-4 text-center font-bold">الحالة</th>
                <th className="py-3 px-4 text-center font-bold">التكلفة المتراكمة</th>
                <th className="py-3 px-4 text-center font-bold">الإيراد/الدفعات</th>
                <th className="py-3 px-4 text-center font-bold">الربح التقديري</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'} font-bold text-slate-800`}>
                    {p.name}
                    <span className="block text-[11px] font-medium text-slate-400">{p.costCount} بند تكلفة{p.expectedCompletion ? ` · متوقع: ${p.expectedCompletion}` : ''}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.status === 'active'
                      ? <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold"><Layers className="w-4 h-4" /> WIP (تحت التنفيذ)</span>
                      : <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> مكتمل (في التكلفة)</span>}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900" dir="ltr">{formatCurrency(p.cost)}</td>
                  <td className="py-3 px-4 text-center text-slate-700" dir="ltr">{p.revenue ? formatCurrency(p.revenue) : '—'}</td>
                  <td className={`py-3 px-4 text-center font-black ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">{formatCurrency(p.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[13px] leading-relaxed">
        <p className="font-black mb-1">كيف تعمل هذه الصفحة</p>
        تُنسَب تكلفة كل بند إلى المشروع عبر ورود اسم المشروع في وصف العملية. ما دام المشروع <b>نشطاً</b>، تتراكم تكاليفه
        كـ<b>أعمال تحت التنفيذ (WIP) ومؤجَّلة عن قائمة الدخل</b>؛ وعند تحديده <b>مكتملاً</b> من الإعدادات تُعترف تكاليفه
        كتكلفة مبيعات (طريقة العقد المكتمل). «الإيراد/الدفعات» يعرض دفعات العميل المرتبطة بالمشروع — أما <b>تأجيل الإيراد
        المقدّم كالتزام (إيراد غير مكتسب)</b> فهو بند منفصل (D12) ينتظر أساس دليل الحسابات؛ وكذلك يظهر بند WIP رسمياً كأصل
        في الميزانية عند بناء ذلك الأساس.
      </div>
    </div>
  );
};
