# Fionira — IA Consolidation Execution Plan

**Date:** 2026-06-28
**Type:** Planning / documentation only — **zero code changes in this task.**
**Purpose:** an execution-ready plan a future session can implement directly, without re-deriving design.
**Grounded in:** this session's live testing + direct reads of `GlobalDashboard.tsx`, `WelcomePage.tsx`, `BankReconciliation.tsx`, `BankMovements.tsx`, `ReportsDashboard.tsx`, `NewAppShell.tsx`, `CommandPalette.tsx`, `App.tsx` routing.

---

## 0. Current reality (verified, not assumed)

- **Home (`appMode==='dashboard'`)** currently renders **`WelcomePage`** (a static brand splash — hero + 3 generic feature cards, no data) and **`GlobalDashboard`** (4 KPI cards: revenue/expenses/net profit/transactions + a revenue-vs-expenses bar chart + Quick Actions + 4 lower tiles: customers/vendors/transactions/recent-activity, plus a staged-files "ملفات تنتظر اعتمادك" alert).
- `GlobalDashboard` computes from `incomeStatement` (= `computePnLCore`). It does **NOT** surface: **cash position** (the new reconciled Cash Flow), **branch comparison**, or any plain-language narrative. It is KPI-tile-centric — the exact "sprawl" risk.
- **Bank pages:** `bank_reconciliation` → `BankReconciliation` (opening/closing reconciliation + GL-nature breakdown + continuity); `categories_summary` (banks) → `BankMovements` (per-account In/Out/Net + analysis **by transaction type** or **by counterparty**, drill-down). Both segment per account; both list per-account transactions — **adjacent lenses on the same data**, not identical.
- **Three P&L surfaces:** `income_statement` (formal P&L, `computePnLCore`), `owners_summary` (a P&L *digest* — audited: not equity), `visual_dashboard` (charts over the same P&L).
- **Routing keys** that any rename/move must keep consistent: `NewAppShell.tsx` menu `id`s; `App.tsx` `activeTab===` checks + the `REPORT_PAGE` list (~line 2101) + page-title block (~line 2118-2135); `CommandPalette.tsx` `actions[]` (`mode`/`tab` pairs: `exp_dash, exp_upload, exp_supp, rev_dash, rev_upload, rev_invoice, pr_dash, bnk_dash, rep_inc, rep_bal, set_users`); `ReportsDashboard.tsx` `reports[]` ids.

---

## TASK 1 — The "Owner Home" concept

> **⚠️ USER CORRECTION (2026-06-28, takes precedence over any earlier wording):**
> Owner Home is **STRICTLY ADDITIVE**. The plain-language band is **added ABOVE** the existing
> GlobalDashboard content. **Nothing existing is removed, collapsed, hidden behind a click, moved to a
> secondary tab, or reduced in prominence.** Every KPI card, chart, and breakdown the user relies on
> today stays **equally visible (or more), on the same page.** The earlier "demoted to details" framing
> was wrong and is retracted. See the "WHAT WE WILL NEVER DO" subsection below.

**Precise inventory — what GlobalDashboard actually shows today (verified by direct read):**
1. Staged-files alert banner ("ملفات تنتظر اعتمادك") — governance.
2. **4 KPI cards:** إجمالي الإيرادات · إجمالي المصروفات · صافي الربح (+ margin %) · المعاملات (+ anomalies badge).
3. **Revenue-vs-Expenses bar chart** ("نظرة عامة مالية") with an empty-state upload CTA.
4. **Quick Actions** (Revenues / Expenses / Invoices / Payroll).
5. **4 lower cards:** العملاء (count) · الموردون (count) · إجمالي المعاملات · النشاط الأخير.

**Where the "top-5" breakdowns the user values actually live (verified — NOT on GlobalDashboard):**
- **أعلى الموردين (Top-5 Vendors)** → `ExpensesDashboard` (incl./excl. VAT, with charts).
- **Top customers** → `RevenuesDashboard` (customer entities list).
- **Top expense categories / category changes** → `ExpensesDashboard` + `CategoriesSummary`.
→ **These were never on GlobalDashboard and are NOT touched by the Owner Home change.** The Owner Home work edits `GlobalDashboard` only; the domain dashboards that own these breakdowns are **out of scope and unchanged.** (Whether to *additionally* surface a top-5 snippet on Owner Home: optional, see C — additive only, never removed from its current home.)

**Decision: evolve `GlobalDashboard` by ADDING the band on top — refine, do not build greenfield, do not remove anything.** It already owns the home slot and data wiring (`incomeStatement`, staged-files, nav callbacks). The change is *prepend a band*, not restructure-by-removal.

**A) First 5 seconds — a new plain-language band ADDED at the very top** (in this order):
1. **"ربحك هذا الشهر"** — net profit, one big number + a one-line plain sentence ("ربحت 12,400 ر.س هذا الشهر، بهامش 18%" / "خسرت …"). Sign-aware colour.
2. **"النقدية لديك"** — actual reconciled cash position from the **Cash Flow / bank closing balance** (the strong new work). One number + "+/− عن الشهر الماضي".
3. **"ما يحتاج انتباهك"** — a governance/attention strip: staged files awaiting approval (already present), anomalies count, and (later) budget variances. Each is a one-click deep-link.

**All existing content (the 4 KPI cards, the chart, Quick Actions, and the 4 lower cards) remains immediately below the band, on the SAME page, at its current prominence — fully visible by scroll, NOT collapsed, NOT tabbed, NOT click-to-reveal.** The band is a new first section; everything else is untouched.

**B) Relationship to existing GlobalDashboard / WelcomePage:**
- **GlobalDashboard → becomes Owner Home by ADDING the band above its current content** (+ a new cash card sourced from `computePortfolioCashFlow`). All current tiles/chart/cards stay exactly where they are. Same file, same route — minimal regression surface.
- **WelcomePage → shown only on first run** (zero data / brand intro). This removes no data visualization (WelcomePage is a static splash with no charts/KPIs); once data exists, Owner Home leads.

**C) Surfacing strong work without re-creating sprawl:**
- Cash position pulls from the existing `computePortfolioCashFlow(scopedBanks)` — no new computation.
- A compact **"أداء الفروع"** mini-row (top 2-3 branches by net) links into the existing `مقارنة الفروع` page — only rendered when `hasBranches`.
- Governance alerts reuse the existing staged-files banner pattern.
- Rule: Owner Home **links to** detail pages, it does not **duplicate** them. Each block is a headline + deep-link, capped at the 3 questions above.

**Scope honesty:** the cash card needs bank data scoped like the Cash Flow page (`scopedBanks`) passed into GlobalDashboard — a prop-wiring change in `App.tsx`, not new infrastructure. The plain-language sentences are presentation over existing numbers. This is genuinely "mostly UI work."

### ⛔ WHAT WE WILL NEVER DO (binding principle for the entire IA pass)
Across **every** step of this plan, we will **NEVER**, without an explicit user request to do so:
1. **Hide, collapse, or move-behind-a-click** any KPI card, chart, table, or top-5 breakdown the user currently sees.
2. **Reduce the visual prominence** of any existing data visualization (no shrinking a full card into a line item, no moving a primary chart to a secondary tab).
3. **Delete a page that contains a unique visualization** without first relocating that visualization somewhere equally visible.
4. **Replace** existing value with the new band — the band is **purely additive (a new top section)**, never a substitution.
5. Treat "consolidation" as "removal." Consolidation here means **reducing navigational confusion** (fewer overlapping *entry points*), **never** reducing the *information* the user can see.

If any execution step appears to require violating the above, **stop and ask the user first.** Default bias: keep it visible.

---

## TASK 2 — The three P&L-flavoured surfaces

**Proposal: keep three, but with sharply distinct, non-overlapping purposes — and fix the mislabel.**

| Surface | New, distinct purpose |
|---|---|
| **قائمة الدخل** (Income Statement) | THE formal P&L statement for a period (canonical numbers). Unchanged. |
| **التحليل الرسومي** (Visual Analytics) | Repositioned explicitly as "**الرسوم البيانية لقائمة الدخل**" — the charts/trend view of the same P&L. Sits *under* Income Statement, not as a peer "report." |
| **ملخص الملاك** (Owners Summary) | **Re-scope.** Today it duplicates the P&L under an equity-implying name. Two honest options below. |

**A)** Not "remove/merge blindly." The cleanest: Income Statement = statement; Visual Analytics = its charts (relabel + renest); Owners Summary = stop duplicating the P&L.

**B) Owners Summary → should it become a REAL owners'-equity statement? Honest scope assessment:**
- **Does the data exist today? NO.** Traced: there is **no owner-contribution and no owner-drawing data source** anywhere — not in expense categories (CAPEX exists; owner-capital/drawings do not), not in the bank classifier (it has transfers/remittances but cannot distinguish an owner draw from any other transfer — this exact limitation was documented in the Cash Flow build).
- **Therefore a real equity statement requires NEW DATA CAPTURE first**, not just UI:
  1. A way to record **owner contributions** and **drawings** (either a new transaction category the user tags, or a dedicated light entry form — mirrors the Budget entry pattern).
  2. **Retained earnings** = accumulated net income across periods — derivable from `computePnLCore` **only if** historical periods are persisted and summed (the system stores records, so this is computable once contributions/drawings exist).
  3. This is the **same chart-of-accounts-with-types foundation** the real Balance Sheet and D12 need — they should be built together.
- **Recommendation:** until that foundation exists, **re-scope `owners_summary` to an honest "الملخص التنفيذي"** (or fold it into Owner Home as the plain-language band from TASK 1, eliminating the surface entirely). Do **NOT** ship an "owners' equity" label over data that isn't equity. The real equity statement is a **future milestone gated on owner-contribution/drawing capture** — flagged plainly, not hand-waved.

**Leaning:** fold `owners_summary`'s content into **Owner Home** and **retire the separate `owners_summary` tab** — this resolves a P&L duplicate AND reduces overview sprawl.

> **⚠️ Preservation flag (per the additive principle):** `owners_summary` contains a **unique visualization — the "مسار تدفق الأرباح" (Profitability Waterfall)** — plus KPI + margin cards. "Retire the tab" must NOT mean delete the waterfall. Before retiring, **relocate the Profitability Waterfall** to Owner Home (or onto the Income Statement) so it remains equally visible. Its KPI/margin cards already duplicate the Income Statement and Owner Home band, so those can be dropped without information loss — but the **waterfall must survive.** If relocation isn't done, do NOT retire the tab.

---

## TASK 3 — Bank pages overlap (مطابقة البنوك vs حركة الحسابات)

**Proposal: merge into ONE page — "البنوك: مطابقة وحركة" — with internal tabs/modes**, since both are "analyse this account's transactions," differing only by lens:
- **Tab 1 — المطابقة (Reconciliation):** the `BankReconciliation` view (opening/closing/continuity + GL-nature breakdown). The trust anchor; default tab.
- **Tab 2 — الحركة حسب النوع (By Type):** `BankMovements` `view='type'`.
- **Tab 3 — الحركة حسب الطرف المقابل (By Counterparty):** `BankMovements` `view='counterparty'`.

Grounded in tested behaviour: reconciliation already shows a per-account GL breakdown; BankMovements adds the by-type/by-counterparty analytics + In/Out/Net + share bars. They are complementary, not redundant — but presenting them as two sibling top-tabs reads as duplication to a non-specialist. One page, three modes removes the confusion while preserving both capabilities.

**Implementation note:** both components already take `records` and self-segment per account; the merge is a thin tabbed wrapper component. Remove the standalone `categories_summary` (banks) nav entry; keep `bank_reconciliation` as the single entry, renamed.

---

## TASK 4 — Overview sprawl (genuine vs duplicate)

| Overview surface | Verdict |
|---|---|
| **Owner Home** (evolved GlobalDashboard) | **Keep — the one true home.** |
| **WelcomePage** | **Collapse** into Owner Home (first-run-only state). Not a peer overview. |
| **ملخص الملاك** (Owners Summary) | **Collapse** into Owner Home (TASK 2). |
| **التحليل الرسومي** (Visual Analytics) | **Keep but renest** under Income Statement (not a peer overview). |
| **مقارنة الفروع** (Branch Comparison) | **Keep — genuinely distinct** (cross-branch lens, not a financial-statement overview). |
| **Reports hub** (`reports/dashboard`) | **Keep — genuinely distinct** (a directory/launcher of formal statements). |
| **Per-domain dashboards** (expenses/revenues/banks/payroll/invoices) | **Keep — genuinely distinct** (each is the entry point *into* its domain, not a global overview). |

**Net:** of the "4+ overviews," two are true duplicates to collapse (WelcomePage-as-home, Owners Summary), one to renest (Visual Analytics); the rest are legitimately distinct. This removes ~2 surfaces and clarifies the rest.

### Data-visualization preservation re-check (every consolidation item)
Per the user correction, each proposed change is re-checked: does it **risk hiding/losing any visualization**, or is it **purely structural** (merging/renaming, zero information loss)?

| Item | Loses any visualization? | Verdict |
|---|---|---|
| **Owner Home band (TASK 1)** | No — purely additive; all existing tiles/chart/cards stay at full prominence. | ✅ SAFE (additive) |
| **WelcomePage → first-run only (TASK 4)** | No — WelcomePage is a **static brand splash with no charts/KPIs**. | ✅ SAFE (no data viz) |
| **Visual Analytics renest (TASK 2/4)** | No — verified it is a **near-duplicate of GlobalDashboard** (same 4 KPI cards + same "نظرة عامة مالية" bar chart). Renesting keeps it reachable; nothing unique is removed. | ✅ SAFE (duplicate content) |
| **Owners Summary retire (TASK 2)** | **YES — risk:** the **Profitability Waterfall** is unique. | ⚠️ GATED — only after the waterfall is relocated (see TASK 2 flag). KPI/margin cards are duplicates (safe to drop). |
| **Bank pages merge (TASK 3)** | No — both views (Reconciliation + by-Type + by-Counterparty) become **tabs on one page**; every table/KPI/share-bar is preserved, just under one entry. | ✅ SAFE (different data → tabs) |
| **Budget vs Actual placement (TASK 5)** | No — brand-new additive page; removes nothing. | ✅ SAFE (additive) |
| **Domain dashboards (Expenses/Revenues/etc.)** | No — **out of scope, untouched.** This is where **Top-5 Vendors / Top customers / category breakdowns** live; the IA pass does not modify them. | ✅ SAFE (unchanged) |

**Summary:** the only item carrying real viz-loss risk is **Owners Summary's Profitability Waterfall**, now explicitly **gated** on relocation. Everything else is structural (merging entry points / adding sections), losing **zero** information the user sees today.

---

## TASK 5 — Budget vs Actual placement (per confirmed design e0fde690)

**Placement: a tab paired directly with the Income Statement — "قائمة الدخل" gains a sibling "الموازنة مقابل الفعلي" — AND a summary line on Owner Home.**
- **Primary home:** under **Reports**, immediately after `income_statement` (variance is read *against* the P&L; co-locating gives instant context). Nav id `budget_vs_actual`.
- **Secondary surfacing:** an Owner Home attention-band line ("أنت أعلى/أدنى من خطتك بـ X") linking into it — discoverable without hunting.
- **Not** a new top-level domain (avoids a 46th orphan tab). It rides inside the existing Reports domain alongside the statement it explains.

---

## TASK 6 — Migration / rollout safety

**A) Incremental — YES.** Each consolidation is independent and live-testable, same discipline as this session. Do them one at a time, verify, commit.

**B) Regression risks (named):**
1. **CommandPalette `actions[]`** (`CommandPalette.tsx`) — `bnk_dash`, `rep_inc`, etc. point to `mode/tab`. Renaming/removing `categories_summary` (banks) or `owners_summary` will orphan any command targeting them. **Audit + update `actions[]` whenever a tab id changes.** (Same care as commit `7e19081`.)
2. **`App.tsx` routing** — `activeTab===` checks, the `REPORT_PAGE` list (~2101), and the page-title block (~2118-2135) all key off tab ids. Removing/renaming a tab requires updating all three or the page renders blank / mis-titled.
3. **`NewAppShell.tsx` menu `id`s** + **`ReportsDashboard.tsx` `reports[]`** — the nav source of truth; must match `App.tsx`'s expected `activeTab` values.
4. **Deep-links / bookmarks** — if any external links use `?tab=` style params (verify during execution), removed ids break them; add redirects for any removed id → its new home.
5. **`owners_summary` removal** — it's in the `REPORT_PAGE` list and ReportsDashboard cards; remove from both atomically.
6. **Bank merge** — the `categories_summary && appMode==='banks'` branch in `App.tsx` (~2631) and its non-banks counterpart share an id; the merge must not disturb the non-banks `categories_summary` (Auto Chart of Accounts) path.

**C) Safe implementation ORDER (low-risk/high-value first):**
1. ✅ **EXECUTED — Bank pages merge** (TASK 3) — `BankAccountsView` tabbed wrapper (مطابقة الأرصدة / الحركة حسب النوع / الحركة حسب الطرف); both original components preserved unchanged; branch scoping now functional. Live-verified (2-account never-merge, drill-down, all tabs, console clean). See `ia-execution-phase1-bank-merge-visual-renest.md`.
2. ✅ **EXECUTED — Visual Analytics retire** (TASK 4) — confirmed strict duplicate of GlobalDashboard (live + code); page/route/nav/hub-card removed; `VisualDashboard.tsx` file kept (its `formatCurrency` export is shared). Removed a pre-existing double-render bug. Reports hub now 6 cards. Live-verified.
3. ✅ **EXECUTED — Owner Home evolution** (TASK 1) — additive plain-language band (ربحك / النقدية لديك via computePortfolioCashFlow / ما يحتاج انتباهك) added ABOVE GlobalDashboard; all existing KPIs/chart/cards preserved; WelcomePage first-run logic untouched; branch-scope-aware. Live-verified (real profit −96,900, real cash 13,000, governance signals). See `ia-execution-phase2-owner-home-waterfall-retirement.md`. *(Originally described as:)* **Owner Home evolution** (TASK 1) — refine `GlobalDashboard` (plain-language band + cash card via `scopedBanks` prop); WelcomePage → first-run-only. Medium risk (home is high-traffic), but isolated to one component + one prop wire.
4. ✅ **EXECUTED — Owners Summary retired** (TASK 2) — **gate honoured: Profitability Waterfall relocated to the Income Statement (new `ProfitabilityWaterfall.tsx`) and live-verified BEFORE retirement.** Removed route/import/REPORT_PAGE/page-title/nav/hub-card; no CommandPalette entry existed; `OwnersSummary.tsx` retained but unreferenced. Reports hub now 5 cards. Zero unique-visualization loss.
5. ⏳ PENDING — **Budget vs Actual + the rest of its build** (TASK 5 + design e0fde690) — last, landing into the now-consolidated structure.
6. ⏳ PENDING (Future, gated) — real Owners' Equity statement — only after owner-contribution/drawing capture + chart-of-accounts foundation exist.

Each step: live-test, confirm zero console errors, confirm CommandPalette + nav still resolve, commit, push.

---

## TASK 7 — Navigation tree: before → after

**BEFORE (home + affected areas):**
```
لوحة التحكم  → WelcomePage (splash) + GlobalDashboard (KPI tiles)  + مقارنة الفروع
البنوك       → dashboard · upload · مطابقة البنوك · قائمة الحسابات · حركة الحسابات · ...
التقارير     → hub · ملخص الملاك · التحليل الرسومي · قائمة الدخل · الميزانية · التدفقات · المقارنة السنوية
```

**AFTER:**
```
الرئيسية (Owner Home)  → plain-language band (ربح · نقدية · يحتاج انتباهك)
                          + details (existing tiles/chart) + أداء الفروع mini-row → مقارنة الفروع
                          (WelcomePage only when zero data)
البنوك    → dashboard · upload · "مطابقة وحركة البنوك" (tabs: مطابقة | حسب النوع | حسب الطرف) · قائمة الحسابات · ...
التقارير  → hub · قائمة الدخل (+ child: الرسوم البيانية) · الموازنة مقابل الفعلي · الميزانية (تقديري) · التدفقات النقدية · المقارنة السنوية
            (ملخص الملاك retired → folded into Owner Home)
```

**Surfaces removed/collapsed:** WelcomePage-as-home, `owners_summary`, `categories_summary` (banks standalone) → net **−2 to −3 surfaces**, **+1** (Budget vs Actual), with Visual Analytics renested. Result: a tighter, owner-first story without losing any real capability.

---

## Honest scope summary (no hand-waving)
- **Mostly UI:** Owner Home evolution, Visual Analytics renest, bank-pages merge, Budget vs Actual placement, Owners Summary fold.
- **Needs new data capture (NOT just UI), explicitly deferred:** a real **Owners' Equity** statement (owner contributions/drawings capture + retained-earnings accumulation) — same foundation as the real Balance Sheet / D12. Flagged as a future milestone, not part of this IA pass.
- **Build Budget vs Actual** (design e0fde690) **into step 5** of this rollout, per the confirmed "alongside the IA pass" sequencing.
