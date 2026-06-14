import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle, Database, 
  Users, Layers, Coins, Scale, ChevronDown, ChevronUp,
  ArrowRight, Info
} from 'lucide-react';
import { 
  migrationOverviewData, 
  vendorReviewGroups, 
  apStandardizationCandidates, 
  roundingDifferences, 
  trialBalanceComparison 
} from '../data/migrationReviewSample';

export const MigrationReviewDashboard = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'vendors' | 'ap' | 'rounding' | 'tb'>('overview');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const overviewCards = [
    {
      title: 'مجموعات الموردين',
      value: migrationOverviewData.vendorGroupsNeedingReview,
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      desc: 'تحتاج مراجعة وتوحيد'
    },
    {
      title: 'حسابات موردين للتنظيم',
      value: migrationOverviewData.suggestedAccountStandardizations,
      icon: <Layers className="w-6 h-6 text-amber-500" />,
      desc: 'مقترح دمجها في حساب رئيسي'
    },
    {
      title: 'فروقات تقريب بسيطة',
      value: migrationOverviewData.roundingDifferencesCount,
      icon: <Coins className="w-6 h-6 text-blue-500" />,
      desc: `إجمالي: ${migrationOverviewData.totalRoundingDifference} ر.س`
    },
    {
      title: 'ميزان المراجعة',
      value: migrationOverviewData.trialBalanceMatched ? 'متطابق' : 'يوجد فارق',
      icon: <Scale className="w-6 h-6 text-emerald-500" />,
      desc: 'بعد إعادة التنظيم الهيكلي',
      valueColor: migrationOverviewData.trialBalanceMatched ? 'text-emerald-600' : 'text-rose-600'
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            مراجعة الجاهزية المحاسبية
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            هذه المساحة مخصصة للمراجعة الهيكلية للحسابات والموردين. هذا الإجراء ضروري لضمان دقة التقارير المستقبلية.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showAdvancedDetails ? 'إخفاء التفاصيل الفنية' : 'عرض التفاصيل الفنية'}
          </button>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-800 text-sm">
              الحالة: انتظار فحص المحاسب (Pending)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-r-4 border-blue-500 text-blue-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p><strong>هذا اقتراح وليس قرارًا نهائيًا.</strong> لن يتم تطبيق أي تغيير على السجلات المحاسبية بدون موافقتك الصريحة.</p>
          <p className="mt-1 opacity-80">الهدف من هذه الخطوة ليس تغيير القيم المالية، بل إعادة تنظيم للحسابات لضمان جودة استخراج ميزان المراجعة والتقارير الضريبية.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'الملخص العام' },
          { id: 'vendors', label: 'توحيد الموردين' },
          { id: 'ap', label: 'حسابات الموردين' },
          { id: 'rounding', label: 'فروقات التقريب' },
          { id: 'tb', label: 'ميزان المراجعة' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
              activeSection === tab.id 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map((card, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg">{card.icon}</div>
                </div>
                <div>
                  <h4 className="text-slate-500 text-xs font-bold mb-1">{card.title}</h4>
                  <div className={`text-2xl font-black ${card.valueColor || 'text-slate-800'}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">{card.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">بوابات الاعتماد (Approval Gates)</h3>
            <div className="space-y-3">
              {[
                { label: 'مراجعة الموردين والكيانات المكررة', status: 'PENDING' },
                { label: 'مراجعة توحيد حسابات الموردين (AP Collapse)', status: 'PENDING' },
                { label: 'مراجعة فروقات التقريب', status: 'PENDING' },
                { label: 'المصادقة على ميزان المراجعة الهيكلي', status: 'PENDING' }
              ].map((gate, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">{i+1}</div>
                    <span className="font-bold text-slate-700 text-sm">{gate.label}</span>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                    قيد المراجعة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vendors Section */}
      {activeSection === 'vendors' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">اقتراحات توحيد الموردين</h3>
              <p className="text-sm text-slate-500 mt-1">يبدو أن هناك عدة سجلات تشير لنفس المورد. هل ترغب بدمجها في سجل رئيسي واحد لتوحيد كشوفات الحساب؟</p>
            </div>
            {showAdvancedDetails && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-mono">
                [TECHNICAL: Phase 3D Entity Clustering]
              </span>
            )}
          </div>

          {vendorReviewGroups.map(group => (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div 
                className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg"><Users className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">{group.suggestedMainName}</h4>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-emerald-500" /> ثقة النظام: {group.confidence}</span>
                      <span>•</span>
                      <span>العمليات: {group.transactionCount}</span>
                      <span>•</span>
                      <span>القيمة: {group.totalAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">{group.riskExplanation}</span>
                  {expandedGroups[group.id] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>
              
              {expandedGroups[group.id] && (
                <div className="p-4 bg-white space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 mb-2">الأسماء المقترح دمجها:</h5>
                      <div className="flex flex-wrap gap-2">
                        {group.variants.map((v, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    {showAdvancedDetails && (
                      <div className="bg-slate-900 rounded-lg p-3 text-green-400 font-mono text-[10px] whitespace-pre-wrap">
                        {`// Raw JSON Artifact Preview\n{\n  "target_normalized_id": "SUP-0042",\n  "legacy_uuids_to_merge": [\n    "8f2a-4bc1", "9c3d-1ef2"\n  ]\n}`}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                    <button className="px-4 py-2 text-sm font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">يحتاج فحص يدوي</button>
                    <button className="px-4 py-2 text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100">إبقاء كحسابات منفصلة</button>
                    <button className="px-4 py-2 text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> موافقة على الدمج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AP Account Standardization */}
      {activeSection === 'ap' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="font-bold text-slate-800 text-lg mb-2">تنظيم حسابات الموردين (المستحقات)</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              وجد النظام أن بعض الموردين لهم حسابات أستاذ منفصلة في الدليل المحاسبي القديم. التوصية القياسية هي توحيد هذه الحسابات في حساب واحد يسمى "الموردون" (210000)، مع تتبع تفاصيل كل مورد داخلياً عبر كشوفات الحساب. هذا لا يؤثر على الأرصدة بل يسهّل استخراج التقارير الختامية.
            </p>
            {showAdvancedDetails && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs font-mono mb-4">
                [TECHNICAL]: Accounts Payable Collapse Strategy. Maps 125 liability accounts into single Account 210000. Retains vendor_id on journal lines.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">الحساب القديم</th>
                  <th className="px-4 py-3 font-bold">الحساب المقترح (التنظيم الجديد)</th>
                  <th className="px-4 py-3 font-bold">عدد العمليات</th>
                  <th className="px-4 py-3 font-bold">القيمة المتأثرة</th>
                  <th className="px-4 py-3 font-bold text-center">القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apStandardizationCandidates.map(cand => (
                  <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 font-medium line-through decoration-rose-300">{cand.legacyAccount}</td>
                    <td className="px-4 py-3 font-bold text-indigo-700 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                      {cand.standardAccount}
                    </td>
                    <td className="px-4 py-3 font-mono">{cand.transactionCount}</td>
                    <td className="px-4 py-3 font-mono">{cand.amountImpact.toLocaleString()} ر.س</td>
                    <td className="px-4 py-3 text-center">
                       <button className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                         موافقة
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trial Balance */}
      {activeSection === 'tb' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-2">تأكيد توازن ميزان المراجعة</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              يقوم النظام بفحص أرصدة ميزان المراجعة قبل وبعد اقتراحات التنظيم لضمان عدم وجود أي اختلال في توازن الحسابات.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-bold text-slate-700">
                  قبل التنظيم (Legacy)
                </div>
                <div className="p-4 space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">إجمالي المدين:</span>
                    <span className="font-bold">{trialBalanceComparison.legacyTotalDebit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">إجمالي الدائن:</span>
                    <span className="font-bold">{trialBalanceComparison.legacyTotalCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">حسابات الموردين (المتعددة):</span>
                    <span className="font-bold text-rose-600">{trialBalanceComparison.legacyAPTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border border-indigo-200 rounded-xl overflow-hidden ring-2 ring-indigo-50">
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 font-bold text-indigo-800 flex justify-between items-center">
                  <span>بعد التنظيم (Normalized)</span>
                  {trialBalanceComparison.status === 'BALANCED' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </div>
                <div className="p-4 space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">إجمالي المدين:</span>
                    <span className="font-bold">{trialBalanceComparison.normalizedTotalDebit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">إجمالي الدائن:</span>
                    <span className="font-bold">{trialBalanceComparison.normalizedTotalCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">حساب الموردين (الموحد):</span>
                    <span className="font-bold text-emerald-600">{trialBalanceComparison.normalizedAPTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {showAdvancedDetails && (
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-600">
                <p className="font-bold mb-2">// Structural Variance Analysis</p>
                <p>Reclassification_Shift: <span className="text-indigo-600">{trialBalanceComparison.reclassificationShift.toLocaleString()} SAR</span></p>
                <p className="mt-1 opacity-80">Variance represents total balance shifted from legacy leaf liability accounts to the standard root AP account. Overall TB equation (Assets = Liab + Equity) remains strictly balanced.</p>
              </div>
            )}
            
            <div className="mt-8 flex justify-center">
               <button className="px-8 py-3 font-bold bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                 <CheckCircle className="w-5 h-5" /> مصادقة المحاسب على توازن الميزان
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationReviewDashboard;
