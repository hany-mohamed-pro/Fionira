import { IntelligenceRule, Insight, IntelligenceContext } from '../models';
import { FinancialRecord } from '../../../../types';

export const smartTaxRule: IntelligenceRule = {
    name: 'SMART_TAX',
    execute: (record: FinancialRecord, context: IntelligenceContext) => {
        const insights: Insight[] = [];
        const total = record.Total_Amount || 0;
        const net = record.Net_Amount || 0;
        const vat = record.VAT_Amount || 0;

        // VAT without taxable base
        if (vat > 0 && net === 0) {
            insights.push({
                type: 'VAT_WITHOUT_BASE',
                severity: 'HIGH',
                message: `يوجد قيمة ضريبية (${vat}) بينما القيمة غير الخاضعة/الصافي صفر.`,
                confidence: 1.0,
                suggestedAction: 'تعديل البيانات لتضمين الصافي',
                scoreImpact: 35
            });
        }

        // Taxable but zero VAT (assuming mostly B2B, standard rate 15% in KSA but might be exempt)
        if (net > 0 && vat === 0) {
            const vendorKey = record.Entity_ID || record.Raw_Entity || 'UNKNOWN_VENDOR';
            const profile = context.vendorProfiles[vendorKey];

            // If we've seen this vendor before and they USUALLY charge tax...
            if (profile && profile.transactionCount > 2) {
                const vendorRecords = context.historicalData.filter(r => (r.Entity_ID || r.Raw_Entity) === vendorKey);
                const timesWithTax = vendorRecords.filter(r => (r.VAT_Amount || 0) > 0).length;
                
                if (timesWithTax / profile.transactionCount > 0.8) {
                     insights.push({
                        type: 'MISSING_EXPECTED_VAT',
                        severity: 'HIGH',
                        message: `المورد يفرض ضريبة غالباً، لكن الفاتورة الحالية ليس بها ضريبة.`,
                        confidence: 0.85,
                        scoreImpact: 25
                    });
                }
            }
        }

        return insights.length > 0 ? insights : null;
    }
};
