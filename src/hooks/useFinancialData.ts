import { useState, useCallback } from 'react';
import { FinancialRecord } from '../types';

export function useFinancialData(mode: 'expenses' | 'revenues' | 'payroll' | 'banks') {
  const [data, setData] = useState<any>({ fileId: null, records: [], entities: [], schema: null, skippedRows: [] });

  return {
    data,
    setData
  };
}
