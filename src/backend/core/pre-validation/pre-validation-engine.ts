import { ValidationSession } from './validation-session';
import { processUploadBatch } from '../ingestion-engine';
import { routeToDomainIntelligence } from '../financial-intelligence/domain-orchestrator';
import { normalizeBranchId } from '../dimensions';

export async function createValidationSession(
  files: { buffer: ArrayBuffer; name: string; fileHash?: string }[],
  moduleType: 'expenses' | 'revenues' | 'payroll' | 'banks' | 'inventory',
  onProgress?: (msg: string) => void,
  activityProfile?: string,
  branchId?: string
): Promise<ValidationSession> {
  const session = await processUploadBatch(files, moduleType, onProgress);

  const rawRecords = session.records;

  // Tag every record with the branch it was uploaded for (default if unset).
  // Additive, one place — no processor/engine touched. Persists through activation.
  const resolvedBranchId = normalizeBranchId(branchId);
  rawRecords.forEach((r: any) => { r.branchId = resolvedBranchId; });
  const warnings: any[] = [];
  const errors: any[] = [];
  const suggestions: any[] = [];
  
  const severitySummary = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  
  // CFO-Grade Domain Specific Financial Intelligence
  // We pass historical data if we fetch it, for now we pass an empty array or recent history
  const intelligenceResults = routeToDomainIntelligence(rawRecords, moduleType, [], activityProfile);

  const sessionRecords: any[] = [];
  let cleanRecords = 0;
  let criticalIssues = 0;
  let highRiskCount = 0;
  let totalFinancialExposure = 0;

  // Build new CFO-graded structured records
  rawRecords.forEach((record: any) => {
      const issues: any[] = [];
      const recordSuggestions: any[] = [];
      
      const intel = intelligenceResults.find(r => r.record.id === record.id);
      let riskScore = 0;
      let insights: any[] = [];

      if (intel) {
          insights = intel.insights;
          riskScore = intel.riskScore;
          
          insights.forEach((insight: any) => {
              const mappedSeverity = insight.severity === 'HIGH' ? 'CRITICAL' : insight.severity;
              issues.push({
                 code: insight.type,
                 type: insight.type.includes('MISSING') ? 'STRUCTURAL' : 'INTELLIGENCE',
                 severity: mappedSeverity,
                 message: insight.message,
                 explanation: insight.message,
                 impact: 'مخاطر مالية واحتمالية وجود أخطاء في التوجيه أو الاحتيال',
                 scoreImpact: insight.scoreImpact || (insight.severity === 'HIGH' || insight.severity === 'CRITICAL' ? 30 : 10),
                 suggestedFixes: insight.suggestedAction ? [{ description: insight.suggestedAction, action: "MANUAL_REVIEW" }] : []
              });
              
              if (mappedSeverity === 'CRITICAL') criticalIssues++;
              
              if (insight.severity === 'HIGH' || insight.severity === 'CRITICAL') severitySummary.HIGH++;
              else if (insight.severity === 'MEDIUM') severitySummary.MEDIUM++;
              else severitySummary.LOW++;
              
              if (insight.severity !== 'CRITICAL') {
                   warnings.push({ recordId: record.id, ...insight });
              } else {
                   errors.push({ recordId: record.id, ...insight });
              }
              
              if (insight.suggestedAction) {
                  const fixObj = { description: insight.suggestedAction, action: "MANUAL_REVIEW" };
                  recordSuggestions.push(fixObj);
                  suggestions.push({
                      recordId: record.id,
                      record,
                      error: insight,
                      fixes: [fixObj]
                  });
              }
          });
      }

      if (issues.length === 0) {
          // FAIL-SAFE MODE: check obvious errors
          const amount = record.Total_Amount || 0;
          const expectedCalc = (record.Net_Amount||0) + (record.VAT_Amount||0);
          const hasMismatch = Math.abs(amount - expectedCalc) > 0.5 && Math.abs(amount - ((record.Taxable_Amount||0) + (record.NonTaxable_Amount||0) + (record.VAT_Amount||0))) > 0.5;
          const invoiceStr = (record.Invoice_Number || '').toLowerCase();
          const descStr = (record.Item_Description || '').toLowerCase();
          const isNegative = amount < 0 && !(
              invoiceStr.includes('cn') || 
              invoiceStr.includes('credit') || 
              descStr.includes('حركة عكسية') ||
              descStr.includes('تسوية') || 
              descStr.includes('مرتجع') || 
              descStr.includes('refund') || 
              descStr.includes('reversal') || 
              descStr.includes('adjustment')
          );
          
          if (hasMismatch || isNegative) {
              console.error(`DETECTION ENGINE FAILURE: Obvious errors bypassed intelligence engine for record ${record.id}`, record);
              throw new Error("DETECTION ENGINE FAILURE: Obvious invalid logic bypassed the engine.");
          }
      }

      if (issues.length === 0 && riskScore < 30) {
          cleanRecords++;
      }
      
      console.log(`[DETECTION TRACE]\nRecord: ${record.id || record.Invoice_Number}\nIssues: [${issues.map((i: any) => i.type).join(', ')}]\nSeverity: [${issues.map((i: any) => i.severity).join(', ')}]\nRiskScore: ${riskScore}`);

      if (riskScore > 50 || issues.some(i => i.severity === 'CRITICAL')) {
          highRiskCount++;
          totalFinancialExposure += (record.Total_Amount || 0);
      }

      sessionRecords.push({
          id: record.id,
          rawData: record.rawData || record,
          normalizedData: record,
          issues,
          suggestions: recordSuggestions,
          financialIntelligence: {
              insights,
              riskScore
          },
          status: issues.length === 0 ? 'APPROVED' : 'PENDING'
      });
  });

  return {
    sessionId: session.sessionId,
    uploadedFileName: files.length > 0 ? files[0].name : 'Batch Upload',
    timestamp: new Date().toISOString(),
    records: sessionRecords,
    summary: {
      totalRecords: rawRecords.length,
      cleanRecords,
      criticalIssues,
      highRiskCount,
      totalFinancialExposure
    },
    rawRecords,
    validRecords: rawRecords, // keeping for backwards compat
    warnings,
    errors,
    suggestions,
    intelligenceResults,
    severitySummary,
    status: 'PENDING_REVIEW',
    fileMetadatas: [],
    skippedRows: session.skippedRows,
    rejectedRecords: session.rejectedRecords || [],
    journalEntries: [],
    masterData: session.masterData
  };
}
