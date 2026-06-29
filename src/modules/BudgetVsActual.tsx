import React, { useEffect, useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { Target, Download, Upload, Save, Loader2, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '../shared/Card';
import { formatCurrency } from '../lib/formatters';
import { getSettings, saveSettings, AppSettings, BudgetEntry } from '../lib/settings-service';

interface BudgetVsActualProps {
  // The SAME incomeStatement object the Income Statement page receives — already
  // branch-scoped + date-filtered. This is the ONLY source of Actual (zero drift).
  incomeStatement: any;
  branchScope: string;          // 'all' | 'default' | branch id
  branchList: { id: string; name: string }[];
  dateFilter: any;              // global date filter (we read .year)
  tenantId?: string;
}

const MAIN_BRANCH = { id: 'default', name: 'الفرع الرئيسي' };

type Kind = 'revenue' | 'cost' | 'net';
const variancePct = (actual: number, budget: number) => (budget ? ((actual - budget) / Math.abs(budget)) * 100 : null);
const isFavorable = (kind: Kind, actual: number, budget: number): boolean | null => {
  if (!budget) return null;
  return kind === 'cost' ? actual <= budget : actual >= budget;
};

export const BudgetVsActual: React.FC<BudgetVsActualProps> = ({ incomeStatement, branchScope, branchList, dateFilter, tenantId }) => {
  const { language, notify } = useUI();
  const isRTL = language === 'ar';
  const { showAlert } = useUI() as any;

  const period = String(dateFilter?.year || new Date().getFullYear());
  const branches = useMemo(() => [MAIN_BRANCH, ...(branchList || [])], [branchList]);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // editable draft for the current period: { [branchId]: {revenue,cogs,opex} }
  const [draft, setDraft] = useState<Record<string, { revenue: number; cogs: number; opex: number }>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      if (!tenantId) { setLoading(false); return; }
      const s = await getSettings(tenantId);
      if (!active) return;
      setSettings(s);
      setBudgets(s.budgets || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [tenantId]);

  // Seed the editable draft for the current period from stored budgets.
  useEffect(() => {
    const d: Record<string, { revenue: number; cogs: number; opex: number }> = {};
    branches.forEach(b => {
      const row = budgets.find(x => x.branchId === b.id && x.period === period);
      d[b.id] = { revenue: row?.revenue || 0, cogs: row?.cogs || 0, opex: row?.opex || 0 };
    });
    setDraft(d);
  }, [budgets, period, branches]);

  // ── Budget for the current scope+period (sum across branches when 'all') ──
  const budgetForScope = useMemo(() => {
    const rows = budgets.filter(x => x.period === period && (branchScope === 'all' || x.branchId === branchScope));
    const revenue = rows.reduce((s, r) => s + (r.revenue || 0), 0);
    const cogs = rows.reduce((s, r) => s + (r.cogs || 0), 0);
    const opex = rows.reduce((s, r) => s + (r.opex || 0), 0);
    return { revenue, cogs, opex, net: revenue - cogs - opex, hasAny: rows.length > 0 };
  }, [budgets, period, branchScope]);

  // ── Actual — EXCLUSIVELY from incomeStatement (computePnLCore) ──
  const actual = {
    revenue: incomeStatement?.totalRevenue || 0,
    cogs: incomeStatement?.totalCOGS || 0,
    opex: incomeStatement?.totalOPEX || 0,
    net: incomeStatement?.netOperatingIncome || 0,
  };

  const rows: { key: string; label: string; kind: Kind; budget: number; actual: number }[] = [
    { key: 'revenue', label: 'إجمالي المبيعات', kind: 'revenue', budget: budgetForScope.revenue, actual: actual.revenue },
    { key: 'cogs', label: 'تكلفة المبيعات (COGS)', kind: 'cost', budget: budgetForScope.cogs, actual: actual.cogs },
    { key: 'opex', label: 'المصاريف التشغيلية (OPEX)', kind: 'cost', budget: budgetForScope.opex, actual: actual.opex },
    { key: 'net', label: 'صافي الربح', kind: 'net', budget: budgetForScope.net, actual: actual.net },
  ];

  const persist = async (next: BudgetEntry[]) => {
    if (!tenantId || !settings) return;
    setSaving(true);
    try {
      await saveSettings(tenantId, { ...settings, budgets: next });
      setBudgets(next);
      setSettings({ ...settings, budgets: next });
      notify('تم حفظ الموازنة بنجاح');
    } catch (e) {
      console.error('budget save failed', e);
      showAlert?.('خطأ في الحفظ', 'تعذّر حفظ الموازنة. حاول مرة أخرى.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    // Replace this period's rows with the draft (keep other periods untouched).
    const kept = budgets.filter(x => x.period !== period);
    const next: BudgetEntry[] = [
      ...kept,
      ...branches.map(b => ({ branchId: b.id, period, revenue: draft[b.id]?.revenue || 0, cogs: draft[b.id]?.cogs || 0, opex: draft[b.id]?.opex || 0 })),
    ];
    await persist(next);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const header = ['الفرع', 'السنة', 'الإيرادات', 'تكلفة المبيعات', 'المصاريف التشغيلية'];
    const aoa = [header, ...branches.map(b => [b.name, period, draft[b.id]?.revenue || 0, draft[b.id]?.cogs || 0, draft[b.id]?.opex || 0])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الموازنة');
    XLSX.writeFile(wb, `قالب_الموازنة_${period}.xlsx`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      // find header row
      const hIdx = data.findIndex(r => r && r.some((c: any) => typeof c === 'string' && /الفرع/.test(c)));
      if (hIdx === -1) throw new Error('NO_HEADER');
      const unmatched: string[] = [];
      const parsed: BudgetEntry[] = [];
      for (let i = hIdx + 1; i < data.length; i++) {
        const row = data[i]; if (!row || row.every(c => c == null || c === '')) continue;
        const branchName = String(row[0] || '').trim();
        const yr = String(row[1] || period).trim();
        const num = (v: any) => { const n = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n; };
        const match = branches.find(b => b.name === branchName) || (branchName === MAIN_BRANCH.name ? MAIN_BRANCH : null);
        if (!match) { if (branchName) unmatched.push(branchName); continue; }
        parsed.push({ branchId: match.id, period: yr, revenue: num(row[2]), cogs: num(row[3]), opex: num(row[4]) });
      }
      if (parsed.length === 0) throw new Error('NO_ROWS');
      // merge: replace matching (branchId, period) rows
      const keyOf = (b: BudgetEntry) => `${b.branchId}|${b.period}`;
      const keys = new Set(parsed.map(keyOf));
      const next = [...budgets.filter(b => !keys.has(keyOf(b))), ...parsed];
      await persist(next);
      if (unmatched.length) showAlert?.('فروع غير معروفة', `لم يتم التعرف على الفروع التالية وتم تجاهلها: ${[...new Set(unmatched)].join('، ')}. عرّفها في الإعدادات أولاً.`, 'error');
    } catch (err: any) {
      const m = err?.message;
      showAlert?.('خطأ في الملف', m === 'NO_HEADER' ? 'لم يتم العثور على عمود «الفرع». استخدم القالب المرفق.' : m === 'NO_ROWS' ? 'لا توجد صفوف صالحة في الملف.' : 'تعذّرت قراءة الملف. استخدم القالب المرفق.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const scopeLabel = branchScope === 'all' ? 'كل الفروع (مجمّع)' : (branches.find(b => b.id === branchScope)?.name || branchScope);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <Target className="w-4 h-4 text-indigo-500" />
          الموازنة مقابل الفعلي — سنة <span className="text-indigo-700">{period}</span> · <span className="text-indigo-700">{scopeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" /> قالب Excel
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" /> رفع موازنة
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Comparison table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>البند</th>
                <th className="py-3 px-4 text-center font-bold">الموازنة</th>
                <th className="py-3 px-4 text-center font-bold">الفعلي</th>
                <th className="py-3 px-4 text-center font-bold">الفرق</th>
                <th className="py-3 px-4 text-center font-bold">النسبة</th>
                <th className="py-3 px-4 text-center font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const varAmount = r.actual - r.budget;
                const pct = variancePct(r.actual, r.budget);
                const fav = isFavorable(r.kind, r.actual, r.budget);
                const color = fav == null ? 'text-slate-500' : fav ? 'text-emerald-600' : 'text-rose-600';
                const isNet = r.key === 'net';
                return (
                  <tr key={r.key} className={`border-b border-slate-100 ${isNet ? 'bg-slate-50 font-black' : ''}`}>
                    <td className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'} font-bold text-slate-800`}>{r.label}</td>
                    <td className="py-3 px-4 text-center text-slate-700" dir="ltr">{r.budget ? formatCurrency(r.budget) : '—'}</td>
                    <td className="py-3 px-4 text-center text-slate-900 font-bold" dir="ltr">{formatCurrency(r.actual)}</td>
                    <td className={`py-3 px-4 text-center font-bold ${color}`} dir="ltr">{r.budget ? `${varAmount >= 0 ? '+' : ''}${formatCurrency(varAmount)}` : '—'}</td>
                    <td className={`py-3 px-4 text-center font-bold ${color}`} dir="ltr">{pct == null ? '—' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}</td>
                    <td className="py-3 px-4 text-center">
                      {fav == null ? <span className="text-slate-400 text-xs">لا موازنة</span>
                        : fav ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> مُرضٍ</span>
                        : <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold"><AlertTriangle className="w-4 h-4" /> يحتاج انتباه</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!budgetForScope.hasAny && (
          <div className="p-4 bg-amber-50 border-t border-amber-100 text-amber-800 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> لا توجد موازنة محددة لسنة {period} لهذا النطاق. أدخل الأرقام أدناه أو ارفع قالب Excel.
          </div>
        )}
      </Card>

      {/* In-app editor */}
      <Card className="p-6">
        <h3 className="text-base font-black text-slate-800 mb-4">تحديد موازنة سنة {period} (لكل فرع)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className={`py-2 px-3 ${isRTL ? 'text-right' : 'text-left'} font-bold`}>الفرع</th>
                <th className="py-2 px-3 font-bold">الإيرادات</th>
                <th className="py-2 px-3 font-bold">تكلفة المبيعات</th>
                <th className="py-2 px-3 font-bold">المصاريف التشغيلية</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className={`py-2 px-3 ${isRTL ? 'text-right' : 'text-left'} font-bold text-slate-700`}>{b.name}</td>
                  {(['revenue', 'cogs', 'opex'] as const).map(field => (
                    <td key={field} className="py-2 px-3">
                      <input
                        type="number"
                        value={draft[b.id]?.[field] ?? 0}
                        onChange={e => setDraft(prev => ({ ...prev, [b.id]: { ...prev[b.id], [field]: Number(e.target.value) || 0 } }))}
                        className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        dir="ltr"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={saveDraft} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ الموازنة
          </button>
        </div>
      </Card>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[13px] leading-relaxed">
        <p className="font-black mb-1">عن هذه الصفحة</p>
        «الفعلي» يأتي مباشرةً من قائمة الدخل (نفس المصدر الموحّد) — لا حساب موازٍ ولا انحراف. الموازنة على مستوى الأقسام (إيرادات/تكلفة/مصاريف) سنوياً، وتتبع نطاق الفرع والفترة المختارَين من الأعلى. التفصيل الشهري وعلى مستوى كل تصنيف هما التوسعتان التاليتان.
      </div>
    </div>
  );
};
