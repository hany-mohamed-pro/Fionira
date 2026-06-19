import { FinancialRecord } from '../../../types';

export interface Insight {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  confidence: number;
  suggestedAction?: string;
  scoreImpact: number;
}

export interface IntelligenceResult {
  record: FinancialRecord;
  insights: Insight[];
  riskScore: number;
}

export interface VendorProfile {
    id: string;
    name: string;
    totalAmount: number;
    transactionCount: number;
    avgAmount: number;
    variance: number;
    standardDeviation: number;
    lastTransactionDate?: string;
    isNew: boolean;
}

export interface IntelligenceContext {
    historicalData: FinancialRecord[];
    currentBatch: FinancialRecord[];
    vendorProfiles: Record<string, VendorProfile>;
    /**
     * Stable activity key for the tenant (e.g. 'restaurant_fb'). Undefined/empty
     * means unset — activity-aware rules stay inert, preserving today's behavior.
     */
    activityProfile?: string;
}

export interface IntelligenceRule {
    name: string;
    execute: (record: FinancialRecord, context: IntelligenceContext) => Insight | Insight[] | null;
}
