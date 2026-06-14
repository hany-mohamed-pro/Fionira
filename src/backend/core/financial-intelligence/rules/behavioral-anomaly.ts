import { IntelligenceRule, Insight, IntelligenceContext } from '../models';
import { FinancialRecord } from '../../../../types';

export const behavioralAnomalyRule: IntelligenceRule = {
    name: 'BEHAVIORAL_ANOMALY',
    execute: (record: FinancialRecord, context: IntelligenceContext) => {
        const insights: Insight[] = [];
        const vendorKey = record.Entity_ID || record.Raw_Entity || 'UNKNOWN_VENDOR';
        const profile = context.vendorProfiles[vendorKey];
        const recordAmount = record.Total_Amount || 0;

        if (!profile || profile.transactionCount < 3) {
            // New vendor + high value
            if (recordAmount > 50000) { // Arbitrary high threshold if no history
                insights.push({
                    type: 'NEW_VENDOR_HIGH_VALUE',
                    severity: 'MEDIUM',
                    message: `مورد جديد (أو لا يوجد له تاريخ كافٍ) مسجل بقيمة عالية جداً (${recordAmount}).`,
                    confidence: 0.7,
                    suggestedAction: 'تأكيد اعتماد المورد والتأكد من صِحة الشراء.',
                    scoreImpact: 35
                });
            }
            return insights.length > 0 ? insights : null;
        }

        // Behavior check
        if (profile.avgAmount > 0) {
            if (recordAmount > profile.avgAmount * 3) {
                insights.push({
                    type: 'ANOMALY_HIGH_AMOUNT',
                    severity: 'HIGH',
                    message: `القيمة (${recordAmount}) تمثل أكثر من 3 أضعاف متوسط الشراء العادي من هذا المورد (${profile.avgAmount.toFixed(2)}).`,
                    confidence: 0.9,
                    suggestedAction: 'قم بمراجعة القيمة قد يكون هناك خطأ في الإدخال.',
                    scoreImpact: 30
                });
            }
        }

        // Statistical outlier check (using Standard Deviation)
        if (profile.standardDeviation > 0 && profile.transactionCount > 5) {
            const zScore = Math.abs((recordAmount - profile.avgAmount) / profile.standardDeviation);
            if (zScore > 3) {
                insights.push({
                    type: 'ANOMALY_STATISTICAL_OUTLIER',
                    severity: 'MEDIUM',
                    message: `القيمة تمثل شذوذ إحصائي واضح عن السلوك المالي المعتاد.`,
                    confidence: 0.8,
                    scoreImpact: 20
                });
            }
        }

        return insights.length > 0 ? insights : null;
    }
};
