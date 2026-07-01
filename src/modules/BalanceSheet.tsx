import React from 'react';
import { RealBalanceSheet } from './RealBalanceSheet';

interface BalanceSheetProps {
  // Retained for the App.tsx call site; the real balance sheet fetches its own
  // data from the journal entries, so these are no longer read here.
  data?: {
    revenues: number;
    expenses: number;
    payroll: number;
  };
  onNavigateToTab?: (tab: string, anchor?: string, search?: string, targetMode?: string) => void;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* The REAL balance sheet (from actual journal entries) — the sole view. */}
      <RealBalanceSheet />
    </div>
  );
};
