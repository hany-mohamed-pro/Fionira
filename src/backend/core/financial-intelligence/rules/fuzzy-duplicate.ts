import { IntelligenceRule, Insight, IntelligenceContext } from '../models';
import { FinancialRecord } from '../../../../types';

export const fuzzyDuplicateRule: IntelligenceRule = {
    name: 'FUZZY_DUPLICATE',
    execute: (record: FinancialRecord, context: IntelligenceContext) => {
        const insights: Insight[] = [];
        
        const vendorKey = record.Entity_ID || record.Raw_Entity || 'UNKNOWN_VENDOR';
        const recordAmount = record.Total_Amount || 0;
        const recordDate = record.Invoice_Date ? new Date(record.Invoice_Date) : null;

        if (!recordDate || recordAmount === 0) return null;

        const checkDuplicateIn = (dataset: FinancialRecord[], isHistorical: boolean) => {
            dataset.forEach(r => {
                if (r.id === record.id) return; // Skip self
                
                const rVendor = r.Entity_ID || r.Raw_Entity || 'UNKNOWN_VENDOR';
                if (rVendor !== vendorKey) return;

                const rAmount = r.Total_Amount || 0;
                const rDate = r.Invoice_Date ? new Date(r.Invoice_Date) : null;
                
                if (!rDate) return;

                // Date within ±3 days
                const diffTime = Math.abs(rDate.getTime() - recordDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 3) {
                    // Amount within ±2%
                    const amountDiff = Math.abs(rAmount - recordAmount);
                    const percentDiff = recordAmount !== 0 ? (amountDiff / Math.abs(recordAmount)) : 0;

                    if (percentDiff <= 0.02) {
                        insights.push({
                            type: 'POTENTIAL_DUPLICATE',
                            severity: 'HIGH',
                            message: `معاملة مشابهة جداً تم اكتشافها (${diffDays} أيام فارق، اختلاف ${(percentDiff*100).toFixed(1)}% في القيمة).`,
                            confidence: 0.85 + (1 - percentDiff * 50) * 0.1, // Confidence scales with closeness
                            suggestedAction: 'تحقق من عدم تكرار الفاتورة',
                            scoreImpact: 40
                        });
                    }
                }
            });
        };

        checkDuplicateIn(context.currentBatch, false);
        checkDuplicateIn(context.historicalData, true);

        return insights.length > 0 ? insights : null;
    }
};
