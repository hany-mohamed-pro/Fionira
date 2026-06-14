import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const negativeAmountRule: OperationalRule = {
  name: 'NEGATIVE_AMOUNT',
  execute: (record: FinancialRecord): DetectionResult | null => {
    
    // Determine context based on invoice number and description
    const invoiceStr = (record.Invoice_Number || '').toLowerCase();
    const descStr = (record.Item_Description || '').toLowerCase();
    
    const isCreditNote = invoiceStr.includes('cn') || 
                         invoiceStr.includes('credit') || 
                         descStr.includes('حركة عكسية') ||
                         descStr.includes('تسوية') || 
                         descStr.includes('مرتجع') || 
                         descStr.includes('refund') || 
                         descStr.includes('reversal') || 
                         descStr.includes('adjustment');

    if ((record.Total_Amount || 0) < 0 || (record.Net_Amount || 0) < 0) {
      if (!isCreditNote) {
        return {
          type: 'NEGATIVE_AMOUNT',
          severity: 'HIGH',
          message: 'قيمة سالبة بدون سياق واضح (مستند دائن/مرتجع)',
          field: (record.Total_Amount || 0) < 0 ? 'Total_Amount' : 'Net_Amount'
        };
      } else {
        // Log an informational insight but NOT an error
        return {
          type: 'VALID_NEGATIVE_AMOUNT',
          severity: 'LOW',
          message: 'مستند دائن / حركة عكسية معتمدة',
          field: (record.Total_Amount || 0) < 0 ? 'Total_Amount' : 'Net_Amount'
        };
      }
    }
    
    return null;
  }
};
