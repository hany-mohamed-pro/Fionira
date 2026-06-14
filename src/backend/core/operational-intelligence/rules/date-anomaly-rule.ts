import { OperationalRule, DetectionResult } from './base-rule';
import { FinancialRecord } from '../../../../types';

export const dateAnomalyRule: OperationalRule = {
  name: 'DATE_ANOMALY',
  execute: (record: FinancialRecord, context?: any): DetectionResult | null => {
    if (!record.Invoice_Date || record.Invoice_Date === '-' || record.Invoice_Date === 'غير محدد') return null;
    
    const recordDate = new Date(record.Invoice_Date);
    if (isNaN(recordDate.getTime())) return null;
    
    const now = new Date();
    
    // Future Date
    if (recordDate > now) {
      return {
        type: 'DATE_ANOMALY_FUTURE',
        severity: 'CRITICAL',
        message: 'تاريخ المستند في المستقبل (تلاعب أو خطأ إدخال)',
        field: 'Invoice_Date'
      };
    }
    
    // Fiscal Period Inference
    let fStart: Date;
    let fEnd: Date;

    if (context?.fiscalStart && context?.fiscalEnd) {
       fStart = new Date(context.fiscalStart);
       fEnd = new Date(context.fiscalEnd);
    } else if (record.Period_Year) {
       fStart = new Date(`${record.Period_Year}-01-01`);
       fEnd = new Date(`${record.Period_Year}-12-31T23:59:59`);
    } else {
       // Infer from the document itself, which means it shouldn't realistically be out of range of its own year
       const year = recordDate.getFullYear();
       fStart = new Date(`${year}-01-01`);
       fEnd = new Date(`${year}-12-31T23:59:59`);
    }
    
    if (recordDate < fStart || recordDate > fEnd) {
      return {
        type: 'DATE_ANOMALY_OUT_OF_RANGE',
        severity: 'LOW',
        message: `تاريخ المستند (${record.Invoice_Date}) قديم أو خارج الفترة المالية المحددة`,
        field: 'Invoice_Date'
      };
    }

    return null;
  }
};
