# System-Wide Page Value & Strategic Review

**Date:** 2026-06-28
**Type:** Read-only strategic/product review (no code changes)
**Lens:** Fionira's mission — an AI-assisted financial-expert system for **non-specialist Saudi SME owners**, with governance and institutional accuracy.
**Grounding:** compiled from this session's direct live testing (Expenses, Revenues, Banks dashboard/movements/reconciliation/upload, Reports hub, Income Statement, Owners Summary, Cash Flow, Settings/Branches, Branch Comparison) and this session's code audits (TaxDeclaration, TrialBalance, BalanceSheet, IncomeStatement, migration_review removal). Where a rating rests on code-audit rather than direct UI viewing, it is marked *(audited, not re-viewed live)*.

---

## TASK 1 — Page/module inventory

Navigation is organised into **8 top-level domains**, each with sub-tabs (from `NewAppShell.tsx`):

| Domain | Sub-pages |
|---|---|
| **لوحة التحكم** (Home) | GlobalDashboard · مقارنة الفروع (Branch Comparison) |
| **المصروفات** (Expenses) | Dashboard · Upload · الأخطاء والتشخيص · الموردون · التصنيفات · دليل الأصناف · الملخص الشهري · كشف الحساب |
| **الإيرادات** (Revenues) | Dashboard · Upload · مراجعة · العملاء · مسارات الإيرادات · الملخص الشهري · كشف حساب |
| **البنوك** (Banks) | Dashboard · رفع كشف · مطابقة البنوك · قائمة الحسابات · حركة الحسابات · الملخص الشهري · كشف الحساب |
| **الرواتب** (Payroll) | Dashboard · Upload · مراجعة · الموظفون · المسير الشهري · توزيع الرواتب |
| **الفواتير** (Invoices) | Dashboard · فاتورة إلكترونية · عروض الأسعار |
| **التقارير** (Reports) | Hub · ملخص الملاك · التحليل الرسومي · قائمة الدخل · الميزانية العمومية · التدفقات النقدية · المقارنة السنوية |
| **المحاسبة** (Accounting) | Dashboard · الإقرار الضريبي · دفتر الأستاذ · ميزان المراجعة |
| **الإعدادات** (Settings) | الشركة (+الفروع) · المستخدمون والصلاحيات · سجل التدقيق · التنبيهات · الأمان · الإقليمية |
| **Cross-cutting** | CommandPalette (Ctrl+K) · FileManagement (per-domain upload) · ValidationReviewScreen (governance) · TraceModal (lineage) |

That is **~45 distinct user-facing surfaces.**

---

## TASK 2 — Honest value rating

### Core financial statements (Reports + Accounting)
| Page | Value to a non-specialist owner | Status | Rating |
|---|---|---|---|
| قائمة الدخل (Income Statement) | "Am I profitable?" — the single most important question | Sound real data (computePnLCore, D2/D7 fixed) | 🟢 |
| التدفقات النقدية (Cash Flow) | "Do I actually have cash?" — survival question for SMEs | Rebuilt today: real, bank-reconciled, branch-aware | 🟢 |
| ميزان المراجعة (Trial Balance) | Accountant-grade integrity check | Audited sound | 🟢 *(audited)* |
| الإقرار الضريبي (Tax Declaration) | ZATCA VAT filing — high regulatory value | Fixed today (taxable/exempt split) | 🟢 *(audited)* |
| الميزانية العمومية (Balance Sheet) | "What do I own/owe?" | **Estimated, labeled تقديري** — honest but not yet real (awaits chart-of-accounts foundation) | 🟡 |
| ملخص الملاك (Owners Summary) | Owner-facing KPI digest | Real, but it's a **P&L digest, not an equity statement** — overlaps Income Statement; name implies equity it doesn't show | 🟡 |
| التحليل الرسومي (Visual Analytics) | Visual KPIs | Charts over the same P&L data | 🟡 *(audited)* |
| المقارنة السنوية (Yearly Comparison) | Trend across years | Valuable if multi-year data exists | 🟡 *(not re-viewed live)* |
| دفتر الأستاذ (General Ledger) | Accountant detail | Useful for accountants, opaque to owners | ⚪ *(audited)* |

### Operational domains
| Page | Value | Rating |
|---|---|---|
| Expenses Dashboard | Where the money goes — core, branch-segmented live | 🟢 |
| Revenues Dashboard | Where money comes from — branch breakdown | 🟢 |
| Banks → مطابقة البنوك | Reconciliation to the halala — trust anchor | 🟢 |
| الأخطاء والتشخيص / ValidationReview | The governance/"expert catches errors" promise made visible | 🟢 |
| Branch Comparison (مقارنة الفروع) | "Which branch performs?" — real multi-branch value | 🟢 |
| الموردون / العملاء / الموظفون | Entity records (canonicalised) | 🟢 |
| Banks → حركة الحسابات | Movements report — **overlaps مطابقة البنوك** (see TASK 3) | 🟡 |
| الملخص الشهري / كشف الحساب (repeated per domain) | Per-domain monthly & statement views | 🟡 (repetition, see TASK 3) |
| دليل الأصناف / مسارات الإيرادات | Item/stream directory | 🟡 *(not re-viewed live)* |

### Invoices (outward-facing)
| Page | Value | Rating |
|---|---|---|
| فاتورة إلكترونية (Smart Invoice) | ZATCA e-invoice creation — high value if compliant | 🟡 *(not audited this session)* |
| عروض الأسعار (Quotations) | Quote issuance | 🟡 *(not audited)* |
| Invoices Dashboard | Collection summary | 🟡 *(not audited)* |

### Admin/technical (not for the target owner)
GlobalDashboard 🟢 (the true "home"), Settings/Branches 🟢 (fixed today), Users & Roles ⚪, Audit Log ⚪, Accounting Dashboard ⚪, CommandPalette ⚪ (power-user), FileManagement ⚪ (mechanism).

**Removed today:** migration_review (🔴 mock → deleted) — correct call, no value lost.

---

## TASK 3 — Redundancy & coherence findings (concrete, observed)

1. **Banks: مطابقة البنوك vs حركة الحسابات.** The reconciliation page already renders the GL-nature → account → drill-down breakdown of all movements. "حركة الحسابات" (categories_summary) is largely the same movement data without the balance gate. **Genuine overlap** — the earlier coherence question stands. Recommend folding movements into the reconciliation page (or making "حركة الحسابات" a filtered view of it), not a separate top tab.

2. **Three P&L-flavoured surfaces in Reports: قائمة الدخل, ملخص الملاك, التحليل الرسومي.** All three present profitability over the same `computePnLCore` data. Owners Summary in particular duplicates the Income Statement's content under a name that implies equity. A non-specialist will not know which to open. Recommend: Income Statement = the canonical P&L; Owners Summary = re-scope to a true plain-language "executive snapshot" (or merge into the home dashboard); Visual Analytics = explicitly the "charts" view of the P&L.

3. **Overview sprawl.** Each domain has its own "Dashboard," plus GlobalDashboard (home), plus Visual Analytics, plus Owners Summary. That's **4+ overview surfaces**. For a non-specialist this dilutes "where do I look first?"

4. **Repeated generic tabs** (الملخص الشهري, كشف الحساب, grouped_purchases) appear in 3–4 domains with different labels. Internally elegant (one component reused), but it means the *same verb* ("كشف الحساب") means vendor history, customer history, bank statement, depending on domain — mild cognitive load, acceptable.

5. **Data-load timing (observed live).** Every P&L-derived page renders 0 until the client's async data sync completes; after a reload real numbers appear. A first-time owner could read the transient 0 as "no data / broken." This is cross-cutting, not page-specific.

---

## TASK 4 — Genuinely missing capabilities (grounded, not generic)

1. **Budget vs Actual** — no planning/variance capability exists. Owners think in "did I beat my plan?"; this is the natural complement to the now-complete P&L + Cash Flow. (Design proposed separately.)
2. **A true Owners' Equity view** — capital contributions, drawings, retained earnings. Today's "ملخص الملاك" is a P&L digest, not equity; the real equity statement (and the real Balance Sheet) await the **chart-of-accounts-with-types** foundation. This is the single biggest accuracy gap remaining.
3. **An owner-first "plain-language home."** The system is accountant-structured (statements, ledgers, reconciliation). The *mission* is a non-specialist owner. There is no single screen that answers, in plain Arabic, "how is my business doing this month, and what needs my attention?" GlobalDashboard is the closest but is KPI-tiles, not narrative.

---

## TASK 5 — Concrete proposals for 🟡/🔴 pages

- **ملخص الملاك:** either rename to an honest "الملخص التنفيذي / لوحة الأداء" OR repurpose as the plain-language home (TASK 4.3). Don't keep an equity-implying name over P&L content.
- **حركة الحسابات (banks):** fold into مطابقة البنوك as a tab/filter; remove the standalone overlap.
- **الميزانية العمومية:** keep the honest تقديري label until the chart-of-accounts foundation lands; until then, consider de-emphasising it in nav so owners aren't anchored on an estimate.
- **Visual Analytics:** position explicitly as "الرسوم البيانية" under Income Statement, not a peer "report."
- **Data-load 0-state:** show a "جارٍ تحميل بياناتك…" state instead of 0 on P&L pages (cross-cutting UX).

---

## TASK 6 — Honest overall verdict

**The financial *engine* is now genuinely strong; the *information architecture* has out-grown its non-specialist audience and needs a structural pass before more pages are added.**

What's excellent: the accuracy spine built this session — unified P&L, real bank reconciliation, a real Cash Flow reconciled to the halala, honest labelling of the estimated Balance Sheet, governance/validation visible, multi-branch and multi-activity real. As an *accountant's* tool, Fionira is coherent and increasingly institutional-grade.

The risk: ~45 surfaces across 8 domains, with 4+ overview screens and several P&L-flavoured duplicates, is a lot for the stated user — a restaurant owner who is *not* an accountant. The product promises "the system IS the expert FOR you," but the current navigation asks the user to think like an accountant to find anything. The pieces are right; the **entry experience and de-duplication** are what's missing.

**Recommendation:** before adding further modules, do one **structural/IA pass** — (a) a plain-language owner home that surfaces "profit, cash, what needs attention" with the detailed statements behind it; (b) resolve the three concrete overlaps (banks movements, the P&L trio, overview sprawl). Budget vs Actual (Part 1) is worth building, but it will land better *after* — or alongside — that IA pass, so it strengthens a coherent story rather than adding a 46th surface. This is a strength-consolidation moment, not a stop-work one.
