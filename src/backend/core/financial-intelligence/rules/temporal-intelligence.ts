import { IntelligenceRule, Insight, IntelligenceContext } from '../models';
import { FinancialRecord } from '../../../../types';

export const temporalIntelligenceRule: IntelligenceRule = {
    name: 'TEMPORAL_INTELLIGENCE',
    execute: (record: FinancialRecord, _context: IntelligenceContext) => {
        const insights: Insight[] = [];
        if (!record.Invoice_Date) return null;

        const recordDate = new Date(record.Invoice_Date);
        const now = new Date();

        // Future dates
        if (recordDate > now) {
            insights.push({
                type: 'FUTURE_DATE',
                severity: 'HIGH',
                message: `تاريخ الفاتورة (${record.Invoice_Date}) في المستقبل.`,
                confidence: 1.0,
                suggestedAction: 'تعديل تاريخ الفاتورة إلى التاريخ الفعلي',
                scoreImpact: 30
            });
        }

        // Extremely backdated entries (e.g. over 1 year ago)
        const diffTime = Math.abs(now.getTime() - recordDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (recordDate <= now && diffDays > 365) {
             insights.push({
                type: 'EXTREME_BACKDATE',
                severity: 'MEDIUM',
                message: `الفاتورة قديمة جداً (أكثر من سنة).`,
                confidence: 0.9,
                scoreImpact: 15
            });
        }

        return insights.length > 0 ? insights : null;
    }
};
