import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { Card } from '../shared/Card';
import { Coins, ArrowUpCircle, ArrowDownCircle, TrendingUp, Landmark, CheckCircle2, AlertTriangle, Wallet, Repeat } from 'lucide-react';
import { formatCurrency } from '../lib/financial-utils';
import { computePortfolioCashFlow, type AccountCashFlow, type CashFlowSection } from '../lib/bank-cashflow-core';

interface CashFlowProps {
  // Bank records (moduleType === 'banks'), already date/search/branch scoped by App.
  bankRecords?: any[];
  // True when a single branch is selected in the global branch scope — affects how
  // honestly we can present per-account opening/closing balances.
  branchScoped?: boolean;
}

const SectionBlock: React.FC<{ title: string; subtitle?: string; section: CashFlowSection; tone: 'operating' | 'transfers' }>
  = ({ title, subtitle, section, tone }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
      <div className="flex items-center gap-2">
        {tone === 'operating' ? <Coins className="w-5 h-5 text-emerald-500" /> : <Repeat className="w-5 h-5 text-amber-500" />}
        <div>
          <span className="font-black text-slate-800">{title}</span>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <span className={`font-black ${section.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {section.net >= 0 ? '+' : ''}{formatCurrency(section.net)}
      </span>
    </div>
    <div className="bg-white">
      {section.lines.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-400">لا توجد حركات</div>
      )}
      {section.lines.map((l) => (
        <div key={l.nature} className="flex justify-between items-center px-4 py-3 border-b border-slate-50 last:border-0">
          <span className="text-sm text-slate-600 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${l.net >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            {l.nature} <span className="text-[10px] text-slate-300">({l.count})</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            {l.inflow > 0 && <span className="text-emerald-600 font-bold">+{formatCurrency(l.inflow)}</span>}
            {l.outflow > 0 && <span className="text-rose-600 font-bold">−{formatCurrency(l.outflow)}</span>}
            <span className={`font-black w-28 text-left ${l.net >= 0 ? 'text-slate-800' : 'text-rose-700'}`} dir="ltr">{formatCurrency(l.net)}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AccountCashFlowCard: React.FC<{ acc: AccountCashFlow; tr: (ar: string, en: string) => string }> = ({ acc, tr }) => (
  <Card className="p-0 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark className="w-5 h-5" /></div>
      <div>
        <h3 className="text-[15px] font-black text-slate-800">{acc.bankName || acc.accountLabel || 'حساب بنكي'}</h3>
        <p className="text-[12px] text-slate-500">
          {acc.accountNumber ? `رقم الحساب: ${acc.accountNumber}` : 'بدون رقم حساب'} · {acc.recon.count} حركة
        </p>
      </div>
    </div>

    <div className="p-6 space-y-5">
      {/* Opening balance */}
      {acc.hasBalances ? (
        <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="font-bold text-slate-700">الرصيد النقدي الافتتاحي</span>
          <span className="font-black text-slate-800" dir="ltr">{formatCurrency(acc.openingBalance || 0)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-[13px] text-slate-600">{tr('لا يحتوي الكشف على عمود رصيد جارٍ — يُعرض صافي الحركة النقدية فقط (دون مطابقة رصيد ختامي).', 'No running-balance column — net movement only.')}</p>
        </div>
      )}

      <SectionBlock title="التدفقات النقدية من الأنشطة التشغيلية" section={acc.operating} tone="operating" />
      <SectionBlock
        title="تحويلات وحركات أخرى"
        subtitle="تحويلات بين الحسابات/حوالات — قد تتضمن حركات استثمارية أو تمويلية يتعذّر فصلها من بيانات البنك"
        section={acc.transfers}
        tone="transfers"
      />

      {/* Net change */}
      <div className="flex justify-between items-center pt-2">
        <span className="text-lg font-black text-slate-900">صافي التغير في النقدية</span>
        <span className={`text-xl font-black ${acc.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
          {acc.netChange >= 0 ? '+' : ''}{formatCurrency(acc.netChange)}
        </span>
      </div>

      {/* Ending cash + reconciliation gate */}
      {acc.hasBalances && (
        <>
          <div className="flex justify-between items-center p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="font-black text-indigo-900">الرصيد النقدي الختامي (محسوب)</span>
            <span className="font-black text-indigo-900" dir="ltr">{formatCurrency(acc.computedEndingCash || 0)}</span>
          </div>
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${acc.reconciledToClosing ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {acc.reconciledToClosing ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
            <div>
              <p className={`text-[14px] font-bold ${acc.reconciledToClosing ? 'text-emerald-800' : 'text-amber-800'}`}>
                {acc.reconciledToClosing
                  ? `مطابق ✓ — الرصيد الختامي المحسوب يساوي رصيد الكشف البنكي (${formatCurrency(acc.closingBalance || 0)})`
                  : `فرق في المطابقة: ${acc.closingDiff != null ? formatCurrency(acc.closingDiff) : ''} — الرصيد الختامي المحسوب لا يطابق رصيد الكشف (${formatCurrency(acc.closingBalance || 0)})`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </Card>
);

export const CashFlow: React.FC<CashFlowProps> = ({ bankRecords = [], branchScoped = false }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const tr = (ar: string, en: string) => (isRTL ? ar : en);

  const portfolio = useMemo(() => computePortfolioCashFlow(bankRecords), [bankRecords]);

  if (portfolio.accountCount === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="p-10 text-center">
          <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-700 mb-1">لا توجد حركات بنكية لعرض قائمة التدفقات النقدية</h3>
          <p className="text-sm text-slate-500">
            {branchScoped
              ? 'لا توجد حركات بنكية مُسندة لهذا الفرع. تُبنى قائمة التدفقات النقدية من كشوف الحسابات البنكية المرفوعة.'
              : 'تُبنى قائمة التدفقات النقدية من كشوف الحسابات البنكية الفعلية. ارفع كشف حساب بنكي من قسم «البنوك».'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Portfolio summary — opening / net change / ending cash (additive across accounts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-50 border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Wallet className="w-6 h-6 text-slate-500" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500">النقدية الافتتاحية</p>
              <p className="text-2xl font-black text-slate-900" dir="ltr">{portfolio.openingBalance != null ? formatCurrency(portfolio.openingBalance) : '—'}</p>
            </div>
          </div>
        </Card>
        <Card className={`p-6 ${portfolio.netChange >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              {portfolio.netChange >= 0 ? <ArrowUpCircle className="w-6 h-6 text-emerald-600" /> : <ArrowDownCircle className="w-6 h-6 text-rose-600" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${portfolio.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>صافي التغير في النقدية</p>
              <p className="text-2xl font-black text-slate-900" dir="ltr">{portfolio.netChange >= 0 ? '+' : ''}{formatCurrency(portfolio.netChange)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
            <div>
              <p className="text-sm font-bold text-indigo-600">النقدية الختامية</p>
              <p className="text-2xl font-black text-slate-900" dir="ltr">{portfolio.closingBalance != null ? formatCurrency(portfolio.closingBalance) : '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio-level reconciliation gate */}
      {portfolio.hasBalances && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${portfolio.reconciledToClosing ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          {portfolio.reconciledToClosing ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
          <p className={`text-[14px] font-bold ${portfolio.reconciledToClosing ? 'text-emerald-800' : 'text-amber-800'}`}>
            {portfolio.reconciledToClosing
              ? 'مطابقة مكتملة ✓ — النقدية الافتتاحية + صافي التغير = النقدية الختامية الفعلية حسب كشوف البنوك'
              : `يوجد فرق في المطابقة: ${portfolio.closingDiff != null ? formatCurrency(portfolio.closingDiff) : ''}`}
          </p>
        </div>
      )}

      {branchScoped && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-[13px] text-blue-800">
          <Wallet className="w-4 h-4 shrink-0" />
          عرض مُصفّى حسب الفرع: تُعرض التدفقات النقدية المُسندة لهذا الفرع. أرصدة الافتتاح/الإقفال تُطابَق على مستوى الحساب البنكي الكامل (كل الفروع).
        </div>
      )}

      {portfolio.accountCount > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-slate-600">
          <Landmark className="w-4 h-4" />
          {`${portfolio.accountCount} حسابات بنكية — كل حساب تُعرض تدفقاته على حدة (لا تُدمج الأرصدة).`}
        </div>
      )}

      {portfolio.accounts.map((acc) => <AccountCashFlowCard key={acc.accountKey} acc={acc} tr={tr} />)}

      {/* Honest scope note */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm leading-relaxed">
        <p className="font-black mb-1">عن هذه القائمة (الطريقة المباشرة)</p>
        تُبنى قائمة التدفقات النقدية من الحركات الفعلية لكشوف الحسابات البنكية، ويُطابَق رصيدها الختامي مع الرصيد الفعلي للكشف (لا تقدير).
        الأنشطة <b>الاستثمارية</b> (شراء أصول ثابتة) و<b>التمويلية</b> (مساهمات/مسحوبات الملاك، القروض) لا يمكن فصلها بدقة من بيانات البنك وحدها حالياً —
        إذ لا يميّز التصنيف البنكي شراء أصل ثابت عن أي مدفوعات أخرى، ولا مسحوبات الملاك عن أي تحويل — لذا تظهر ضمن «الأنشطة التشغيلية» أو «تحويلات وحركات أخرى» دون افتراض تصنيف لا تسنده البيانات. يتطلب الفصل الدقيق تفعيل ترميز الأصول الثابتة ورأس مال الملاك مستقبلاً.
      </div>
    </div>
  );
};
