# Consolidated Implementation Plan: Financial Decision Center & File Governance (Revised)

## 1. Executive Recommendation
The standalone `MigrationReviewDashboard` approach must be halted. It unnecessarily duplicates existing logic, splits the user experience, and scatters approval workflows. We will treat `ValidationReviewScreen.tsx` as the unified Financial Decision Center, and `FileManagement.tsx` as the existing file governance page to extend, not replace.

Furthermore, we are prioritizing **Phase B-lite (FileManagement Visibility)** as the immediate next step to solve the critical product issue where dashboards show values but the underlying uploaded files are hidden.

## 2. Governed Auto-Posting Policy
Normal operational accounting entries may be generated automatically by Fionira when based on clear approved rules, IFRS-aware accounting logic, tax compliance, auditability, and high professional accuracy. 

However, there will be no blind or unconditional accounting corrections. For structural issues like rounding adjustments:
- **Governed Policy**: "يمكن للنظام إنشاء قيد تسوية تلقائي لفروقات التقريب غير الجوهرية فقط إذا كانت داخل حدود سياسة محاسبية معتمدة مسبقًا، مع توثيق السبب والمصدر والأثر والحساب المستخدم، وإظهار القيد في مركز القرار المالي للمراجعة اللاحقة. أما الفروقات الجوهرية أو الضريبية أو غير المعتادة فتحتاج موافقة صريحة قبل إنشاء أي قيد."
- **Requirements for Auto-Posting**: Every auto-posted immaterial adjustment must include the source records, reason, amount, threshold/policy used, generated journal entry preview, audit trail, and review visibility in the Financial Decision Center.
- **Material Differences**: Any material, tax-sensitive, unusual, or high-risk differences require explicit user approval.

## 3. Implementation Phases

> [!IMPORTANT]
> **Priority Shift**
> Phase B-lite is now the highest priority to restore user trust and visibility into the data driving the dashboards. Phase A is deferred but retained for later.

### Phase B-lite: FileManagement Visibility & Safe Display Fix (Completed & Superseded)
**Status:** Completed. Superseded by the accepted Phase C governed visibility model.
**Scope Implemented:**
- Shows clear Arabic explanation for legacy/imported records lacking an active file registry entry.
- Displays actual affected record and vendor counts.
- Technical IDs are collapsed by default.
- **Constraints Maintained:** Read-only by design. Not treated as a real uploaded file. No backend/API/database changes. No source data or calculation modifications. No delete/disable/restore workflows added yet.

### Phase A: Financial Decision Center Extension (Deferred)
Once Phase B-lite is complete, `ValidationReviewScreen.tsx` will be extended to become the unified gateway for structural reviews and migration readiness checks.

**Scope:**
- Add structural/accounting-readiness observations as issue categories (e.g., `MIGRATION_VENDOR_DUPLICATE`, `MIGRATION_ROUNDING_ERROR`).
- Reuse the existing severity/risk score model (CRITICAL/HIGH/MEDIUM/LOW).
- Reuse the existing approval/escalation/override workflow.
- Keep technical details (raw JSON, exact GL Account Code conflicts, structural journal entry adjustments) under the “عرض التفاصيل الفنية” accordion for professional users.
- Present plain Arabic explanations for normal users (e.g., vendor consolidation warnings, supplier account standardization).

### Phase C: Governed File Lifecycle Management (Visibility Completed)
**Status:** Phase C1, C2 (and fixes), C3 (and fixes) are **Completed and Manually Accepted**. The backend read-model securely classifies active/orphaned files without mutations. The frontend `FileManagement.tsx` successfully separates registered included sources from orphaned historical sources, and actively blocks uncontrolled global/file-specific hard deletes. Count semantics have been safely audited and labeled.
**Future Non-Blocking UX Refinements Documented:**
- Rename disabled delete wording later if desired.
- Consider renaming the overall section to reflect both files and data sources.
- Expose actual record-date coverage separately from the uploaded filename.

### Phase C4: Governed Dry-Run Financial Impact Preview (Contract & Flow Architecture)

#### 1. Corrected Baseline (Phase C4-A2)
**Registered Included Source:**
- **Source type:** Registered contributing source.
- **Included record count:** 358.
- **Current contribution status:** `INCLUDED_IN_CALCULATIONS`.
- **Actual record-date range:** `2025-01-01` to `2025-04-15`.
- **Raw-party count:** 125 (displayed in FileManagement).
- **Dashboard standardized supplier count:** 88 (previously displayed).
- *Note:* These metrics represent different aggregation stages and must not be treated as directly comparable. Filename is descriptive only and must not determine data-period coverage.

**Orphaned / Excluded Source:**
- **Source type:** Orphaned/excluded source.
- **Excluded record count:** 752.
- **Current contribution status:** `ORPHANED_EXCLUDED` (Dashboard contribution is zero).
- **Matched orphaned records:** 716 (matched against active source business keys).
- **Orphan-only records:** 36 (requires separate review).
- **Current classification:** `MIXED POPULATION / UNRESOLVED LIFECYCLE PROVENANCE`
- **Arabic Status:** `مصدر مستبعد مختلط — يحتوي على تكرارات وسجلات فريدة قيد المراجعة`
- **Purge Status:** `NOT SAFE / NOT APPROVED`
- **Root Cause:** Existing identifier mismatch in delete logic can technically explain how records may remain after metadata deletion. This is a material governance risk.

#### 2. Governed Architecture
- **FileManagement.tsx:** Visibility and action-initiation surface only. Shows sources, statuses, and links for governed preview. Must not execute approvals.
- **ValidationReviewScreen.tsx:** Unified approval/escalation/override destination for material or calculation-affecting lifecycle actions.
- **Audit Trail:** Any later executable action must generate a documented audit log.

#### 3. Two Distinct Future Dry-Run Scenarios
**A) Active Included File Preview**
- **Applicable source:** Registered file currently included in calculations.
- **Future actions:** `PREVIEW_SOFT_DISABLE`, `PREVIEW_REPLACE`, `PREVIEW_RESTORE` (post-approval), `PREVIEW_ARCHIVE` (if excluded), `PREVIEW_PERMANENT_DELETE` (deferred exception).
- **Preview behavior:** Displays delta against current reports. Data is never mutated.
- **Mandatory impact fields:** included record count, raw-party count, standardized supplier count, taxable amount delta, non-taxable/exempt delta, input VAT delta, total including VAT delta, accounting periods, actual record dates, affected reports, journal-entry implications, tax sensitivity, risk classification, retention restriction, approval route.
- **Approval Rule:** Any calculation/tax/dashboard-impacting action routes to ValidationReviewScreen.

**B) Orphaned / Excluded Mixed Source Preview**
- **Applicable source:** Source excluded from current calculations containing mixed overlap/unique records.
- **Future actions:** `PREVIEW_KEEP_EXCLUDED_AND_CLASSIFY`, `PREVIEW_COMPARE_WITH_ACTIVE_SOURCE`, `PREVIEW_ASSOCIATE_RECOVERED_SOURCE_METADATA`, `PREVIEW_PROSPECTIVE_INCLUDE`, `PREVIEW_ARCHIVE`, `PREVIEW_PURGE` (blocked).
- **Preview behavior:** Current dashboard impact is zero. Inclusion impact labeled `أثر افتراضي في حال اعتماد الإدراج مستقبلًا`.
- **Mandatory fields:** exact-match count, probable-match count, orphan-only unique count, active-only unique count, financial totals breakdown (match/probable/unique), hypothetical inclusion totals, overlap risk classification, provenance confidence, retention safety status.

#### 4. Planned Dry-Run JSON Contract Shape
```json
{
  "success": true,
  "previewOnly": true,
  "source": {
    "sourceType": "REGISTERED_INCLUDED | ORPHANED_EXCLUDED",
    "displayIdentifier": "sanitized-only",
    "filename": "string-or-null",
    "currentLifecycleStatus": "string",
    "currentContributionStatus": "string",
    "actualRecordDateRange": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
    "provenance": {
      "classification": "string",
      "confidence": "PROVEN | STRONGLY_INDICATED | POSSIBLE | UNRESOLVED",
      "explanationArabic": "string"
    }
  },
  "proposedAction": {
    "actionType": "string",
    "isMutationExecuted": false,
    "previewOnly": true,
    "requiresApproval": true,
    "executionBlockedUntilGovernedApproval": true
  },
  "currentState": {
    "recordCount": 0,
    "rawPartyCount": 0,
    "standardizedSupplierCount": null,
    "standardizedSupplierCountReason": "string-or-null",
    "taxableAmount": 0,
    "nonTaxableExemptAmount": 0,
    "inputVatAmount": 0,
    "totalIncludingVat": 0,
    "includedInCurrentReports": true
  },
  "projectedImpact": {
    "impactMode": "CURRENT_REPORT_DELTA | HYPOTHETICAL_INCLUSION_ONLY | CURRENT_IMPACT_ZERO_REVIEW_ONLY",
    "recordCountDelta": 0,
    "standardizedSupplierCountDelta": null,
    "taxableAmountDelta": 0,
    "nonTaxableExemptAmountDelta": 0,
    "inputVatAmountDelta": 0,
    "totalIncludingVatDelta": 0,
    "affectedAccountingPeriods": [],
    "affectedDashboardsReports": [],
    "journalEntryImpact": {
      "status": "IDENTIFIED | NONE_FOUND | REQUIRES_VERIFICATION",
      "summaryArabic": "string"
    }
  },
  "overlapAnalysis": {
    "required": true,
    "matchingHierarchyDescription": "string",
    "recordsMatchingActiveBusinessKeys": 0,
    "oneToOneMatchedPairCount": 0,
    "excessDuplicateRecordCount": 0,
    "sourceOnlyUniqueRecordCount": 0,
    "activeOnlyUniqueRecordCount": 0,
    "oneToOneMatchedFinancialTotals": {
      "taxableAmount": 0,
      "nonTaxableExemptAmount": 0,
      "inputVatAmount": 0,
      "totalIncludingVat": 0
    },
    "excessDuplicateFinancialTotals": {
      "taxableAmount": 0,
      "nonTaxableExemptAmount": 0,
      "inputVatAmount": 0,
      "totalIncludingVat": 0
    },
    "sourceOnlyUniqueFinancialTotals": {
      "taxableAmount": 0,
      "nonTaxableExemptAmount": 0,
      "inputVatAmount": 0,
      "totalIncludingVat": 0
    },
    "activeOnlyUniqueFinancialTotals": {
      "taxableAmount": 0,
      "nonTaxableExemptAmount": 0,
      "inputVatAmount": 0,
      "totalIncludingVat": 0
    },
    "duplicationRiskClassification": "string",
    "safeToPurge": false
  },
  "governance": {
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "taxSensitive": true,
    "retentionStatus": "UNVERIFIED | RETENTION_REQUIRED | ELIGIBLE_AFTER_APPROVAL",
    "permanentPurgeAllowed": false,
    "auditTrailRequired": true,
    "approvalRoute": "ValidationReviewScreen",
    "approvalReasonArabic": "string"
  },
  "uiPresentation": {
    "primaryStatusArabic": "string",
    "warningArabic": "string",
    "recommendedNextActionArabic": "string",
    "technicalDetailsCollapsedByDefault": true
  }
}
```
*Rules: `overlapAnalysis` mandatory for excluded sources. `previewOnly` must be true. No purge without verified retention.*

#### 5. Future UX Flow
1. **FileManagement Visibility:** View sources. Select preview action (`معاينة أثر استبعاد الملف`, `مراجعة السجلات المستبعدة`).
2. **Read-Only Preview:** UI displays generated dry-run contract, showing projected financial effect and duplication/overlap.
3. **Approval Routing:** If calculations/tax/retention are affected, routes to `ValidationReviewScreen.tsx`. FileManagement does not approve.
4. **Governed Execution:** Handled only in separately approved future phases.

#### 6. Future User-Facing Wording Requirements
- **Registered included source:** `ملف فعلي مدرج في التقارير`, `نطاق البيانات الفعلي: من [date] إلى [date]`, `معاينة أثر الإجراء قبل التنفيذ`.
- **Orphaned mixed source:** `مصدر مستبعد مختلط — يحتوي على تكرارات وسجلات فريدة قيد المراجعة`. `لا تؤثر هذه البيانات على التقارير الحالية. يلزم تحليل التكرارات والسجلات الفريدة قبل اتخاذ أي إجراء.`
- **Purge/delete:** `الحذف النهائي غير متاح قبل استكمال متطلبات الاحتفاظ والموافقة.`
- **Date coverage:** Show actual date-range separately from filename.

#### 7. Phase C4 Implementation Order
- **C4-B:** Contract and UX flow planning (Current Phase).
- **C4-C:** Read-only dry-run preview contract/API (Separately approved).
- **C4-D:** Read-only preview UI and approval routing (Separately approved).
- **C4-E:** Governed soft-disable and restore (Separately approved).
- **C4-F:** Replacement/archive workflows (Separately approved).
- **Permanent delete/purge:** Deferred indefinitely.

#### 8. Existing Delete-Risk Prerequisite
Existing delete behavior is not approved. Identifier mismatch between file metadata IDs and record source identifiers presents a material orphan-record risk. No execution may reuse existing hard-delete behavior without a separately approved security/data-integrity redesign. Visible controls remain disabled.

*(Note: This is a plan clarification only. No Phase C code has been implemented yet.)*

## 4. Why Standalone MigrationReviewDashboard Should Be Stopped
Creating a separate page requires duplicating the data grid, the severity models, risk scoring, manual edits, escalation logic, and audit trails. This fractures the codebase and violates the principle of a unified decision layer.

## 5. Files Likely Involved Later
- **Phase C**: `src/modules/FileManagement.tsx`, File API endpoints, `src/lib/active-file-registry.ts`.
- **Phase A**: `src/modules/ValidationReviewScreen.tsx`.

## 6. Files Forbidden For Now
- Any Database/PostgreSQL connection code.
- Backend routing (`server.ts`).
- Production data processing pipelines, calculations, or auto-posting implementations.

## 7. Risks
- **Data Integrity during Phase C**: Transitioning from hard-delete to soft-disable requires careful backend coordination to ensure excluded files truly do not pollute ledger calculations while remaining accessible for restoration.

## 8. Recommended Next Phase
Wait for user approval to proceed with either **Phase C (Governed File Lifecycle Management)** or **Phase A (Financial Decision Center Extension)**. No code changes for these phases have been implemented yet.
