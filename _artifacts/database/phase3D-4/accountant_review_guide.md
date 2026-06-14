# Accountant Review Guide: Phase 3D-4

## A) What Artifacts to Review
You must review the following artifacts generated in Phase 3D-3 before any database migration can proceed:
- `entity_mapping_review.csv`
- `entity_mapping_candidates.json`
- `ap_collapse_preview.csv`
- `rounding_reconciliation_report.md`
- `rounding_differences_preview.csv`
- `trial_balance_comparison.md`
- `trial_balance_comparison.csv`
- `phase3d3_summary.md`

## B) Review Order
To understand the structural changes and data mappings correctly, please review the artifacts in this exact order:
1. Read `phase3d3_summary.md` to understand the scale of the anomalies.
2. Review and complete `entity_mapping_review.csv` (this is the most critical manual task).
3. Review `ap_collapse_preview.csv`.
4. Review `rounding_reconciliation_report.md`.
5. Review `trial_balance_comparison.md`.
6. Approve or reject migration gates via the `review_gate_checklist.md`.

## C) How to Review `entity_mapping_review.csv`
This file proposes a normalization mapping for 141 distinct raw entity names across 265 distinct raw UUIDs to resolve the 1:Many duplicates.

**Columns:**
- `raw_entity_id`: The legacy UUID.
- `raw_entity_name`: The legacy vendor/customer name (e.g., "danub").
- `proposed_normalized_entity_id`: The single master UUID chosen for this vendor.
- `proposed_normalized_entity_name`: The finalized master name.
- `confidence`: 'High' (exact match), 'Medium' (fuzzy match), 'Low' (ambiguous).
- `source_count`: Number of journal entries attached.
- `total_amount`: Total financial volume associated with this raw ID.
- `sample_source_files` / `sample_invoice_numbers`: Context to help you identify the vendor.
- `review_status`: Defaults to `Pending`. **You must change this.**
- `reviewer_notes`: Blank field for your notes.

**Allowed `review_status` Values:**
- `Pending`
- `Approved`
- `Rejected`
- `Needs Investigation`

**Rules:**
- Do not approve ambiguous vendor merges blindly.
- High confidence is still only a proposal, not approval.
- Similar names can still represent different legal suppliers.
- Use `reviewer_notes` for unclear cases.

## D) How to Review AP Collapse Preview
Review `ap_collapse_preview.csv`.
- **Why:** The legacy system created 125 distinct accounts named `الموردين - [Vendor Name]`. ERP standards dictate these must be collapsed into a single `Accounts Payable` account, while tracking the vendor via `entity_id` on the individual journal lines.
- **Structural Variance:** Moving 730 journal lines from individual sub-accounts into one massive AP account drastically alters the structure of the Trial Balance.
- **Net Balance Zero:** Even though the buckets change, the total system net balance remains exactly zero.
- **Verification:** Ensure that the vendors detected in the legacy account name correctly match the proposed target entity.

## E) How to Review Rounding Differences
Review `rounding_reconciliation_report.md` and `rounding_differences_preview.csv`.
- **The Issue:** 798 records are affected by legacy floating-point drift (e.g., `31.435499999999998`). 
- **Total Difference:** The sum of all fractional drift across the entire dataset is exactly **0.2323 SAR**.
- **No Automatic Adjustment:** No automatic rounding entry has been created.
- **Your Job:** You must decide whether 0.2323 SAR over 3 years of data is immaterial. If any adjustment is later needed to balance a strict 2-decimal Trial Balance, it requires separate manual approval from you.

## F) How to Review Trial Balance Comparison
Review `trial_balance_comparison.md`.
- **Differences:** You will see a massive difference between the legacy account structure and the normalized account structure.
- **Why:** The AP collapse causes a 1.13M SAR structural variance. 125 small liability accounts are emptied, and `Accounts Payable` absorbs the entire volume.
- **How to Identify Blockers:** True blockers are differences > 0.01 SAR in accounts that are NOT part of the AP collapse or VAT Receivable metadata extraction.
- **Approval:** You must accept this structural reclassification before proceeding.

## G) Migration Gates Checklist
You must clear these gates to proceed to backend prototyping. Please use `review_gate_checklist.md` to mark them off.

- [ ] **Gate 1:** Entity mapping reviewed.
- [ ] **Gate 2:** Entity mapping `review_status` completed for all rows.
- [ ] **Gate 3:** AP collapse accepted.
- [ ] **Gate 4:** Rounding difference accepted or flagged.
- [ ] **Gate 5:** Trial Balance comparison accepted.
- [ ] **Gate 6:** Only then proceed to database/backend prototype.

## H) DO-NOT-DO Warnings
> [!WARNING]
> - Do NOT edit UUIDs carelessly in the CSV.
> - Do NOT invent `normalized_entity_id` manually unless following the agreed format.
> - Do NOT approve all rows blindly.
> - Do NOT delete rows from the CSV.
> - Do NOT change source JSON data directly.
> - Do NOT create manual accounting entries yet.
