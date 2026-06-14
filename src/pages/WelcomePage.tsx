import React from 'react';
import { Sparkles, BarChart3, PieChart, ShieldCheck } from 'lucide-react';
import { AppConfig } from '../config/appConfig';
import { useUI } from '../contexts/UIContext';
import { getTranslation } from '../i18n/ui-text';

export const WelcomePage: React.FC<{ companyName?: string, logo?: string | null }> = ({ companyName, logo }) => {
  const { language } = useUI();
  const t = getTranslation(language);
  const isRTL = language === 'ar';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-xl p-10 text-center relative overflow-hidden shadow-lg border border-indigo-500/20">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="bg-white/10 w-24 h-24 rounded-xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-inner">
            {logo || AppConfig.logo ? (
              <img src={logo || AppConfig.logo || ''} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <Sparkles className="w-12 h-12 text-amber-300" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-sans text-white tracking-tight font-bold mb-2">{t.brand.name}</h1>
          <p className="text-indigo-200 text-xl font-medium whitespace-nowrap mb-2">{t.brand.tagline}</p>
          <p className="text-slate-400 text-sm whitespace-nowrap mb-4">{t.brand.descriptor}</p>
          {companyName && (
             <p className="text-amber-300/90 text-lg mb-4 font-medium tracking-wide">
                {companyName}
             </p>
          )}
          <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-6">
            {isRTL ? 'المنصة المتكاملة للتحليل المالي والمحاسبي المتقدم. يمكنك تصفح التقارير والإحصائيات من خلال القائمة الجانبية.' : 'Integrated platform for advanced financial and accounting analysis. Browse reports and statistics via the side menu.'}
          </p>
          <div className="inline-block bg-white/5 border border-white/10 rounded-full px-6 py-2 backdrop-blur-sm">
            <p className="text-amber-300 text-sm md:text-base font-medium italic" dir="ltr">
              "Engineered by a financial expert to solve real-world money management challenges."
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-sm transition-shadow text-center">
          <div className="bg-indigo-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{isRTL ? 'تحليل مالي دقيق' : 'Accurate Financial Analysis'}</h3>
          <p className="text-slate-500 text-sm">{isRTL ? 'استعرض الأداء المالي للمشتريات والمبيعات والرواتب بدقة عالية.' : 'Review financial performance of purchases, sales, and salaries with high accuracy.'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-sm transition-shadow text-center">
          <div className="bg-emerald-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <PieChart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{isRTL ? 'تقارير تفصيلية' : 'Detailed Reports'}</h3>
          <p className="text-slate-500 text-sm">{isRTL ? 'موازين المراجعة وقوائم الدخل ولوحات الأداء المالي في متناول يدك.' : 'Trial balances, income statements, and financial performance dashboards at your fingertips.'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-sm transition-shadow text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{isRTL ? 'بيانات آمنة' : 'Secure Data'}</h3>
          <p className="text-slate-500 text-sm">{isRTL ? 'تمتع بصلاحيات المشاهدة الآمنة لجميع البيانات المالية المعتمدة.' : 'Enjoy secure viewing privileges for all approved financial data.'}</p>
        </div>
      </div>
    </div>
  );
};
