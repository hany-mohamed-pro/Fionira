import { FinancialRecord } from '../../../types';
import { DetectionResult, OperationalRule } from './rules/base-rule';
import { duplicateRule } from './rules/duplicate-rule';
import { totalMismatchRule } from './rules/total-mismatch-rule';
import { negativeAmountRule } from './rules/negative-amount-rule';
import { dateAnomalyRule } from './rules/date-anomaly-rule';
import { taxValidationRule } from './rules/tax-validation-rule';
import { generateSuggestions, SuggestedFix } from './suggestion-engine';

import { emptyAmountRule } from './rules/empty-amount-rule';

const rules: OperationalRule[] = [
  emptyAmountRule,
  duplicateRule,
  totalMismatchRule,
  negativeAmountRule,
  dateAnomalyRule,
  taxValidationRule
];

export interface DetectedError {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field?: string;
  relatedRecords?: any[];
  suggestedFixes: SuggestedFix[];
}

export function analyzeRecord(record: FinancialRecord, context?: any): DetectedError[] {
  const errors: DetectedError[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const detection = rule.execute(record, context);
    if (detection) {
      const suggestedFixes = generateSuggestions(record, detection);
      errors.push({
        id: crypto.randomUUID(),
        type: detection.type,
        severity: detection.severity,
        message: detection.message,
        field: detection.field,
        relatedRecords: detection.relatedRecords,
        suggestedFixes: suggestedFixes
      });
    }
  }

  return errors;
}

export function validateRecords(rawRecords: FinancialRecord[], context?: any) {
  return rawRecords.map(record => {
    const issues = analyzeRecord(record, context);
    // suggestions are already embedded in issues (as suggestedFixes), we can extract them if needed
    const suggestions: SuggestedFix[] = [];
    issues.forEach(issue => {
        if (issue.suggestedFixes) {
            suggestions.push(...issue.suggestedFixes);
        }
    });
    
    return {
      record,
      issues,
      suggestions
    };
  });
}

export function analyzeBatch(records: FinancialRecord[]): void {
  // We do NOT mutate the original records directly by filtering or mapping arrays that would return new ones.
  // Instead, we just assign an operationalErrors array to each record.
  const context = {
      existingRecords: records // the whole batch for comparison
  };
  const validated = validateRecords(records, context);
  for (let i = 0; i < validated.length; i++) {
     records[i].operationalErrors = validated[i].issues;
  }
}
