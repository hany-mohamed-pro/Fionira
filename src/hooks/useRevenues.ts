import { useState } from 'react';
import { FinancialRecord, EntityProfile } from '../types';

export function useRevenues() {
  const [revenuesData, setRevenuesData] = useState<{
    fileId: string | null;
    records: FinancialRecord[];
    entities: EntityProfile[];
    schema: any;
    skippedRows: any[];
  }>({ fileId: null, records: [], entities: [], schema: null, skippedRows: [] });

  return { revenuesData, setRevenuesData };
}
