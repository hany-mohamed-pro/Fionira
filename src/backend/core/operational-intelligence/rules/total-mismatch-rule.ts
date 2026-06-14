import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const totalMismatchRule: OperationalRule = {
  name: 'TOTAL_MISMATCH',
  execute: (record: FinancialRecord): DetectionResult | null => {
    // subtotal + tax == total => Net_Amount + VAT_Amount == Total_Amount
    // But Net_Amount is also Taxable_Amount + NonTaxable_Amount
    
    // Total mismatch:
    const calculatedTotal = (record.Net_Amount || 0) + (record.VAT_Amount || 0);
    const actualTotal = record.Total_Amount || 0;
    
    if (Math.abs(calculatedTotal - actualTotal) > 0.1) {
      return {
        type: 'TOTAL_MISMATCH',
        severity: 'MEDIUM',
        message: 'عدم تطابق بين (الصافي + الضريبة) مع الإجمالي',
        field: 'Total_Amount'
      };
    }
    
    return null;
  }
};
