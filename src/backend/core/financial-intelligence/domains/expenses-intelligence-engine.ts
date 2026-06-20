import { FinancialRecord } from '../../../../types';
import { IntelligenceResult, Insight, IntelligenceContext } from '../models';
import { buildVendorProfiles } from '../vendor-profiler';
import { restaurantWastageRule } from '../rules/activity/restaurant-wastage';
import { manufacturingFoodRule } from '../rules/activity/manufacturing-food';

// Activity-aware rules. Each self-gates on context.activityProfile and only ADDS
// insights — none of them changes a record's category.
const activityRules = [restaurantWastageRule, manufacturingFoodRule];

export function analyzeExpenses(records: FinancialRecord[], historicalData: FinancialRecord[] = [], activityProfile?: string): IntelligenceResult[] {
    const profiles = buildVendorProfiles(historicalData);
    const context: IntelligenceContext = { historicalData, currentBatch: records, vendorProfiles: profiles, activityProfile };

    return records.map(record => {
        const insights: Insight[] = [];
        let riskScore = 0;

        const amount = record.Total_Amount || 0;
        const net = record.Net_Amount || 0;
        const vat = record.VAT_Amount || 0;
        const taxableAmt = record.Taxable_Amount || 0;
        const nonTaxableAmt = record.NonTaxable_Amount || 0;

        // --- Tax Context Classification ---
        let taxContext: 'taxable' | 'zero-rated' | 'exempt' | 'unknown' = 'unknown';
        if (taxableAmt > 0) {
            taxContext = 'taxable';
        } else if (nonTaxableAmt > 0) {
            taxContext = 'exempt'; 
        } else if (net > 0) {
            taxContext = vat > 0 ? 'taxable' : 'unknown';
        }

        // 1. Structural Rules
        if (!record.Entity_Name && !record.Raw_Entity && !record.Entity_ID) {
            insights.push({ type: 'MISSING_VENDOR', severity: 'HIGH', message: 'مورد غير معروف في فاتورة المصروفات (نقص في البيانات الأساسية)', confidence: 1.0, scoreImpact: 30, suggestedAction: 'تحديد المورد الصحيح' });
        }

        // 2. Financial Logic Rules
        // Negative Values: MUST be context-aware
        if (amount < 0) {
            const invoiceStr = (record.Invoice_Number || '').toLowerCase();
            const descStr = (record.Item_Description || '').toLowerCase();
            const isCreditNote = invoiceStr.includes('cn') || invoiceStr.includes('credit') || descStr.includes('حركة عكسية') || descStr.includes('تسوية') || invoiceStr.includes('مرتجع') || descStr.includes('مرتجع') || descStr.includes('refund') || descStr.includes('reversal') || descStr.includes('adjustment');
            
            if (!isCreditNote) {
                insights.push({ type: 'NEGATIVE_EXPENSE', severity: 'HIGH', message: 'قيمة المصروف بالسالب وبلا سياق واضح كإشعار دائن', confidence: 0.9, scoreImpact: 10, suggestedAction: 'التحقق من طبيعة السجل' });
            } else {
                insights.push({ type: 'VALID_NEGATIVE_EXPENSE', severity: 'LOW', message: 'مستند دائن / حركة عكسية معتمدة', confidence: 1.0, scoreImpact: 0 });
            }
        }
        
        // Total mismatch
        let expectedTotal = net + vat;
        if (net === 0 && (taxableAmt > 0 || nonTaxableAmt > 0)) {
            expectedTotal = taxableAmt + nonTaxableAmt + vat;
        }
        
        if (Math.abs(amount - expectedTotal) > 0.5) {
            insights.push({ type: 'MATH_MISMATCH', severity: 'CRITICAL', message: `اختلال حسابي: الإجمالي (${amount}) لا يتطابق مع المبالغ المكونة له`, confidence: 1.0, scoreImpact: 40, suggestedAction: 'إعادة حساب المبالغ' });
        }

        // Logical inconsistencies
        if (vat > 0 && taxableAmt === 0 && net === 0 && nonTaxableAmt > 0) {
            insights.push({ type: 'LOGICAL_INCONSISTENCY', severity: 'CRITICAL', message: 'توجد قيمة ضريبية ولكن المبلغ مسجل كغير خاضع للضريبة', confidence: 1.0, scoreImpact: 40 });
        }

        // Tax Context Enforcement: ONLY flag if taxable
        if (taxContext === 'taxable' && vat === 0) {
            insights.push({ type: 'MISSING_EXPECTED_VAT', severity: 'HIGH', message: 'مبلغ خاضع للضريبة ولكن تم تسجيل قيمة الضريبة بصفر', confidence: 0.95, scoreImpact: 35 });
        } else if (taxContext === 'taxable' && vat > 0) {
            const expectedVat = (taxableAmt > 0 ? taxableAmt : net) * 0.15; // KSA VAT
            if (Math.abs(vat - expectedVat) > 1.0) {
                insights.push({ type: 'VAT_RATE_MISMATCH', severity: 'HIGH', message: 'إقرار ضريبي مشتبه به: قيمة الضريبة لا تتطابق مع نسبة 15%', confidence: 0.9, scoreImpact: 30 });
            }
        }

        // 3. Duplication Rules
        const duplicateInvoice = context.historicalData.find(r => r.id !== record.id && r.Invoice_Number === record.Invoice_Number && record.Invoice_Number && (r.Entity_Name === record.Entity_Name || r.Raw_Entity === record.Raw_Entity)) 
            || context.currentBatch.find(r => r.id !== record.id && r.Invoice_Number === record.Invoice_Number && record.Invoice_Number && (r.Entity_Name === record.Entity_Name || r.Raw_Entity === record.Raw_Entity));
        if (duplicateInvoice) {
             insights.push({ type: 'EXACT_DUPLICATE', severity: 'CRITICAL', message: `تكرار متطابق لرقم الفاتورة (${record.Invoice_Number}) لنفس المورد`, confidence: 1.0, scoreImpact: 50 });
        } else {
             const fuzzyDuplicate = context.historicalData.find(r => 
                 r.id !== record.id && 
                 (r.Entity_Name === record.Entity_Name || r.Raw_Entity === record.Raw_Entity) && 
                 Math.abs((r.Total_Amount||0) - amount) < 0.1 && 
                 r.Invoice_Date === record.Invoice_Date
             ) || context.currentBatch.find(r => 
                 r.id !== record.id && 
                 (r.Entity_Name === record.Entity_Name || r.Raw_Entity === record.Raw_Entity) && 
                 Math.abs((r.Total_Amount||0) - amount) < 0.1 && 
                 r.Invoice_Date === record.Invoice_Date
             );
             if (fuzzyDuplicate) {
                 insights.push({ type: 'FUZZY_DUPLICATE', severity: 'HIGH', message: `اشتباه في فاتورة مزدوجة: نفس المورد والقيمة والتاريخ بمعرف مختلف`, confidence: 0.8, scoreImpact: 30 });
             }
        }

        // 4. Behavioral & Date Intelligence
        const vendorKey = record.Entity_ID || record.Raw_Entity || 'UNKNOWN_VENDOR';
        const profile = profiles[vendorKey];
        if (profile && profile.avgAmount > 0 && amount > profile.avgAmount * 3) {
            insights.push({ type: 'EXPENSE_SPIKE', severity: 'HIGH', message: `قفزة مالية غير معتادة (${amount}) تتجاوز المعدل الطبيعي للمورد`, confidence: 0.9, scoreImpact: 20 });
        }

        if (record.Invoice_Date) {
            const date = new Date(record.Invoice_Date);
            const now = new Date();
            if (date > now) {
                insights.push({ type: 'FUTURE_EXPENSE', severity: 'CRITICAL', message: 'تاريخ المستند في المستقبل (تلاعب أو خطأ إدخال)', confidence: 1.0, scoreImpact: 40 });
            } else {
                let fStart: Date;
                let fEnd: Date;
                if (record.Period_Year) {
                    fStart = new Date(`${record.Period_Year}-01-01`);
                    fEnd = new Date(`${record.Period_Year}-12-31T23:59:59`);
                } else {
                    const year = date.getFullYear();
                    fStart = new Date(`${year}-01-01`);
                    fEnd = new Date(`${year}-12-31T23:59:59`);
                }
                
                if (date < fStart || date > fEnd) {
                    insights.push({ type: 'OUTSIDE_FISCAL_PERIOD', severity: 'LOW', message: 'تاريخ المستند قديم أو يقع خارج الفترة المالية (معلومة إرشادية)', confidence: 0.9, scoreImpact: 5 });
                }
            }
        }

        // 5. Activity-aware rules (inert unless the tenant's activityProfile matches).
        //    These never change classification — they only add review insights.
        for (const rule of activityRules) {
            const result = rule.execute(record, context);
            if (!result) continue;
            if (Array.isArray(result)) insights.push(...result);
            else insights.push(result);
        }

        // Risk Score Calculation
        insights.forEach(i => riskScore += i.scoreImpact);
        riskScore = Math.min(Math.max(riskScore, 0), 100);

        return { record, insights, riskScore };
    });
}

