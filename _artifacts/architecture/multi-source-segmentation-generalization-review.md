# Architectural Review — Is Bank Multi-Account Segmentation a Generalizable Pattern?

**Date:** 2026-06-22
**Type:** Read-only design review. **No code changed.**
**Builds on:** `b0df476` (branchId dimension + bank account-aware segmentation).

## Verdict (one line)
**The "multiple independent sources" need is real and recurs — but it is already
served by `branchId`. The bank *never-merge* machinery is tied to one specific
property — a stateful RUNNING BALANCE — which today exists ONLY in banks. Do not
abstract it now; do not retrofit the working bank code. `branchId` is the
sufficient generalization for today's evidence.**

---

## The crucial distinction this review surfaced

Today's bank work conflates two things that must be separated:

- **"Multiple independent sources"** (multi-store revenue, multi-entity payroll):
  these are **additive flows**. Summing their totals is *correct and desired*
  (consolidated P&L). What they need is **segmentation / filtering** — which is
  exactly what `branchId` provides. They do **not** need a never-merge guard.

- **The bank "never-merge" rule** is not really about "multiple sources." It
  protects a **RUNNING BALANCE** — a stateful, order-dependent, sequential
  quantity (opening → ±movement → closing, with continuity). Interleaving two
  independent balance sequences is meaningless (proven live in `61347e8`:
  merging produced a false "فرق 1,253"). This property — not "multiplicity" — is
  what makes segmentation *mandatory* rather than merely *nice*.

So the right question is narrower than the prompt's framing: **which other
modules carry a stateful running-balance/sequence per source?** — not merely
"which have multiple sources."

---

## TASK 1 — Concrete per-module assessment

### A) Payroll — multiple legal entities / independent runs
- **Plausible?** Real-ish: a KSA group with several commercial registrations
  (CRs) files separate payroll/GOSI/WPS per establishment. But in Fionira's model
  a separate legal entity is usually a separate **tenant**, so multi-entity
  payroll *within one tenant* is the less-common case.
- **Additive or stateful?** **Additive.** Consolidated payroll expense = Σ across
  entities is valid. There is no running balance. Only per-entity GOSI/WPS
  *compliance reporting* must stay separable — that is a **filter** (branchId /
  establishment id), not a never-merge ledger.
- **Identity field:** establishment / employer (CR or GOSI number).
- **Conclusion:** served by `branchId`-style segmentation; **not** a bank-style
  never-merge case.

### B) Expenses / Revenues — multiple stores / POS / channels
- **Plausible?** Yes, common — and concretely present in this tenant's own files
  (`تقرير مبيعات المعارض اليومي`, `مبيعات التطبيقات`, per-quarter مبيعات/مشتريات).
  A retailer with multiple branches/channels has independent sales/purchase
  sources.
- **Additive or stateful?** **Additive.** Total revenue/expense = Σ across
  stores/channels is the whole point of consolidated reporting. Records are
  invoice-level (Taxable/VAT/Total); there is **no running balance**.
- **Identity field:** store / branch / channel.
- **Conclusion:** the genuine need here is **segmentation by branch/channel** =
  `branchId` (already built, rollout documented). Merging is *not* wrong, so the
  never-merge mechanism does not apply.

### C) Inventory / warehouses
- **Plausible?** Multi-warehouse is plausible, and stock-on-hand per warehouse is
  *conceptually* stateful — making it the **only structural analog** of the bank
  running balance.
- **But as modeled today?** `inventory-processor.ts` produces a **flat valuation
  snapshot** (`Quantity` + value per item, additive total) — **no perpetual stock
  ledger, no running quantity-on-hand, no location field**, and the module is
  effectively unused. So the never-merge analog is real *only if* inventory is
  re-modeled as a perpetual movement ledger — **speculative today**.
- **Identity field (if/when built):** warehouse / location id.
- **Conclusion:** a *potential future* analog, not a current one.

### Other (noted): Statement of Account
A/R–A/P statements (`StatementOfAccount.tsx`) carry a running balance per
customer/vendor — but they are **inherently segmented by entity** already, so the
never-merge concern is structurally auto-satisfied; no shared machinery needed.

---

## TASK 2 / 3 — Generalize, or leave as-is?

**The never-merge mechanism has exactly ONE real instance today (banks), and one
purely theoretical future candidate (perpetual inventory) that isn't built.** One
instance is not enough to justify abstraction. Per the project's evidence-based
standard (cf. Trial Balance "sound, no fix needed"), this is a **Task 3 outcome**
for the never-merge machinery:

- **Keep the bank multi-account code exactly as it is** — proven, tested, live-
  verified (`b0df476`: 2 accounts → 2× مطابق ✓, no merge; single account
  regression intact). Do **not** retrofit it into a speculative abstraction.
- **`branchId` is the genuinely reusable system-wide piece** and already covers
  the real recurring need (multi-store/channel/entity *segmentation* of additive
  flows). That is sufficient generalization for today's evidence.

**Future-ready sketch (do NOT build now)** — *if and when* a second stateful-
balance module appears (most likely perpetual inventory per warehouse), extract a
thin shared helper at that point, applying it to the **new** module and leaving
bank code untouched:
- `SourceIdentity { kind: 'bank'|'warehouse'|…; key: string; label?: string }` —
  identity **extraction stays module-specific** (bank: preamble account number;
  warehouse: location column).
- A shared `segmentBySource(records, keyOf)` + per-segment running-balance/
  continuity computation — the only genuinely shareable logic.
- Retrofitting banks would be **pure risk on tested financial code for zero
  present benefit** → defer until there is a second consumer.

---

## TASK 4 — Honest architectural verdict

**(a) — Today's bank-account segmentation is effectively a one-off**, correctly
specific to the running-balance reconciliation that only banks have. The broader
"multiple independent sources" concern that *is* real elsewhere
(stores/channels/entities) is **already addressed by `branchId`**, because those
flows are additive and need filtering, not a never-merge guard.

**Recommendation:**
1. Leave the bank multi-account code unchanged.
2. Treat `branchId` as the system-wide segmentation dimension; roll it out to
   expenses/revenues/payroll per the documented path when prioritized.
3. Only revisit a shared "stateful-balance segmentation" abstraction **if/when** a
   perpetual-inventory (or similar running-quantity) module is actually built —
   scope it then as its own task against that new module, not as a retrofit.

## Success criteria
✅ Each module assessed concretely (payroll / expenses-revenues / inventory / statement-of-account)
✅ Honest verdict — no manufactured abstraction; distinguishes additive-flow vs running-balance
✅ Bank code explicitly left untouched; `branchId` confirmed as the sufficient generalization today
✅ Future abstraction sketched but explicitly deferred (retrofit-later, only on a second real consumer)
