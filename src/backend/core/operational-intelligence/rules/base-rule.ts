import { FinancialRecord } from '../../../../types';

export interface DetectionResult {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field?: string;
  relatedRecords?: any[];
}

export interface OperationalRule {
  name: string;
  execute: (record: FinancialRecord, context?: any) => DetectionResult | null;
}
