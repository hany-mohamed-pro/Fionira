# Intelligence Engine Audit — Classification Reality vs Vision

> **Read-only fact-finding. No code/SQL changed.** Every claim cites file:line.
> **Generated:** 2026-06-16 · **Base commit:** `01e6e19`

---

## Bottom line (one sentence)
Today's account classification is **rule-based** (Arabic keyword scoring + static module→account mapping); the `financial-intelligence/` engine is a separate **rule-based anomaly/risk layer that does not assign accounts**, and the only AI in the product (Gemini) is used **solely in the frontend** for invoice/quotation text generation — **not** in the Excel-classification pipeline. The "AI-driven IFRS/ZATCA classification" is currently a **vision, not yet implemented** in the account-assignment step.

---

## TASK 1 — `src/backend/core/financial-intelligence/` mapped (per file)

| File | A) What it does | B) AI or rule-based | C) Feeds account assignment? | 
|---|---|---|---|
| `intelligence-engine.ts` | `analyzeFinancialData` runs 5 rules → `insights[]` + `riskScore` per record ([:20-67](../../src/backend/core/financial-intelligence/intelligence-engine.ts)) | **Rule-based** (orchestrates if/else rules) | **No** — outputs risk/insights for validation, not accounts |
| `domain-orchestrator.ts` | `routeToDomainIntelligence` switches on moduleType → domain analyzer ([:9-29](../../src/backend/core/financial-intelligence/domain-orchestrator.ts)) | Rule-based router | No |
| `domains/expenses-intelligence-engine.ts` | `analyzeExpenses` → `IntelligenceResult[]` (insights + riskScore) ([:5-129](../../src/backend/core/financial-intelligence/domains/expenses-intelligence-engine.ts)) | Rule-based | No |
| `domains/revenues-intelligence-engine.ts` | `analyzeRevenues` (same pattern) | Rule-based | No |
| `domains/payroll-intelligence-engine.ts` | `analyzePayroll` | Rule-based | No |
| `domains/bank-intelligence-engine.ts` | `analyzeBanks` | Rule-based | No |
| `domains/inventory-intelligence-engine.ts` | `analyzeInventory` | Rule-based | No |
| `models.ts` | Types: `Insight`, `IntelligenceResult{record,insights,riskScore}`, `VendorProfile`, `IntelligenceRule` ([:3-39](../../src/backend/core/financial-intelligence/models.ts)) | n/a (types) | No |
| `rules/fuzzy-duplicate.ts` | `fuzzyDuplicateRule` → `POTENTIAL_DUPLICATE` ([:4,38](../../src/backend/core/financial-intelligence/rules/fuzzy-duplicate.ts)) | Rule-based (fuzzy match) | No |
| `rules/behavioral-anomaly.ts` | `NEW_VENDOR_HIGH_VALUE`, `ANOMALY_HIGH_AMOUNT`, `ANOMALY_STATISTICAL_OUTLIER` ([:16,31,46](../../src/backend/core/financial-intelligence/rules/behavioral-anomaly.ts)) | Rule-based (statistical) | No |
| `rules/math-consistency.ts` | `MINOR_ROUNDING_ISSUE`, `MATH_INCONSISTENCY` ([:20,30](../../src/backend/core/financial-intelligence/rules/math-consistency.ts)) | Rule-based | No |
| `rules/smart-tax.ts` | `VAT_WITHOUT_BASE`, `MISSING_EXPECTED_VAT` ([:15,36](../../src/backend/core/financial-intelligence/rules/smart-tax.ts)) | Rule-based (VAT sanity) | No |
| `rules/temporal-intelligence.ts` | `FUTURE_DATE`, `EXTREME_BACKDATE` ([:16,31](../../src/backend/core/financial-intelligence/rules/temporal-intelligence.ts)) | Rule-based | No |
| `vendor-profiler.ts` | `buildVendorProfiles` → avg/variance/stdDev per vendor ([models.ts:18-28](../../src/backend/core/financial-intelligence/models.ts)) | Rule-based (statistics) | No (feeds anomaly rules) |

**A–C summary:** the whole directory is a **rule-based anomaly / data-quality / risk-scoring layer**. A directory-wide search for `debitAccount`/`creditAccount`/`account`/`classif`/`category` returns **0 matches** — it never touches account assignment. No `@google/genai`, `gemini`, `generateContent`, or embeddings anywhere in it.

**D) The functions that actually decide the account name** (outside this directory):
- `categorization-engine.ts` → `getExpenseCategory(name, desc, amount)` ([:42](../../src/backend/core/categorization-engine.ts)), `getRevenueCategory(...)` ([:422](../../src/backend/core/categorization-engine.ts)), `getPayrollCategory(...)` — rule-based: Arabic normalization ([:45-52](../../src/backend/core/categorization-engine.ts)), regex override layer ([:68-77](../../src/backend/core/categorization-engine.ts)), keyword scoring ([:230, 380](../../src/backend/core/categorization-engine.ts)) → returns an Arabic **category string**.
- `erp-engine.ts` → `generateJournalEntries` turns that category + a static counterparty into `debitAccount`/`creditAccount` ([:112-143](../../src/backend/core/erp-engine.ts)).

---

## TASK 2 — End-to-end data flow (numbered pipeline)

1. **Excel upload** → staged-upload route → module processor (e.g. `expenses-processor.ts`).
2. **Categorization (rule-based)** — `expenses-processor.ts:175` calls `getExpenseCategory(finalEntity, rawDesc, total)` → writes `Category: category` onto the record ([expenses-processor.ts:196](../../src/backend/core/processors/expenses-processor.ts)). Revenues/payroll do the same via `getRevenueCategory`/`getPayrollCategory` ([revenues-processor.ts:195](../../src/backend/core/processors/revenues-processor.ts), [payroll-processor.ts:165](../../src/backend/core/processors/payroll-processor.ts)). **Banks & inventory use STATIC categories** (`'سحب بنكي'`/`'إيداع بنكي'` [bank-processor.ts:150](../../src/backend/core/processors/bank-processor.ts); `'مخزون بضاعة'` [inventory-processor.ts:128](../../src/backend/core/processors/inventory-processor.ts)).
3. **Anomaly/risk analysis (separate, parallel)** — `analyzeFinancialData` / `routeToDomainIntelligence` produce `insights` + `riskScore` for the validation/governance review screen. **This output does NOT feed account assignment** — it's the quality/risk lane.
4. **Account assignment** — `erp-engine.generateJournalEntries(records, moduleType)` ([:40](../../src/backend/core/erp-engine.ts)):
   - **expenses:** `debitAccount = category` (rule-based), `creditAccount = 'الموردين - {entity}'` (static) ([:116-117](../../src/backend/core/erp-engine.ts))
   - **revenues:** `debitAccount = 'العملاء - {entity}'` (static), `creditAccount = category` ([:119-120](../../src/backend/core/erp-engine.ts))
   - **payroll / banks / inventory:** fixed account names ([:85-138](../../src/backend/core/erp-engine.ts))
5. **Journal entry created** with the assigned debit/credit names ([erp-engine.ts:143](../../src/backend/core/erp-engine.ts)).

**Is account assignment AI, rules, static, or combination? → (d) Combination:**
- **(b) Rule-based keyword/category matching** for the P&L side (expense/revenue account) — `categorization-engine.ts`.
- **(c) Static module→fixed-account mapping** for the counterparty side (Suppliers/Customers/Bank/Capital) and for banks/inventory/payroll accounts — `erp-engine.ts`.
- **(a) AI/ML classification: none** in this pipeline.

---

## TASK 3 — IFRS / SOCPA / ZATCA alignment evidence

Searched the codebase (`*.ts/tsx`) for `SOCPA|IFRS|GAAP|ZATCA|chart of accounts|دليل الحسابات|account numbering`:

| Looked for | Found? | Evidence |
|---|---|---|
| **SOCPA** | ❌ None | 0 matches |
| **IFRS** | ❌ None | 0 matches |
| **GAAP** | ❌ None | 0 matches |
| **ZATCA** | ⚠️ UI text only | "compliant with ZATCA" label ([App.tsx:2122](../../src/App.tsx)); tax-declaration disclaimer ([TaxDeclaration.tsx:121](../../src/modules/TaxDeclaration.tsx)). **No ZATCA classification rules** beyond VAT-rate math / VAT sanity checks (`smart-tax.ts`). |
| **Chart of accounts** | ⚠️ Label only | `دليل الحسابات` / "Auto Chart of Accounts" are **UI labels** ([App.tsx:2108, 2132](../../src/App.tsx), [ui-text.ts:29,50](../../src/i18n/ui-text.ts)). It's an auto-grouping of the rule-based category names — **not** a standard coded CoA. |
| **Account-numbering scheme** (1000s=assets, 4000s=revenue) | ❌ None | Accounts are **free-text Arabic name strings**; no codes anywhere. |
| **Config file of standard account categories** | ❌ None | Categories are **hardcoded keyword rules** inside `categorization-engine.ts`; no external taxonomy/config. |

**Conclusion:** there is **no IFRS/SOCPA/GAAP alignment** and **no standards-coded chart of accounts**. ZATCA appears only as UI copy + VAT-rate arithmetic. The "chart of accounts" is the emergent set of Arabic category strings the keyword engine produces.

---

## TASK 4 — Plain findings

### 1. Does true AI-driven classification exist today?
**No.** Account classification is **rule-based** (keyword scoring + regex overrides in `categorization-engine.ts`, plus static counterparty mapping in `erp-engine.ts`). The only AI in the product — Gemini via `@google/genai` — runs **only in the frontend** for **invoice/quotation generation** ([SmartInvoice.tsx:2,240,266](../../src/modules/SmartInvoice.tsx), [QuotationManager.tsx:10,225,238](../../src/modules/QuotationManager.tsx)), **not** for classifying uploaded Excel data. The AI-driven-classification vision is **not yet implemented** in the account-assignment step.

### 2. Real intelligence vs static mapping (partial breakdown)
- **Genuinely "smart" (but rule-based, not AI):**
  - The **anomaly/risk engine** (`financial-intelligence/`): fuzzy-duplicate, behavioral-statistical, math-consistency, smart-tax (VAT sanity), temporal anomalies, vendor profiling. Non-trivial, but deterministic rules — and **decoupled from account assignment** (it scores quality/risk only).
  - The **keyword categorizer** (`categorization-engine.ts`): multi-stage Arabic normalization + regex overrides + weighted keyword scoring. Real logic, still rules.
- **Static mapping:**
  - Counterparty accounts (Suppliers/Customers/Bank/Capital) and payroll/bank/inventory accounts in `erp-engine.ts` (module → fixed Arabic name).
  - Bank/inventory `Category` itself (hardcoded in their processors).
- **AI/ML in classification:** **none.**

### 3. Scope outline to reach the stated vision (IFRS/SOCPA/ZATCA auto-classification)
*(Outline only — no effort estimate, no implementation proposed.)*
- **A standards-coded Chart of Accounts** (SOCPA/IFRS-aligned account codes + types) to replace free-text Arabic names — ties into the Phase C1 `journal_entries` work (account-id-based lines).
- **A classification layer** that maps each line to a standard account with a **confidence score** — could be ML/LLM-assisted and/or an expanded rules+taxonomy engine (current keyword engine becomes one signal, not the whole answer).
- **ZATCA tax-treatment classification beyond VAT rate** — zero-rated / exempt / out-of-scope / reverse-charge determination (today only VAT-rate math + sanity flags exist).
- **An externalized taxonomy/config** for categories and account mappings (today hardcoded in `categorization-engine.ts`).
- **Accountant-in-the-loop review** for low-confidence classifications — the governance/validation layer (`ValidationReviewScreen`, the insight/risk engine) already exists and would be the natural place to surface classification confidence.
- **Account-id journal model** (normalized) — the inverse of the Phase C1 denormalized mirror; a later, separately-approved accounting redesign.

---

## What this audit does NOT do
- No recommendation on *whether* to build the AI classifier, no effort estimate, no implementation. Fact-finding only.
- The **Accounting Bundle remains blocked**; this audit informs its direction but does not start it.
