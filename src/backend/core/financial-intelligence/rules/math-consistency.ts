import { IntelligenceRule, Insight, IntelligenceContext } from '../models';
import { FinancialRecord } from '../../../../types';

export const mathConsistencyRule: IntelligenceRule = {
    name: 'MATH_CONSISTENCY',
    execute: (record: FinancialRecord, _context: IntelligenceContext) => {
        const insights: Insight[] = [];
        const total = record.Total_Amount || 0;
        const net = record.Net_Amount || 0;
        const vat = record.VAT_Amount || 0;

        // Subtotal + Tax = Total tolerance check
        const calculatedTotal = net + vat;
        const difference = Math.abs(total - calculatedTotal);

        if (difference > 0 && difference !== total) {
            if (difference <= 0.1) {
                // Minor rounding issue
                insights.push({
                    type: 'MINOR_ROUNDING_ISSUE',
                    severity: 'LOW',
                    message: `يوجد فارق بسيط جداً (${difference.toFixed(2)}) بسبب التقريب بين مجموع الصافي والضريبة والإجمالي.`,
                    confidence: 0.95,
                    suggestedAction: 'تجاهل أو معالجة الفروقات في حساب التسويات',
                    scoreImpact: 5
                });
            } else {
                // Major mathematical error
                insights.push({
                    type: 'MATH_INCONSISTENCY',
                    severity: 'MEDIUM',
                    message: `تفاوت حسابي: الصافي (${net}) + الضريبة (${vat}) لا يساوي الإجمالي (${total}).`,
                    confidence: 1.0,
                    suggestedAction: 'إعادة مراجعة حسابات الفاتورة',
                    scoreImpact: 25
                });
            }
        }

        return insights.length > 0 ? insights : null;
    }
};
