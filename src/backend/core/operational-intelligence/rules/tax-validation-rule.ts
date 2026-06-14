import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const taxValidationRule: OperationalRule = {
  name: 'TAX_VALIDATION',
  execute: (record: FinancialRecord): DetectionResult | null => {
    // 15% VAT check
    const taxable = record.Taxable_Amount || 0;
    const vat = record.VAT_Amount || 0;
    
    // If there is taxable amount, there must be VAT roughly equal to 15% (for KSA, assuming KSA)
    if (taxable > 0) {
      const expectedVat = taxable * 0.15;
      if (vat === 0) {
        return {
          type: 'TAX_MISSING',
          severity: 'HIGH',
          message: 'يوجد مبلغ خاضع للضريبة ولكن الضريبة صفر',
          field: 'VAT_Amount'
        };
      }
      
      // Calculate diff (allow small rounding diff)
      if (Math.abs(expectedVat - vat) > 0.5) {
        return {
          type: 'TAX_MISMATCH',
          severity: 'MEDIUM',
          message: 'مبلغ الضريبة لا يساوي 15% من المبلغ الخاضع للضريبة',
          field: 'VAT_Amount'
        };
      }
    }
    
    // If VAT exists without taxable amount
    if (vat > 0 && taxable === 0) {
      return {
        type: 'TAX_WITHOUT_TAXABLE',
        severity: 'HIGH',
        message: 'يوجد مبلغ ضريبة ولكن المبلغ الخاضع صفر',
        field: 'Taxable_Amount'
      };
    }
    
    return null;
  }
};
