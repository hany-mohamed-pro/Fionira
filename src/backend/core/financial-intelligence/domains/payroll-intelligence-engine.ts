import { FinancialRecord } from '../../../../types';
import { IntelligenceResult, Insight } from '../models';

export function analyzePayroll(records: FinancialRecord[], historicalData: FinancialRecord[] = []): IntelligenceResult[] {
    return records.map(record => {
        const insights: Insight[] = [];
        let riskScore = 0;

        const amount = record.Total_Amount || 0;

        // 1. Structural Rules
        if (!record.Entity_Name && !record.Raw_Entity) {
            insights.push({ type: 'MISSING_EMPLOYEE', severity: 'CRITICAL', message: 'مستفيد غير معروف في قائمة الرواتب', confidence: 1.0, scoreImpact: 40, suggestedAction: 'ربط السجل بموظف فعال' });
        }

        // 2. Financial Rules (Payroll context)
        if (amount < 0) {
            insights.push({ type: 'NEGATIVE_PAYROLL', severity: 'CRITICAL', message: 'قيمة سالبة في الرواتب! هذا غير مسموح هيكلياً في حركات الرواتب الصافية', confidence: 0.95, scoreImpact: 50 });
        }

        if (record.VAT_Amount && record.VAT_Amount > 0) {
            insights.push({ type: 'PAYROLL_WITH_VAT', severity: 'CRITICAL', message: 'مستحيل محاسبياً: الرواتب لا تخضع لضريبة القيمة المضافة', confidence: 1.0, scoreImpact: 60 });
        }

        // 3. Behavioral Rules
        if (amount > 100000) {
            insights.push({ type: 'EXTRAORDINARY_PAYROLL', severity: 'HIGH', message: `راتب غير اعتيادي بقيمة عالية جداً (${amount})`, confidence: 0.8, scoreImpact: 35 });
        }

        // Risk Score Calculation
        insights.forEach(i => riskScore += i.scoreImpact);
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        return { record, insights, riskScore };
    });
}
