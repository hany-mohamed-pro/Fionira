import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { Scale, Layers, Users } from 'lucide-react';
import { BankReconciliation } from './BankReconciliation';
import { BankMovements } from './BankMovements';

// Unified bank-accounts page (IA consolidation Phase 1). One entry point with
// three modes — strictly a tabbed wrapper, ZERO information loss: each mode
// renders the full original component unchanged.
//   • مطابقة الأرصدة      → BankReconciliation (opening/closing reconciliation + GL breakdown)
//   • الحركة حسب النوع     → BankMovements forced to "by type"
//   • الحركة حسب الطرف     → BankMovements forced to "by counterparty"
// Replaces the previously-separate "مطابقة البنوك" and "حركة الحسابات" nav entries.

type Mode = 'reconciliation' | 'type' | 'counterparty';

export const BankAccountsView = ({ records = [], defaultMode = 'reconciliation' }: { records: any[]; defaultMode?: Mode }) => {
  const { language } = useUI();
  const isRTL = language === 'ar';
  const [mode, setMode] = useState<Mode>(defaultMode);

  const tabs: { id: Mode; label: string; icon: any }[] = [
    { id: 'reconciliation', label: isRTL ? 'مطابقة الأرصدة' : 'Reconciliation', icon: Scale },
    { id: 'type', label: isRTL ? 'الحركة حسب النوع' : 'Movements by Type', icon: Layers },
    { id: 'counterparty', label: isRTL ? 'الحركة حسب الطرف' : 'By Counterparty', icon: Users },
  ];

  return (
    <div className="space-y-5 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = mode === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {mode === 'reconciliation' && <BankReconciliation records={records} />}
      {mode === 'type' && <BankMovements records={records} forcedView="type" />}
      {mode === 'counterparty' && <BankMovements records={records} forcedView="counterparty" />}
    </div>
  );
};
