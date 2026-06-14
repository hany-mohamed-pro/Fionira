import { FinancialRecord } from '../../../../types';
import { IntelligenceResult, Insight } from '../models';

export function analyzeInventory(records: FinancialRecord[], historicalData: FinancialRecord[] = []): IntelligenceResult[] {
    return records.map(record => {
        const insights: Insight[] = [];
        let riskScore = 0;

        const amount = record.Total_Amount || 0; // Total value of inventory move
        const qty = record.Quantity || 0;

        if (qty < 0) {
            insights.push({ type: 'NEGATIVE_INVENTORY', severity: 'MEDIUM', message: 'حركة صرف / خروج من المخزون', confidence: 0.9, scoreImpact: 5 });
        }

        if (amount < 0) {
            insights.push({ type: 'NEGATIVE_INVENTORY_VALUE', severity: 'HIGH', message: 'تقييم مخزون بقيمة سالبة، غير منطقي محاسبياً في الجرد المستمر', confidence: 0.95, scoreImpact: 35 });
        }

        if (!record.Item_Code && !record.Entity_Name) {
            insights.push({ type: 'MISSING_ITEM_CODE', severity: 'CRITICAL', message: 'حركة مخزون بدون كود صنف تعريف', confidence: 1.0, scoreImpact: 40 });
        }

        // Risk Score Calculation
        insights.forEach(i => riskScore += i.scoreImpact);
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        return { record, insights, riskScore };
    });
}
