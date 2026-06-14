import { useState } from 'react';
import { FinancialRecord, EntityProfile } from '../types';

export function useExpenses() {
  const [expensesData, setExpensesData] = useState<{
    fileId: string | null;
    records: FinancialRecord[];
    entities: EntityProfile[];
    schema: any;
    skippedRows: any[];
  }>({ fileId: null, records: [], entities: [], schema: null, skippedRows: [] });

  return { expensesData, setExpensesData };
}
