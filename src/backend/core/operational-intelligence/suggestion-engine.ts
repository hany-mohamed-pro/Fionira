import { FinancialRecord } from '../../../types';
import { DetectionResult } from './rules/base-rule';

export interface SuggestedFix {
  action: 'REPLACE_VALUE' | 'DELETE_RECORD' | 'MARK_AS_DUPLICATE' | 'FLAG_AS_REFUND';
  field?: string;
  suggestedValue?: any;
  confidence: number;
  description: string;
}

export function generateSuggestions(record: FinancialRecord, error: DetectionResult): SuggestedFix[] {
  const fixes: SuggestedFix[] = [];

  switch (error.type) {
    case 'EMPTY_AMOUNT':
      fixes.push({
        action: 'REPLACE_VALUE',
        field: 'Total_Amount',
        suggestedValue: 0,
        confidence: 0.1,
        description: 'تصفير القيمة أو المراجعة اليدوية'
      });
      break;

    case 'DUPLICATE_INVOICE':
      fixes.push({
        action: 'MARK_AS_DUPLICATE',
        confidence: 0.95,
        description: 'تعليم هذا السجل كمكرر وحذفه لتفادي الازدواجية'
      });
      break;
      
    case 'TOTAL_MISMATCH':
      // subtotal + tax == total => Net_Amount + VAT_Amount == Total_Amount
      const computedTotal = (record.Net_Amount || 0) + (record.VAT_Amount || 0);
      fixes.push({
        action: 'REPLACE_VALUE',
        field: 'Total_Amount',
        suggestedValue: computedTotal,
        confidence: 0.92,
        description: `تغيير الرقم الإجمالي ليكون ${computedTotal}`
      });
      break;

    case 'NEGATIVE_AMOUNT':
      fixes.push({
        action: 'REPLACE_VALUE',
        field: error.field,
        suggestedValue: Math.abs(record[error.field as keyof FinancialRecord] as number),
        confidence: 0.85,
        description: 'تحويل القيمة السالبة إلى موجبة'
      });
      fixes.push({
        action: 'FLAG_AS_REFUND',
        confidence: 0.8,
        description: 'تصنيف كمرتجع (Refund)'
      });
      break;

    case 'TAX_MISSING':
      const expectedVat = (record.Taxable_Amount || 0) * 0.15;
      fixes.push({
        action: 'REPLACE_VALUE',
        field: 'VAT_Amount',
        suggestedValue: expectedVat,
        confidence: 0.90,
        description: `تطبيق نسبة 15% وحساب الضريبة كـ ${expectedVat}`
      });
      break;

    case 'TAX_MISMATCH':
      const newVat = (record.Taxable_Amount || 0) * 0.15;
      fixes.push({
        action: 'REPLACE_VALUE',
        field: 'VAT_Amount',
        suggestedValue: newVat,
        confidence: 0.88,
        description: `تعديل قيمة الضريبة لتكون ${newVat} (15% من الخاضع)`
      });
      break;
  }

  return fixes;
}
