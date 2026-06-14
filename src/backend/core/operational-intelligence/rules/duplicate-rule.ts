import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const duplicateRule: OperationalRule = {
  name: 'DUPLICATE_INVOICE',
  execute: (record: FinancialRecord, context?: any): DetectionResult | null => {
    if (!context || !context.existingRecords) return null;
    if (!record.Invoice_Number || record.Invoice_Number === '-' || record.Invoice_Number === 'غير محدد') return null;

    const duplicates = context.existingRecords.filter((r: FinancialRecord) => 
      r.id !== record.id &&
      r.Invoice_Number === record.Invoice_Number &&
      (r.Entity_ID === record.Entity_ID || r.Raw_Entity === record.Raw_Entity || r.Entity_Name === record.Entity_Name) &&
      Math.abs((r.Total_Amount || 0) - (record.Total_Amount || 0)) < 0.1
    );

    if (duplicates.length > 0) {
      return {
        type: 'DUPLICATE_INVOICE',
        severity: 'HIGH',
        message: 'تم تكرار الفاتورة بناءً على رقم الفاتورة والجهة وقيمة الإجمالي',
        relatedRecords: duplicates
      };
    }
    
    return null;
  }
};
