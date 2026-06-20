# Engine Fix — Track 1: Context-Aware Tokenization

**Goal:** resolve the 7 keyword-collision / vendor-bleed debt items (D1, D3, D4, D5, D6, D8, D9).
**Outcome:** **6 of 7 fully resolved**; **D5 improved** (no longer wrong) with its full fix deferred to a
new item (D13). **Zero regression** on the 730 real records and all 5 synthetic fixtures.

This is the first change to `categorization-engine.ts` since the Stage-3 hardening (commit `2e6349a`).

---

## STEP 1 — baseline + root-cause (read-only)

Captured before-state for **795 rows** (730 real + 65 synthetic) and the 7 debt targets. Tracing each
case in code revealed the debt log's diagnosis was incomplete — there is a **third, deeper root** it did
not anticipate:

> **The Arabic definite article "ال" (and attached prepositions لـ/بـ) break word-boundary matching.**
> `التدقيق` ≠ `تدقيق`, `المورد` ≠ `مورد`, `للبضاعة` ≠ `بضاعة`. This directly causes D5 (professional
> never fires) and the D8a mis-route, and likely many silent misses.

Per the "STOP if you find a safer path / unanticipated risk" instruction, this was surfaced and two
decisions were taken with the user:
1. **Surgical guards**, not a global `allText→descText` refactor (lowest regression risk).
2. **Defer the "ال" prefix root** (D13) to its own session — it is systemic and high-risk.

## STEP 2 — mechanism (surgical guards, built on the existing 5 stages)

| Fix | Mechanism |
|---|---|
| Vendor-bleed (D9, +D5) | New `descOnly` flag: generic-location rent words (`مكتب/مستودع/محل`, office/warehouse/shop) match the **item description only**, never the vendor name |
| D1 | Removed `كهرباء` (electrical-repair sense) from the maintenance keyword → utility bill wins |
| D3 | Taught `REGEX_STATIONERY` the document-printing phrases (`طباعة تقارير/مستندات/عقود/فواتير`) → stationery override fires and suppresses the packaging override |
| D4 | New travel-allowance branch (`بدل إقامة/سفر/انتقالات/مبيت/تذاكر`) placed **before** the salary branch in the personnel chain |
| D6 | Professional-fees override suppressed when a salary word (`راتب/رواتب/مرتب/أجور`) is present |
| D8 | Added explicit inbound phrases (`شحن وارد/نقل وارد/شحنة واردة/بضاعة واردة`) and raised the inbound-freight score 600→850 so inbound beats the generic raw-materials tie |

`nrx`/`nTest` normalization from Stages 0–2 (commits `17a598f`/`2e6349a`) was **built on, not undone**.

## STEP 3 — incremental results (one fix, full regression after each)

Every step re-ran the full 795-row baseline diff. **Real-730 changed = 0 after every single step.** The
only changes were the intended target records inside the synthetic fixtures.

| # | Before | After | real-730 regression | Status |
|---|---|---|---|---|
| D9 | إيجارات | تكلفة المبيعات - مواد خام (COGS) | 0 | ✅ resolved |
| D1 | صيانة وإصلاح | منافع (كهرباء ومياه) | 0 | ✅ resolved |
| D3 | مواد تعبئة وتغليف | قرطاسية ومطبوعات | 0 | ✅ resolved |
| D4 | رواتب وأجور | مصاريف سفر وانتقالات | 0 | ✅ resolved |
| D6 | أتعاب مهنية واستشارات | رواتب وأجور | 0 | ✅ resolved |
| D8a | نقل وتوصيل للعملاء (outbound) | شحن ونقل للداخل | 0 | ✅ resolved |
| D8b | مواد خام ومكونات | شحن ونقل للداخل | 0 | ✅ resolved |
| D5 | إيجارات | أخرى (no longer wrong rent) | 0 | ⚠️ partial — full fix needs D13 |

## STEP 4 — final comprehensive verification

1. **730 real records:** 0 changes vs baseline (proven by per-record key diff, not assumed).
2. **5 synthetic fixtures:** the only changes were the 10 intended target records (D1×3 utility bills,
   D3, D4, D5, D6, D8a, D8b, D9). No collateral.
3. **Activity-layer non-interference (the cross-rule test from Phases 3–5):** insight-type counts are
   identical to before — manufacturing `tools2+transport2`, professional `link6`, retail
   `packaging3+shrinkage2`, contracting `projectcost6+labor2`. The engine change did not disturb the
   activity rules (they were not touched).
4. **D8 shipping consistency:** four inbound phrasings all route to `شحن ونقل للداخل`; an outbound
   phrasing (`شحن طلبية للعملاء`) correctly stays `نقل وتوصيل للعملاء`. Consistent.

`npx tsc --noEmit` → exit 0.

## STEP 5 — honest report

- **6 of 7 debt items fully resolved** (D1, D3, D4, D6, D8, D9), each verified individually with zero
  real-data regression.
- **D5 could NOT be cleanly fully fixed** in this track. The surgical vendor-bleed guard stops it being
  mis-routed to إيجارات (now "أخرى"), but reaching the expected *professional* category requires
  matching `التدقيق` → `تدقيق`, which is the deferred **D13** "ال"-prefix root. Stated plainly rather
  than forced.
- **New debt D13** logged: the Arabic "ال"/attached-preposition prefix breaks word-boundary matching —
  systemic, high-risk, deferred to its own session.
- **D2, D7, D10, D11, D12 left untouched** (other tracks).

## Net debt movement

Before Track 1: 12 open (D1–D12). After: **6 resolved**, **D5 partial**, **D13 new** → effectively
**6 open** (D2, D7, D10, D11, D12, D13) + D5 pending D13.
