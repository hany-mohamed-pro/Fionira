import { FinancialRecord } from '../../../../types';
import { IntelligenceResult, Insight } from '../models';

export function analyzeBanks(records: FinancialRecord[], historicalData: FinancialRecord[] = []): IntelligenceResult[] {
    return records.map(record => {
        const insights: Insight[] = [];
        let riskScore = 0;

        const amount = record.Total_Amount || 0;

        // 1. Financial Rules (Bank context)
        if (amount < 0) {
            insights.push({ type: 'BANK_WITHDRAWAL', severity: 'LOW', message: 'حركة سحب بنكي دائنة', confidence: 1.0, scoreImpact: 0 });
        } else if (amount === 0) {
             insights.push({ type: 'ZERO_BANK_TX', severity: 'MEDIUM', message: 'حركة بنكية صفرية، قد تكون خطأ في كشف الحساب أو رسوم تم إلغاؤها', confidence: 0.9, scoreImpact: 10 });
        }

        // In Bank context, missing Entity might be acceptable as we just have statements, but let's warn
        if (!record.Entity_Name && !record.Raw_Entity) {
            insights.push({ type: 'UNALLOCATED_BANK_TX', severity: 'MEDIUM', message: 'حركة بنكية غير مسندة لجهة (تحتاج إلى توجيه محاسبي أو تسوية)', confidence: 0.9, scoreImpact: 15 });
        }

        // Risk Score Calculation
        insights.forEach(i => riskScore += i.scoreImpact);
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        return { record, insights, riskScore };
    });
}
