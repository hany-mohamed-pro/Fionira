# Incident Audit Report: Current Baseline and Lifecycle Transition Audit

> **Document Phase**: AG-STATE-INTEGRITY-GATE-00 — Read-Only Lifecycle Transition Timeline, Current Authoritative Baseline, and Non-Active Contribution Incident Audit  
> **Date**: 2026-06-01  
> **Status**: COMPLETED — Awaiting Review  
> **Classification**: Governance Restricted  

---

> [!IMPORTANT]
> This is a **read-only incident audit document**. It does not perform, authorise, or design any remediation, cleanup, migration, code changes, or database modifications. All modifications are strictly prohibited.

---

## 1. Purpose and Strict Read-Only Scope

This audit report was commissioned following the identification of discrepancies in the purchases file active/staged counts and record totals within the Antigravity workspace. The scope of this phase is strictly read-only and is limited to:
* Establishing the factual state of persisted files in the registry.
* Verifying the current authoritative report-contribution baseline.
* Constructing a transition timeline for the active file entries.
* Quantifying the contribution risk of archived file entries (including the Copy file).
* Checking the persistence and status of staged items and legacy governance requests.

---

## 2. Previously Accepted Baseline

The baseline previously accepted during architectural alignment consisted of:
* **Active source file**: `مشتريات الفترة من يناير وحتى مارس 2025.xlsx`
* **Report-contributing record count**: 358 records
* **Accepted financial totals**:
  * Total before VAT: `245,895.15 ر.س`
  * Input VAT: `35,251.16 ر.س`
  * Total including VAT: `281,146.31 ر.س`

---

## 3. Sanitized Current Persisted File-State Summary

A read-only inspection of the file registry (`uploads.json`) reveals:
* **Active files**: Exactly **1** active source file is registered as processed and not deleted:
  * File name: `مشتريات الفترة من يناير وحتى مارس 2025.xlsx` (ID: `[374-Record-File-ID]`) with `recordCount: 374`.
* **Archived/deleted files**: All other real file entries are registered with `"status": "archived"` and `"isDeleted": true`. This includes:
  * The original `358-record` file entry of the same name.
  * Both upload entries for the Copy file (`مشتريات الفترة من يناير وحتى مارس 2026 - Copy.xlsx`).
  * Other historical uploads and development stubs.

---

## 4. Sanitized Current Authoritative Report Baseline

By evaluating records through the application's active-source resolver and report contribution path (filtering records in `erp_registry.json` against the active registry files), the current authoritative report totals are:
* **Contributing files**: **1** active file (the registered 374-record file).
* **Contributing records**: **374** records.
* **Totals**:
  * Taxable Amount (Before VAT): `238,914.68 ر.س`
  * Non-Taxable Amount: `10,887.42 ر.س`
  * Total Before VAT: `249,802.10 ر.س`
  * Input VAT: `35,837.20 ر.س`
  * Total Including VAT: `285,639.31 ر.س`
* **VAT Arithmetic**: `249,802.10 + 35,837.20 = 285,639.30 ر.س` (a rounding discrepancy of `0.01 ر.س` exists in raw currency calculations).

Compared to the previously accepted baseline, report totals have increased due to the active file registration containing 374 records instead of 358.

---

## 5. Previously Accepted 358-Record Source Current Status

The original `358-record` file (`[358-Record-File-ID]`) is currently persisted in `uploads.json` with:
* `"status": "archived"`
* `"isDeleted": true`
* `"deletedAt": "2026-05-31T16:57:20.921Z"`

Its records in `records` and journal entries in `journalEntries` are inactive and no longer contribute to live report calculations.

---

## 6. 374-Record Source Transition Timeline and Attribution

A forensic analysis of the audit logs (`registry.auditLogs`) establishes the following chronological timeline on **2026-05-31**:
1. **16:54:17**: Activation of a second Copy file (`[Copy-File-ID-2]`) occurred under user ID `[User-Profile-ID]`.
2. **16:54:56**: Archive of the first Copy file (`[Copy-File-ID-1]`) was performed under user ID `[User-Profile-ID]`.
3. **16:57:20**: The 358-record baseline file (`[358-Record-File-ID]`) was deleted/archived.
4. **16:57:25**: A new version of the 2025 file with 374 records (`[374-Record-File-ID-1]`) was uploaded and registered as a replacement for the 358-record file under user ID `[User-Profile-ID]`.
5. **16:57:54**: Archive of the second Copy file (`[Copy-File-ID-2]`) was performed under user ID `[User-Profile-ID]`.
6. **16:57:55**: Archive of the first 374-record file (`[374-Record-File-ID-1]`) occurred under user ID `[User-Profile-ID]`.
7. **16:58:26**: Activation of the current active 374-record file (`[374-Record-File-ID-2]`) was executed from staging under user ID `[User-Profile-ID]`.

**Attribution Confidence**: High. All events are recorded with the user profile ID `[User-Profile-ID]`, corresponding to the logged-in user in this workspace. The changes occurred during manual interface testing of the Purchases File Lifecycle UI.

---

## 7. Copy-File Current Status and Report-Contribution Finding

* **Registry status**: Both Copy file entries are persisted as `"status": "archived"` and `"isDeleted": true`.
* **Report-contribution status**: Exactly **0** records in the registry associated with the Copy file hashes contribute to active reports.
* **Risk assessment**: Low. The Copy file is fully excluded from report contribution and does not affect financial totals. Its visible presence in the UI as active is a representation/cache issue in the frontend component, not a data-state leak.

---

## 8. Staged-Item Staging / Transition Finding

* **Disappearance of Staged Files**: 
  * The 374-record staged file was activated and is now persisted as the active file.
  * The 341-record staged file (`مشتريات الفترة من أبريل وحتى يونيو 2025.xlsx`) was a transient upload in memory and is not found in the persistent `candidateReplacements` database, confirming it was not saved to disk or was cleaned up during server reload.
* **Current staging**: Only **1** test entry remains in the persistent `candidateReplacements` collection.

---

## 9. Legacy Governance Request Status

* The approved-but-unexecuted soft-disable governance request (ID: `[Governance-Request-ID]`) remains **unexecuted** and has not triggered any state change.
* Its historical reference field (`fileId` pointing to the 358-record file hash) remains **unmodified**, preserving audit trail integrity.

---

## 10. Document Package Status and Summary Findings

1. **Suspected unauthorized transitions**: No. All data transitions are accounted for by audit log entries logged under the workspace user profile.
2. **Factual Baseline discrepancy**: The AG-01 design documents were drafted based on a conceptual 358-record baseline. Since the database now has a 374-record active file, the AG-01 documents require a revised factual baseline in their descriptions to match the true database state before they can be approved.
3. **Approval block**: The AG-01 documents should remain blocked until the user aligns on the target baseline (whether to keep the 374-record file or restore the 358-record file).

---

## 11. Explicit Non-Remediation Statement

> [!CAUTION]
> No code changes, data restoration, cleanup, or lifecycle executions have been performed. The implementation freeze remains in full force.
