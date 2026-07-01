import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { JournalEntry } from '../backend/core/erp-engine';
import { Scale, ArrowUpCircle, ArrowDownCircle, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '../shared/Card';
import { formatCurrency } from '../lib/formatters';
import { computeBalanceSheetCore } from '../lib/balance-sheet-core';
import { AccountType } from '../lib/chart-of-accounts';

/**
 * Real Balance Sheet (Foundation — Phase A). Built from the ACTUAL stored journal
 * entries — the SAME source as Trial Balance / General Ledger (`/api/debug/
 * journalEntries/raw`). Assets/Liabilities/Equity grouped by account type; equity
 * uses REAL retained earnings (Σ revenue − Σ expense from the entries), no plug.
 * Shown side-by-side with the legacy estimated ("تقديري") balance sheet until
 * adopted. Journal-entry ↔ current-records sync is a Phase B item (stored JEs may
 * lag the latest records — same source as Trial Balance).
 */
export const RealBalanceSheet: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Use the useAuth user token (works in both dev-auth and production),
        // mirroring fetchDataForMode — NOT auth.currentUser, which is null in dev-auth.
        const token = await user.getIdToken();
        if (!token) return;
        const res = await fetch('/api/debug/journalEntries/raw', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setEntries(res.ok && json.success && Array.isArray(json.data) ? json.data.filter((d: any) => d.isActive !== false) : []);
      } catch (e) {
        console.error('Error fetching journal entries (real balance sheet)', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const bs = useMemo(() => computeBalanceSheetCore(entries as any), [entries]);

  // Aggregate presented amounts per subtype, drop near-zero lines.
  const group = (type: AccountType) => {
    const m: Record<string, number> = {};
    bs.subtypeBreakdown[type].forEach(x => { m[x.subtype] = (m[x.subtype] || 0) + x.amount; });
    return Object.entries(m).filter(([, v]) => Math.abs(v) >= 0.01).sort((a, b) => b[1] - a[1]);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري بناء الميزانية الحقيقية من القيود...</div>;

  const assetGroups = group('asset');
  const liabGroups = group('liability');

  return (
    <div className="space-y-6">
      {/* Source label */}
      <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-900">
        <p className="font-black text-base mb-1 flex items-center gap-2"><Scale className="w-5 h-5" /> الميزانية العمومية الحقيقية — من القيود المحاسبية الفعلية</p>
        <p className="text-sm font-medium leading-relaxed">
          مبنية على <b>قيود ميزان المراجعة ودفتر الأستاذ</b> (نفس المصدر) — أرصدة حسابات حقيقية بقيد مزدوج، وحقوق الملكية = رأس المال + أرباح مبقاة فعلية − مسحوبات (بدون أي تقدير أو موازنة قسرية).
          <br />ملاحظة: قد تتأخّر القيود المخزّنة عن أحدث السجلات المرفوعة (نفس سلوك ميزان المراجعة) — <b>مزامنة القيود مع السجلات تُعالَج في Phase B</b>.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><ArrowUpCircle className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-sm font-bold text-indigo-600">إجمالي الأصول</p><p className="text-2xl font-black text-slate-900" dir="ltr">{formatCurrency(bs.totalAssets)}</p></div>
          </div>
        </Card>
        <Card className="p-6 bg-rose-50 border-rose-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><ArrowDownCircle className="w-6 h-6 text-rose-600" /></div>
            <div><p className="text-sm font-bold text-rose-600">إجمالي الالتزامات</p><p className="text-2xl font-black text-slate-900" dir="ltr">{formatCurrency(bs.totalLiabilities)}</p></div>
          </div>
        </Card>
        <Card className="p-6 bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Wallet className="w-6 h-6 text-emerald-600" /></div>
            <div><p className="text-sm font-bold text-emerald-600">حقوق الملكية</p><p className="text-2xl font-black text-slate-900" dir="ltr">{formatCurrency(bs.totalEquity)}</p></div>
          </div>
        </Card>
      </div>

      {/* Accounting-identity gate (no plug) */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${bs.balanced ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        {bs.balanced ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
        <p className={`text-[14px] font-bold ${bs.balanced ? 'text-emerald-800' : 'text-amber-800'}`}>
          {bs.balanced
            ? `متوازنة ✓ — الأصول (${formatCurrency(bs.totalAssets)}) = الالتزامات + حقوق الملكية (${formatCurrency(bs.totalLiabilities + bs.totalEquity)}) — توازن حقيقي من القيود لا بموازنة قسرية`
            : `فرق في التوازن: ${formatCurrency(bs.difference)} (= صافي الحسابات غير المصنّفة) — يلزم مراجعة`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <Card className="p-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 border-b pb-4">الأصول (Assets)</h3>
          <div className="space-y-3">
            {assetGroups.map(([sub, amt]) => (
              <div key={sub} className="flex justify-between items-center">
                <span className="font-bold text-slate-600">{sub}</span>
                <span className="font-black text-slate-900" dir="ltr">{formatCurrency(amt)}</span>
              </div>
            ))}
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-black text-indigo-600">إجمالي الأصول</span>
              <span className="font-black text-indigo-600" dir="ltr">{formatCurrency(bs.totalAssets)}</span>
            </div>
          </div>
        </Card>

        {/* Liabilities + Equity */}
        <Card className="p-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 border-b pb-4">الالتزامات وحقوق الملكية</h3>
          <div className="space-y-3">
            {liabGroups.map(([sub, amt]) => (
              <div key={sub} className="flex justify-between items-center">
                <span className="font-bold text-slate-600">{sub}</span>
                <span className="font-black text-slate-900" dir="ltr">{formatCurrency(amt)}</span>
              </div>
            ))}
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="font-black text-rose-600">إجمالي الالتزامات</span>
              <span className="font-black text-rose-600" dir="ltr">{formatCurrency(bs.totalLiabilities)}</span>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex justify-between items-center"><span className="font-bold text-slate-600">رأس المال</span><span className="font-black text-slate-900" dir="ltr">{formatCurrency(bs.capital)}</span></div>
              <div className="flex justify-between items-center"><span className="font-bold text-slate-600">الأرباح المبقاة (من القيود)</span><span className="font-black text-slate-900" dir="ltr">{formatCurrency(bs.retainedEarnings)}</span></div>
              {bs.drawings !== 0 && <div className="flex justify-between items-center"><span className="font-bold text-slate-600">مسحوبات الملاك</span><span className="font-black text-rose-600" dir="ltr">({formatCurrency(bs.drawings)})</span></div>}
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-black text-emerald-600">إجمالي حقوق الملكية</span>
                <span className="font-black text-emerald-600" dir="ltr">{formatCurrency(bs.totalEquity)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-[13px] leading-relaxed">
        <p className="font-black mb-1">عن هذه الميزانية</p>
        تتوازن بالبناء الحقيقي لأن كل قيد مزدوج متوازن (مدين = دائن) — الأرباح المبقاة محسوبة فعلياً من القيود لا كرقم موازِن.
        فرقٌ معروف ومحدّد السبب بمقدار ضئيل بينها وبين قائمة الدخل (`computePnLCore`) ناتج عن أن قائمة الدخل تحتسب فئتَي رواتب تحملان ضريبة بالإجمالي، بينما الميزانية تعالجهما بالصافي + ضريبة مدخلات كأصل (الأصحّ محاسبياً) — بند تحسين مستقل مسجّل، لا يمسّ هذه الصفحة.
      </div>
    </div>
  );
};
