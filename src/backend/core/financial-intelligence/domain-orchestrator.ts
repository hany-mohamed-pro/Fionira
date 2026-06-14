import { FinancialRecord } from '../../../types';
import { IntelligenceResult } from './models';
import { analyzeExpenses } from './domains/expenses-intelligence-engine';
import { analyzeRevenues } from './domains/revenues-intelligence-engine';
import { analyzePayroll } from './domains/payroll-intelligence-engine';
import { analyzeBanks } from './domains/bank-intelligence-engine';
import { analyzeInventory } from './domains/inventory-intelligence-engine';

export function routeToDomainIntelligence(
    records: FinancialRecord[], 
    moduleType: 'expenses' | 'revenues' | 'payroll' | 'banks' | 'inventory',
    historicalData: FinancialRecord[] = []
): IntelligenceResult[] {
    switch (moduleType) {
        case 'expenses':
            return analyzeExpenses(records, historicalData);
        case 'revenues':
            return analyzeRevenues(records, historicalData);
        case 'payroll':
            return analyzePayroll(records, historicalData);
        case 'banks':
            return analyzeBanks(records, historicalData);
        case 'inventory':
            return analyzeInventory(records, historicalData);
        default:
            console.warn(`Unrecognized moduleType ${moduleType}, falling back to Expenses Intelligence`);
            return analyzeExpenses(records, historicalData);
    }
}
