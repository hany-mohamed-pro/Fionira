import { getActiveFiles, getActiveFileIds } from './active-file-registry';

// Reusable read-only helper for deterministic multiplicity-aware dry-run preview contract (Phase C4-C)
export function generateDryRunPreview(
  sourceId: string,
  proposedAction: string,
  moduleType: string | undefined,
  tenantId: string,
  devMemoryDb: any
) {
  // 1. Enforce tenant isolation and collect populations
  const tenantRecords = devMemoryDb.records.filter((r: any) => 
    r.tenantId === tenantId && (!moduleType || r.moduleType === moduleType)
  );
  const activeFileIds = new Set(getActiveFileIds(devMemoryDb.uploadedFiles, moduleType || null, tenantId));

  // Determine if the requested source is actively included or orphaned
  let sourceIsIncluded = false;
  let filename = null;

  // Check if it's an active registered file
  const activeFileEntry = devMemoryDb.uploadedFiles.find((f: any) => f.id === sourceId || f.fileHash === sourceId);
  if (activeFileEntry && activeFileIds.has(activeFileEntry.fileHash || activeFileEntry.id)) {
    sourceIsIncluded = true;
    filename = activeFileEntry.fileName;
  }

  // 2. Identify the target source records
  const sourceRecords = tenantRecords.filter((r: any) => {
    const rId = String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || '');
    return rId === sourceId;
  });

  if (sourceRecords.length === 0) {
    throw new Error(JSON.stringify({ error: "SOURCE_NOT_FOUND", message: "Source not found or contains no records." }));
  }

  // Action Allow-List Validation
  const activeAllowed = ["PREVIEW_SOFT_DISABLE", "PREVIEW_REPLACE", "PREVIEW_ARCHIVE", "PREVIEW_PERMANENT_DELETE_BLOCKED"];
  const orphanedAllowed = ["PREVIEW_KEEP_EXCLUDED_AND_CLASSIFY", "PREVIEW_COMPARE_WITH_ACTIVE_SOURCE", "PREVIEW_PROSPECTIVE_INCLUDE", "PREVIEW_ARCHIVE", "PREVIEW_PURGE_BLOCKED"];
  
  if (sourceIsIncluded && !activeAllowed.includes(proposedAction)) {
    throw new Error(JSON.stringify({ error: "INVALID_ACTION", message: "Action not permitted for an active included source." }));
  }
  if (!sourceIsIncluded && !orphanedAllowed.includes(proposedAction)) {
    throw new Error(JSON.stringify({ error: "INVALID_ACTION", message: "Action not permitted for an orphaned/excluded source." }));
  }

  // Calculate actual date range
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';
  sourceRecords.forEach((r: any) => {
    const d = r.Invoice_Date || r.Date || r.Transaction_Date;
    if (d && d < minDate) minDate = d;
    if (d && d > maxDate) maxDate = d;
  });
  if (minDate === '9999-99-99') minDate = '';
  if (maxDate === '0000-00-00') maxDate = '';

  // Current State aggregation
  let recordCount = 0;
  let rawPartySet = new Set<string>();
  let taxableAmount = 0;
  let nonTaxableAmount = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  sourceRecords.forEach((r: any) => {
    recordCount++;
    rawPartySet.add(r.Vendor_Name || r.Entity_Name || 'Unknown');
    taxableAmount += Number(r.Taxable_Amount || 0);
    nonTaxableAmount += Number(r.Non_Taxable_Amount || r.NonTaxable_Amount || 0);
    vatAmount += Number(r.VAT_Amount || 0);
    totalAmount += Number(r.Total_Amount || r.Net_Amount || 0);
  });

  const baseResponse = {
    success: true,
    previewOnly: true,
    source: {
      sourceType: sourceIsIncluded ? "REGISTERED_INCLUDED" : "ORPHANED_EXCLUDED",
      displayIdentifier: sourceId.substring(0, 8) + '...', // Sanitized identifier
      filename: filename,
      currentLifecycleStatus: sourceIsIncluded ? "REGISTERED" : "UNREGISTERED",
      currentContributionStatus: sourceIsIncluded ? "INCLUDED_IN_CALCULATIONS" : "ORPHANED_EXCLUDED",
      actualRecordDateRange: { from: minDate, to: maxDate },
      provenance: {
        classification: sourceIsIncluded ? "REGISTERED_FILE" : "MIXED_POPULATION_UNRESOLVED_PROVENANCE",
        confidence: sourceIsIncluded ? "PROVEN" : "STRONGLY_INDICATED",
        explanationArabic: sourceIsIncluded 
          ? "ملف فعلي مدرج في التقارير" 
          : "مصدر مستبعد مختلط — يحتوي على تكرارات وسجلات فريدة قيد المراجعة"
      }
    },
    proposedAction: {
      actionType: proposedAction,
      isMutationExecuted: false,
      previewOnly: true,
      requiresApproval: true, // Any lifecycle action currently requires approval routing
      executionBlockedUntilGovernedApproval: true
    },
    currentState: {
      recordCount,
      rawPartyCount: rawPartySet.size,
      standardizedSupplierCount: null, // Hard to safely determine here without dashboard's grouping logic
      standardizedSupplierCountReason: "Requires dashboard normalization context",
      taxableAmount,
      nonTaxableExemptAmount: nonTaxableAmount,
      inputVatAmount: vatAmount,
      totalIncludingVat: totalAmount,
      includedInCurrentReports: sourceIsIncluded
    },
    projectedImpact: {
      impactMode: sourceIsIncluded ? "CURRENT_REPORT_DELTA" : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? "HYPOTHETICAL_INCLUSION_ONLY" : "CURRENT_IMPACT_ZERO_REVIEW_ONLY"),
      recordCountDelta: sourceIsIncluded ? -recordCount : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? recordCount : 0),
      standardizedSupplierCountDelta: null,
      taxableAmountDelta: sourceIsIncluded ? -taxableAmount : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? taxableAmount : 0),
      nonTaxableExemptAmountDelta: sourceIsIncluded ? -nonTaxableAmount : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? nonTaxableAmount : 0),
      totalBeforeVatDelta: sourceIsIncluded ? -(taxableAmount + nonTaxableAmount) : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? (taxableAmount + nonTaxableAmount) : 0),
      inputVatAmountDelta: sourceIsIncluded ? -vatAmount : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? vatAmount : 0),
      totalIncludingVatDelta: sourceIsIncluded ? -totalAmount : (proposedAction === "PREVIEW_PROSPECTIVE_INCLUDE" ? totalAmount : 0),
      affectedAccountingPeriods: [minDate.substring(0, 7)],
      affectedDashboardsReports: ["ExpensesDashboard"],
      journalEntryImpact: {
        status: "REQUIRES_VERIFICATION",
        summaryArabic: "يلزم التحقق من قيود اليومية المرتبطة"
      }
    },
    overlapAnalysis: null as any,
    governance: {
      riskLevel: "HIGH",
      taxSensitive: vatAmount > 0,
      retentionStatus: "UNVERIFIED",
      permanentPurgeAllowed: false,
      auditTrailRequired: true,
      approvalRoute: "ValidationReviewScreen",
      approvalReasonArabic: "الإجراء المقترح يؤثر على التقارير أو السجلات التاريخية ويلزم اعتماده من شاشة المراجعة"
    },
    uiPresentation: {
      primaryStatusArabic: sourceIsIncluded ? "ملف فعلي مدرج في التقارير" : "مصدر مستبعد مختلط — يحتوي على تكرارات وسجلات فريدة قيد المراجعة",
      warningArabic: "لا يتم تنفيذ الإجراء مباشرة; المعاينة للقراءة فقط",
      recommendedNextActionArabic: "قم بتحويل الإجراء لشاشة المراجعة لاعتماده",
      technicalDetailsCollapsedByDefault: true
    }
  };

  // Blocked Purge UI requirement
  if (proposedAction.includes("PURGE")) {
    baseResponse.uiPresentation.warningArabic = "الحذف النهائي غير متاح قبل استكمال متطلبات الاحتفاظ والموافقة.";
  }

  // 3. Multiplicity-Aware Overlap Analysis (Mandatory for Orphaned Sources)
  if (!sourceIsIncluded || proposedAction === "PREVIEW_COMPARE_WITH_ACTIVE_SOURCE") {
    // Collect all active records (excluding the target source itself if it was active)
    const activeRecords = tenantRecords.filter((r: any) => {
      const rId = String(r.fileId || r.fileHash || r.sourceFileId || r._sourceFile || '');
      return activeFileIds.has(rId) && rId !== sourceId;
    });

    const makeKey = (r: any) => [
      r.Invoice_Number || '',
      r.Entity_Name || r.Vendor_Name || '',
      r.Invoice_Date || r.Date || '',
      r.Total_Amount || 0,
      r.Taxable_Amount || 0,
      r.VAT_Amount || 0
    ].join('|');

    const activeFreq = new Map<string, any[]>();
    activeRecords.forEach((r: any) => {
      const k = makeKey(r);
      if (!activeFreq.has(k)) activeFreq.set(k, []);
      activeFreq.get(k)!.push(r);
    });

    const orphanFreq = new Map<string, any[]>();
    sourceRecords.forEach((r: any) => {
      const k = makeKey(r);
      if (!orphanFreq.has(k)) orphanFreq.set(k, []);
      orphanFreq.get(k)!.push(r);
    });

    let recordsMatchingActiveBusinessKeys = 0;
    let oneToOneMatchedPairCount = 0;
    let excessDuplicateRecordCount = 0;
    let sourceOnlyUniqueRecordCount = 0;
    let activeOnlyUniqueRecordCount = 0;

    const oneToOneMatchedFinancialTotals = { taxableAmount: 0, nonTaxableExemptAmount: 0, inputVatAmount: 0, totalIncludingVat: 0 };
    const excessDuplicateFinancialTotals = { taxableAmount: 0, nonTaxableExemptAmount: 0, inputVatAmount: 0, totalIncludingVat: 0 };
    const sourceOnlyUniqueFinancialTotals = { taxableAmount: 0, nonTaxableExemptAmount: 0, inputVatAmount: 0, totalIncludingVat: 0 };
    const activeOnlyUniqueFinancialTotals = { taxableAmount: 0, nonTaxableExemptAmount: 0, inputVatAmount: 0, totalIncludingVat: 0 };

    const addTotals = (totalsObj: any, r: any) => {
      totalsObj.taxableAmount += Number(r.Taxable_Amount || 0);
      totalsObj.nonTaxableExemptAmount += Number(r.Non_Taxable_Amount || r.NonTaxable_Amount || 0);
      totalsObj.inputVatAmount += Number(r.VAT_Amount || 0);
      totalsObj.totalIncludingVat += Number(r.Total_Amount || r.Net_Amount || 0);
    };

    // Analyze orphaned keys
    for (const [k, orphanedList] of orphanFreq.entries()) {
      const oCount = orphanedList.length;
      const aList = activeFreq.get(k) || [];
      const aCount = aList.length;

      if (aCount > 0) {
        recordsMatchingActiveBusinessKeys += oCount;
        const matched = Math.min(oCount, aCount);
        const excess = Math.max(oCount - aCount, 0);

        oneToOneMatchedPairCount += matched;
        excessDuplicateRecordCount += excess;

        for (let i = 0; i < matched; i++) addTotals(oneToOneMatchedFinancialTotals, orphanedList[i]);
        for (let i = matched; i < oCount; i++) addTotals(excessDuplicateFinancialTotals, orphanedList[i]);
      } else {
        sourceOnlyUniqueRecordCount += oCount;
        for (const r of orphanedList) addTotals(sourceOnlyUniqueFinancialTotals, r);
      }
    }

    // Analyze active-only unique keys
    for (const [k, aList] of activeFreq.entries()) {
      const aCount = aList.length;
      const oList = orphanFreq.get(k) || [];
      const oCount = oList.length;

      const activeExcess = Math.max(aCount - oCount, 0);
      if (activeExcess > 0) {
        activeOnlyUniqueRecordCount += activeExcess;
        for (let i = oCount; i < aCount; i++) addTotals(activeOnlyUniqueFinancialTotals, aList[i]);
      }
    }

    baseResponse.overlapAnalysis = {
      required: true,
      matchingHierarchyDescription: "[Invoice_Number] | [Entity_Name / Vendor_Name] | [Invoice_Date] | [Total_Amount] | [Taxable_Amount] | [VAT_Amount]",
      recordsMatchingActiveBusinessKeys,
      oneToOneMatchedPairCount,
      excessDuplicateRecordCount,
      sourceOnlyUniqueRecordCount,
      activeOnlyUniqueRecordCount,
      oneToOneMatchedFinancialTotals,
      excessDuplicateFinancialTotals,
      sourceOnlyUniqueFinancialTotals,
      activeOnlyUniqueFinancialTotals,
      duplicationRiskClassification: excessDuplicateRecordCount > 0 ? "EXCESS_DUPLICATION_DETECTED" : "STANDARD_OVERLAP",
      safeToPurge: false
    };
  }

  return baseResponse;
}
