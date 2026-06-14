import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const emptyAmountRule: OperationalRule = {
  name: 'EMPTY_AMOUNT',
  execute: (record: FinancialRecord): DetectionResult | null => {
    // If the Total_Amount is not provided or is NaN
    const amount = record.Total_Amount;
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
      return {
        type: 'EMPTY_AMOUNT',
        severity: 'HIGH',
        message: 'مبلغ الفاتورة غير محدد أو غير صالح (NaN)',
        field: 'Total_Amount'
      };
    }
    
    return null;
  }
};
