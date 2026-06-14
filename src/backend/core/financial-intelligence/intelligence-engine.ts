import { FinancialRecord } from '../../../types';
import { IntelligenceResult, Insight, IntelligenceContext } from './models';
import { buildVendorProfiles } from './vendor-profiler';

// Rules
import { fuzzyDuplicateRule } from './rules/fuzzy-duplicate';
import { behavioralAnomalyRule } from './rules/behavioral-anomaly';
import { mathConsistencyRule } from './rules/math-consistency';
import { smartTaxRule } from './rules/smart-tax';
import { temporalIntelligenceRule } from './rules/temporal-intelligence';

const intelligenceRules = [
    fuzzyDuplicateRule,
    behavioralAnomalyRule,
    mathConsistencyRule,
    smartTaxRule,
    temporalIntelligenceRule
];

export function analyzeFinancialData(
    records: FinancialRecord[], 
    historicalData: FinancialRecord[] = []
): IntelligenceResult[] {
    
    // 1. Build Context
    const profiles = buildVendorProfiles(historicalData);
    const context: IntelligenceContext = {
        historicalData,
        currentBatch: records,
        vendorProfiles: profiles
    };

    // 2. Execute Rules
    return records.map(record => {
        const insights: Insight[] = [];
        
        intelligenceRules.forEach(rule => {
            try {
                const result = rule.execute(record, context);
                if (result) {
                    if (Array.isArray(result)) {
                        insights.push(...result);
                    } else {
                        insights.push(result);
                    }
                }
            } catch (error) {
                console.error(`Error executing intelligence rule ${rule.name}:`, error);
            }
        });

        // 3. Calculate Risk Score
        let rawScore = 0;
        insights.forEach(insight => {
            rawScore += insight.scoreImpact;
        });

        // Cap at 100
        const riskScore = Math.min(Math.max(rawScore, 0), 100);

        return {
            record,
            insights,
            riskScore
        };
    });
}
