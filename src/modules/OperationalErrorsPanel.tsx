import React from 'react';
import { Bot, AlertTriangle, LightbulbIcon, ArrowRightLeft } from 'lucide-react';
import { FinancialRecord } from '../types';

interface OperationalErrorsPanelProps {
  records: FinancialRecord[];
}

export const OperationalErrorsPanel: React.FC<OperationalErrorsPanelProps> = ({ records }) => {
  const errorCount = records.reduce((sum, r) => sum + ((r.operationalErrors && r.operationalErrors.length) || 0), 0);

  if (errorCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-lg shrink-0">
          <Bot className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-800 text-lg flex items-center gap-2">
            اكتشافات ذكية وأخطاء تشغيلية
            <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {errorCount}
            </span>
          </h3>
          <p className="text-amber-700/80 text-sm mt-1 mb-2 font-medium">
            تم رصد أخطاء منطقية أو مالية من قبل محرك الذكاء التشغيلي. يمكنك مراجعة التفاصيل أسفل كل سجل وتطبيق المقترح المناسب.
          </p>
        </div>
      </div>
    </div>
  );
};
