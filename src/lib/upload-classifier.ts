export type ClassificationResult = 
  | 'NEW_PERIOD_SOURCE' 
  | 'CORRECTED_VERSION' 
  | 'AMBIGUOUS_OVERLAP' 
  | 'APPROVED_PERIOD_LOCKED'
  | 'UNPROCESSABLE';

export interface ClassificationOutcome {
  classification: ClassificationResult;
  arabicLabel: string;
  confidence: number;
  overlapAnalysis: any;
  dateRange: { from: string; to: string } | null;
  recordsCount: number;
  financialTotals: {
    taxableAmount: number;
    nonTaxableExemptAmount: number;
    inputVatAmount: number;
    totalIncludingVat: number;
  };
}

export function classifyStagedUpload(
  stagedRecords: any[],
  activeFileDateRanges: { fileId: string; minDate: string; maxDate: string }[],
  overlapAnalysis: any
): ClassificationOutcome {
  if (!stagedRecords || stagedRecords.length === 0) {
    return {
      classification: 'UNPROCESSABLE',
      arabicLabel: 'تعذر تحليل الملف أو التحقق من بياناته',
      confidence: 100,
      overlapAnalysis: null,
      dateRange: null,
      recordsCount: 0,
      financialTotals: { taxableAmount: 0, nonTaxableExemptAmount: 0, inputVatAmount: 0, totalIncludingVat: 0 }
    };
  }

  // 1. Calculate Date Range for Candidate
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';
  let taxableAmount = 0;
  let nonTaxableAmount = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  stagedRecords.forEach(r => {
    const d = r.Invoice_Date || r.Date || r.Transaction_Date;
    if (d && d < minDate) minDate = d;
    if (d && d > maxDate) maxDate = d;
    taxableAmount += Number(r.Taxable_Amount || 0);
    nonTaxableAmount += Number(r.Non_Taxable_Amount || r.NonTaxable_Amount || 0);
    vatAmount += Number(r.VAT_Amount || 0);
    totalAmount += Number(r.Total_Amount || r.Net_Amount || 0);
  });

  if (minDate === '9999-99-99') minDate = '';
  if (maxDate === '0000-00-00') maxDate = '';

  const dateRange = minDate ? { from: minDate, to: maxDate } : null;

  const financialTotals = {
    taxableAmount,
    nonTaxableExemptAmount: nonTaxableAmount,
    inputVatAmount: vatAmount,
    totalIncludingVat: totalAmount
  };

  // 2. Overlap Check
  let hasDateOverlap = false;
  if (minDate && maxDate) {
    for (const active of activeFileDateRanges) {
      if (active.minDate && active.maxDate) {
         if (minDate <= active.maxDate && maxDate >= active.minDate) {
            hasDateOverlap = true;
            break;
         }
      }
    }
  }

  const hasRecordOverlap = overlapAnalysis && overlapAnalysis.recordsMatchingActiveBusinessKeys > 0;
  const overlapRatio = hasRecordOverlap ? (overlapAnalysis.recordsMatchingActiveBusinessKeys / stagedRecords.length) : 0;

  // 3. Classification Logic based strictly on primary evidence
  let classification: ClassificationResult = 'AMBIGUOUS_OVERLAP';
  let arabicLabel = 'ملف متداخل أو غير محسوم — يحتاج مراجعة';
  let confidence = 50;

  if (!hasRecordOverlap) {
    // Date overlap alone must never classify a file as duplicate or ambiguous
    classification = 'NEW_PERIOD_SOURCE';
    arabicLabel = 'ملف جديد غير متداخل مع البيانات الحالية';
    confidence = 90;
  } else {
    // If we have high record key overlap, it is a corrected version candidate
    if (overlapRatio >= 0.80) {
      classification = 'CORRECTED_VERSION';
      arabicLabel = 'نسخة معدلة محتملة من ملف حالي';
      confidence = 95;
    } else {
      // Partial/minor record overlap is ambiguous
      classification = 'AMBIGUOUS_OVERLAP';
      arabicLabel = 'ملف متداخل أو غير محسوم — يحتاج مراجعة';
      confidence = 75;
    }
  }

  return {
    classification,
    arabicLabel,
    confidence,
    overlapAnalysis,
    dateRange,
    recordsCount: stagedRecords.length,
    financialTotals
  };
}

