# حزمة التقييم الخارجي لنظام Fionira — prompt جاهز للتسليم
> **تعليمات الاستخدام (لهاني):** انسخ هذا الملف كاملاً والصقه في جلسة النموذج/الخبير الخارجي كرسالة واحدة. كل شيء مضمَّن — لا يحتاج المُقيِّم أي وصول للمستودع.

---

أنت خبير تقني عالمي متخصص في تصميم وتدقيق وتحسين الأنظمة المالية
الذكية المؤسسية (Enterprise Financial Intelligence Systems) بخبرة
عميقة في SAP, Oracle NetSuite, Microsoft Dynamics, Zoho Books,
QuickBooks, وأنظمة ERP عربية وعالمية.

سأعطيك وثائق نظام Fionira كاملةً وأريد منك تقييماً جراحياً شاملاً
لا مجاملة فيه ولا تلطيف — الحقيقة الكاملة فقط، وكل حكم مدعوم بدليل
من الوثائق المرفقة.

ملاحظة منهجية مهمة: من بين الوثائق تقريرا تدقيق داخليان سابقان
(fionira-expert-audit v1/v2). لا تكتفِ بترديد استنتاجاتهما —
تعامل معهما كمُدخل قابل للنقد: أكِّد ما تجده صحيحاً، واعترض على
ما تجده مبالغاً أو ناقصاً، وأضف ما فاتهما.

بعد قراءة كل الوثائق، أنتج تقريراً شاملاً يغطي الأقسام العشرة التالية
بالترتيب، بعمق حقيقي لا اختصار:

──────────────────────────────────────
§1 هوية النظام وتحليل موقعه التنافسي
──────────────────────────────────────
- ما هو Fionira فعلاً (من الأدلة، لا من الوصف الذاتي)؟ أي فئة أنظمة
  يقع فيها بدقة؟ ما الذي يجعله مختلفاً بنيوياً عن نظام محاسبة تقليدي؟
- تحليل السوق المستهدف: من المستخدم الأنسب له الآن؟ وما الذي يحد
  هذا الجمهور؟
- جدول مقارنة مفصل مع Zoho Books / QuickBooks / SAP Business One /
  Oracle NetSuite / أنظمة ERP عربية محلية — لكل نظام: أين يتفوق
  Fionira؟ أين يتفوق المنافس؟ وما الفجوة الحرجة (showstopper)؟

──────────────────────────────────────
§2 تشريح البنية المعمارية
──────────────────────────────────────
- خريطة المكونات الكاملة مع تقييم جودة تصميم كل مكوّن ونقاط ضعفه
  البنيوية وما سيُكسر أولاً تحت ضغط الإنتاج الفعلي.
- تدفق البيانات الكامل من الإدخال لكل تقرير نهائي — مع تحديد كل
  نقطة قد يحدث فيها فقدان دقة أو تناقض أو خطأ صامت.
- تقييم نموذج البيانات: هل يعكس نموذجاً محاسبياً سليماً؟ ما الحقول
  الناقصة؟ ما التناقضات الداخلية؟
- تقييم طبقة التخزين الحالية (devMemoryDb + JSON): حدود الأداء،
  سيناريوهات فقدان البيانات، الجهد الفعلي للانتقال لـPostgres.
- تقييم الأمان: كفاية نموذج المصادقة للإنتاج، الثغرات الواضحة،
  حقيقة عزل بيانات المستأجرين.

──────────────────────────────────────
§3 تشريح محرك التصنيف الذكي
──────────────────────────────────────
- كيف يعمل فعلاً؟ مسار القرار الكامل لسجل واحد من نص إلى فئة.
- نقاط القوة الفعلية بأمثلة من قواعده: أين يتفوق على المنافسين ولماذا؟
- نقاط الضعف والثغرات: سيناريوهات الفشل، البيانات التي ستربكه،
  مستوى التغطية الفعلي للفئات.
- تقييم التكافؤ ثنائي اللغة (عربي/إنجليزي) بالأدلة.
- مقترحات تحسين محددة: آليات، أمثلة تطبيقية، أثر متوقع قابل للقياس.

──────────────────────────────────────
§4 تشريح الطبقة المحاسبية
──────────────────────────────────────
- هل القيود المزدوجة صحيحة محاسبياً لكل نوع معاملة؟ ما المعاملات
  التي تولّد قيوداً خاطئة أو ناقصة؟
- صحة كل تقرير مالي: قائمة الدخل (استحقاق أم نقدي أم خليط؟)،
  الميزانية (صحة تصنيف كل حساب)، التدفقات (اكتمال الأقسام الثلاثة)،
  ميزان المراجعة (لماذا يتوازن دائماً؟).
- الفجوات المحاسبية الحرجة: الإهلاك، الأرصدة الافتتاحية، الإيراد
  المقدم D12، مسحوبات/مساهمات الملاك، وأي فجوات أخرى تكتشفها.
- امتثال IFRS/SOCPA: الفجوات التحديدية وأثرها على قابلية استخدام
  التقارير رسمياً.

──────────────────────────────────────
§5 تشريح نظام الحوكمة والتدقيق
──────────────────────────────────────
- ما الذي يعمل فعلاً؟ ما الذي لا يعمل وأثره على الموثوقية؟
- هل سجل التدقيق كافٍ للمتطلبات النظامية السعودية (ZATCA وهيئة
  الزكاة والضريبة والجمارك)؟
- مقترحات لرفعه لمستوى Enterprise-grade.

──────────────────────────────────────
§6 تدقيق تجربة المستخدم (UX Audit)
──────────────────────────────────────
- رحلة المحاسب اليومية الكاملة من الدخول حتى اعتماد التقارير
  الشهرية — مع كل نقطة احتكاك وكل قرار غامض.
- رحلة المدير المالي (CFO): هل يستطيع اتخاذ قرار من لوحة التحكم؟
- المشاكل المكتشفة في الواجهة (تكرارات، تناقضات، معلومات مفقودة،
  تدفق غير منطقي، رسائل مربكة).
- مقارنة UX مع الأنظمة المنافسة: أين أفضل؟ أين يتخلف؟

──────────────────────────────────────
§7 الديون التقنية والمخاطر الكاملة
──────────────────────────────────────
- قائمة شاملة بكل الديون المعروفة وغير المعروفة (اكتشف ما لم
  يُوثَّق) — لكل دين: الموضع، الأثر، الأولوية، الجهد.
- مخاطر الأداء والتوسع: حدود التباطؤ، أغلى العمليات، معيقات الـscaling.
- مخاطر الجودة والموثوقية: نقاط الفشل الواحد، سيناريوهات فقدان
  البيانات، مستوى تغطية الاختبارات.
- مخاطر الأمان والامتثال: لكل ثغرة أثرها وخطورتها وإصلاحها.

──────────────────────────────────────
§8 خارطة طريق الوصول للعالمية
──────────────────────────────────────
- تقييم رقمي واقعي من 10 لكل محور مع التبرير: الوظائف المحاسبية،
  جودة البيانات، الذكاء المالي، تجربة المستخدم، الجودة التقنية،
  الامتثال النظامي، الجاهزية للإنتاج، التنافسية.
- المرحلة الأولى «قابل للاستخدام الإنتاجي»: الحد الأدنى الذي يجعل
  عميلاً حقيقياً يدفع.
- المرحلة الثانية «منافس جدي خليجياً»: مقابل Zoho Books وأمثاله +
  المتطلبات النظامية غير القابلة للتأجيل.
- المرحلة الثالثة «منافس عالمي».
- المزايا التنافسية الفريدة الممكنة التي لا يملكها أي منافس —
  أفكار محددة قابلة للتنفيذ.

──────────────────────────────────────
§9 اقتراحات التحسين الشاملة
──────────────────────────────────────
لكل اقتراح: [الاقتراح] اسم واضح · [المشكلة] ما يحله بالضبط ·
[التصميم المقترح] آلية عمل محددة لا فكرة عامة · [الأثر المتوقع]
بمقاييس قابلة للقياس إن أمكن · [الأولوية] حرج/عالٍ/متوسط/منخفض
مع التبرير · [الجهد] صغير/متوسط/كبير.
غطِّ على الأقل: محرك التصنيف والتعلم من التصحيحات، رفع التقارير
لمعايير IFRS/SOCPA، امتثال ZATCA الكامل (مرحلة 2)، تعدد الأنشطة
والفروع في الواجهة، الإشعارات الاستباقية الذكية، لوحة CFO،
الموازنة والتخطيط، bank feeds، الفوترة الإلكترونية، الأصول
والإهلاك، المخزون، مقارنة الفترات، الصلاحيات متعددة المستويات،
API خارجي — وأي اقتراحات أخرى تراها ضرورية.

──────────────────────────────────────
§10 الملخص التنفيذي للخبير
──────────────────────────────────────
حكم نهائي صريح: ما الذي يجعل Fionira جديراً بالاستمرار والاستثمار؟
ما أكبر خطر إن لم يُعالَج قريباً؟ ما الخطوة الواحدة الأعلى أثراً
الشهر القادم؟ وأين يقف على مقياس
[نموذج أولي → MVP → منتج → منافس محلي → منافس عالمي]؟

═══════════════════════════════════════
الوثائق المرفقة (6 وثائق كاملة أدناه)
═══════════════════════════════════════


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 1: `CLAUDE.md`
═══════════════════════════════════════════════════════════════

﻿# Project Sync Instructions for Claude Code

## Git Workflow — CRITICAL

This project is actively synced between two machines via GitHub.
After completing any meaningful change (a feature, a fix, a file edit),
you MUST commit and push immediately so the other machine can pull the
latest state. Do not batch multiple unrelated changes into one commit.

Steps to follow after every completed change:
1. `git add -A`
2. `git commit -m "<short, clear description of what changed>"`
3. `git push origin master`

If `git push` fails due to the remote having newer commits, run
`git pull origin master --rebase` first, resolve any conflicts, then push again.

Never force-push (`git push --force`) without explicit confirmation from the user.

## Classification Engine — Core Design Principle (PERMANENT RULE)

The classification engine's primary job is entity resolution across naming
variants, not literal string matching. This applies to expenses, accounts,
vendors, customers, and employees alike.

Real-world inputs will name the SAME underlying entity in different ways:
- Different accountants (or the same accountant in different files, or even
  within the same file) may phrase it differently
  e.g. "سفر وانتقالات" vs "مصاريف سفر وانتقالات"
- Word order may vary, words like "مصروف"/"مصاريف"/"رسوم" may be added or omitted
- Language may mix — Arabic, English, or partial transliteration
- Abbreviations, plural/singular forms, or minor spelling variants may appear

The engine MUST recognize these as the same entity and classify them under
one unified category/account, the same way it already does for cases like
the marketing/government-fees/stationery merge (item 2, commit 37180e0).

This is the opposite of treating similar-looking names as automatically
distinct "to be safe." Default behavior: if two names plausibly refer to
the same real-world thing, unify their classification.

Important distinction — this is about CLASSIFICATION, not about silently
rewriting source records: underlying transaction records and their original
text should remain traceable to their source. But the classification layer
(which category/account a transaction rolls up into) should treat all
recognized variants as one.

If a naming variant is genuinely ambiguous (could plausibly be a real,
distinct account/entity rather than just a phrasing difference), flag it
for user review with the specific candidates — don't silently guess, and
don't silently keep them split either.


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 2: `_artifacts/architecture/SESSION-HANDOFF.md`
═══════════════════════════════════════════════════════════════

# Fionira — Session Handoff

## 0. Latest segment (2026-06-28): IA CONSOLIDATION COMPLETE (Phases 1–3) + new financial statements

This segment delivered the financial-statement triad completion + the full Information-Architecture
consolidation. **This is a natural, complete stopping point — today's IA consolidation goal is fully achieved.**

**A) Financial capabilities built this segment (all live-verified):**
- **Real Cash Flow Statement** (`8bfaaf64`) — direct-method, reconciled to the **actual bank closing balance** (shared `bank-cashflow-core.ts`); branch-aware. Investing/Financing honestly labelled, not fabricated.
- **Settings save fix** (`5482b2ae`) — dev-auth Firestore `permission-denied` no longer surfaced as a false save error (strictly a dev artifact; production unaffected).
- **Per-branch visibility** (`7bf4614b`) — `computePnLCore` single P&L source + `مقارنة الفروع` view + global branch scope.

**B) IA Consolidation Plan (`75cc6b0d`, corrected additive-only `a94f3d70`) — EXECUTED in 3 phases:**
- **Phase 1** (`acb0d8b7`) — Bank pages merged into one tabbed page (`BankAccountsView`: مطابقة / حسب النوع / حسب الطرف); Visual Analytics retired (strict GlobalDashboard duplicate). Zero info loss; multi-account never-merge re-verified.
- **Phase 2** (`2c26bdb5`) — **Owner Home** additive band (ربحك / النقدية لديك via reconciled cash / ما يحتاج انتباهك) above the *preserved* GlobalDashboard; **Profitability Waterfall relocated** to Income Statement (`ProfitabilityWaterfall.tsx`) and verified BEFORE **OwnersSummary retired** (gate honoured).
- **Phase 3** (`726af371`) — **Budget vs Actual** (`BudgetVsActual.tsx`): Reports tab after Income Statement + Owner Home one-line; budgets in `AppSettings.budgets`; Excel template + in-app editor; **Actual sourced exclusively from `computePnLCore` (zero drift)**; sign-aware variance; branch-aware. MVP = annual section-level.

Binding principle enforced throughout (`a94f3d70` "WHAT WE WILL NEVER DO"): **no existing KPI card, chart, or unique visualization was hidden, collapsed, demoted, or lost** — every consolidation was structural (fewer entry points) or additive, never a reduction of information.

**B2) D13 re-attempted (2026-06-29, commit `26708922`) — measured unsafe, reverted, engine unchanged.**
The deferred D13 "combined resolution" (vendor/description field-separation + ال-prefix normalization) was
re-attempted on an 867-record corpus (802 real + 65 synthetic across all 5 activity sets). **Both layers
unsafe and now proven SEPARABLE through two independent measurements (Track 2 + this session):**
1. **Field-separation ALONE** (hybrid: description full score + vendor name at 0.3× hint): blast radius
   **1/867, but that 1 record is a REGRESSION, not an improvement** — a synthetic record intentionally
   tagged `tools_high_value` (6,900 SAR) where the vendor name IS a legitimate strong signal (equipment
   supplier → fixed asset). A uniform low-score vendor-hint cannot distinguish legitimate vendor signal
   from leakage.
2. **ال-prefix normalization on description text**: independently unsafe — breaks root words
   (`ألوان`→`وان`, loses the raw-materials match) and exposes previously-protected short words to descOnly
   keywords (`المكتب`→`مكتب` triggers rent, hijacking telecom/utility bills into rent).

**NEW PREREQUISITE IDENTIFIED (not previously known): per-keyword vendor-safety tagging must come FIRST** —
each keyword rule must be explicitly marked *safe-on-vendor-name* or *vendor-name-leakage-risk* before any
field-separation or ال-normalization is attempted. This **supersedes** the earlier "solve as one combined
mechanism" recommendation. D5's ال-prefixed form (`الترجمة`) remains unresolved pending the same
prerequisite; the narrow bare-keyword patch (Track 2) stays in place and handles the non-prefixed form
correctly. Engine is byte-identical to its last known-good state (no D13 code shipped). See
`engine-fix-d13-combined-resolution.md` + `engine-technical-debt.md`.

**C) DEFINITIVE DEFERRED-ITEMS REGISTRY — the complete, unified list (supersedes all fragmented prior mentions):**
1. ✅ **D11 — Construction WIP / job-costing — RESOLVED (2026-06-30).** Per-project WIP cost accumulation with completed-contract COGS transition: active-project direct costs are deferred from the P&L (`pnlExpenses` partition before `computePnLCore`) and recognized as COGS on completion; «تكلفة المشاريع» view + Settings «المشاريع» management (create + mark-complete trigger); branch-aware; `categorization-engine.ts` untouched; zero regression (inert without active projects). Verified deterministically (defer→recognize→restore, exact numbers) AND live (COGS 33,900 deferred → 73,900 on completion; WIP 60,000 in the costing view). See `d11-construction-wip-job-costing.md`. *Remaining linked future work:* the formal balance-sheet WIP **asset** line + revenue-side deferral (D12), both gated on the chart-of-accounts-with-types foundation (#6).
2. **D12 — Unearned / advance revenue (liability)** — needs a liability account model; gated on the Balance Sheet structural fix (chart-of-accounts-with-types). Activity-insight layer already surfaces it.
3. **D13 — ال-prefix + vendor-name leakage** — sharper diagnosis above (§0-B2). Two separable unsafe mechanisms; NEW prerequisite = per-keyword vendor-safety tagging FIRST, then guarded field-separation + a root-word/descOnly-guarded ال-mechanism.
4. **Expenses/revenues 20-row preamble cap** — parser caps preamble scan at 20 rows (the bank parser is already anchor-based and unaffected); found, not fixed; touches @DO_NOT_MODIFY files — needs sign-off.
5. **UserManagement real backend** — list/promote/delete endpoints all stubbed; deferred to its own MAX-precision session (debt B3).
6. 🟡 **Balance Sheet structural fix — Phase A DONE (2026-06-30); Phase B/C pending.** A real chart-of-accounts **type layer** (`chart-of-accounts.ts`) + **`computeBalanceSheetCore`** now build a REAL balance sheet from the actual stored journal entries (same source as Trial Balance), grouped Assets/Liabilities/Equity with **real retained earnings (Σ revenue − Σ expense from the entries)** — **balanced by construction, no plug** (live-proven: Assets 680,927.37 = Liab 566,780.61 + Equity 114,146.76). Shown side-by-side with the legacy "تقديري" sheet (kept until adopted). READ-ONLY — `erp-engine.ts` / `categorization-engine.ts` untouched. See `chart-of-accounts-foundation.md`. **Pending (Phase B/C):** see the Phase B requirements block below.
7. **Cash Flow Investing/Financing sections** — the bank classifier has no fixed-asset/owner-capital/loan categories, so these are honestly labelled "تحويلات وحركات أخرى", not fabricated; separable only after fixed-asset (D10) + owner-capital tagging exists.
8. **Smart branch suggestion** — suggest-don't-force branch inference at upload time; planned enhancement, not started.
9. **4 remaining activity profiles** — full implementations for trading/retail, manufacturing/food, professional services, contracting (beyond today's restaurant-focused insight rules); deferred pending real data.
10. **Bilingual parity (~29 rules)** — these classification rules are Arabic-only; English coverage flagged needs-human-review (`2e6349a`).
11. 🟡 **Real Owners' Equity — PARTIALLY RESOLVED in Phase A (2026-06-30).** Equity is now **real, not a plug**: retained earnings are derived from the actual journal entries (Σ revenue − Σ expense), and the balance sheet ties out by construction. **Remaining (Phase B):** capture of actual owner **contributions / drawings** (a data-entry path) to complete the equity section; the accounts/typing are already ready for them.
12. **Per-keyword vendor-safety tagging system** — NEW item from today's D13 diagnosis; the explicit prerequisite that must precede any future field-separation / ال-normalization work.
13. **Payroll-VAT basis delta (54.78 known-delta)** — NEW item from Phase A. `computePnLCore` counts two VAT-bearing **payroll-category** expenses at gross (Total, VAT-inclusive), while the journal-entry/balance-sheet basis counts them at Net + VAT-input as an asset (the more accounting-correct treatment). This produces a precise, root-caused Δ=54.78 between journal-derived net income and `computePnLCore`. Independent improvement — align `computePnLCore` in a separate session; do NOT touch it now.
14. ✅ **Alerts-page Fix A — empty/partial rows RESOLVED (2026-07-01, commit `554c80cf`).** Central `isEmptyPartialRow` guard in `ingestion-engine.ts` (finalRecords stage, all five modules, processors/engines untouched): a parsed row is diverted to `skippedRows` (traceable, not deleted) only when it has NEITHER identity (entity/invoice/description/date) NOR any money (all amount fields null-or-zero). Intentional zero-with-identity records are kept; no-identity-but-real-money rows are kept and flagged `MISSING_VENDOR`. Live-proven: 4 excluded / 1134 kept on current data; crafted upload diverted 1 partial, produced 1 valid; balance gate 0.00. Stops the fake «غير محدد / 0 / غير متوفرة» records at the source. Design: `alerts-fixes-group1.md`.
15. **One-time cleanup of the 4 pre-existing fake rows** — the 4 empty/partial records already persisted in `erp_registry.json` (from uploads before Fix A) will NOT disappear automatically; they need a one-time cleanup (a backfill or re-upload). Fix A's guard prevents any recurrence on future uploads. Low-risk follow-up (e.g., extend `je_backfill.ts` or a small prune pass gated by `isEmptyPartialRow`).

Items #2, #6, #11, #13 relate to the chart-of-accounts foundation (Phase A done); #3, #12 are the engine-tokenization track; #14/#15 are the alerts-page track (Fix B below still open); the rest are independent.

**Alerts-page fixes (from the alerts/errors-page diagnostic) — track status:**
- **(أ) ✅ RESOLVED** — empty/partial fake rows (item #14; commit `554c80cf`).
- **(ب) OPEN — next step:** governance escalation is dev-broken because `ValidationReviewScreen.tsx` writes directly to Firestore (`addDoc`), which is DEV MOCKED, and it flips the record status to ESCALATED *inside* the failing `try` (so the button silently does nothing). Fix: a new `POST /api/erp/governance/escalate-record` endpoint storing into the existing `devMemoryDb.governanceRequests` (persisted via `persistGovernanceRequests()`), with the client updating status to ESCALATED only *after* a successful response. Does NOT touch categorization/erp engines. Design: `alerts-fixes-group1.md`.
- Remaining diagnosed (later): global anomaly count shown per-section; near-identical cross-module generic checks; dead `Anomalies` field feeding the admin `AlertsReport`; parallel severity-vs-riskScore systems (score 30 shown under "critical" filter); overlapping CRITICAL/HIGH counters.

### Chart-of-Accounts Foundation — Phase A EXECUTED (2026-06-30); Phase B/C pending
**Phase A (read-only) — DONE:** `chart-of-accounts.ts` (account-type classifier, 160 accounts, zero unclassified) + `balance-sheet-core.ts` (`computeBalanceSheetCore`, same aggregation as Trial Balance, real retained earnings, no plug) + `RealBalanceSheet.tsx` (real balance sheet from the **stored** journal entries — same source as Trial Balance/General Ledger — shown side-by-side with the legacy estimated sheet). **Live-proven balanced** (680,927.37 = 566,780.61 + 114,146.76); reconciles to `computePnLCore` with revenue exact and a documented Δ=54.78 (item #13). `erp-engine.ts` / `categorization-engine.ts` untouched. See `chart-of-accounts-foundation.md`.

**Value-of-the-gate note (process evidence):** a real classifier bug — "تكلفة المبيعات" (COGS) was caught by the revenue rule via the substring "مبيعات" and mis-typed as revenue — was **discovered by the halala-level reconciliation gate** (the balance identity alone had masked it, since moving COGS to negative-revenue leaves net income unchanged). Fixed. This is concrete evidence that the strict reconciliation gate earns its keep.

**Phase B requirements (in priority order, each its own confirmed step):**
- **(أ) ✅ RESOLVED — Stored-JE ↔ current-records sync (stale JEs).**
  - **B-أ-1 (backfill) — DONE (2026-07-01):** a one-time backfill regenerated ALL journal entries from the current records, replacing the stale stored set entirely (**1179 → 1131**). Old manual `isActive` edits intentionally not preserved (fresh entries are the source of truth). **Both acceptance gates passed:** balance identity **0.00 to the halala** (Assets 565,811.78 = Liabilities 682,703.61 + Equity −116,891.83) and NI reconciliation **Δ = 54.78 only** (the known payroll-VAT delta, item #13). **Live-proven** via the running dev server's `/api/debug/journalEntries/raw` (served 1131 active JEs across 4 source files; `computeBalanceSheetCore` on the live payload → difference 0.00, balanced ✓). The stale-JE issue is now resolved; Trial Balance / General Ledger / Balance Sheet all reflect current records (shared source). `erp_registry.json` updated (old JEs fully replaced). `erp-engine.ts` / `categorization-engine.ts` untouched. Design: `je-sync-proposal.md`.
  - **Permanent operational tool:** `scripts/je_backfill.ts` — dry-run by default (prints both gates with real numbers, writes nothing); `--apply` persists. Re-runnable any time to re-sync JEs from current records.
  - **B-أ-2 group 1 — DONE (2026-07-01, commit `33f14d96`):** incremental sync via a shared `syncJournalEntriesForFile(records, fallbackModule, tenantId, extraRemoveFileIds)` helper in `server.ts` (after `persistRegistry`): groups by module, excludes orphan records via `JE_VALID_MODS`, delete-then-regenerates keyed by `sourceFileId` (reuses the delete-by-file pattern at 3292), dev-only guard. **Hooked at `activate`** (after `records.push`, ~2183) **and `replace`** (~2398, passing `[targetFile.id, targetFile.fileHash]` to drop the archived file's JEs — the replacement has a different fileHash). `erp-engine.ts` / `categorization-engine.ts` untouched. **Live-proven** (real dev server, no backfill run): new upload via `staged-upload → activate` auto-generated the file's JE (1131→1132), both gates PASS (0.00; Δ54.78); re-uploading the same file did **not** duplicate JEs (idempotent); the `replace` path deduped records→1 and JE→1 with gates PASS. **Visual UI verification approved by the user.** Design: `je-sync-incremental.md`.
    - **Honest finding (pre-existing, out of B-أ-2 scope):** the `activate` handler appends records with **no dedup**, so a *direct re-activate* of the same file doubles that file's *records* (JEs stay correct — generated from the incoming batch). In the real UI a `CORRECTED_VERSION` re-upload routes through `replace` (which dedups), so this isn't hit in normal flow. Candidate follow-up: add record dedup to the activate path (separate item).
  - **B-أ-2 remaining — OPEN (separate step):** hook `restore` (3259) · per-**record** idempotency for the single-fix path (3584, `sourceRecordId` not `sourceFileId` — per-file removal there would wipe the file's other JEs) · optional hook for `dev/sync` (669, multi-module, no live client). Until done, those less-common paths still need a manual `je_backfill.ts --apply`.
- **(ب) Formal WIP asset line** — post a real WIP journal entry on defer/complete so D11's WIP appears as a balance-sheet **asset** (today it's an App-level P&L deferral only).
- **(ج) D12 — unearned/advance revenue** — credit `إيراد مقدم (التزام)` on advances (erp-engine), recognized on delivery; the type layer already classifies it as a liability.
- **(د) Owner contributions / drawings capture** — a data-entry path to complete item #11's equity section.
- **(هـ) Cash Flow investing/financing (item #7)** — enrich bank-entry contra-accounting so the contra-account type drives the investing/financing split.

**Phase C (later):** opening balances (migration) + AR/AP aging.

## Session closing summary (definitive stopping point)
Across this body of work, Fionira reached: **full security hardening**; a **complete UX flow**; **5 activity-aware
intelligence profiles** (insight-only, engine frozen); **11 of 13 engine debt items resolved** with a full
audit trail (D11 now resolved via WIP/job-costing; D13 re-measured and honestly left open with a sharper
diagnosis); a **complete, honestly-labelled
four-statement financial suite** — Income Statement, Trial Balance, Balance Sheet (**now a REAL one from journal entries, balanced no-plug (Phase A 2026-06-30)**, with the legacy "تقديري" kept side-by-side for comparison), and a
real bank-reconciled Cash Flow; **real multi-bank and multi-branch support**; and a **3-phase IA consolidation**
(bank-pages merge + Visual retire → Owner Home + waterfall relocation + Owners Summary retire → Budget vs Actual).
**All 12 remaining items are fully documented above with context for clean resumption at any future time.** This
is a natural, complete stopping point.

> Resume point for any future session. HEAD = `74b3638`. Working tree clean except the
> long-standing untouched runtime/state files (`data/erp_registry.json`, `data/uploads.json`,
> and a few `data/**/staged-files/*.staged` left from live upload testing — all under the
> git-ignored/runtime `data/` tree). Evidence-based; pulled from live git + file state, not memory.
>
> **Latest segment (2026-06-22): Bank module audited & hardened end-to-end** — parser robustness,
> bank-native classification, dedicated reconciliation/movements pages, multi-account segmentation,
> and `branchId` established as a system-wide dimension. See §2 (commits `f1e723a`→`74b3638`), the new
> §3 "Bank Module" subsection, and §4 debt additions.

## 1. What this project is

Fionira is an **Arabic-first financial intelligence + governance platform for Saudi SMEs**. It is built
to act as the **expert *for* a non-specialist user** — the owner does not need to know accounting; the
system classifies, validates, and governs the financials and surfaces plain-language decisions. It is
**not** a traditional ERP and does not push accounting mechanics onto the user.

## 2. Complete chronological commit ledger (root → HEAD, 56 commits)

This Claude Code session resumed at `12a0529`; commits `2aaa928` → `892c4df` are this session's work.
Everything above `12a0529` was already in history at session start (security/UX/early-classification).

| # | Hash | Tag | Description |
|---|---|---|---|
| 1 | `be5d30d` | [INIT] | Initial clean commit (start of recoverable history) |
| 2 | `464ccdc` | [SECURITY] | claims-based auth, RBAC, remove tamper route, Firestore isolation [PR-1..7] |
| 3 | `a9e16bc` | [SECURITY] | harden subcollection tenant isolation via parent-doc lookup (PATCH-7 follow-up) |
| 4 | `355999c` | [UX] | unblock new-user login bootstrap + wire WelcomePage |
| 5 | `09974d8` | [SECURITY] | secure first-admin bootstrap in fix-role handler |
| 6 | `8e6ca83` | [ARCHITECTURE] | architecture data-plane map + operational readiness audit |
| 7 | `1e644fb` | [SECURITY] | ensure sensitive files are gitignored |
| 8 | `7ee4660` | [UX] | improve first-upload experience in FileManagement |
| 9 | `934892e` | [UX] | fix hardcoded module name in upload screen |
| 10 | `eceb9e4` | [UX] | align moduleTitle with canonical sidebar labels |
| 11 | `6d713b1` | [UX] | make governance status visible after upload |
| 12 | `f6195de` | [UX] | governance pending-files alert on dashboard |
| 13 | `f2a60a4` | [UX] | governance alert when staged files exist pre-first-active |
| 14 | `01e6e19` | [ARCHITECTURE] | Phase C1 — journal_entries Postgres schema plan (no execution, no cutover) |
| 15 | `e652cc4` | [CLASSIFICATION] | audit FI engine vs account-classification reality (docs) |
| 16 | `7b47295` | [CLASSIFICATION] | reconcile classification audit vs real processed data (docs) |
| 17 | `17a598f` | [ENGINE-FIX] | harden categorization engine — confidence, normalization bug, bilingual coverage |
| 18 | `2e6349a` | [ENGINE-FIX] | complete Stage-3 normalization (per-rule verified); bilingual parity flagged |
| 19 | `ab23cc0` | [CLASSIFICATION] | forensic verification of classification history (docs) |
| 20 | `12a0529` | [ARCHITECTURE] | add CLAUDE.md auto-sync git workflow |
| 21 | `2aaa928` | [CLASSIFICATION] | remove dead code in categorization-engine |
| 22 | `37180e0` | [CLASSIFICATION] | merge duplicate keyword blocks (marketing/gov/stationery) |
| 23 | `5a95395` | [ARCHITECTURE] | split heavy vendor libs (manualChunks) — bundle 3664→725 KB |
| 24 | `b6e4e45` | [CLASSIFICATION] | unify travel category to canonical 'مصاريف سفر وانتقالات' |
| 25 | `be14600` | [CLASSIFICATION] | permanent canonicalization design principle (CLAUDE.md) |
| 26 | `52cb0b7` | [CLASSIFICATION] | activity phase 1 — restaurant/F&B wastage |
| 27 | `6a66112` | [CLASSIFICATION] | activity phase 2 — manufacturing/food |
| 28 | `a6a5731` | [CLASSIFICATION] | activity phase 3 — professional services |
| 29 | `ced0cc2` | [CLASSIFICATION] | activity phase 4 — trading/retail |
| 30 | `679f791` | [CLASSIFICATION] | activity phase 5 — contracting/construction (expenses+revenues) |
| 31 | `cf90a62` | [ENGINE-FIX] | Track 1 — context-aware tokenization (resolves 6 of 7: D1,D3,D4,D6,D8,D9) |
| 32 | `6705b53` | [DOCS] | session handoff document created |
| 33 | `bb88233` | [ENGINE-FIX] | Track 2 — D5 resolved surgically (ترجمة/translation = professional); global "ال"-prefix fix attempted, **measured unsafe** (21-record blast radius dominated by vendor-name leakage), **rejected and reverted** |
| 34 | `ecef9da` | [ENGINE-FIX] | Track A — D10 resolved (equipment purchase→fixed asset, rental-guarded); D11 partial (construction materials→existing COGS); D2/D7/D12 deferred (need new COA account) |
| 35 | `849c2b0` | [ENGINE-FIX] | Track B — D13 combined fix attempted; field-separation **measured unsafe** (8-record blast radius, legitimate vendor-signal regressions), **reverted**; D13 stays open (needs per-keyword vendor-safety tagging first) |
| 36 | `3ca0d0c` | [DOCS] | handoff update post Phase A (Track A + Track B outcomes) |
| 37 | `e46052f` | [CLASSIFICATION] | D2/D7 chart-of-accounts additions (engine routing + `CATEGORY_ORDER`); D12 deferred — later found COGS wiring incomplete (see #41/#42) |
| 38 | `e8510d6` | [AUDIT] | Balance Sheet deep audit — verdict: **actively misleading** (figures fabricated by fixed ratios; equity is a forced plug → always balances vacuously) |
| 39 | `f60038f` | [UX] | Balance Sheet honest labeling — top warning banner + 6 "تقديري" badges + reworded disclaimer |
| 40 | `9ed75b9` | [AUDIT] | Trial Balance deep audit — verdict: **sound** (real tenant-scoped journal entries; balance guaranteed by double-entry construction, not a plug); no fix needed |
| 41 | `5a165ed` | [AUDIT] | Income Statement deep audit — verdict: **sound source**; found D2/D7 NOT actually in `cogsCategories` (corrects e46052f's overstated "under COGS" claim) |
| 42 | `892c4df` | [FIX] | Income Statement `cogsCategories` — D2/D7 now genuinely end-to-end under COGS; zero regression on 730 real |
| 43 | `b0a88ba` | [DOCS] | session handoff update — financial statement triad audit complete (BS flawed+labeled, TB sound, IS sound+D2/D7 fixed) |
| 44 | `1c9cd92` | [AUDIT] | User Management live audit — page unreachable in UI + endpoints are no-op stubs (empty list, fake-success promote/delete); auth layer intact |
| 45 | `3cece7f` | [FIX] | CommandPalette mode mismatch corrected; live-verified the page is in fact reachable (audit correction) — **palette is dead code (no open-trigger exists)**; endpoints remain stubbed |
| 46 | `bc1e9ca` | [UX] | User Management discoverability — added as a Settings sub-tab (was hover-menu-only) |
| 47 | `f322ed3` | [AUDIT] | Payroll Dashboard live audit — **zero payroll data existed at the time**; Deductions KPI reads a non-existent field (always 0) found by code; GOSI panel confirmed hardcoded placeholder; read-only aggregate, independent of the intelligence engine |
| 48 | `f1e723a` | [FIX] | Payroll & Bank Excel parser robustness — real user files (`رواتب JANUARY 2025`, `Records_12042026-2.xlsx`) now parse; reconciled to the **riyal/halala** against the files' own printed control totals; fixed 3 latent bugs (negative-debit sign, Excel-serial dates, false `PAYROLL_WITH_VAT` flag). New `header-detection.ts` (sparse/multi-row headers + preamble skip) |
| 49 | `f0031f0` | [FEAT] | Bank-native classification engine — transaction type + counterparty + GL account (`bank-classification.ts`), replacing expense-style categorization for bank records |
| 50 | `9d4c76e` | [FEAT] | Dedicated Bank Reconciliation page — **was misrouted to the generic alerts/anomalies center**; opening/closing/running-balance + continuity, backward-compatible with legacy records |
| 51 | `b282746` | [FEAT] | Bank Movements — bank-native view (by transaction type / by counterparty) with cash-flow KPIs, replacing the expense chart-of-accounts view |
| 52 | `7b48c41` | [UX] | GL-nature grouping with per-nature subtotals + **universal drill-down** (account/type/counterparty → individual transactions with running balance) |
| 53 | `676bebe` | [DOCS] | Rich classification activated via the real governance **replace-flow**; control totals unchanged, verified **to the halala** before/after |
| 54 | `61347e8` | [AUDIT] | Multi-bank investigation — accounts had **NO identity captured**; multiple active bank files **silently merged** balances into one meaningless running balance (no warning); upload classifier account-blind (risk of false "replace" losing an entire account). Verdict: **actively misleading**, fix before Balance Sheet cash link |
| 55 | `b0df476` | [FEAT] | **`branchId` defined as a system-wide central dimension** (`dimensions.ts`, zero-migration default). Bank accounts now identified (`Account_Number`/`Bank_Name` from preamble) and **segmented** — Reconciliation/Movements never merge across accounts; upload classifier account-aware (safety-biased to additive). Live-verified: the exact `61347e8` false-mismatch scenario now shows **2 independently-reconciled accounts, zero false diff** |
| 56 | `74b3638` | [DOCS] | Architectural review — is bank account-segmentation generalizable? **Verdict: NO** — tied to running-balance semantics (order-dependent, stateful), unique to bank accounts today. `branchId` is the correct/sufficient generalization for the real "multiple sources" need elsewhere (payroll multi-entity, expenses/revenues multi-store — additive flows, not running balances). Bank code deliberately **left untouched** |

## 3. Current system state (factual, verified)

- **Auth / RBAC:** claims-based auth + RBAC, tamper route removed, Firestore tenant isolation, and
  PATCH-7 parent-doc subcollection isolation are **committed in code/rules** (`464ccdc`, `a9e16bc`,
  `09974d8`). Live enforcement depends on a valid Firebase project, deployed `firestore.rules`, and
  custom claims being set (`scripts/set-dev-admin-claims.ts`). **Live deploy / key validity is not
  verifiable from the repo** — see §7.
- **Data plane (current reality):** three-way. Dev/runtime uses an **in-memory JSON store**
  (`devMemoryDb` in `server.ts`) persisted to `data/*.json`; the client uses **Firestore**; a
  **Postgres** `journal_entries` schema is **planned only** (`01e6e19`, no execution, no cutover).
- **Classification engine (`categorization-engine.ts`):** Stages 0–2 hardened with `nrx`/`nTest`
  normalization (`17a598f`), Stage-3 normalization complete (`2e6349a`), **Track 1 context-aware fixes**
  (`cf90a62`), **Track 2's surgical D5 fix** (`bb88233`), and **Track A's two new Stage-3 rules**
  (`ecef9da`): construction/heavy-equipment purchase → fixed asset (rental-guarded, D10) and
  construction materials → COGS (D11). **Track B changed nothing** — its field-separation candidate was
  measured unsafe and reverted (`git diff` clean). Net effect: every engine change to date is verified
  zero-regression on the 730 real records. Treated as frozen except via approved engine-fix tracks.
- **Activity-aware layer:** 5 profiles live (restaurant_fb, manufacturing_food, professional_services,
  trading_retail, contracting_construction), **insight-only**, **zero engine coupling** — verified by
  the cross-rule non-interference test (re-confirmed after Track 1). Wired through both the expenses and
  revenues intelligence paths; activity selected via a fixed enum dropdown in Settings.
- **PATCH-7 (subcollection tenant isolation):** committed structurally (`a9e16bc`); **live Firebase
  rules deployment to a real environment remains pending/unverifiable from the repo.**

### Financial Statement Triad — Audited 2026-06-21 (Phase B)

| Statement | Verdict | Evidence / status |
|---|---|---|
| **Balance Sheet** | 🟡 **Real one delivered (Phase A); legacy estimate kept for comparison** | **NEW (2026-06-30):** a REAL balance sheet now builds from the actual stored journal entries (`chart-of-accounts.ts` type layer + `computeBalanceSheetCore`, same source as Trial Balance) — Assets/Liabilities/Equity with **real retained earnings, balanced by construction (no plug)**; live-proven 680,927.37 = 566,780.61 + 114,146.76. The legacy ESTIMATED sheet (fixed ratios, plug equity) is kept side-by-side, still labelled "تقديري", until the real one is fully adopted. Phase B pending: stored-JE↔records sync (stale), WIP asset line, D12, owner contributions/drawings. See `chart-of-accounts-foundation.md` + §0-C item 6/11. Original audit: `balance-sheet-audit.md`. |
| **Trial Balance** | ✅ **Sound** | Real journal-entry aggregation; balance **guaranteed by double-entry construction** (each entry adds its amount to one debit + one credit), **not** a forced plug; tenant-scoped; correctly excludes superseded `_v{n}` versions (`isActive !== false`); has a genuine imbalance warning. No fix needed. Audit: `trial-balance-audit.md`. |
| **Income Statement** | ✅ **Sound source** | Aggregates **real revenue/expense records** (not estimates). D2/D7 wastage/shrinkage now correctly flow into **COGS** (`892c4df`, after `5a165ed` found them landing in OPEX via a stale hard-coded list). **Net profit has been reliable throughout** — the D2/D7 gap only affected the COGS/OPEX *split presentation*, never the bottom line. Audits: `income-statement-audit.md`, `income-statement-d2-d7-cogs-fix.md`. |

**Strategic implication:** the core **double-entry / posting foundation is sound** (Trial Balance + Income
Statement both run on real data). The **one** flawed statement (Balance Sheet) is flawed **only in its own
ratio-conversion layer** — it distorts good upstream data, it does **not** inherit bad data. So the fix
surface is contained and well-understood, not a systemic data-integrity problem.

### Bank Module — Audited & Hardened 2026-06-22

The bank-module segment (commits `f1e723a`→`74b3638`) is **closed: hardened, live-tested, and
architecturally reviewed**. Verified against the user's **real** files (`رواتب JANUARY 2025`,
`Records_12042026-2.xlsx`), not synthetic stand-ins.

- **Parser (`header-detection.ts`):** robust against sparse / non-contiguous header cells, two-row merged
  headers (payroll), and arbitrary-length metadata **preambles** (the Saudi bank format's ~21-row
  preamble). Both real files parse; reconciled **to the halala** against the files' own printed control
  totals (bank: debit `671,818.18` / credit `671,882.98`; payroll net `38,657`).
- **Classification:** bank-native **3-axis** — transaction type, counterparty, and **GL account/nature**
  (`bank-classification.ts`) — replacing the expense chart-of-accounts lens that was previously (wrongly)
  applied to bank records.
- **Reconciliation / Movements:** dedicated bank pages (the "مطابقة البنوك" tab previously **misrouted to
  the generic anomalies center**). Per-account opening/running/closing balance + continuity, GL-nature
  subtotals, and a **universal drill-down** (account / type / counterparty → individual transactions with
  running balance).
- **Multi-account:** accounts are **identified** (`Account_Number`/`Bank_Name`/`Account_Key` from the
  preamble) and **segmented — never merged**. The `61347e8` failure (two accounts silently merged into one
  meaningless running balance with a false "فرق") is fixed: live test shows **2 accounts, each reconciled
  independently, zero false diff**. The upload classifier is **account-aware**, safety-biased toward
  *additive* (a different account is never offered as a "replace" of another).
- **`branchId` (system-wide):** defined once in `dimensions.ts` with a zero-migration `'default'` — the
  **reusable** dimension for OTHER modules' multiple-source needs (payroll multi-entity, expenses/revenues
  multi-store). **Rollout path documented, NOT yet implemented** in those modules (their processors are
  `@DO_NOT_MODIFY`).
- **Generalization verdict (`74b3638`):** the bank *never-merge* logic is **NOT** generalized — it is tied
  to running-balance semantics unique to banks today; `branchId` is the sufficient generalization. Bank
  code left untouched (no refactor for theoretical purity). **Inventory** is noted as a *future* candidate
  for running-balance segmentation **only if** it becomes a real perpetual-inventory ledger (not built
  today, no current need).
- Artifacts: `payroll-bank-parser-fix.md`, `bank-rich-classification-activation.md`,
  `multi-bank-support-investigation.md`, `system-wide-branch-dimension-and-bank-phase1.md`,
  `multi-source-segmentation-generalization-review.md`.

## 4. Open technical debt (live from `engine-technical-debt.md`)

**RESOLVED — 10 items:** D1, D3, D4, D6, D8, D9 (Track 1) + **D5** (Track 2) + **D10** (Track A) +
**D2, D7** (COA additions `e46052f`, now genuinely end-to-end under COGS as of `892c4df`). All zero-regression.

**PARTIALLY RESOLVED — 1 item:** **D11** (Track A) — construction materials now route to the existing
COGS raw-materials account; a *dedicated* construction direct-cost/WIP account is still missing.

**DEFERRED — needs a NEW account-type the system doesn't have + an accountant decision:**

| # | Description | Discovered | Severity |
|---|---|---|---|
| D12 | customer advance → **deferred/unearned revenue is a LIABILITY**; the Balance Sheet is estimated with no liability-account infrastructure, so there is no correct home yet (adding it as revenue would be accounting-wrong) | Phase 5 (`679f791`) | MEDIUM-HIGH |

**D13 — STILL OPEN, THRICE-measured (Track 2 + Track B + 2026-06-29 `26708922`), definitive diagnosis in §0-B2.**
Track 2 showed a universal "ال" strip re-exposes vendor-name leakage (`المعدات`→`معدات`→fixed-asset for a
*rental*; `الموقع`→`موقع`→subscriptions). Track B showed the prerequisite **field-separation** itself
regresses *legitimate* vendor signal. Today's re-attempt (hybrid field-separation + description-only "ال")
proved the two mechanisms **separable and each independently unsafe**: field-separation still regresses the
legitimate `معدات المخابز`/`tools_high_value` signal (1/867), and "ال"-normalization independently breaks
root words (`ألوان`→`وان`) and exposes descOnly keywords (`المكتب`→rent). **Conclusion (superseding earlier
"combined mechanism" wording):** D13 needs **per-keyword vendor-safety tagging FIRST** (declare per pattern
whether it may match the vendor name), THEN guarded field-separation, THEN a root-word/descOnly-guarded "ال".
Full detail + the definitive 12-item registry in **§0** (`engine-fix-d13-combined-resolution.md`).

**NEW debt found during the bank-module segment (2026-06-22):**

| # | Description | Severity | Status |
|---|---|---|---|
| B1 | **Expenses/revenues 20-row preamble cap** — `expenses-processor.ts` & `revenues-processor.ts` cap header search at `Math.min(20, …)`. A >20-row preamble (the same shape that broke the bank parser) makes them fall back to row 0 and **silently emit garbage records** (null financials, "غير محدد"). Found & reproduced (test), **not fixed** — both files are `@DO_NOT_MODIFY`. | MEDIUM-HIGH | Needs user sign-off to fix (apply `detectTabularHeader` or raise the cap) |
| B2 | **CommandPalette is dead code** — has **no open-trigger anywhere in `src`**; the mode-mismatch fix (`3cece7f`) was cosmetic, the palette itself remains unreachable. | LOW | Cosmetic; either wire a trigger or remove |
| B3 | **UserManagement backend endpoints stubbed** — list/promote/delete are no-ops (empty list, fake-success). Page is now reachable via 2 paths (`bc1e9ca`); backend remains stubbed. | MEDIUM | Deferred to its own MAX-precision session (standing decision) |

## 5. Explicitly NOT started

- **Bilingual parity** — flagged needs-human-review (~29 rules per the prior audit; see `17a598f`,
  `2e6349a`). Not implemented.
- **Any activity beyond the 5** implemented.
- **Any engine-fix track beyond Tracks 1–2** (new-accounts, coverage, and the combined
  field-separation + ال track all pending).
- **Accounting Bundle** — dedup re-enable, VAT-posting formalization, double-entry enforcement.
  Explicitly still **gated**, not started.

## 6. Recommended next-session priority (professional opinion)

**The Bank module segment is CLOSED** — hardened, live-tested, and architecturally sound
(parser, 3-axis classification, multi-account segmentation, `branchId` dimension). Continue Phase B on the
**remaining unaudited modules**, in priority order by financial / user-trust sensitivity (apply the SAME
discipline: read-only audit first, then label-or-fix **only after explicit confirmation**):

1. **TaxDeclaration** — ZATCA-facing, **highest remaining financial sensitivity** (wrong VAT figures have
   regulatory consequence).
2. **OwnersSummary** — owner-equity / drawings view; trust-sensitive.
3. **SmartInvoice / QuotationManager** — outward-facing documents (customer-visible).

**Already covered this segment (no longer top of queue):** PayrollDashboard (audited `f322ed3`) and
BanksDashboard (fully hardened `f1e723a`→`74b3638`).

**Separately, explicitly deferred (ready to scope when prioritized):** **UserManagement real backend
implementation** (endpoints still stubbed — debt B3) — its own MAX-precision session per standing decision.

**Still-open engine/accounting debt** — the **definitive, complete 12-item registry is now in §0-C** (single
source of truth; supersedes the fragmented mentions that previously lived here). Highlights:
- **D12** (deferred/unearned-revenue LIABILITY) + **D11's** dedicated construction WIP/direct-cost
  account — both need the **chart-of-accounts-with-types / account-driven balance sheet** foundation
  (also what unblocks the real Balance Sheet). Bring the account naming + IFRS treatment to the
  financial-manager user as a product decision.
- **D13** (the "ال"/vendor-leakage tokenization issue) — highest risk; thrice-measured unsafe. Definitive
  diagnosis in §0-B2: the NEW prerequisite is **per-keyword vendor-safety tagging FIRST**, then guarded
  field-separation, then a root-word/descOnly-guarded "ال". May stay open.

Same baseline-first, one-change-at-a-time, full-regression discipline as every track so far.

### D11 — Full Construction Materials WIP (Job Costing): ESCALATED to top priority

**ESCALATED from "deferred" to "planned with equal priority to TaxDeclaration"** — per the user's
explicit strategic decision (2026-06-22): Fionira must build the complete, accounting-correct solution
for every supported activity from the start, not a partial solution awaiting real-customer demand.
(Today D11 routes construction materials to the existing COGS raw-materials account as a stopgap; the
*dedicated* WIP/direct-cost infrastructure does not exist.)

This requires its **OWN dedicated MAX-precision session** to design and implement proper
work-in-progress cost tracking per project: material direct-cost accumulation, percentage-of-completion
considerations, and the WIP-to-COGS transition on project completion — **not a quick patch**.

**Sequencing:** follows the restaurant-data verification (done, commit `ca295fd`) and remains queued
**alongside TaxDeclaration as a top-priority next session**, under the same rigor used throughout this
session (live-tested, evidence-based, one verified step at a time). It shares the
**chart-of-accounts-with-types / account-driven balance sheet** foundation with D12 and the real
Balance Sheet fix.

### Strategic Roadmap — Multi-Branch/Multi-Activity Rollout (Planned, Not Started)

**Context.** `branchId` is now established as a **central, system-wide dimension** (`dimensions.ts`,
commit `b0df476`) with a zero-migration `'default'` — but it is **applied to the bank module ONLY**. No
other module (expenses, revenues, payroll, inventory) yet carries or uses it. The user's strategic intent
is to extend it broadly:
- **Multiple branches / activities across every module** — each branch/activity with its own expenses,
  revenues, payroll, and bank accounts, segmentable and filterable end-to-end (dashboards, reports,
  financial statements) without ever blending where blending is wrong.
- **Proposals for new modules/sections** that this dimension enables.
- **Possible restructuring** of existing pages/architecture to make branch/activity a first-class lens.

**Recommendation (professional opinion).** This is a **large strategic scope that needs its own dedicated,
full session** — design → incremental, module-by-module implementation → **live testing per module** (the
same evidence-based, one-module-at-a-time discipline proven on the bank module today). It must **NOT** be
merged into, or bolted onto, any other task; doing it piecemeal alongside audits would compromise both.

**Proposed sequencing — do these FIRST, before opening Multi-Branch Rollout:**
1. **Critical restaurant-data verification** (see §7) — must complete first; gates any new engine work.
2. **TaxDeclaration audit** — highest remaining financial sensitivity (ZATCA-facing).
3. **D12 (deferred/unearned-revenue LIABILITY) + the real BalanceSheet structural fix** — i.e. the
   chart-of-accounts-with-types / account-driven foundation.
4. **Only then:** open **"Multi-Branch / Multi-Activity Rollout"** as a standalone, full phase of its own.

**Status: PLANNED, NOT STARTED.** Nothing here is implemented; this entry exists so the strategic
direction stays visible and is not lost. The reusable groundwork already in place: `branchId` +
`withBranch()` in `dimensions.ts`, and the documented per-module adoption path in
`system-wide-branch-dimension-and-bank-phase1.md` (§ Task 7).

### Smart Branch Suggestion (Planned Enhancement, Not Started)

Context: Real multi-branch support is now live (commit ae55d967) — the user explicitly assigns a branch at
upload time via a dropdown, defaulting safely to 'الفرع الرئيسي' for single-branch tenants. This
explicit-assignment design is DELIBERATE and CORRECT: branch/activity is an organizational decision the
user makes BEFORE uploading, not a fact discoverable from file content. Auto-inferring branch from filename
or in-file text would repeat the exact failure class fixed today in categorization-engine.ts (a generic
word like 'مكتب' silently hijacking a category) — but applied to branch assignment, where a wrong silent
guess could misroute large sums between branch reports.

Planned future enhancement (additive, never replacing explicit choice): After the user uploads a file and
has selected (or defaulted to) a branch, the system MAY analyze the file's content for repeated
location/branch-name signals (e.g., 'جدة' appearing frequently in transaction descriptions) and offer a
SUGGESTION — never a silent decision — through the same proven 'suggest, don't force' governance pattern
already built for the 5 activity profiles (Phase 1-5) and the bank account-aware classifier. The user
accepts or dismisses with one click; declining never blocks or alters the upload.

This is explicitly NOT urgent and NOT scoped for the next session — documented here only so the idea isn't
lost, per standing practice.

## 7. Critical operational reminders for next session

- **⚠️ VERIFICATION NEEDED (named, explicit — check FIRST in the practical-testing phase):** Compare the
  current engine output on the user's **real restaurant Excel data** against the user's own
  **previously-corrected results** (which pre-date today's Track 1/2/A/B engine changes), to confirm no
  silent regression was introduced for that specific real-world dataset. The in-repo 730-record fixture
  showed **zero** regression at every step, but it is not guaranteed identical to the user's latest real
  file — so this is a distinct, mandatory check, not a vague caveat. Run it before any new engine work.
  **STILL PENDING — and do NOT conflate it with the 2026-06-22 bank/payroll real-file work.** That work
  exercised the **parser + bank classification** against real bank/payroll statements; it did **not** touch
  `categorization-engine.ts` and did **not** re-run the user's previously-corrected **restaurant expense
  classification** against the post-Track-1/2/A/B engine. The exact comparison described here
  (engine output on the user's corrected restaurant data) has **not** been performed.
- **Firebase service-account key:** `firebase-service-account.json` exists in the repo root; the prior
  checkpoint notes **key rotation/validity must be verified manually by the user** — do not assume the
  live Firebase environment is functional. Auth/RBAC and PATCH-7 enforcement are unverifiable from the
  repo alone.
- **Git history starts at `be5d30d`** ("Initial clean commit") — no earlier history is recoverable.
- **The user is a financial manager (domain expert), not a developer.** Claude Code executes; the user
  (with the consultant) decides direction. Surface professional disagreement, but do not change scope
  unilaterally.
- **Precision discipline = MAX, non-negotiable project policy**, for anything touching
  `categorization-engine.ts`, `erp-engine.ts`, `server.ts` auth, or `firestore.rules`: baseline first,
  one change at a time, full regression after each, honest reporting, commit only on clean verification.
- **Sync workflow (CLAUDE.md):** project syncs between two machines; commit + push after each meaningful
  change. The three modified data/lock files in the working tree are long-standing and intentionally
  left untouched throughout this session.
- **Verification fixtures available:** the real 730-record dataset (`data/erp_registry.json`) + the 5
  synthetic activity fixtures (`_artifacts/architecture/phase*-synthetic-*.json`) are the regression
  harness for any future engine change.


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 3: `_artifacts/architecture/engine-technical-debt.md`
═══════════════════════════════════════════════════════════════

# Categorization Engine — Consolidated Technical Debt

These are engine-level issues discovered while building activity-aware classification
(Phases 1–3). **The engine is deliberately frozen** (`categorization-engine.ts` is
`@DO_NOT_MODIFY`). Per user decision, none of these are touched now — they are recorded
here and will be fixed **together in one Max-level session AFTER all activity profiles are
complete**, since later phases may surface more of the same class of bug.

All items below are **keyword-collision / tie-break** issues in the scoring engine, or a
**missing chart-of-accounts category** — not regressions introduced by the activity rules.

## Resolution status

- **Track 1 (context-aware tokenization) — DONE.** Resolved **D1, D3, D4, D6, D8, D9** with surgical
  context guards + a `descOnly` vendor/description separation. Verified zero regression on the 730 real
  records and on all 5 synthetic fixtures. See `engine-fix-track1-context-tokenization.md`.
- **D5 — RESOLVED (Track 2).** Fixed with a targeted, semantically-correct keyword: `ترجمة`/translation
  is now recognized as a professional service, so the translation-office expense classifies as
  أتعاب مهنية واستشارات. Zero regression on the 730 real records; only the D5 record changed. This
  sidesteps D13 entirely (no dependency on the "ال" root).
- **D13 — STILL OPEN; global fix MEASURED and REJECTED as unsafe (Track 2).** A symmetric "ال"/"لل"
  strip was implemented and measured: it changed **21 records** (17 real + 4 synthetic). Crucially it
  **re-exposes the vendor-name-bleed class** — stripping the article off a vendor name surfaces a
  generic word that then bleeds into item-keyword matching (`المعدات`→`معدات`→fixed-asset for a *rental*
  company; `الموقع`→`موقع`/website→subscriptions for site labor). Several "improvements" on real data
  also relied on this accidental bleed. **Reverted.** D13's true fix must be done **together with
  vendor/description field separation** (the `allText→descText` item-keyword change deferred in Track 1)
  — not as a standalone tokenization change. Re-scoped accordingly.
- **Track A (independent items) — DONE** (engine-only). **D10 resolved** (equipment purchase →
  fixed-asset, rental-guarded). **D11 partially resolved** (construction materials → existing COGS
  raw-materials account; dedicated WIP/direct-cost account remains deferred). **D2, D7, D12 deferred
  with reason** — each needs a NEW chart-of-accounts entry in the protected `financial-utils.ts` plus
  an accountant decision (out of engine-only scope); the activity-insight layer already surfaces them.
  Zero regression on 730 real + only 3 intended synthetic changes. See
  `engine-fix-trackA-independent-items.md`.
- **Track B (D13 combined mechanism) — ATTEMPTED, MEASURED unsafe, D13 STILL OPEN.** Field separation
  (Stage-2 item keywords → description only) was implemented and measured ALONE first: 8-record blast
  radius including **genuine regressions** — vendor names carry *legitimate* signal sometimes
  (`عامل سباكة`/plumber → maintenance; `معدات المخابز`/equipment vendor → fixed-asset are *correct*
  vendor signals that blunt field-separation discards). A lower-score vendor pass does not separate
  legitimate signal from leakage either. **Reverted** (engine unchanged from Track A; D5 not regressed).
  D13's real fix needs **per-keyword vendor-safety tagging FIRST**, then field separation, then "ال" —
  a larger separately-scoped effort. See `engine-fix-trackB-combined-d13.md`.
- **D13 combined resolution (2026-06-29) — RE-ATTEMPTED with a hybrid, MEASURED unsafe again, STILL OPEN.**
  Re-ran the full two-layer plan on an 867-record corpus (802 real + 65 synthetic, all 5 activity sets).
  (1) **Field-separation (hybrid: description full score + vendor name at 0.3× hint)** — lowered the blast
  radius to **1 record** (vs Track B's 8) but did **not** fix the core issue: that 1 record is the
  `معدات المخابز` / `قالب إنتاج` case (`group=tools_high_value`, 6,900 SAR) — a *legitimate* fixed-asset
  vendor signal wrongly pushed to consumables. Confirms: a uniform low-score vendor pass cannot separate
  legitimate strong vendor signal from leakage. (2) **ال-normalization (description-only)** — independently
  unsafe: **root-word breakage** (`ألوان`→`وان`, loses raw-materials) and **descOnly exposure**
  (`المكتب`→`مكتب`→rent, hijacks telecom/utility bills into rent). The two unsafeties are **separable** —
  field-separation does NOT make ال safe. **Reverted; no forced fix.** Sharper prerequisite re-confirmed:
  per-keyword vendor-safety tagging, then a guarded ال-mechanism (root-word guard + descOnly disambiguation).
  D5's ال-prefixed form (`الترجمة`) rides on this same future work; its bare form stays on the narrow patch.
  See `engine-fix-d13-combined-resolution.md`.
- **Chart-of-accounts additions — D2 & D7 RESOLVED (end-to-end), D12 still DEFERRED.** Added two new
  COGS accounts (`تكلفة المبيعات - هدر وتلف إنتاج` for D2; `تكلفة المبيعات - هالك وعجز مخزون` for D7) to
  `CATEGORY_ORDER` + two new Stage-3 routing rules; they display under COGS in the Income Statement.
  Zero regression on 730 real, only 3 intended synthetic changes, activity non-interference confirmed.
  **D12 deferred** — it is a *liability* (unearned revenue), and the balance sheet is fully estimated
  with **no liability-account infrastructure**; adding it as revenue would be accounting-wrong. Needs an
  account-driven balance sheet + accountant decision. See `chart-of-accounts-additions-d2-d7-d12.md`.

| # | Symptom (real-ish input) | Engine output (wrong) | Expected | Likely cause | Found in |
|---|---|---|---|---|---|
| D1 | `فاتورة كهرباء المصنع` (utility bill) | مصروفات عمومية وإدارية - صيانة وإصلاح | منافع (كهرباء ومياه) | `كهرباء` appears in the maintenance keyword set (electrical-repair sense) and wins the tie vs the utilities sense | Phase 2 |
| D2 | `هدر مواد خام تالفة في الإنتاج` (production wastage) | تكلفة المبيعات - مواد خام ومكونات | a distinct "production wastage" account | **No such account exists** in the chart of accounts (`financial-utils.ts`); creating it needs an engine + COA change | Phase 2 |
| D3 | `طباعة تقارير لحساب العميل` (printing/reports) | تكلفة المبيعات - مواد تعبئة وتغليف | مصروفات عمومية وإدارية - قرطاسية ومطبوعات | `طباعة` is a packaging keyword and routes printing to packaging COGS | Phase 3 |
| D4 | `بدل إقامة فندق لمهمة عميل` (accommodation allowance) | مصروفات عمومية وإدارية - رواتب ومنافع موظفين - رواتب وأجور | مصاريف سفر وانتقالات | `بدل` triggers the personnel/salary path; "بدل إقامة" (travel per-diem) collides with salary "بدل/بدلات" | Phase 3 |
| D5 | vendor `مكتب ترجمة معتمد` (translation office) | مصروفات عمومية وإدارية - إيجارات | أتعاب/خدمات مهنية (translation service) | `مكتب` is a rent keyword (office space); any vendor whose name contains `مكتب` is pulled toward إيجارات | Phase 3 |
| D6 | `راتب محاسب أول` (accountant's salary) | مصروفات عمومية وإدارية - أتعاب مهنية واستشارات | رواتب ومنافع موظفين - رواتب وأجور | `محاسب` (accountant → professional services) outweighs `راتب` (salary); an employee's job title hijacks the category | Phase 3 |
| D7 | `هالك مخزون`, `عجز جرد سنوي` (inventory shrinkage) | تكلفة المبيعات - مواد خام ومكونات / مصروفات عمومية - أخرى | a distinct "inventory shrinkage" account | **No such account exists** in the chart of accounts (same class as D2) | Phase 4 |
| D8 | `شحن وارد للبضاعة من المورد` / `نقل مشتريات أصناف` (inbound freight) | مصروفات بيعية وتسويقية - نقل وتوصيل للعملاء (outbound!) / مواد خام ومكونات | تكلفة المبيعات - شحن ونقل للداخل | `شحن/نقل` matched without distinguishing **inbound (وارد/مشتريات)** from **outbound (للعملاء)** | Phase 4 |
| D9 | vendor `مستودع الجملة` (wholesale warehouse) | مصروفات عمومية وإدارية - إيجارات | تكلفة بضاعة / COGS | `مستودع` (warehouse) is a rent keyword; the **vendor name** hijacks the category — same root as D5 | Phase 4 |
| D10 | `شراء خلاطة خرسانة جديدة` (equipment purchase) | مصروفات عمومية وإدارية - أخرى | أصول ثابتة - أجهزة ومعدات (capitalize) | **Coverage gap** — `خلاطة خرسانة` (concrete mixer) isn't in the CAPEX-equipment keywords, so a clear asset purchase is not capitalized | Phase 5 |
| D11 | construction materials/labor (`أسمنت`, `حديد تسليح`, `بلوك خرساني`, `يوميات عمال`) | مصروفات عمومية وإدارية - أخرى (all of them) | direct project cost / WIP (COGS) | **Coverage gap** — the engine has no construction vocabulary; all project costs fall to "G&A - other" | Phase 5 |
| D12 | customer advance payment (revenue) | إيرادات المبيعات | إيراد مقدم / unearned (liability) | **Missing account** (revenue side) — no deferred-revenue account exists (same class as D2/D7) | Phase 5 |
| D13 | `التدقيق`, `المورد`, `للبضاعة` (prefixed words) | keyword silently NOT matched | should match the base word | **Arabic "ال"/attached-preposition prefix breaks word-boundary matching** — systemic; blocks full D5 fix | Track 1 |

**Status legend:** ✅ resolved → **D1, D3, D4, D6, D8, D9** (Track 1), **D5** (Track 2), **D10** (Track A),
**D2, D7** (COA additions). 🟡 partial → **D11** (Track A — COGS routing; WIP account deferred).
⛔ deferred → **D12** (liability; needs account-driven balance sheet + accountant). ⚠️ open/rescoped →
**D13** (pair with vendor/desc field separation, after per-keyword vendor-safety tagging).

## Diagnostic note — the shared root pattern (D3–D6, and likely D1)

D3–D6 (and D1) are **not five unrelated bugs — they are one structural defect repeated**:

> A **single Arabic word** is matched as a **substring** and chosen on its own, **without
> understanding the full sentence context**. One token has two senses, and the keyword scorer
> fires on the wrong sense because it never weighs the surrounding words.

- `طباعة` (printing) → assumed packaging, ignoring "تقارير" (reports) → D3
- `بدل` (allowance) → assumed salary, ignoring "إقامة فندق" (hotel per-diem = travel) → D4
- `مكتب` (office) → assumed rent, ignoring it is part of a **vendor name** ("مكتب ترجمة") → D5
- `محاسب` (accountant) → assumed professional service, ignoring "راتب" (salary) right before it → D6
- `كهرباء` (electricity) → assumed electrical-repair, ignoring "فاتورة" (bill = utility) → D1

Phase 4 added two more instances of the very same pattern:
- `شحن/نقل` (shipping) → picked outbound vs inbound on the bare token, ignoring `وارد/مشتريات`
  (inbound) vs `للعملاء` (outbound) → D8
- `مستودع` (warehouse) → assumed rent, ignoring it is part of a **vendor name** ("مستودع الجملة"),
  exactly like `مكتب` in D5 → D9

**Implication for the fix session:** patching each keyword individually is whack-a-mole. The durable
fix is **context-aware scoring** — e.g. (a) require/deny qualifiers (negative lookahead: `طباعة` is
NOT packaging when near `تقارير/مستندات`; `بدل` is NOT salary when near `إقامة/فندق/سفر`; `شحن` is
inbound when near `وارد/مشتريات/من المورد`), (b) separate the **vendor-name** field from the
**item-description** field so a vendor's name (`مكتب…`, `مستودع…`) can't drive the item category, and
(c) give multi-word phrases priority over single-token substrings. Fixing the **pattern** should
resolve D1, D3, D4, D5, D6, D8, D9 together.

The other items split into two more classes:
- **Missing accounts** (need new chart-of-accounts entries): D2 (production wastage), D7 (inventory
  shrinkage), D12 (deferred/unearned revenue).
- **Coverage gaps** (need new vocabulary/routing): D10 (concrete mixer → capitalize), D11 (no
  construction-materials/WIP vocabulary — all project costs fall to "G&A - other").

## Notes for the future engine-fix session
- D1, D3, D4, D5, D6 are the same root pattern: a keyword has two senses, and the
  scoring/tie-break picks the wrong one. A general fix (sense-disambiguation or
  priority/negative-lookahead tuning) would likely resolve several at once.
- D2 is different: it needs a **new account** in the chart of accounts plus engine routing.
- The activity rules are insight-only and do NOT depend on these being fixed — e.g. the
  Phase 3 project-link suggestion fires correctly even when the base category is wrong.
- Re-run the Phase 1–3 synthetic fixtures after any engine fix to confirm no new regressions.


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 4: `_artifacts/architecture/chart-of-accounts-foundation.md`
═══════════════════════════════════════════════════════════════

# Architecture Proposal — Chart-of-Accounts Foundation (typed accounts + journal_entries → real Balance Sheet)

**Date:** 2026-06-30
**Type:** Architecture proposal (approved 2026-06-30). Phased; implementation begins with Phase A only after explicit confirmation.
**Goal:** replace the estimated/"تقديري" Balance Sheet + plug-equity with a **real** position derived from the actual double-entry journal entries — the shared foundation that unblocks registry items **D12, formal WIP asset line, item 11 (real owners' equity), and part of item 7 (cash-flow investing/financing)**.
**Methodology:** analyze → propose → no implementation until approval. `categorization-engine.ts` and (in Phase A) `erp-engine.ts` are NOT touched.

---

## 1) Current-state analysis (grounded in the actual code)

### A) The current Balance Sheet is 100% estimated
`src/modules/BalanceSheet.tsx` receives only `{revenues, expenses, payroll}` from `incomeStatement` (App.tsx ~2782) and derives every line by a fixed assumed ratio:

| Line | Current formula | Problem |
|---|---|---|
| Cash | `netIncome × 0.4` | assumption, not a real bank balance |
| Accounts receivable | `revenues × 0.15` | assumption |
| Inventory | `expenses × 0.10` | assumption |
| Accounts payable | `expenses × 0.12` | assumption |
| Accrued expenses | `payroll × 0.05` | assumption |
| **Equity** | **`totalAssets − totalLiabilities` (plug)** | **balances tautologically, by construction, not by correctness** |

The page already carries honest "⚠️ ليست ميزانية فعلية — تقديري" banners.

### B) The real accounting foundation ALREADY EXISTS and is unused by the Balance Sheet
- **`erp-engine.ts::generateJournalEntries`** already produces proper **double-entry** journal entries for every operation, posting to balance-sheet-natured accounts:
  - Expense → **Dr** `{expense category}` / **Cr** `الموردين - {entity}` (AP); opening → **Cr** `رأس المال (أرباح مبقاة)`
  - Revenue → **Dr** `العملاء - {entity}` (AR) / **Cr** `{revenue category}`
  - Bank → **Dr/Cr** `البنوك - {entity}` (+ `رأس المال` / bank-settlement)
  - Payroll → **Dr** `مصروف راتب أساسي` / `مصروف - {allowance}` / **Cr** `رواتب وأجور مستحقة الدفع` (accrued liability) / `ذمم دائنة - {deduction}`
  - Inventory → **Dr** `مخزون بضاعة` / **Cr** `الذمم الدائنة الموردين`
- **1,179 real journal entries** persisted in `data/erp_registry.json` (`journalEntries`), served via `/api/erp/ledger` and `/api/debug/journalEntries/raw`.
- **`TrialBalance.tsx` already computes per-account balances** (debit/credit/balance) by aggregating the journal entries, with separate VAT input/output handling. **160 distinct accounts.**

### C) The single structural gap
There is **no account-TYPE classification** (Asset / Liability / Equity / Revenue / Expense). Account names are free-text, so they cannot be grouped into a balance sheet, and `BalanceSheet.tsx` ignores the journal entries and estimates instead. **This is the only thing missing — not the journal entries themselves.**

---

## 2) Chart-of-accounts design (the types)

An **additive, pure** layer (`src/lib/chart-of-accounts.ts`): a pure function classifying an account name → its accounting type, using the conventions `erp-engine` already emits (no change to journal generation).

```
AccountType = Asset | Liability | Equity | Revenue | Expense
```

| Type | Subtype | Matching accounts (prefix/pattern) |
|---|---|---|
| **Asset** | Cash & banks | `البنوك - *`, `نقدية *`, `حساب تسوية البنك (مدينة)` |
| | Accounts receivable | `العملاء - *` |
| | Inventory | `مخزون *` |
| | Fixed assets | `أصول ثابتة - *` (from `CAPEX_CATEGORIES`) |
| | WIP *(new, §4)* | `أعمال تحت التنفيذ` |
| **Liability** | Accounts payable | `الموردين - *`, `الذمم الدائنة *` |
| | Accruals | `رواتب وأجور مستحقة الدفع`, `ذمم دائنة - *` |
| | Taxes payable | `ضريبة المخرجات`, `الضرائب` |
| | Unearned revenue *(new, D12)* | `إيراد مقدم / غير مكتسب` |
| **Equity** | Capital | `رأس المال (أرباح مبقاة)` |
| | Drawings *(new, item 11)* | `مسحوبات الملاك` |
| | Retained earnings | **derived = Σ(Revenue − Expense) from the journal entries** |
| **Revenue** | — | `إيرادات *` + revenue categories |
| **Expense** | COGS / OPEX | `CATEGORY_ORDER` cost/expense categories |

Classification keys off the **account prefix + `CATEGORY_ORDER` / `COGS_CATEGORIES` / `CAPEX_CATEGORIES`** (already defined in `financial-utils.ts` / `pnl-core.ts`). Any unknown account → "غير مصنّف", surfaced for review (suggest-don't-force) rather than guessed.

---

## 3) journal_entries design

The double-entry layer **exists and works — we do not rebuild it.** Design = reuse + a few additive postings:

**A) Read path (Phase A — does NOT touch `erp-engine`):** a builder `computeBalanceSheetCore(journalEntries, chartOfAccounts)`:
1. Aggregate each account's balance using the **exact same logic as `TrialBalance`** (single source, no drift).
2. Classify each account by type (§2).
3. **Assets = Σ Asset balances · Liabilities = Σ Liability balances · Equity = Capital + (Retained earnings = Σ Revenue − Σ Expense from the journal entries) − Drawings.**
4. **`Assets = Liabilities + Equity` holds by REAL construction** — every journal entry balances (Σ Dr = Σ Cr), so it ties out without any plug. Any non-zero difference = a real error, surfaced (same rigor as the bank-reconciliation gate).

**B) Generation for the new accounts (Phase B — additive postings in `erp-engine`, each behind its own confirmation):**
- **D12:** customer advance → **Cr** `إيراد مقدم (التزام)` instead of `إيرادات` (recognized later).
- **WIP:** active-project cost → **Dr** `أعمال تحت التنفيذ` / **Cr** payable; on completion → **Dr** COGS / **Cr** WIP.
- **Owner contributions/drawings →** `رأس المال` / `مسحوبات الملاك`.

**Guarantees:** `categorization-engine.ts` is **never touched** (the type layer only reads categories). Phase A does **not** touch `erp-engine.ts`. **Validation gate:** the journal-derived profit must equal `computePnLCore` to the halala.

---

## 4) How this unblocks the four deferred items — and what remains

| Item | How it's unblocked | What remains |
|---|---|---|
| **Item 11 — real owners' equity** | ✅ **Immediately in Phase A** — retained earnings computed for real from the journal entries (no plug). | Owner contribution/drawing data capture = a small entry path (Phase B). |
| **Formal WIP asset line** | The type layer classifies `أعمال تحت التنفيذ` as an Asset → it appears on the Balance Sheet. | Generate the WIP journal entry on defer/complete (Phase B; links today's D11 P&L-deferral to a real posting). |
| **D12 — revenue deferral** | `إيراد مقدم` typed as a Liability appears on the Balance Sheet. | Change the advance-payment journal generation (Phase B, `erp-engine`). |
| **Item 7 — cash-flow investing/financing** | The contra-account's type on a bank entry distinguishes: fixed-asset → investing, capital/loan → financing. | Enrich bank-entry contra-accounting (currently limited to capital/settlement). |

**Still deferred even after the foundation:**
- **Opening balances at go-live** — an accurate position statement needs real opening balances (cash/AR/assets before the first upload). Without them, the Balance Sheet reflects **only the uploaded period's activity**, not the full position. (= migration; the single biggest caveat — see §5.)
- AR/AP aging — detail only, not needed for the totals.
- Bank-entry contra enrichment for full investing/financing split.

---

## 5) Risk assessment

- **Touches real existing data?** Phase A is **read-only** over the existing 1,179 journal entries — **no modification, no regeneration** → very low risk. Phase B adds new entries (never edits old ones).
- **Migration needed?** **Yes — partially, stated honestly:** the journal-derived Balance Sheet reflects only the uploaded period. A full position statement needs **opening balances** (entered as an opening `رأس المال (أرباح مبقاة)` entry — the structure already supports it). The existing journal entries themselves need no migration (their shape is sound).
- **Backward compatibility:**
  - `TrialBalance` and `GeneralLedger` run on the same journal entries → **no impact**.
  - `computePnLCore` / Income Statement is **independent** of the journal entries → no conflict (with the reconciliation gate as a check).
  - Safe transition: **keep the estimated Balance Sheet, labelled "تقديري", side-by-side with the new real one until the real one is approved after a live proof**, then replace (same one-step-at-a-time discipline). Remove the "تقديري" label only after proving `Assets = Liabilities + Equity` on real data.

---

## Phased rollout (recommended)
- **Phase A (read-only, highest value / lowest risk):** account-type layer + balance-sheet builder reading the existing journal entries → **a real Balance Sheet + real equity (real retained earnings)** without touching `erp-engine` or `categorization-engine`. Resolves most of item 11 and proves the foundation. *(Estimated current Balance Sheet kept side-by-side, still labelled "تقديري", until live-proven.)*
- **Phase B (additive postings, each behind confirmation):** formal WIP asset entry (asset line) → unearned-revenue entry (D12) → owner contribution/drawing capture → bank-entry contra enrichment (item 7).
- **Phase C (later):** opening balances (migration) + AR/AP aging.

---

## Live-proof acceptance criteria (Phase A)
On real data: **Assets = Liabilities + Equity exactly** (not by plug — every entry balances), and **journal-derived profit (Σ Revenue − Σ Expense) = `computePnLCore` to the halala**. Documented with the real numbers, same rigor as the D11 verification.


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 5: `_artifacts/reviews/fionira-expert-audit.md`
═══════════════════════════════════════════════════════════════

# Fionira — التدقيق التقني الجراحي الشامل (Expert Audit)

**التاريخ:** 2026-07-01 · **المدقق:** مراجعة خبير أنظمة مالية مؤسسية (منظور SAP B1 / NetSuite / Dynamics / Zoho)
**المنهج:** فحص ميداني كامل قبل الكتابة — الوثائق الخمسون في `_artifacts/architecture/` + `_artifacts/reviews/` + `SESSION-HANDOFF.md` + `engine-technical-debt.md` + `CLAUDE.md`، وقراءة سطرية للمحرّكات (التصنيف 526 سطراً، ERP 149، الإدخال 221، ما-قبل-الاعتماد 163، الموجّه + المحرّكات الخمسة + قواعد الأنشطة الخمس كاملة)، وطبقة المحاسبة (`chart-of-accounts` / `balance-sheet-core` / `pnl-core` / `bank-cashflow-core` / `financial-utils::CATEGORY_ORDER`)، والواجهات (`TrialBalance` / `GeneralLedger` / `CashFlow` / `BalanceSheet` / `GlobalDashboard` / `ValidationReviewScreen` / `AlertsReport` / هيكل `App.tsx` 2,941 سطراً)، والخادم (`server.ts` 4,118 سطراً: 48 endpoint + auth + devMemoryDb + الحوكمة + سلسلة التدقيق)، ونموذج البيانات (`types.ts` + بنية `erp_registry.json` الفعلية: 1,138 سجلاً / 1,131 قيداً).
**قاعدة صارمة:** كل حكم بدليل (ملف:سطر أو دالة). هذا التقرير **يكتشف** ولا يكتفي بالمُوثَّق — البنود الموسومة 🆕 لم تكن موثَّقة في أي وثيقة سابقة.

> **حالة لحظة الفحص:** شجرة العمل تحوي «إصلاح ب» (endpoint التصعيد `server.ts:1621` + إعادة توجيه `ValidationReviewScreen`) منفَّذاً مثبتاً حياً وغير مُثبَّت في git (بانتظار اعتماد بصري). يُحسب هنا ضمن الواقع الكودي.

---

# §1 هوية النظام وتحليل موقعه التنافسي

## 1.1 ما هو Fionira فعلاً — من الكود لا من الوصف

من قراءة الكود، Fionira هو **خط أنابيب ذكاء مستندي-محاسبي (Document-to-Ledger Intelligence Pipeline) بحوكمة مدمجة**، وليس نظام محاسبة بإدخال يدوي:
- نقطة الدخول الوحيدة للحقيقة المالية هي **ملف Excel** (`staged-upload` `server.ts:1819`) — لا يوجد أي شاشة «قيد يومية يدوي» أو «فاتورة مورد يدوية» تدخل السجل المالي (فاتورة SmartInvoice مسار Firestore منفصل غير موصول بالسجل).
- بين الملف والدفتر تقف **ثلاث طبقات ذكاء إلزامية**: تصنيف لحظة التفكيك (`expenses-processor.ts:175` يستدعي `getExpenseCategory` داخل حلقة الصفوف)، ذكاء مجال يلحق مخاطر بكل سجل (`pre-validation-engine.ts:29`)، وبوابة مراجعة بشرية بلغة عادية (`ValidationReviewScreen`).
- القيد المزدوج **مشتق آلياً** من السجل المعتمد (`erp-engine.ts:40`) — المستخدم لا يرى Dr/Cr إلا إن أراد.

**الفئة الدقيقة:** بين «Accounting Automation» (مثل Dext/AutoEntry) و«SME Accounting» (مثل Zoho Books) — لكنه يملك ما لا يملكه الأولان (دفتر كامل وقوائم) وما لا يملكه الثاني (فهم عربي عميق + حوكمة رفع مؤسسية). الأصح تسميته: **نظام محاسبة آلي-التغذية بحوكمة (Governed Auto-Accounting)**.

**الاختلاف البنيوي عن النظام التقليدي:** في Zoho/QuickBooks المستخدم يُدخل والنظام يسجّل؛ هنا الملف يدخل والنظام **يقرّر ثم يسأل** — ومسؤولية الصحة منقولة عمداً من المستخدم إلى بوابات النظام (مطابقة الهللة، توازن-بالبناء، بوابة Δ54.78 الموثقة). هذا انقلاب في عقد المسؤولية (liability contract) وهو جوهر المنتج.

## 1.2 السوق المستهدف — من هو المستخدم الأنسب الآن (لا مستقبلاً)

**الأنسب اليوم:** منشأة سعودية صغيرة (5–50 موظفاً)، قطاع F&B أو تجزئة/خدمات، تمسك دفاترها على Excel أصلاً، بعملة واحدة، بلا مخزون دائم، ولديها «مدير مالي/محاسب خارجي جزئي» يراجع شهرياً. الدليل: كل fixtures التحقق حقيقية من هذا الملف الشخصي (730 سجل مطعم، كشوف بنوك سعودية بـpreamble نموذجي، مسير رواتب يناير).

**ما يحدّ هذا الجمهور حالياً:**
1. **أحادية النشاط لكل مستأجر** (`devMemoryDb.settings[tenantId].activity` — `server.ts:1838`): مالك بفرعين بنشاطين مختلفين (شائع خليجياً) لا يستفيد من قواعد النشاطين معاً.
2. **أحادية العملة**: لا حقل عملة في `FinancialRecord` (`types.ts:6-38`) إطلاقاً — أي مستورد يتعامل بالدولار خارج النطاق.
3. **الرفع اليدوي فقط**: لا bank feeds ولا POS integration — منشأة بـ5,000 حركة/شهر ستجد الرفع الشهري عبئاً.
4. **dev data plane**: أي عميل يدفع اليوم يضع حقيقته المالية في ملف JSON على خادم واحد (§2.4) — قابل للتجربة، غير قابل للاعتماد.

## 1.3 جدول المقارنة التنافسية المفصل

| المحور | **Fionira** | **Zoho Books** | **QuickBooks** | **SAP Business One** | **Oracle NetSuite** | **قيود/دفترة (عربية محلية)** |
|---|---|---|---|---|---|---|
| فهم عربي للنصوص الحرة | 🏆 فريد: تطبيع نص+أنماط معاً (`nrx` `categorization-engine.ts:12`) + توحيد كيانات كمبدأ دائم | ترجمة واجهة فقط | لا يوجد | ترجمة واجهة | ترجمة واجهة | واجهة عربية، لا NLP تصنيفي |
| تصنيف تلقائي من Excel فوضوي | 🏆 5 مراحل سياقية + preamble بنكي سعودي (`header-detection.ts`) | قواعد مصرفية بسيطة | ML مصرفي جيد (إنجليزي) | لا (يتوقع إدخالاً منظماً) | SuiteScript مخصص | إدخال يدوي/قوالب |
| حوكمة الرفع (staged→classify→review→activate) | 🏆 فريدة بهذا العمق (تصنيف نسخة-مصححة/تداخل بالـhash + مفاتيح تجارية `server.ts:1928-1948`) | لا يوجد مفهوم مكافئ | لا | Approval workflows عامة | Approval workflows قوية | لا |
| توازن ميزانية بالبناء + بوابة فرق معروضة | 🏆 (`balance-sheet-core.ts:117` + عرض الفرق `RealBalanceSheet.tsx:98`) | يتوازن (نظام قيود ناضج) | يتوازن | يتوازن | يتوازن | يتوازن |
| إهلاك وسجل أصول | ❌ **صفر** (لا يوجد أي منطق — بحث شامل) | ✅ | ✅ | ✅ متقدم | ✅ متقدم | ✅ أساسي |
| أرصدة افتتاحية | ❌ (Phase C مخطط) | ✅ | ✅ | ✅ | ✅ | ✅ |
| أعمار ذمم AR/AP | ❌ (البيانات موجودة في القيود، العرض غائب) | ✅ | ✅ | ✅ | ✅ | ✅ |
| مخزون دائم | ❌ (توريد-فقط: `erp-engine.ts:133-136`) | ✅ | ✅ أساسي | 🏆 | 🏆 | جزئي |
| عملات متعددة | ❌ | ✅ | ✅ | ✅ | 🏆 | جزئي |
| ZATCA فوترة مرحلة 2 | ❌ (فاتورة+PDF بلا UBL/ختم/ربط) | ✅ معتمد | جزئي (شركاء) | ✅ عبر add-ons | ✅ عبر شركاء | 🏆 (نقطة قوتهم الأولى) |
| إقفال فترات وقفل رجعي | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| API خارجي/تكاملات | ❌ صفر | ✅ واسع | ✅ واسع | ✅ | 🏆 | محدود |
| Multi-tenant إنتاجي | ❌ (JSON dev) | ✅ SaaS ناضج | ✅ | On-prem/cloud | ✅ | ✅ |
| سجل تدقيق مسلسل-التجزئة | 🏆 (sha256 chain + endpoint تحقق `server.ts:249-300, 3414`) | سجل عادي | سجل عادي | سجل قوي | سجل قوي | سجل عادي |
| **الـshowstopper ضد كلٍّ** | — | لا فهم عربي/حوكمة رفع → لكن **يفوز اليوم بكل شيء آخر** | نفس Zoho + أضعف عربياً | سعر/تعقيد يقتلانه لدى SME السعودي | نفس SAP | امتثال محلي ممتاز لكن «غبي» — لا ذكاء ولا خبير |
| **showstopper Fionira الحالي** | **مستوى بيانات dev + غياب افتتاحيات/إهلاك/ZATCA-2** — يمنع البيع الجاد رغم تفوّق النواة الذكية | | | | | |

**الخلاصة التنافسية:** Fionira يملك **ثلاث ميزات لا يملكها أحد في الجدول** (الفهم العربي التصنيفي، حوكمة الرفع، عقد المسؤولية المقلوب) — لكنه يفتقد **عشر ميزات يملكها الجميع**. المعادلة ليست «اللحاق ثم التميّز»؛ التميّز موجود الآن، والمطلوب سدّ فجوات النظافة المحاسبية (table stakes) قبل أن تُقارن قيمته أصلاً.

---

# §2 تشريح البنية المعمارية

## 2.1 خريطة المكوّنات مع تقييم كل مكوّن

| المكوّن | الجودة | نقاط الضعف البنيوية | ما سيُكسر أولاً تحت ضغط الإنتاج |
|---|---|---|---|
| `ingestion-engine.ts` (221) | جيد — منسّق نظيف + حارس الصفوف الجزئية المركزي الجديد (`:15-38`) | 🆕 `detectModuleType` كود ميت (معطَّل بـcomment `:86`)؛ بناء masterData في الذاكرة لكل رفعة | ملف 50k صف: `sheet_to_json` كامل بالذاكرة — سيمر لكن ببطء ملحوظ |
| المعالجات الخمسة | جيدة لبيئتها — قفل خريطة أعمدة، كشف صفوف الإجماليات (`expenses-processor.ts:111-143`) | سقف preamble 20 صفاً (B1، @DO_NOT_MODIFY)؛ منطق شبه-مكرر بين expenses/revenues | ملف بمقدمة >20 صفاً → **سجلات مشوهة صامتة** (مستنسَخ في اختبار موثَّق) |
| `categorization-engine.ts` (526) | ممتاز لنطاقه — §3 كاملاً | مصفوفة قواعد وحيدة الملف؛ regexes عملاقة (سطر 134 = ~1,900 حرفاً) | لا ينكسر تشغيلياً؛ ينكسر **صيانياً** — إضافة قطاع جديد = تحرير regex يدوي عالي الخطورة |
| محرّكات المجالات (5) | متفاوتة بشدة: expenses ناضج (150 سطراً، profiles سلوكية) مقابل banks/inventory هيكلية فقط (29/30) | 🆕 لا-تماثل: revenues بلا FUZZY_DUPLICATE (موجود في expenses `:88-101` فقط)؛ 🆕 payroll عتبة مطلقة ثابتة 100,000 (`payroll:26`) لا نسبية-للمستأجر (عكس فلسفة baseline المطاعم)؛ 🆕 نوع خاطئ `FUTURE_EXPENSE` داخل محرك الإيرادات (`revenues:86`) يفسد أي telemetry مستقبلي | فحص التكرار O(n²) (`expenses:83-101` — find داخل map): 10k سجل/دفعة = 100M مقارنة → **ثوانٍ معلّقة لكل رفعة كبيرة** |
| `pre-validation-engine.ts` | جيد التصميم (جلسة موحدة) | تضخيم HIGH→CRITICAL (`:51`)؛ `throw` يفجّر الرفعة كلها (`:108`)؛ عدّادات متداخلة (`:63` مقابل `:118`) | ملف فيه سجل واحد «خطأ واضح تجاوز المحرك» → **فشل رفع كامل** بدل رفض سجل |
| `erp-engine.ts` | نظيف ونقي — §4.1 | قيود المصروف تفترض الأجل دائماً (لا مسار نقدي)؛ لا عكس قيود عند التعديل (يُحل بالحذف-وإعادة-التوليد) | لا شيء — أصغر مكوّن وأثبتها |
| `chart-of-accounts.ts` + `balance-sheet-core.ts` | ممتازان — نمط pure-layer نموذجي | التصنيف بالاسم-البادئة هش أمام حساب مستقبلي خارج الاتفاقيات؛ لا متداول/غير متداول | حساب جديد باسم غير متوقَّع → «غير مصنّف» يظهر كفرق — **مقبول بالتصميم** (يُعرض لا يُخفى) |
| `pnl-core.ts` | جيد | خلل أساس الرواتب-الضريبية (Δ54.78، `:81-84` Total للرواتب)؛ 🆕 كشف «فئة رواتب» بـ`includes('بدلات')` نصي هش | لا ينكسر؛ ينحرف بصمت لو أُضيفت فئة فيها كلمة «أجور» غير مقصودة |
| `server.ts` (4,118) | وظيفي، غير قابل للاستمرار بنيوياً | monolith: routes+auth+persistence+business في ملف؛ ازدواج مسارَي isConnected في كل معالج (272 موضعاً) — **فرع Postgres غير مختبَر إطلاقاً** | أول اختبار حقيقي لفرع `isConnected()` سيكشف انحرافات متراكمة (الأرجح: أعمدة/حقول غير متطابقة) |
| `App.tsx` (2,941) | يعمل، مركزية مفرطة | كل الحوسبة التقريرية client-side على كامل السجلات؛ 30+ useMemo متسلسلة | 50k سجل → إعادة حساب سلسلة الـmemos عند كل تغيير فلتر = ثوانٍ تجميد UI |
| `devMemoryDb` + persist | مناسب للتطوير فقط | §2.4 | §2.4 |

## 2.2 تدفق البيانات الكامل — ونقاط فقدان الدقة/الأخطاء الصامتة

```
Excel → staged-upload(1819) → createValidationSession → processUploadBatch
  → [processor: header→rows→getExpenseCategory→isEmptyPartialRow guard]
  → routeToDomainIntelligence(insights,riskScore) → ValidationReviewScreen
  → activate(2076)/replace(2253) → devMemoryDb.records + syncJournalEntriesForFile
  → generateJournalEntries → journalEntries(sourceFileId) → persistRegistry
  → [قراءات] TB/RealBS: /api/debug/journalEntries/raw (1223)
             GL: /api/erp/ledger (1236)
             P&L: client fetch /files/:id/data (3795) → computePnLCore
             CashFlow: سجلات البنوك → bank-cashflow-core
```

**نقاط الخطر الصامت المحددة (مرتبة بموقعها في التدفق):**
| # | النقطة | الخطر | الدليل |
|---|---|---|---|
| F1 | كشف الرأس (expenses/revenues) | preamble >20 صفاً → صف 0 كرأس → سجلات «غير محدد/null» صامتة | B1 الموثَّق؛ المعالجان @DO_NOT_MODIFY |
| F2 | `parseNum` | `'-'` تُفسَّر 0 محاسبياً (`shared-processor.ts:48`) — صحيح غالباً لكنه يحوّل «غير متوفر» المكتوبة شرطةً إلى صفر فعلي | shared-processor:48 |
| F3 | التصنيف لحظة التفكيك | التصنيف **يتجمّد في السجل** (`Category` حقل مخزَّن) — أي تحسين مستقبلي للمحرك لا يلمس البيانات القديمة إلا بإعادة معالجة غير موجودة كآلية | expenses-processor:175 + لا endpoint لإعادة تصنيف |
| F4 | `pre-validation:106-109` | fail-safe يرمي → إسقاط رفعة كاملة بسجل واحد | ذكر أعلاه |
| F5 | activate | **لا dedup للسجلات** عند إعادة تفعيل مباشرة (موثَّق كـhonest finding) — القيود تبقى صحيحة والسجلات تتضاعف | SESSION-HANDOFF B-أ-2 |
| F6 🆕 | **`/api/erp/ledger` يتجاهل `taxAmount` كلياً** | دفتر الأستاذ **لا يحتوي أي قيود ضريبة** بينما ميزان المراجعة (client-side) يضيفها (`TrialBalance.tsx:54-69`) → **GL ≠ TB بمقدار كل الضريبة** — تناقض بين تقريرين يفترض أنهما نفس المصدر | قارن `server.ts:1240-1257` (لا ذكر لـtaxAmount) مع TrialBalance.tsx:54 |
| F7 🆕 | **`/api/erp/ledger` يتجاهل `isActive`** | القيود المعطَّلة يدوياً تُحتسب في GL وتُستثنى في TB (`TrialBalance.tsx:29`) — انحراف ثانٍ بين التقريرين | `server.ts:1240` — فلتر tenantId فقط |
| F8 🆕 | **TB وGL يجلبان التوكن عبر `auth.currentUser`** | null في dev-auth → **جدول فارغ صامت** (نفس صنف العطل الذي أُصلح في RealBalanceSheet بالتحويل لـ`useAuth()`) — كامن يظهر حسب طريقة تسجيل الدخول | `TrialBalance.tsx:22`، `GeneralLedger.tsx:25` مقابل الإصلاح في `RealBalanceSheet.tsx:31` |
| F9 | مسارات JE غير مُهوَّكة | restore/single-fix/dev-sync → قيود stale حتى backfill يدوي | B-أ-2 remaining |
| F10 | Δ54.78 | أساسان مختلفان لرواتب-بضريبة بين P&L والقيود | item #13 |
| F11 | حقل `Anomalies` الميت | صفحة تنبيهات إدارية فوق حقل لا يُكتب أبداً | `types.ts:26` + لا كاتب في `src/` |

## 2.3 تقييم نموذج البيانات (`types.ts`)

**السليم:** فصل خمسة مبالغ (Net/Taxable/NonTaxable/VAT/Total) صحيح لواقع الفواتير السعودية؛ فصل Raw_Entity/Entity_Normalized_Name يخدم مبدأ التتبّع+التوحيد؛ `AllowancesBreakdown/DeductionsBreakdown` كقواميس مرنة للرواتب.

**الناقص محاسبياً (حقول غائبة):**
- **عملة** (currency/exchangeRate) — غياب كامل.
- **حالة سداد/استحقاق** (dueDate, paidAt, paymentMethod) — بدونها لا أعمار ذمم حقيقية ولا تمييز نقدي/آجل في القيود (§4.1-ب).
- **مركز تكلفة/مشروع** كحقل صريح — ربط المشاريع الحالي بمطابقة نص اسم المشروع في الوصف (`d11` design) — عملي لكنه هش.
- **postingDate منفصل عن documentDate** — أساس أي إقفال فترات.
- 🆕 **تناقض داخلي:** `Anomalies: string[]` إلزامي في الواجهة (types.ts:26) وميت فعلياً؛ و`_originalIndex` إلزامي بينما المعالجات تكتب `_originalRowIndex` (expenses-processor:184) — النوع لا يطابق الإنتاج الفعلي، وعموم `any` في الخادم يخفي ذلك.
- **JournalEntry** بلا `postingPeriod`، بلا `reversalOf`، بلا `currency` — كافٍ لدفتر فترة واحدة، غير كافٍ لدفتر مؤسسي.

## 2.4 طبقة التخزين (devMemoryDb + JSON)

**البنية:** مصفوفات بالذاكرة (records/journalEntries/uploadedFiles/rejected/governance/audit/settings — `server.ts:98-127`) + كتابة **الملف الكامل** عند كل تغيير (`persistRegistry` `:463-477`؛ `erp_registry.json` حالياً ~14k سطراً لكل حفظة).

**حدود الانهيار (تقدير هندسي مبني على الآليات):**
- **~50k قيد (سنتان لمنشأة متوسطة):** كل activate يعيد كتابة ملف عشرات الميغابايت + JSON.stringify متزامن على الـevent loop → ثوانٍ حجب لكل رفعة، وكل الـAPIs خلفها.
- **`/api/debug/journalEntries/raw` بلا pagination:** الواجهة تسحب كل القيود لكل فتح صفحة TB/BS — عند 100k قيد: ~50-100MB نقل + parse بالمتصفح.
- **فحص التكرار O(n²)** في الرفعات الكبيرة (2.1).

**سيناريوهات فقدان البيانات:**
1. **انقطاع أثناء `writeFileSync`** → ملف JSON مبتور = **فقدان كل السجل** (لا كتابة ذرّية عبر ملف مؤقت+rename، ولا نسخ دورية). النجاة الحالية الوحيدة: كون الملف git-tracked — وهذا مصادفة تطويرية لا تصميم نسخ احتياطي.
2. **كتابتان متزامنتان** (طلبان يفعّلان ملفين): read-modify-write غير محمي → آخر كاتب يمحو أثر الأول.
3. **إعدادات المستأجر dual-write** (Firestore + `/api/erp/settings` — `data-plane-map.md` §B) → انفصام صامت بين نسختين.

**جهد الانتقال إلى Postgres (تقدير واقعي):** الخطة موجودة (`phase-c1-journal-entries-plan.md`) والجداول الخمسة معرَّفة (`db.ts:72-148`) لكن: (1) لا جدول قيود؛ (2) 272 فرع `isConnected()` **غير مختبَرة**؛ (3) الهجرة الحالية «فقط-عند-فراغ-الجدول» و4 نطاقات؛ (4) يجب سحب كتابات Firestore العميلية أولاً وإلا انفصل مستوى الفواتير عن الدفتر. **التقدير: 3-5 أسابيع عمل مركّز** لمهندس يعرف القاعدة، شاملة اختبار الفروع — ليس «تشغيل اتصال».

## 2.5 تقييم الأمان

**الجيد (أعلى من المتوقع لمشروع بهذه المرحلة):**
- المصادقة claims-based مع **فشل مغلق** عند غياب tenantId/role (`server.ts:813-815`).
- dev-auth مسيَّج ثلاثياً: non-prod + flag + localhost-only (`:790-798`).
- dev/reset خلف ثلاثة شروط بيئة (`:522-528`).
- **سلسلة تدقيق sha256 حقيقية** بربط previousHash + endpoint تحقق (`:218-300`, `/api/erp/audit/verify` `:3414`) — نادرة في هذه المرحلة.
- عزل tenant مطبَّق فعلياً في كل مسارات devMemoryDb المقروءة (فلتر tenantId ثابت النمط).

**الثغرات الواضحة:**
| # | الثغرة | الخطورة | الدليل |
|---|---|---|---|
| S1 | **مفتاح service-account داخل جذر المشروع ويُستورد مباشرة** (`server.ts:26`) — وثيقة المشروع نفسها تحذّر من عدم التحقق من صلاحيته/تدويره | حرجة قبل أي إنتاج | `SESSION-HANDOFF` §7 |
| S2 | 🆕 لا `helmet`/security headers، لا rate limiting، لا مقاومة brute-force على أي endpoint (فحص الاستيرادات: `server.ts:1-97` — لا cors/helmet/express-rate-limit) | عالية للإنتاج | فحص مباشر |
| S3 | حدود جسم كبيرة: `dev/sync` بـ50mb (`:610`) — DoS سهل في dev المكشوف | متوسطة (dev-only نظرياً) | :610 |
| S4 | 🆕 كتابات Firestore عميلية (فواتير/كتالوج/`override_audit_logs` `ValidationReviewScreen:276`) تعتمد أمنها كلياً على `firestore.rules` **التي لا يمكن التحقق من نشرها من المستودع** | عالية | data-plane-map + SESSION-HANDOFF §3 |
| S5 | لا تحقق مدخلات منهجي (schema validation) على أجسام الطلبات — الاعتماد على destructuring والتساهل | متوسطة | نمط عام في المعالجات |
| S6 | العزل داخل عملية واحدة وذاكرة واحدة — أي RCE/خطأ برمجي يعبر المستأجرين؛ لا RLS ولا حدود عملية | بنيوية حتى Postgres+RLS | طبيعة devMemoryDb |

**الحكم:** نموذج المصادقة **سليم التصميم** وكافٍ لتجارب موجَّهة؛ **غير كافٍ للإنتاج** قبل: تدوير المفتاح وإخراجه لـsecret manager، صلابة HTTP الأساسية (S2)، وسحب الكتابات العميلية (S4).

---

# §3 تشريح محرك التصنيف الذكي

## 3.1 كيف يعمل فعلاً — مسار القرار الكامل لسجل واحد

لسجل مصروف (اسم مورد + وصف + مبلغ) عبر `getExpenseCategory` (`categorization-engine.ts:52-463`):
1. **تطبيع مزدوج:** النص يُطبَّع (تطويل/همزات/تاء/ألف مقصورة `:55-62`)، **والأنماط تُطبَّع أيضاً** عبر `nrx` (`:12-16`) — فلا يسقط تطابق بسبب إملاء المؤلف للقاعدة.
2. **Stage 0 — Override قاطع (`:78-100`):** 3 قواعد (صيانة/مستلزمات تشغيل/هدايا) تُنهي القرار فوراً إن طابقت **الوصف**.
3. **Stage 1 — المورد كتلميح (`:104-128`):** ~20 نمط مورّد (اتصالات/كهرباء/حكومي/توصيل/بنوك/تأمين/سوبرماركت...) يضيف 300-500 نقطة. فلسفة معلنة: «Description is King» — المورد لا يحسم وحده.
4. **Stage 2 — كلمات الوصف (`:132-249`):** ~25 كتلة كلمات (COGS خام/تغليف/مستهلكات؛ OPEX وقود/صيانة/إيجار/سفر/رواتب-منافع/حكومي/بنكي/اشتراكات/أتعاب/اتصالات/منافع/قرطاسية/تأمين/تبرعات/غرامات؛ CAPEX حاسب/معدات/أثاث/سيارات بـ1000) — تطابق `allText` يضيف score والوصف الصريح +200؛ وكتل موسومة `descOnly` (إيجار الأماكن العامة) لا ترى اسم المورد إطلاقاً (`:243-246`) — حل D5/D9 المقاس.
5. **Stage 3 — تحكيم سياقي (~21 قاعدة `:251-422`):** سيارة+توصيل→نقل مبيعات وإلا مصاريف سيارات؛ صيانة-إن-لم-تكن-سيارة؛ تعليق أتعاب عند «راتب» (D6)؛ بدل إقامة→سفر لا رواتب (D4)؛ شحن+مواد→وارد COGS إلا مع صيانة؛ استئجار دينا لنقل معدات→نقل (قرار مستخدم موثَّق بتاريخه `:338-353`)؛ معدات ثقيلة شراء-لا-إيجار→أصل (D10)؛ مواد بناء→COGS (D11)؛ هدر إنتاج/هالك مخزون→حساباهما بـ5000 (D2/D7).
6. **Stage 4 — أعلى score يفوز؛ Stage 5 — تنقيح مبلغ:** أصل <1500 ريال → مصروف مناسب (`:432-443`).
7. الناتج فئة من `CATEGORY_ORDER` (44 فئة) تتجمّد في `record.Category` وتقود لاحقاً القيد والدفتر والقوائم.

**قناة القرار كاملة قابلة للتفسير آلياً** — `detectedRule` يُحسب فعلاً (`:74`) لكنه يذهب للـconsole فقط (فرصة §9-P2).

## 3.2 نقاط القوة الفعلية — أين يتفوق ولماذا

1. **حسم ثنائية-المعنى بالسياق لا بالكلمة:** «بدل إقامة فندق» سفرٌ رغم أن «بدل» راتبية (`:377-379`)؛ «راتب محاسب» راتبٌ رغم «محاسب» المهنية (`:307`) — هذا تحديداً ما تفشل فيه قواعد bank-rules في Zoho/QB (كلمة=فئة).
2. **عزل تسرّب اسم المورد** كآلية صنف-أول (`descOnly`) لا كترقيع حالة — ومقاسة (D5/D9 صفر انحدار).
3. **طبقة نشاط منفصلة تماماً** عن المحرك: contracting توصي بـWIP والمحرك لا يعرف بوجودها — فصل صلاحيات نموذجي يسمح بتوسيع رأسي آمن.
4. **fixtures انحدار حقيقية** (730 سجل مستخدم فعلي + 5 اصطناعية) مع سوابق موثقة لرفض تحسينات قاسها — لا أعرف منافساً SME يوثّق blast-radius لقواعده.
5. **تنقيح المبلغ** (Stage 5) لمسة محاسب حقيقي: «لابتوب بـ300 ريال» ليس أصلاً — القاعدة تعرف الرسملة العرفية.

## 3.3 نقاط الضعف والثغرات — أين سيفشل

1. **هشاشة إضافة قطاع جديد:** التغطية F&B-متركّزة بوضوح (راجع مفردات `:22-24`: ليمون/دجاج/بيكربونات/فرشلي...) — عيادة أسنان أو ورشة سيارات سيسقط معظم مشترياتها في «أخرى». D11 أثبت النمط: نشاط جديد = فجوة مفردات كاملة اكتُشفت بالاصطناع.
2. **D13 البنيوي المفتوح:** «ال»+حروف الجر تكسر حدود الكلمات (`التدقيق` لا تطابق `تدقيق`) — مقاس ثلاثاً وممنوع حلّه العام حتى وسم أمان-المورد. أثره اليومي: أنماط كثيرة تُنقذها كتل بديلة، لكن ذيلاً حقيقياً من الحالات يسقط لـ«أخرى» بصمت.
3. **قابلية خداع تركيبية:** الscores جمعية — وصف طويل يذكر «قرطاسية» عرضاً في فاتورة صيانة كبيرة قد يقلب الفئة؛ لا يوجد تحليل عبارات (phrase-priority جزئي فقط عبر قواعد Stage 3 اليدوية).
4. **لا درجة ثقة تصنيفية حقيقية للمستخدم:** `Confidence_Score` المخزَّن هو **سلامة حسابية** (Net+VAT=Total) لا ثقة تصنيف (تعليق صريح `expenses-processor.ts:197-198`) — الواجهة لا تملك إشارة «هذا التصنيف ضعيف، راجعه».
5. **التعلم من التصحيحات = صفر:** التعديل اليدوي في شاشة المراجعة يعدّل السجل ولا يُسجَّل كإشارة تعليمية لأي شيء (لا vendor→category memory) — كل تصحيح يتبخر.
6. **إيرادات أخف عدة بكثير:** `getRevenueCategory` قنوات-بيع فقط (توصيل/B2B/POS/مناسبات) — لا خدمات اشتراكية، لا إيجارات دخل، لا فوائد؛ عتبة 400 وإلا «متنوعة» (`:503-515`).

## 3.4 التكافؤ ثنائي اللغة — الإثبات من الكود

**غير متوازن، والعربية هي الأصل:** الوثيقة الرسمية تحصر ~29 قاعدة عربية-فقط (`SESSION-HANDOFF` §0-C-10). من الكود: كتل إنجليزية قوية موجودة في COGS/التغليف/التنظيف (`:134,137,156` — قوائم \b...\b طويلة) وموردي التقنية، لكن Stage 3 التحكيمي **عربي شبه-كامل** (كل قواعد `:369-422` بلا مرادف إنجليزي: نهاية خدمة/بدل إقامة/هالك مخزون/خلاطة خرسانة...). النتيجة العملية: ملف إنجليزي محض سيتصنّف Stage-2-فقط بدقة أدنى درجة، وستغيب عنه حماية D4/D6/D8-الإنجليزية. **الحكم:** كافٍ لواقع SME السعودي (عربي/مختلط)، غير كافٍ لادعاء bilingual — والوسم الحالي «needs-human-review» صادق.

## 3.5 مقترحات تحسين المحرك (آليات محددة + أثر متوقع)

1. **ذاكرة مورد→فئة من التصحيحات (Correction Memory):** جدول `{tenantId, entityNormalized, correctedCategory, count}` يُغذَّى من كل تعديل يدوي في شاشة المراجعة؛ يُستهلك كـStage-1.5 بscore متدرج بالعدّ (مثلاً 250×min(count,4))، suggest-حين-يخالف-المحرك. *الأثر المقيس المتوقع:* على بيانات مطعم واقعية، غالب التصحيحات تتكرر لنفس المورد — خفض تصحيحات المستخدم الشهرية 40-60% بعد شهرين. *لا يلمس القواعد المجمّدة — طبقة فوقها.*
2. **إظهار detectedRule + أعلى-3-فئات-بالدرجات** في بطاقة السجل (البيانات محسوبة أصلاً `:74,:427`): يحوّل «الصندوق الأسود» إلى خبير مُعلِّل، ويجعل التصحيح أدق. *جهد يومان.*
3. **وسم أمان-المورد كبيانات (المتطلب المقرَّر):** حقل `vendorSafety` لكل كتلة Stage-2 — يفتح D13 تدريجياً بالطريقة الوحيدة المقاسة آمنة، ويُحوّل descOnly من استثناء إلى سياسة عامة.
4. **حِزم مفردات قطاعية قابلة للتركيب (Sector Packs):** ملفات بيانات (لا كود) لكل نشاط بكلماته+فئاته، تُحمَّل حسب activityProfile وتضيف scores بنفس آلية Stage 2 — يعالج 3.3-1 بلا تضخيم الملف المجمّد. *بوابة القبول: صفر تغيير عند unset (نفس انضباط الأنشطة).*
5. **درجة ثقة تصنيفية حقيقية:** `categoryConfidence = topScore / (topScore + secondScore)` تُخزَّن مع السجل؛ عتبة <0.6 تولّد insight «تصنيف منخفض الثقة» في الشاشة. *يحوّل الذيل الصامت (D13-class) إلى مراجعات مرئية.*
6. **مزامنة فحوص المجالات:** إضافة FUZZY_DUPLICATE للإيرادات، تحويل عتبة الرواتب لعتبة نسبية-تاريخية (نمط baseline المطاعم `restaurant-wastage.ts:45-65` جاهز لإعادة الاستخدام)، تصحيح النوع `FUTURE_EXPENSE→FUTURE_REVENUE`.

---

# §4 تشريح الطبقة المحاسبية

## 4.1 هل القيود المزدوجة صحيحة؟ فحص `generateJournalEntries` نوعاً-نوعاً

| النوع | القيد المولَّد | الحكم |
|---|---|---|
| مصروف | Dr فئة المصروف / Cr `الموردين - {الجهة}` (`erp-engine.ts:115-117`)؛ الضريبة تُعالج طبقة-التجميع (مدخلات مدينة + زيادة الدائن — `balance-sheet-core.ts:67-71`) | ✅ صحيح **كمشتريات آجلة**. ⚠️ قصور: **كل مصروف يفترض أجلاً** — المصروف النقدي/الفوري يراكم ذمماً دائنة لا تُسدَّد أبداً (لا قيد سداد في النظام كله). نتيجته المرئية الآن: التزامات 682k مقابل أصول 565k — AP منفوخ بنيوياً لأنه لا يُطفأ |
| إيراد | Dr `العملاء - {الجهة}` / Cr فئة الإيراد (`:118-120`) | ✅ صحيح كمبيعات آجلة. نفس القصور معكوساً: AR لا يُحصَّل أبداً (لا قيد قبض) |
| افتتاحي (isOpeningBalance) | مقابل `رأس المال (أرباح مبقاة)` (`:117,119,125`) | ✅ آلية سليمة — **غير مستعملة** (لا مسار إدخال افتتاحيات) |
| بنك | إيداع: Dr بنك/Cr تسوية-دائنة؛ سحب: Dr تسوية-مدينة/Cr بنك (`:121-132`) | ✅ **صادق هندسياً**: حسابا تسوية معلَّقان بدل اختلاق طرف مقابل — لكنه يعني أن حركة البنك **لا تُقفل مقابل AR/AP** (لا مطابقة سداد↔فاتورة)، فالنقد في الميزانية يتحرك بينما الذمم ثابتة |
| رواتب | تفصيل: Dr راتب أساسي/بدلات، Cr `رواتب مستحقة الدفع`؛ الاستقطاعات Dr مستحقة/Cr ذمم دائنة (`:79-109`) | ✅ استحقاق صحيح. نفس نمط عدم-الإطفاء: المستحقات تتراكم بلا صرف |
| مخزون | Dr مخزون بضاعة / Cr ذمم موردين (`:133-136`) | ⚠️ توريد فقط — لا قيد صرف/COGS من المخزون، فالمخزون يتضخم أحادياً |

**الحكم الكلي:** **صحيحة محاسبياً كطبقة استحقاق أولى (accrual leg الأول)، وناقصة الطرف الثاني منهجياً**: لا يوجد في النظام كله **قيد تسوية/سداد/تحصيل** يربط النقد بالذمم. هذا ليس خطأً في المولّد بل **غياب صنف معاملات كامل (Settlements)** — وهو التفسير البنيوي لأرقام الميزانية الحالية (AP الضخم وAR الضخم وحقوق ملكية سالبة −116,891 رغم عمل تشغيلي طبيعي).

## 4.2 صحة التقارير المالية

- **قائمة الدخل:** **استحقاق نقي** (تعترف بالفاتورة لا بالسداد — `pnl-core.ts:64,82`)، مع ثلاث ملاحظات: استثناء CAPEX من المصروف صحيح (`:92`)؛ خلل أساس-الرواتب-الضريبية (Δ54.78)؛ و**غياب الإهلاك يجعل «صافي الدخل التشغيلي» أعلى من الحقيقي** بقدر استهلاك الأصول المرسملة.
- **الميزانية:** التصنيف **سليم لكل الحسابات الـ160 حالياً** (صفر غير-مصنّف مثبت، وخطأ COGS-كإيراد اصطيد وأُصلح بالبوابة). ثغرات التصنيف الكامنة: التصنيف بادئة-اسم — حساب مستقبلي بصيغة شاذة يسقط لغير-مصنّف (مقبول: يظهر كفرق معروض). البنية بلا متداول/غير متداول وبلا صافي أصول ثابتة (لا مجمع إهلاك).
- **التدفقات:** قسم تشغيلي **مكتمل وموثوق** (مطابقة بالهللة بالبناء)؛ استثماري/تمويلي **غير موجودين** ومُفصح عنهما بأمانة داخل «تحويلات وحركات أخرى» (`CashFlow.tsx:80-83`) — أفضل من التلفيق، لكنه يعني أن القائمة **ليست قائمة تدفقات IFRS-كاملة** بعد.
- **ميزان المراجعة:** يتوازن **دائماً وبالضرورة** — لأن كل قيد يضيف نفس المبلغ مديناً ودائناً، وطبقة الضريبة تضيف الطرفين معاً (`TrialBalance.tsx:54-69`)؛ التحذير عند فرق >0.05 (`:137`) عملياً لا يُطلق إلا بفساد بيانات. ⚠️ لكن انظر F6/F7: **توأمه GL ينحرف عنه** بالضريبة وبالقيود المعطلة — تناقض داخلي يجب سدّه قبل أي تدقيق خارجي.

## 4.3 الفجوات المحاسبية الحرجة — الأثر الفعلي

| الفجوة | الأثر الكمّي/العملي |
|---|---|
| **الإهلاك** | كل CAPEX (5 فئات `pnl-core:22-28`) يجلس بقيمته الشرائية للأبد: أصول مبالغ فيها + أرباح مبالغ فيها + لا صافي قيمة دفترية. لمنشأة تشتري معدات 200k بعمر 5 سنوات: تحريف سنوي 40k في الربح — **أكبر تحريف منهجي متبقٍ** |
| **الأرصدة الافتتاحية** | الميزانية = نشاط الفترة المرفوعة فقط؛ نقد/أصول/التزامات ما-قبل-النظام غير موجودة → أي مقارنة بميزانية سابقة أو طلب تمويل بنكي مستحيل. (مُقر بصراحة: `chart-of-accounts-foundation.md` §4) |
| **Settlements (اكتشاف هذا التدقيق، أعمق من D12)** | بلا قيود سداد/تحصيل: AR/AP يتضخمان أحادياً، النقد لا يرتبط بالذمم، وأعمار الذمم متى بُنيت ستُظهر كل الفواتير «غير مسددة». **هذه الفجوة يجب أن تدخل السجل كبند مستقل** |
| **D12 إيراد مقدم** | كل عربون/دفعة مقدمة تُعترف إيراداً فوراً → تضخيم إيراد الفترة وتقزيم التزاماتها — حرجة للمقاولات تحديداً (النشاط يقترح والدفتر يخالف: `contracting-construction.ts:87-95`) |
| **مسحوبات/مساهمات الملاك** | حقوق الملكية = أرباح متراكمة فقط؛ مالك ضخ 500k أو سحب 200k لا أثر لهما — «رأس المال 0.00» الظاهر حالياً في الميزانية عرضٌ صادق لبيانات ناقصة |
| **إقفال الفترات** | أي رفع لاحق يعدّل ماضياً معتمداً بلا أثر إقفال — يمنع الاعتماد الرسمي للقوائم |

## 4.4 امتثال المعايير (IFRS for SMEs / SOCPA)

**المستوفى:** أساس الاستحقاق للإيراد/المصروف؛ القيد المزدوج؛ فصل ضريبة المدخلات/المخرجات (متوافق مع منطق إقرار ZATCA)؛ تصنيف مصروفات بوظيفة معقولة (COGS/بيعية/إدارية).
**الفجوات التحديدية:** IAS16-مكافئ (إهلاك) غائب؛ IFRS15-مكافئ (توقيت الاعتراف/الإيراد المقدم) غائب D12؛ عرض المركز (متداول/غير متداول IAS1-مكافئ) غائب؛ اكتمال حقوق الملكية غائب؛ قائمة تدفقات ثلاثية غير مكتملة؛ لا سياسات محاسبية معلنة ولا إيضاحات.
**الأثر العملي:** القوائم الحالية صالحة **إدارياً** (قرارات المالك، متابعة داخلية) وممتازة لذلك؛ **غير صالحة رسمياً** (مراجع خارجي/بنك/زكاة كقوائم اعتماد) حتى إغلاق: افتتاحيات + إهلاك + D12 + إقفال. المسافة أقصر مما تبدو — البنية (typed accounts + قيود) تستوعبها كلها بقيود إضافية، وهذا تحديداً مخطط Phase B/C الموجود.

---

# §5 تشريح نظام الحوكمة والتدقيق

## 5.1 ما يعمل فعلاً (من الكود)
- **دورة حياة الملف كاملة:** staged (تصنيف hash+مفاتيح تجارية+مفاتيح حساب بنكي `server.ts:1928-1948`) → مراجعة → activate/replace/cancel/restore/delete، مع حذف قيود الملف عند حذفه (`:3376-3383`) والآن توليدها عند تفعيله.
- **شاشة المراجعة:** كل الأفعال حية؛ الاعتماد النهائي محجوب حتى معالجة كل CRITICAL (`ValidationReviewScreen` handleFinalSubmit — hasUnhandledCritical guard).
- **المرفوضات بموافقة مزدوجة للحرج** (`server.ts:3527+`: `requiredApprovals = CRITICAL?2:1`) — فصل واجبات حقيقي.
- **سلسلة تدقيق sha256 بربط سابق** + تحقق ذاتي (`:218-300`, `:3414`).
- **تصعيد سجل عبر الخادم** (الجديد): مخزن مستمر + idempotency بمفتاح (tenant,record,session,PENDING) — مثبت حياً بثلاثة سيناريوهات.

## 5.2 ما لا يعمل — وأثره على الموثوقية
| العطل | الأثر |
|---|---|
| UserManagement stubs (B3: `:996-1004`) | «إدارة الصلاحيات» واجهة بلا خلف — admin واحد فعلي؛ أي عرض «أدوار» للمشتري ادعاء غير مطابق |
| `override_audit_logs` كتابة Firestore عميلية (`ValidationReviewScreen:276`) | **مبررات الاعتماد الاستثنائي تضيع في dev** (نفس صنف عطل التصعيد قبل إصلاحه) — أخطر ثقب حوكمة متبقٍ لأنه يمس التجاوزات تحديداً |
| صفحة التنبيهات على حقل ميت + ازدواج severity/riskScore + عدّادات متداخلة (F11 + §2.2) | «مركز الإنذار» الإداري غير موثوق — والمستخدم لاحظه بنفسه (منشأ هذا المسار) |
| لا سطح لمراجعة التصعيدات الجديدة | الطلبات تُخزَّن ولا يوجد من يستهلكها بعد — نصف دورة |
| governanceRequests بلا سلسلة hash | قرارات الحوكمة أقل حماية من سجل التدقيق نفسه |

## 5.3 كفاية سجل التدقيق للمتطلبات السعودية
**الأساس أقوى من المعتاد** (تسلسل مربوط + تحقق). **الفجوات لمستوى ZATCA/مراجعة نظامية:** (1) التسلسل يغطي `auditLogs` فقط — القيود نفسها بلا تجزئة/ترقيم تسلسلي مانع للفجوات؛ (2) قابلية التعديل الرجعي بلا إقفال تكسر «عدم قابلية التغيير» عملياً حتى لو سُجّل التعديل؛ (3) لا احتفاظ مضمون (ملف JSON قابل للاستبدال بصلاحية نظام تشغيل)؛ (4) مبررات التجاوز (أخطر البنود تدقيقياً) في المسار المعطوب أعلاه. **الحكم:** ممتاز داخلياً، **غير كافٍ بعد** كملف تدقيق نظامي — يحتاج: تجزئة القيود + إقفال فترات + تخزين مُدار.

## 5.4 رفع الحوكمة لمستوى Enterprise
(1) توجيه `override_audit_logs` عبر الخادم بنفس نمط التصعيد (نصف يوم — نفس الوصفة المثبتة)؛ (2) سطح المراجع للتصعيدات (توسيع reviewer surface القائم `:1661-1684`)؛ (3) مصفوفة صلاحيات فعلية (roles→actions) تفعّل الموافقة-المزدوجة بأشخاص مختلفين حقاً؛ (4) إقفال فترات كسياسة حوكمة لا محاسبة فقط؛ (5) سلسلة hash للقيود وطلبات الحوكمة؛ (6) SLA للطلبات (طابع زمني + تقادم + تصعيد تلقائي).

---

# §6 تشريح تجربة المستخدم (UX Audit)

## 6.1 رحلة المحاسب الشهرية — خطوة بخطوة مع نقاط الاحتكاك

دخول → Owner Home (جيد: ربح/نقد/انتباه فوراً) → **[احتكاك 1]** إن لم تكتمل المزامنة: أصفار عابرة توحي بالعطب (ملاحَظ حياً) → رفع كشف المصروفات: اختيار قسم/فرع ثم ملف — واضح → **[احتكاك 2]** شاشة المراجعة تفتح بخمس بطاقات إحصاء وعشرات البطاقات؛ لأول استخدام لا يوجد «ابدأ بهذه الثلاث» → **[غموض 1]** بطاقة «حرجة» تحمل شارة «منخفض» (ازدواج severity/score) — يهز الثقة في أول دقيقة → يعالج الحرجة (تعديل/استثنائي/تصعيد/استبعاد — أفعال واضحة الآن بعد إصلاح التصعيد) → اعتماد → **[احتكاك 3]** العودة لإدارة الملفات يدوياً لملف الإيرادات وتكرار الدورة ×4 أقسام — لا «سلة رفع» موحدة → التقارير: قائمة دخل ثم ميزانية (ممتازة الآن بعد حذف التقديرية) → **[غموض 2]** يفتح GL ليطابق TB فيجد فرق الضريبة (F6) — سيظنه خطأه → **[فجوة]** لا يوجد «إقفال الشهر» — تنتهي الرحلة بلا فعل ختامي، والاعتماد «حالة ذهنية» لا حالة نظام.

## 6.2 رحلة الـCFO
يفتح فيرى Owner Home: ربح الشهر بجملة عربية + نقدية مطابَقة + بند انتباه — **أفضل من Zoho/QB اللذين يرميانه في وسط KPIs عامة**. يستطيع من اللوحة: قرار سيولة (نعم — الرقم مطابَق بنكياً)، قرار ربحية إجمالي (نعم). لا يستطيع: قرار تحصيل (لا أعمار)، قرار إنفاق رأسمالي (لا صافي أصول/إهلاك)، مقارنة خطة (Budget vs Actual موجود لكنه سنوي-مستوى-أقسام)، ولا يرى اتجاهاً >سنة داخل القوائم نفسها. **الحكم:** لوحة «مالك» ممتازة؛ لوحة «CFO» تحتاج الطبقة الثانية (أعمار/اتجاهات/نِسب).

## 6.3 المشاكل المكتشفة في الواجهة (الحالية، بعد إصلاحات هذا الأسبوع)
1. ازدواج severity/riskScore داخل نفس البطاقة (`ValidationReviewScreen:523` مقابل `:573`) — أعلى بند إرباك متبقٍ.
2. TB/GL لا يتطابقان (F6/F7) ولا يشرح أيٌّ منهما اختلافه عن الآخر.
3. TB/GL فراغ صامت في dev-auth (F8) — سيُقرأ «لا بيانات».
4. «كشف الحساب» تسمية واحدة لثلاثة معانٍ (مورد/عميل/بنك) عبر الأقسام.
5. صفحة التنبيهات الإدارية شبه-فارغة دائماً (حقل ميت) بينما شاشة المراجعة مزدحمة — توزيع إنذار معكوس.
6. أصفار التحميل العابرة (cross-cutting موثّق).
7. لا «لماذا؟» على التصنيف رغم توفر البيانات داخلياً.

## 6.4 مقارنة UX مع المنافسين
**أفضل:** لغة عربية أصلية بجُمل بشرية (لا ترجمة قوالب)؛ شاشة مراجعة الرفع (لا مكافئ لدى أحد)؛ شفافية الفجوات («تحويلات وحركات أخرى» بدل تلفيق — NetSuite نفسه يخفي أقل من هذا)؛ Owner Home كسرد لا كلوحة عدادات.
**أدنى:** غياب الإقفال الشهري كطقس (QB/Zoho يمتلكان checklist شهرياً)؛ لا bank feeds (معيار السوق)؛ لا mobile؛ لا مركز إشعارات فعّال؛ فراغات dev-auth الصامتة تعطي انطباع هشاشة لا يستحقه المنطق التحتي.

---

# §7 الديون التقنية والمخاطر الكاملة

## 7.1 السجل الموحَّد (الموثَّق + 🆕 مكتشفات هذا التدقيق)

| # | الدين | الموضع | الأثر | الأولوية | الجهد |
|---|---|---|---|---|---|
| T1 🆕 | GL يتجاهل taxAmount → GL≠TB | `server.ts:1240-1257` | تناقض تقارير جوهري | **حرج** | صغير (نسخ منطق tax من TB أو توحيدهما على core واحد) |
| T2 🆕 | GL يتجاهل isActive | نفسه | قيود ملغاة تُحتسب | حرج | صغير |
| T3 🆕 | TB/GL على `auth.currentUser` | `TrialBalance:22`,`GeneralLedger:25` | فراغ صامت dev-auth | عالٍ | صغير (وصفة RealBalanceSheet جاهزة) |
| T4 🆕 | غياب Settlements (سداد/تحصيل) | `erp-engine` كصنف غائب | AP/AR أحادية التضخم؛ يشوه الميزانية | **حرج محاسبياً** | كبير (تصميم مطابقة دفعة↔فاتورة) |
| T5 | إهلاك غائب | لا موضع — غياب | تحريف ربح/أصول منهجي | حرج | متوسط (قيد دوري + سجل أصول بسيط) |
| T6 | Δ54.78 أساس رواتب-ضريبية | `pnl-core:81-84` | فرق موثَّق بين P&L والقيود | متوسط | صغير (قرار أساس + سطر) |
| T7 | severity مضخَّم + عدّادات متداخلة + score مزدوج | `pre-validation:51,63,118` + شاشة | إرباك حوكمي | عالٍ | متوسط (توحيد نموذج الخطورة) |
| T8 | حقل Anomalies ميت + تنبيهات إدارية فارغة | `types.ts:26` + AlertsReport | مركز إنذار زائف | عالٍ | متوسط (مصدر جديد من insights المعتمدة) |
| T9 | مسارات JE ناقصة (restore/3584/dev-sync) | `server.ts` | قيود stale في مسارات نادرة | متوسط | صغير (الوصفة مثبتة) |
| T10 | activate بلا dedup سجلات | `server.ts:~2182` | تضاعف سجلات بإعادة تفعيل مباشرة | متوسط | صغير |
| T11 | 4 سجلات وهمية قائمة | `erp_registry.json` | ضجيج تقارير طفيف | منخفض | صغير (prune بحارس قائم) |
| T12 | B1 سقف preamble 20 | المعالجان المحميّان | سجلات مشوهة صامتة لملفات معينة | عالٍ | صغير تقنياً — يحتاج توقيع الحماية |
| T13 | B3 UserManagement stubs | `:996-1004` | صلاحيات شكلية | عالٍ للإنتاج | متوسط |
| T14 | override_audit_logs عميلي | `ValidationReviewScreen:276` | ضياع مبررات التجاوز في dev | عالٍ | صغير (نمط escalate جاهز) |
| T15 | D12، D13 | مُوثَّقان | اعتراف إيراد خاطئ للمقاولات؛ ذيل تصنيفي | عالٍ/متوسط | متوسط/كبير |
| T16 🆕 | فحص تكرار O(n²) | `expenses:83-101` | بطء رفعات كبيرة | متوسط | صغير (خرائط مفاتيح) |
| T17 🆕 | throw يفشل الرفعة | `pre-validation:108` | DoS-ذاتي بملف واحد | متوسط | صغير |
| T18 🆕 | types لا تطابق الإنتاج (`_originalIndex` vs `_originalRowIndex`؛ Anomalies إلزامي-ميت) | `types.ts` | أمان أنواع زائف | منخفض | صغير |
| T19 | dead code: CommandPalette، detectModuleType، استيراد Firestore الخلفي الشبحي | متفرقة | ضجيج صيانة | منخفض | صغير |
| T20 | dual-write الإعدادات | `settings-service.ts` | انفصام إعدادات | عالٍ قبل الإنتاج | متوسط |

## 7.2 مخاطر الأداء والتوسع
**العتبات المتوقعة:** انزعاج أول عند ~10k قيد (سحب raw كامل للواجهة + سلسلة memos)؛ ألم حقيقي عند ~50k (persist كامل-الملف المتزامن يحجب الخادم لكل عملية)؛ سقف عملي قبل إعادة الهندسة: **~100-150k قيد/مستأجر واحد** — أي «منشأة نشطة لسنتين-ثلاث». **الأغلى:** persistRegistry الكامل؛ raw بلا ترقيم صفحات؛ O(n²) التكرار؛ إعادة حساب App.tsx الكلية عند كل فلتر. **المعيقات البنيوية للتوسع:** أحادية العملية/الذاكرة (لا أفقية إطلاقاً)، والحوسبة التقريرية في المتصفح (تمنع نقل العرض للجوال/API كما تمنع البيانات الكبيرة).

## 7.3 مخاطر الجودة والموثوقية
**SPOF:** ملف `erp_registry.json` (الحقيقة كلها) + العملية الواحدة + مفتاح Firebase الواحد. **سيناريوهات فقدان:** كتابة مبتورة عند انقطاع (لا atomic rename)؛ كتابتان متزامنتان؛ حذف/تلف الملف بلا نسخ مُدار (git مصادفة حميدة لا سياسة). **الاختبارات:** لا إطار آلي دائم — الانضباط الحالي (بوابات يدوية + سكربتات حتمية تُحذف) ممتاز ثقافةً وهشّ استمراريةً؛ تغطية آلية فعلية: **0%**، مقابل مادة اختبارية جاهزة ممتازة (بوابات الهللة، fixtures الـ867، اختبارات idempotency) تنتظر التثبيت في CI فقط.

## 7.4 مخاطر الأمان والامتثال (تكميل §2.5 بدرجات)
S1 المفتاح في الجذر: **أثر: اختراق كامل للمشروع Firebase — حرج — الإصلاح: secret manager + تدوير موثَّق (يوم)**. S2 لا headers/rate-limit: **تشويش/إغراق — عالٍ — helmet+limiter (نصف يوم)**. S4 كتابات عميلية بقواعد غير مُتحقَّق نشرها: **تسرب/عبث ببيانات الفواتير — عالٍ — سحب للخادم (أسبوع)**. S5 لا schema validation: **حقن بيانات مشوهة للسجل — متوسط — zod على أجسام الكتابة (أيام)**. S6 عزل بلا حدود عملية/DB: **بنيوي — يُحل مع Postgres+RLS**. الامتثال (حفظ سجلات، إقامة بيانات، ZATCA-2): غير مستوفى بعد وموثَّق أعلاه — لا مفاجآت خفية.

---

# §8 خارطة طريق الوصول للعالمية

## 8.1 التقييم الرقمي الواقعي (من 10، بالتبرير)
| المحور | الدرجة | التبرير المكثف |
|---|---|---|
| الوظائف المحاسبية | **5.5** | قوائم أربع حقيقية المصدر ومُثبتة — لكن بلا افتتاحيات/إهلاك/تسويات/إقفال؛ «صحيح فيما يغطيه، وناقص فيما يجب أن يغطيه» |
| جودة البيانات | **7.5** | حوكمة رفع فريدة + حارس صفوف + توحيد كيانات + قيود متزامنة idempotent؛ يخصم: التصنيف المتجمد بلا إعادة-معالجة، وF6/F7 |
| الذكاء المالي | **7** | محرك سياقي مقيس بلا مثيل SME عربياً + طبقة أنشطة نظيفة؛ يخصم: لا تعلم من التصحيح، تغطية قطاعية متمركزة، ذكاء غير مرئي بعد الرفع |
| تجربة المستخدم | **6** | Owner Home وشاشة مراجعة من الطراز الأول؛ يخصم: ازدواج الخطورة، تناقض TB/GL، فراغات صامتة، لا طقس إقفال |
| الجودة التقنية | **4.5** | نوى core نظيفة وتوثيق استثنائي؛ يخصم بقسوة: monolith×2، صفر اختبارات آلية، فرع Postgres غير مختبَر، persist خطِر |
| الامتثال النظامي | **3** | إقرار VAT حسابياً + أثر تدقيق مسلسل؛ لا ZATCA-2، لا إقفال، لا احتفاظ مُدار |
| الجاهزية للإنتاج | **2.5** | dev data plane بكل ما يعنيه (SPOF، فقدان عند انقطاع، لا نسخ) |
| التنافسية (الفئة المستهدفة) | **6.5** | ثلاث ميزات لا يملكها أحد؛ محجوبة خلف فجوات table-stakes |

## 8.2 المرحلة 1 — «قابل للاستخدام الإنتاجي» (الحد الأدنى الذي يدفع مقابله عميل حقيقي)
**التعريف الصارم:** منشأة واحدة تُدخل حقيقتها المالية ولا تخشى عليها، وتخرج بقوائم يقبلها محاسبها الخارجي شهرياً.
المتطلبات الدقيقة (لا الطموحة): (1) Postgres شامل القيود + كتابة ذرّية + نسخ يومي — **غير قابل للتفاوض**؛ (2) الافتتاحيات (مسار إدخال واحد + قيد رأس مال)؛ (3) الإهلاك القسري البسيط (قسط ثابت، قيد شهري مولَّد)؛ (4) Settlements v1 (شاشة «سداد فاتورة/تحصيل» تولّد قيد بنك↔ذمم) — بدونها الميزانية تتشوه تراكمياً؛ (5) إصلاح T1/T2/T3/T14 (أيام مجمعة)؛ (6) إقفال شهر v1 (قفل تعديل قبل تاريخ)؛ (7) S1/S2 أمنياً؛ (8) تثبيت بوابات القبول في CI. **كل ما عدا ذلك يؤجَّل.**

## 8.3 المرحلة 2 — «منافس جدي خليجياً» (مقابل Zoho Books تحديداً)
(1) **ZATCA مرحلة 2 كاملة** (UBL/QR/ربط) — بوابة السوق؛ (2) أعمار ذمم + كشوف عملاء/موردين رسمية (فوق Settlements)؛ (3) bank feeds (ولو عبر مزوّد وسيط) — يحوّل المطابقة-بالهللة من ميزة فحص إلى ميزة تشغيل يومي؛ (4) تقارير مقارنة فترات داخل القوائم + نِسب؛ (5) نشاط-لكل-فرع + إظهار ذكاء الأنشطة في لوحات دائمة؛ (6) صلاحيات فعلية متعددة المستويات (T13)؛ (7) mobile-responsive للمالك. **غير القابل للتأجيل نظامياً:** ZATCA-2 والاحتفاظ المُدار بالسجلات.

## 8.4 المرحلة 3 — «منافس عالمي»
تعدد عملات كامل (قيود بعملة+تقييم فروقات)؛ مخزون دائم بتكلفة (متوسط مرجّح v1)؛ توحيد كيانات متعددة بقوائم مجمعة؛ API-first + webhooks + سوق تكاملات؛ SSO/SOC2-مسار؛ i18n حقيقي (الإنجليزية كمواطن أول في المحرك لا الواجهة فقط)؛ حينها فقط تُفتح ملفات «شركة متعددة الجنسيات» — وميزة الدخول ستكون: **الفرع العربي لأي عالمية يعمل على Fionira أفضل من نظامها الأم**.

## 8.5 المزايا التنافسية الفريدة المقترحة (قابلة للتنفيذ، لا شعارات)
1. **«شهادة مطابقة» قابلة للتنزيل:** تقرير PDF يجمع بوابات النظام (توازن-بالبناء، مطابقة بنكية بالهللة، سلسلة تدقيق مُتحقَّقة) موقَّعاً بتجزئة — يعطيه المالك لمحاسبه/بنكه. لا منافس يحوّل التحقق الداخلي إلى وثيقة ثقة خارجية.
2. **ذاكرة التصحيح كخندق بيانات** (§3.5-1): كل مستأجر يبني قاموسه؛ إجمالياً (بموافقة) قاموس كيانات سعودي لا يُشترى.
3. **حِزم القطاعات السعودية** (§3.5-4) بتقاريرها: «Fionira للمطاعم/للمقاولات» كمنتجات تسويقية فوق نفس النواة.
4. **وضع المحاسب الخارجي:** دخول قراءة-فقط + شهادة المطابقة + تعليقات على السجلات — يجعل المحاسبين قناة توزيع لا حرّاس بوابة.
5. **إقرار ZATCA «من الملف إلى البوابة»:** الرحلة الكاملة Excel→تصنيف→إقرار→تقديم كسيناريو واحد مُعلن بزمن («إقرارك في ساعة») — قابل للقياس والتسويق.
6. **سرد عربي تنفيذي فوق البوابات:** توسيع جُمل Owner Home إلى «قراءة شهرية» مولَّدة (فقرة عربية سليمة تشرح القوائم بأرقامها المثبتة) — «خبير يتكلم» حرفياً، ومستحيل التقليد السريع على المعرّبين.

---

# §9 اقتراحات التحسين الشاملة (بالصيغة القياسية)

**[P1] توحيد TB/GL على core واحد**
[المشكلة]: F6/F7 — تقريران «نفس المصدر» يختلفان بالضريبة وبالقيود الملغاة. [التصميم]: استخراج `aggregate` من `balance-sheet-core.ts:57-84` إلى `ledger-core.ts` يستهلكه TB (client) وGL (endpoint 1236) معاً، مع فلتر isActive موحَّد. [الأثر]: تطابق TB=GL حرفياً؛ يزيل أول سؤال سيطرحه أي مدقق. [الأولوية]: حرج. [الجهد]: صغير.

**[P2] Explainability للتصنيف**
[المشكلة]: قرارات المحرك غير مرئية (detectedRule يُطبع للـconsole فقط `categorization-engine:451-459`). [التصميم]: إرجاع `{category, rule, top3:[{cat,score}]}` من الدالة (توسيع توقيع خلفي-التوافق)، تخزينها بالسجل، شارة «لماذا؟» في بطاقات المراجعة وكشوف الموردين. [الأثر]: خفض زمن مراجعة السجل المشكوك ~50%؛ رفع ثقة المحاسب المحترف. [الأولوية]: عالٍ. [الجهد]: صغير-متوسط.

**[P3] Settlements v1 (سداد/تحصيل)**
[المشكلة]: T4 — لا طرف ثانٍ للاستحقاق؛ AP/AR يتضخمان للأبد. [التصميم]: شاشة «تسوية» تختار فواتير جهة + حساب بنك → قيد Dr موردين/Cr بنك (أو عكسه للعملاء) بمرجع الفواتير؛ لاحقاً اقتراح مطابقة تلقائي من حركات البنك (المبلغ+الجهة+التاريخ). [الأثر]: ميزانية تعكس ذمماً حقيقية؛ يفتح أعمار الذمم؛ يربط النقد بالدفتر. [الأولوية]: حرج (مرحلة 1). [الجهد]: كبير.

**[P4] إدارة الأصول والإهلاك v1**
[المشكلة]: T5. [التصميم]: كل سجل CAPEX يولّد أصلاً في سجل أصول (`AppSettings`-نمط أو جدول)؛ عمر افتراضي لكل فئة (5 فئات CAPEX موجودة)؛ مولّد قيد شهري Dr مصروف إهلاك/Cr مجمع إهلاك؛ `chart-of-accounts` يصنّف «مجمع إهلاك» contra-asset (توسيع subtype). [الأثر]: أرباح وأصول صحيحة زمنياً؛ شرط أي اعتماد خارجي. [الأولوية]: حرج (مرحلة 1). [الجهد]: متوسط.

**[P5] ZATCA مرحلة 2**
[المشكلة]: بوابة السوق السعودي؛ الفاتورة الحالية PDF فقط. [التصميم]: مولّد UBL 2.1 + QR (TLV) فوق بيانات SmartInvoice بعد سحبها للخادم؛ onboarding أجهزة (CSID) وربط Reporting/Clearance API؛ أرشفة الفواتير الموقعة بالسلسلة الهاشية القائمة. [الأثر]: يفتح كل عميل ملزَم بالمرحلة 2 (السوق كله تدريجياً). [الأولوية]: حرج (مرحلة 2 أولها). [الجهد]: كبير.

**[P6] مركز إشعارات حي يستبدل AlertsReport**
[المشكلة]: T8/F11. [التصميم]: عند الاعتماد، تُخزَّن insights النهائية على السجل (`issuesSummary`) وتُجمَّع في endpoint `alerts?module=&branch=`؛ AlertsReport يقرأه بفلاتر؛ حذف الاعتماد على `Anomalies`. [الأثر]: مركز إنذار صادق لكل قسم؛ يغلق شكوى المستخدم الأصلية جذرياً. [الأولوية]: عالٍ. [الجهد]: متوسط.

**[P7] توحيد نموذج الخطورة**
[المشكلة]: T7. [التصميم]: إلغاء تحويل HIGH→CRITICAL (`pre-validation:51`)؛ اعتماد `riskScore` مصدراً وحيداً بدالة عرض واحدة (العتبات الحالية `getRiskLevel`)؛ عدّادا الملخص يُشتقان من نفس الدالة. [الأثر]: زوال بطاقة «حرج/منخفض» المتناقضة؛ عدّادات قابلة للتفسير. [الأولوية]: عالٍ. [الجهد]: صغير-متوسط.

**[P8] لوحة CFO (الطبقة الثانية فوق Owner Home)**
[المشكلة]: §6.2. [التصميم]: صفحة تجمع: أعمار ذمم (بعد P3)، اتجاه 13-شهراً للربح/النقد (البيانات موجودة)، نِسب (من core-ي P&L/BS)، حالة الموازنة، وقائمة الاستثناءات المفتوحة (من P6). [الأثر]: يرفع الجمهور من «مالك» إلى «مدير مالي» بلا مساس بالبساطة الأولى. [الأولوية]: متوسط. [الجهد]: متوسط.

**[P9] الموازنة v2**
[المشكلة]: MVP سنوي-قطاعي فقط. [التصميم]: شهرية بتوزيع (أنماط توزيع جاهزة: متساوٍ/موسمي من السنة السابقة)، على مستوى فئة، مع rolling forecast بسيط (فعلي حتى الآن + خطة الباقي)؛ نفس مصدر `computePnLCore`. [الأثر]: يحوّل «مقارنة نهاية سنة» إلى أداة توجيه شهرية. [الأولوية]: متوسط. [الجهد]: متوسط.

**[P10] Bank feeds**
[المشكلة]: الرفع اليدوي سقف تكرار-الاستخدام. [التصميم]: تكامل مزوّد مفتوح-الخدمات المصرفية سعودي (Lean/Tarabut-فئة) → حركات يومية تدخل نفس خط staged كملف افتراضي؛ المطابقة القائمة تعمل كما هي. [الأثر]: من «نظام شهري» إلى «نظام يومي»؛ يضاعف قيمة المطابقة-بالهللة. [الأولوية]: عالٍ (مرحلة 2). [الجهد]: كبير.

**[P11] المخزون الدائم v1**
[المشكلة]: توريد-فقط (§4.1). [التصميم]: حركات صرف/جرد (يدوية أولاً)، متوسط مرجّح، قيد Dr COGS/Cr مخزون عند الصرف، وجرد دوري يولّد فرق هالك (يتكامل مع D7 القائمة). [الأثر]: COGS حقيقي للتجزئة/التصنيع؛ يفعّل insights الجرد الموجودة. [الأولوية]: متوسط (مرحلة 3 أو حسب شريحة العملاء). [الجهد]: كبير.

**[P12] صلاحيات متعددة المستويات فعلية**
[المشكلة]: T13 — stubs. [التصميم]: تفعيل الجداول القائمة (`tenant_users`) بأدوار (owner/accountant/reviewer/viewer) وربط الأفعال الحساسة (اعتماد استثنائي/قرار حوكمة/إقفال) بأدوار مميزة — يجعل الموافقة-المزدوجة حقيقية بشخصين. [الأثر]: شرط مؤسسي + يصحح ادعاء الواجهة. [الأولوية]: عالٍ (مرحلة 2). [الجهد]: متوسط.

**[P13] API خارجي v1**
[المشكلة]: صفر تكاملات. [التصميم]: REST قراءة-أولاً (records/journal/statements/alerts) بمفاتيح لكل مستأجر + webhooks للأحداث (upload.activated, alert.created) — بعد Postgres حصراً. [الأثر]: يفتح شركاء (POS/متاجر) بلا تخصيص يدوي. [الأولوية]: متوسط (مرحلة 3). [الجهد]: متوسط-كبير.

**[P14] اختبارات CI للبوابات (الرافعة الأرخص)**
[المشكلة]: §7.3 — تغطية آلية 0% رغم مادة جاهزة. [التصميم]: تثبيت 6 اختبارات: توازن-بالهللة، NI-Δ≤54.78، regression الـ867، idempotency الرفع المكرر، حارس الصفوف، تحقق سلسلة التدقيق — تشغيل عند كل push. [الأثر]: تحويل الانضباط اليدوي الحالي إلى ضمانة دائمة؛ يحمي كل ما سبق. [الأولوية]: **حرج** (يسبق كل توسّع). [الجهد]: صغير.

**[P15] نشاط-لكل-فرع + إظهار ذكاء الأنشطة**
[المشكلة]: §3.5-الفجوة + 4-ب-2 السابقة. [التصميم]: `activity` ينتقل من tenant إلى branch (fallback للقيمة القديمة)؛ ولوحة «رؤى نشاطك» دائمة تعرض insights المجمَّعة (هدر الشهر مقابل خطك الأساسي، مشاريع بلا ربط...). [الأثر]: الذكاء المدفوع-الثمن يصبح مرئياً يومياً؛ يفتح شريحة متعدد-الأنشطة. [الأولوية]: متوسط-عالٍ. [الجهد]: متوسط.

---

# §10 الملخص التنفيذي للخبير — الحكم النهائي الصريح

**ما يجعل Fionira جديراً بالاستمرار والاستثمار:** ثلاثة أصول يصعب شراؤها أو استنساخها: (1) **نواة تصنيف عربية سياقية مقاسة** بمنهجية blast-radius لا أعرف لها نظيراً في فئة SME؛ (2) **عقد مسؤولية مقلوب مثبت تقنياً** — النظام يتحقق بالهللة ويعرض فروقه بدل إخفائها، وقد اصطادت بواباته خطأً حقيقياً موثَّقاً؛ (3) **ثقافة هندسية توثيقية** (خمسون وثيقة قرار/دليل، تراجعات مقاسة) تخفض مخاطرة أي فريق/مستثمر قادم أكثر من أي due-diligence معتاد. هذه ليست مزايا شرائح عرض — إنها في الكود.

**أكبر خطر إن لم يُعالَج قريباً:** **مستوى البيانات** — كل القيمة أعلاه تجلس على ملف JSON يُعاد كتابته كاملاً بلا ذرّية ولا نسخ مُدار داخل عملية واحدة. حادثة انقطاع واحدة أثناء حفظ عند أول عميل حقيقي تمحو الحقيقة المالية وتُنهي سمعة منتجٍ عنوانه «الثقة». كل أسبوع تطوير وظيفي إضافي قبل معالجة هذا يرفع تكلفة الهجرة ويؤخر أول ريال إيراد آمن.

**الخطوة الواحدة الأعلى أثراً الشهر القادم:** **قطع Postgres شاملاً القيود، مع كتابة ذرّية ونسخ يومي، وتثبيت بوابات القبول الست في CI (P14) كشرط قبول للهجرة نفسها.** كل شيء آخر — بما فيه الإهلاك وZATCA — يُبنى فوقها أسرع وأرخص وأأمن.

**التقييم الإجمالي على المقياس:**
`نموذج أولي → [MVP] → منتج → منافس محلي → منافس عالمي`
Fionira يقف عند **«MVP متأخر بنواة منتجٍ ناضجة»** — منطقه المحاسبي والتصنيفي تجاوز مرحلة MVP بوضوح (يضاهي منتجات ناضجة في نطاقه المغطى)، بينما بنيته التشغيلية (تخزين/اختبارات/أمان إنتاج) ما زالت نموذجاً أولياً. المسافة إلى **«منتج»**: المرحلة 1 كما حُدّدت (§8.2) — تقديري 2-3 أشهر عمل مركّز. إلى **«منافس محلي جاد»**: +ZATCA-2 وbank feeds وأعمار الذمم — 6-9 أشهر إضافية. إلى «عالمي»: طريق سنتين مشروط بالمرحلتين وبقرار i18n جوهري في المحرك. **الاحتمال الهندسي لبلوغ كل مرحلة مرتفع** — لأن أصعب ما في هذه الفئة (الذكاء الموثوق بالعربية + الحوكمة) مبنيٌّ فعلاً، والباقي هندسة معروفة الوصفات.

---
*نهاية التدقيق. كل مرجع (ملف:سطر) قابل للتحقق في المستودع بتاريخ 2026-07-01. البنود الموسومة 🆕 (T1-T4، T16-T18، F6-F8، S2، وغياب Settlements) اكتُشفت في هذا التدقيق ولم تكن موثَّقة سابقاً — يُوصى بترحيلها إلى سجل §0-C.*


═══════════════════════════════════════════════════════════════
## 📄 الوثيقة 6: `_artifacts/reviews/fionira-expert-audit-v2.md`
═══════════════════════════════════════════════════════════════

# Fionira — التدقيق الجراحي الشامل v2 (استكشاف حر كامل)

**التاريخ:** 2026-07-01 · **المنهج:** استكشاف حر من الصفر بلا قائمة مفروضة — مسح كامل لهيكل المشروع (الجذر، `src/` بطبقاته الـ12، `scripts/`، `data/`، الإعدادات والبنية التحتية) ثم قراءة معمَّقة لما استحق: كل المحرّكات والمعالجات وقواعد الأنشطة والنوى المحاسبية سطرياً، وطبقة قاعدة البيانات (`db.ts` كاملاً)، وقواعد Firestore، والوحدات غير المدقَّقة سابقاً (**SmartInvoice** 1,792 سطراً، **TaxDeclaration** كاملاً، `upload-classifier`، `header-detection`، `settings-service`، `AuthProvider`)، وهيكل `server.ts` (4,118 سطراً) و`App.tsx` (2,941).
**العلاقة بالتدقيق v1** (`fionira-expert-audit.md`, commit `62715c0b`): هذا الإصدار **يحتويه ويتجاوزه** — يثبّت مكتشفاته (T1-T20، F1-F11، S1-S6) ويضيف **مكتشفات الاستكشاف الحر** الموسومة 🆕v2، وأخطرها في الامتثال (ZATCA) وفي مسار Postgres الكامن.
**القاعدة:** كل حكم بمرجع ملف:سطر. لا مجاملة.

---

## ⚡ المكتشفات الجديدة في v2 (خلاصة تنفيذية قبل التفصيل)

| # | الاكتشاف 🆕v2 | الموضع | لماذا خطير |
|---|---|---|---|
| V1 | **ادعاء توافق ZATCA بلا أساس**: الواجهة تعلن «فواتير ذكية متوافقة مع متطلبات هيئة الزكاة» بينما وحدة الفاتورة **لا تحتوي حرفاً واحداً** من QR/TLV/ZATCA | الادعاء: `App.tsx:2167`؛ الغياب: بحث شامل في `SmartInvoice.tsx` (1,792 سطراً) = 0 نتيجة | QR إلزامي للفاتورة المبسطة منذ ديسمبر 2021 (المرحلة 1!) — الفاتورة الصادرة اليوم **غير قانونية للاستخدام الضريبي**، والواجهة تقول عكس ذلك. أخطر بند «ثقة» في المنتج كله |
| V2 | **ترقيم فواتير غير تسلسلي**: `INV-${Date.now().toString().slice(-6)}` | `SmartInvoice.tsx:667` | ZATCA تشترط تسلسلاً غير منقطع؛ الطابع الزمني يقفز ويتصادم نظرياً |
| V3 | **بيانات الفواتير تُرسل لـGemini من المتصفح بمفتاح API عميلي** | `SmartInvoice.tsx:2,240,266` (`new GoogleGenAI({apiKey})` client-side) | تسريب مفتاح مدفوع لأي مستخدم + خروج بيانات عملاء/أسعار لطرف ثالث بلا سياسة معلنة — عائقا امتثال وخصوصية معاً |
| V4 | **خطأ حالة-أحرف يمحو «غير الخاضع» في كلا مسارَي Postgres**: يقرأان `r.Nontaxable_Amount` بينما الحقل الفعلي `NonTaxable_Amount` (بـT كبيرة — `types.ts:21`، والمعالجات تكتبه هكذا `expenses-processor.ts:194`) | `db.ts:203` (هجرة الإقلاع) + `server.ts:~2083` (فرع Postgres في activate) | عند أول قطع Postgres: **كل المبالغ المعفاة/الصفرية تُخزَّن صفراً** → إقرار ضريبي خاطئ وصوامت. برهان حي على تنبؤ v1 «فرع isConnected غير المختبَر سينحرف» |
| V5 | **وحدتان متقاعدتان ما زالتا في الشجرة كاملتين** (OwnersSummary 161 سطراً + VisualDashboard 273) بلا أي route | `grep` على App/NewAppShell = 0 استخدام | 434 سطر كود ميت يوحي زوراً بميزات ويضلل أي فاحص |
| V6 | **`zod` مثبَّتة ومستخدمة عميلياً فقط** (`schemas.ts` لأشكال الاستجابات) — **صفر تحقق مدخلات في الخادم** | `package.json` + الاستيراد الوحيد `schemas.ts:2` | يؤكد S5 بدقة أشد: الأداة موجودة والانضباط غائب حيث يهم |
| V7 | **`docker-compose.yml` بـPostgres جاهز** (rapid_s1) + بيانات اعتماد افتراضية postgres/postgres في `db.ts:8-10` | الجذر + `db.ts` | البنية أقرب مما توحي الوثائق — لكن الافتراضيات credentials-in-code يجب قتلها قبل أي بيئة مشتركة |
| V8 | **VAT افتراضي 15 مكتوب رقمياً** في مسار استيراد بنود الفاتورة | `SmartInvoice.tsx:775` | نفس عائلة الـ0.15 الثابتة في المحرّكات (`expenses-intelligence:76`) — تغيير نسبة رسمي = مطاردة أرقام مبعثرة |
| V9 | **تصنيف `APPROVED_PERIOD_LOCKED` معرَّف ولا يُنتَج أبداً** | `upload-classifier.ts:5` (النوع) مقابل المنطق `:112-134` (لا مسار يعيده) | أثر لطموح «قفل فترات» لم يُبنَ — يؤكد فجوة الإقفال من زاوية ثانية |
| V10 | **`header-detection.ts` الممتاز غير موصول بمعالجَي المصروفات/الإيرادات** — يمسح 200 صف بمرساة نطاقية (`:73`) بينما هما على سقف 20 يدوي | المعالجان يستوردانه؟ لا — بحث: يستخدمه bank/payroll فقط | الحل الجاهز لدين B1 موجود في نفس المجلد منذ أسابيع؛ الحاجز تنظيمي (@DO_NOT_MODIFY) لا تقني |

---

# §1 هوية النظام وموقعه التنافسي الحقيقي

## 1.1 ما هو فعلاً (من الكود)
**خط أنابيب «مستند→دفتر» محكوم (Governed Document-to-Ledger Pipeline):** مدخل الحقيقة المالية الوحيد ملف Excel عبر `staged-upload` (`server.ts:1819`)؛ بين الملف والدفتر ثلاث بوابات إلزامية — تصنيف لحظة-التفكيك (`expenses-processor.ts:175`)، ذكاء مخاطر لكل سجل (`pre-validation-engine.ts:29-48`)، ومراجعة بشرية بلغة عادية (`ValidationReviewScreen`) — ثم قيد مزدوج مولَّد آلياً (`erp-engine.ts:40`) متزامن idempotent مع السجلات (`syncJournalEntriesForFile`). لا توجد أي شاشة قيد يدوي. **الفئة:** بين أتمتة المستندات (Dext-class) ومحاسبة SME (Zoho-class)، متفوقاً على الأولى بدفتر كامل وقوائم، وعلى الثانية بفهم عربي عميق وحوكمة رفع لا نظير لها.

**جوهر الاختلاف البنيوي:** عقد المسؤولية مقلوب — النظام يتحقق ويبرهن (توازن-بالبناء `balance-sheet-core.ts:115-117`، مطابقة بنكية بالهللة `bank-cashflow-core.ts:13-14`، سلسلة تدقيق sha256 `server.ts:249-300`) بدل أن يطلب من المستخدم التحقق. مبدأ «النظام هو الخبير» مقنَّن ومدقَّق (`expert-system-principle-audit.md`) وانتهاكه الوحيد (migration_review) حُذف فعلاً.

## 1.2 المستخدم الأنسب الآن — وحدوده
منشأة سعودية 5–50 موظفاً، F&B/تجزئة/خدمات، دفاترها Excel، عملة واحدة، محاسب خارجي شهري. (كل fixtures التحقق من هذا الملف: 730 سجل مطعم حقيقي، كشوف بنوك سعودية بـpreamble، مسير رواتب فعلي.) **الحدود:** نشاط واحد لكل مستأجر (`server.ts:1838`)؛ لا عملة ثانية (لا حقل currency في `types.ts` إطلاقاً)؛ رفع يدوي فقط؛ وقبل كل شيء dev data plane (§2.4).

## 1.3 المقارنة التنافسية

| المحور | Fionira | Zoho Books | QuickBooks | SAP B1 | NetSuite | قيود/دفترة (عربية) |
|---|---|---|---|---|---|---|
| فهم عربي تصنيفي للنص الحر | 🏆 تطبيع نص+أنماط (`nrx` `categorization-engine:12`) + توحيد كيانات كمبدأ دائم (CLAUDE.md) | — | — | — | — | واجهة عربية فقط |
| حوكمة رفع (تصنيف نسخة/تداخل/حساب-واعٍ) | 🏆 `upload-classifier.ts` كاملاً + حارس هوية الحساب البنكي `:92-110` | — | — | workflows عامة | workflows قوية | — |
| مطابقة بنكية بالهللة كبوابة بناء | 🏆 (`cash-flow-statement-build.md` 9,000=9,000) | مطابقة يدوية جيدة | ML جيد إنجليزياً | ✅ | ✅ | أساسية |
| سجل تدقيق مسلسل-التجزئة + تحقق ذاتي | 🏆 (`server.ts:218-300, 3414`) | عادي | عادي | قوي | قوي | عادي |
| **ZATCA فوترة (مرحلة 1 فضلاً عن 2)** | ❌ **صفر QR** رغم ادعاء الواجهة (V1) | ✅ معتمد | جزئي | add-ons | شركاء | 🏆 نقطة قوتهم |
| إهلاك/افتتاحيات/أعمار ذمم/إقفال/عملات/مخزون دائم | ❌ الست جميعاً | ✅ | ✅ | ✅✅ | ✅✅ | ✅ أساسي |
| Multi-tenant إنتاجي + API | ❌ | ✅✅ | ✅✅ | ✅ | 🏆 | ✅ |

**الخلاصة:** ثلاث ميزات لا يملكها أحد (العربية التصنيفية، حوكمة الرفع، البرهنة-بالبناء) مقابل قائمة table-stakes كاملة غائبة — **والأسوأ أن الفجوة الوحيدة المدَّعى إغلاقها في الواجهة (ZATCA) ليست مغلقة حتى بمستوى 2021.**

---

# §2 تشريح البنية المعمارية الكاملة

## 2.1 الخريطة والطبقات (كما اكتُشفت حرّاً)

```
src/
├─ backend/core/            ← قلب النظام
│  ├─ ingestion-engine.ts   منسّق + حارس الصفوف الجزئية (isEmptyPartialRow :15-38)
│  ├─ processors/ (7)       expenses/revenues (yدويا-الرأس، سقف 20) · bank/payroll (على header-detection)
│  │                        · inventory · shared (تواريخ/أرقام) · bank-classification (3 محاور + GL_NATURES :92)
│  ├─ categorization-engine 526 سطراً، 5 مراحل، مجمَّد
│  ├─ erp-engine            القيد المزدوج (149)
│  ├─ pre-validation/       جلسة المراجعة + الخطورة
│  └─ financial-intelligence/  موجّه + 5 محرّكات + 5 قواعد نشاط + vendor-profiler
├─ lib/                     النوى: pnl-core · balance-sheet-core · bank-cashflow-core · chart-of-accounts
│                           · financial-utils (CATEGORY_ORDER :469، 44 فئة) · upload-classifier
│                           · settings-service (dual-write!) · governance-dry-run · pdf-engine · schemas (zod عميلي)
├─ modules/ (36)            15,280 سطراً — أكبرها SmartInvoice 1,792 (غير مدقَّقة حتى هذا التقرير)
├─ contexts/ AuthProvider   claims-first + bootstrap /users/init + dev-auth منعزل
├─ backend/utils/db.ts      Postgres: 5 جداول + هجرة-عند-الفراغ (بلا journal_entries!)
server.ts (4,118)           48 endpoint + devMemoryDb + persist + auth + سلسلة التدقيق
data/erp_registry.json      الحقيقة كلها: 1,138 سجلاً + 1,131 قيداً + الحوكمة
docker-compose.yml          Postgres 15 جاهز (rapid_s1) 🆕v2
firestore.rules             عزل claims-based معرَّف (نشره غير مُتحقَّق من المستودع)
```

**تقييم المكوّنات (المستجد على v1):**
- `header-detection.ts` — **أفضل قطعة parsing في المشروع**: مرساة نطاقية + مسح 200 صف + دمج رؤوس مزدوجة + resolver مُرتَّب الأولوية يحل «الالتقاط الجشِع» (`:140-160`). عيبه الوحيد أنه **غير موصول** حيث يلزم أكثر (V10).
- `upload-classifier.ts` — منطق قرار نظيف بثلاث طبقات أدلة (تداخل سجلات≥80% → نسخة مصححة؛ هوية حساب مختلفة → مصدر جديد قسراً `:100-110`) — لكن عتبة الـ80% ثابتة بلا معايرة، ونوع `APPROVED_PERIOD_LOCKED` ميت (V9).
- `SmartInvoice.tsx` — **أضعف وحدة قياساً بحجمها**: 1,792 سطراً تخلط UI+AI+تخزين+PDF؛ تكتب Firestore مباشرة (`:31,458`)؛ Gemini عميلياً (V3)؛ ترقيم زمني (V2)؛ **منفصلة كلياً عن الدفتر** — الفاتورة الصادرة لا تولّد سجل إيراد ولا قيداً (مسار Firestore موازٍ للحقيقة المالية).
- `db.ts` — نظيف كبنية (pool/transaction سليمان) لكن: بيانات اعتماد افتراضية بالكود (V7)، هجرة تُشغَّل مرة-عند-الفراغ فقط، **وخطأ V4 القاتل في تحويل الحقول**.
- `TaxDeclaration.tsx` (145 سطراً كاملة) — حسابياً سليم (تجميع Taxable/NonTaxable/VAT منفصلاً `:26-38`، صافي = مخرجات−مدخلات) بتنويه صادق (`:139`)؛ **لكنه ملخص، لا إقراراً**: لا خانات نموذج الهيئة، لا فترة إقرار مستقلة عن فلتر الواجهة، لا تصدير، ولا معالجة مدخلات غير قابلة للخصم (مصرَّح بها في التنويه).

## 2.2 تدفق البيانات ونقاط الخطر (المجمّع النهائي: v1-F1..F11 + 🆕v2)
السلسلة الكاملة في v1 §2.2 تبقى صحيحة. الإضافات:
- **F12 🆕v2 (V4):** فرعا Postgres يمحوان NonTaxable — خطر صامت مؤجَّل حتى القطع.
- **F13 🆕v2 (V1/V2):** مسار الفاتورة الصادرة كله خارج خط الحوكمة والدفتر — «جزيرة Firestore» تنتج مستندات ضريبية غير ممتثلة باسم النظام.
- تأكيد قياسي لـF6/F7: `/api/erp/ledger` (`server.ts:1240-1257`) بلا taxAmount وبلا isActive مقابل TB العميل (`TrialBalance.tsx:29,54-69`) — **التقريران «التوأمان» ينحرفان بكل الضريبة وبالقيود الملغاة**.

## 2.3 نموذج البيانات
سليم في فصل المبالغ الخمسة وثنائية Raw/Normalized للكيان. النواقص الحرجة (v1 §2.3 تفصيلاً): عملة، dueDate/paidAt (بوابة أعمار الذمم والتسويات)، postingDate≠documentDate (بوابة الإقفال)، مركز تكلفة صريح. التناقضات: `Anomalies` إلزامي-ميت (`types.ts:26`)، `_originalIndex` مقابل `_originalRowIndex` الفعلي (`expenses-processor:184`) — **والآن V4 يضيف: عدم تطابق الحالة بين طبقة المعالجة وطبقة Postgres.**

## 2.4 التخزين
كما في v1 (عتبات ~10k/50k/100-150k قيد؛ كتابة كاملة-الملف غير ذرّية `server.ts:463-477`؛ سباق كتابتين؛ dual-write الإعدادات). المستجد: **docker-compose جاهز** يقصّر طريق القطع، لكن `runStartupMigration` «مرة-عند-الفراغ» (`db.ts:158,196,232,258`) **ليست أداة قطع** — إنها bootstrap لمرة واحدة؛ القطع الحقيقي يحتاج هجرة قابلة للإعادة + جدول قيود (غير موجود) + إصلاح V4 أولاً.

## 2.5 الأمان
v1-S1..S6 كلها قائمة. الإضافات 🆕v2: **مفتاح Gemini في العميل** (V3 — استخراجه من الحزمة تافه)؛ **بيانات اعتماد Postgres افتراضية بالكود** (V7)؛ وتأكيد أن zod الموجودة لا تحرس أي endpoint (V6). الإيجابي المؤكَّد: `firestore.rules` مكتوبة بعزل claims-based صحيح البنية (`getTenantId/isTenantData` بدايات الملف) — المشكلة أن نشرها الفعلي **غير قابل للإثبات من المستودع** وكل أمن «جزيرة Firestore» معلَّق عليها.

---

# §3 تشريح محرك التصنيف الذكي
(الخوارزمية الكاملة موثَّقة في v1 §3.1 — خمس مراحل من التطبيع المزدوج حتى تنقيح المبلغ؛ تبقى صحيحة حرفياً.)

**قوته المؤكدة بالاستكشاف الحر:** حسم ثنائيات المعنى سياقياً (بدل إقامة→سفر `:377`؛ راتب محاسب→راتب `:307`)؛ عزل تسرّب اسم المورد كصنف (`descOnly` `:243-246`)؛ fixtures انحدار حقيقية بثقافة blast-radius (ثلاث محاولات D13 مقاسة ومرفوضة — `engine-technical-debt.md`).

**حدوده الحقيقية:** تمركز مفردات F&B (قوائم `:22-24,134`)؛ D13 البنيوي («ال» تكسر الحدود) مفتوح بشرط وسم-أمان-المورد؛ scores جمعية قابلة للخداع التركيبي؛ `Confidence_Score` المخزَّن سلامةٌ حسابية لا ثقة تصنيف (`expenses-processor:197-198`)؛ **صفر تعلم من التصحيحات** — كل تعديل يدوي يتبخر؛ تكافؤ لغوي غير متوازن (Stage-3 التحكيمي عربي شبه-كامل `:369-422`).

**التحسينات القابلة للتنفيذ (مفصَّلة v1 §3.5، تبقى الخطة):** ذاكرة مورد→فئة من التصحيحات (خفض متوقع 40-60% لتصحيحات الشهر الثاني)؛ إظهار detectedRule+top-3 (محسوبة أصلاً `:74,:427`)؛ وسم vendorSafety كبيانات (بوابة D13)؛ حِزم مفردات قطاعية كبيانات لا كود؛ ثقة تصنيفية حقيقية top/(top+second) بعتبة مراجعة؛ ومزامنة فحوص المجالات (FUZZY للإيرادات، عتبة رواتب نسبية بنمط baseline المطاعم `restaurant-wastage.ts:45-65`، إصلاح النوع `FUTURE_EXPENSE` في الإيرادات `revenues:86`).

---

# §4 تشريح الطبقة المحاسبية

## 4.1 صحة القيود — الحكم النهائي
كل أنواع `generateJournalEntries` صحيحة **كطرف استحقاق أول** (جدول v1 §4.1 نوعاً-نوعاً). العيب البنيوي المؤكَّد: **غياب صنف Settlements كاملاً** — لا قيد سداد/تحصيل/مطابقة-بنك-بفاتورة في النظام كله؛ حسابا تسوية البنك (`erp-engine:127-131`) صادقان لكنهما لا يُقفلان مقابل AR/AP. النتيجة المرئية الحالية: التزامات 682,703 مقابل أصول 565,811 وحقوق سالبة −116,891 — **بنية أرقام لا يمكن تفسيرها للمستخدم بدون هذه الفجوة**.

## 4.2 صحة التقارير
- **قائمة الدخل:** استحقاق نقي، CAPEX مستثنى صحيحاً (`pnl-core:92`)، بعيبَي Δ54.78 (أساس رواتب-بضريبة `:81-84`) وغياب الإهلاك (ربح منفوخ بقدر الاستهلاك).
- **الميزانية:** توازن حقيقي بالبناء وتصنيف سليم للحسابات الـ160 (صفر غير-مصنّف، وبوابة الهللة اصطادت خطأ COGS-كإيراد فعلاً)؛ بلا متداول/غير متداول وبلا صافي أصول.
- **التدفقات:** تشغيلي مكتمل مُبرهَن؛ استثماري/تمويلي غائبان بإفصاح (`CashFlow.tsx:80-83`).
- **ميزان المراجعة:** يتوازن بالضرورة (الضريبة تُضاف للطرفين `TrialBalance:54-69`) — **لكن توأمه GL منحرف عنه** (F6/F7) وكلاهما على `auth.currentUser` المعطوب dev-auth (F8).

## 4.3 الفجوات الحرجة (مرتبة بالأثر)
1. **Settlements** (تشوّه تراكمي للمركز) → 2. **الإهلاك** (تحريف منهجي للربح والأصول — لا وجود له إلا كنص EBITDA وصفي `IncomeStatement.tsx:287`) → 3. **الافتتاحيات** (ميزانية-فترة لا مركزاً) → 4. **D12 الإيراد المقدم** (المقاولات تعترف بالعربون إيراداً والنشاط نفسه يوصي بعكسه `contracting-construction.ts:87-95`) → 5. **مساهمات/مسحوبات** (رأس مال 0.00 المعروض) → 6. **الإقفال** (V9 يؤكد أنه كان طموحاً وأُسقط).

## 4.4 الامتثال IFRS/SOCPA — والمستجد V1/V2
المستوفى والفجوات كما في v1 §4.4. **الإضافة الحاسمة:** جبهة الفوترة أسوأ من جبهة القوائم — القوائم «صادقة الوسم» عن نواقصها، بينما **الفاتورة تدّعي التوافق وهي دونه** (V1): لا QR-TLV (مرحلة 1)، ترقيم غير تسلسلي (V2)، ولا مسار Reporting/Clearance (مرحلة 2). **التوصية الفورية قبل أي كود: تغيير نص `App.tsx:2167`** — الوسم الصادق مبدأ المشروع المعلن، وهذا النص يخالفه.

---

# §5 تشريح نظام الحوكمة والتدقيق

**يعمل فعلاً:** دورة حياة الملف كاملة بتصنيف ثلاثي-الأدلة؛ شاشة مراجعة بأفعال كاملة واعتماد محجوب حتى معالجة الحرج؛ مرفوضات بموافقة مزدوجة للحرج (`server.ts:3527+`)؛ سلسلة sha256 بتحقق ذاتي؛ تصعيد سجل عبر الخادم idempotent (الجديد — مثبت حياً بثلاثة سيناريوهات، معلَّق commit على الاعتماد البصري).

**لا يعمل:** UserManagement stubs (`:996-1004`)؛ **مبررات الاعتماد الاستثنائي تُكتب لFirestore عميلياً وتضيع في dev** (`ValidationReviewScreen:276` — أخطر ثقب متبقٍ لأنه يمس التجاوزات تحديداً)؛ مركز التنبيهات الإداري على حقل ميت؛ لا مستهلك لسجل التصعيدات بعد؛ 🆕v2: **جزيرة الفواتير خارج الحوكمة كلياً** — مستند خارجي المفعول يصدر بلا أي بوابة من بوابات النظام.

**كفاية سجل التدقيق للسعودية:** الأساس فوق المعتاد (تسلسل مربوط + `/api/erp/audit/verify` `:3414`)؛ يعوزه لمستوى نظامي: تجزئة القيود ذاتها، إقفال يمنع التعديل الرجعي، احتفاظ مُدار خارج ملف JSON، وضم مبررات التجاوز للمسار الخادمي.

**رفعه لـEnterprise:** (1) توجيه `override_audit_logs` عبر الخادم بنفس وصفة التصعيد المثبتة — **نصف يوم، أعلى عائد حوكمي متاح**؛ (2) سطح مراجع للتصعيدات (توسعة `:1661-1684`)؛ (3) أدوار فعلية تجعل الموافقة-المزدوجة بشخصين حقيقيين؛ (4) إقفال فترات؛ (5) سلسلة hash للقيود والطلبات؛ (6) ضم إصدار الفواتير لخط الحوكمة (مستند = سجل + قيد + بوابة).

---

# §6 تدقيق تجربة المستخدم

**رحلة المحاسب الشهرية** (v1 §6.1 كاملة تبقى): دخول→Owner Home ممتاز→رفع×4 أقسام بلا سلة موحدة→شاشة مراجعة كثيفة لأول مرة→بطاقة «حرج/منخفض» المتناقضة (`ValidationReviewScreen:523` مقابل `:573`)→تقارير→**لا طقس إقفال يختم الشهر**. 🆕v2 يضيف: من يصدر فاتورة من «الفاتورة الذكية» يظن أنه أنجز التزامه الضريبي (النص يطمئنه) وهو لم يفعل — **فخ ثقة** لا مجرد احتكاك.

**رحلة الـCFO:** Owner Home يجيب سيولة+ربحية فوراً (أفضل من هبوط Zoho/QB العام)؛ يعجز عن: تحصيل (لا أعمار)، إنفاق رأسمالي (لا صافي أصول)، خطة شهرية (الموازنة سنوية-قطاعية)، واتجاه >سنة داخل القوائم.

**مشاكل الواجهة المفتوحة:** ازدواج الخطورة؛ تناقض TB/GL الصامت؛ فراغ TB/GL في dev-auth؛ «كشف الحساب» ثلاثي المعنى؛ مركز تنبيهات فارغ مقابل شاشة مراجعة مزدحمة (توزيع إنذار معكوس)؛ أصفار التحميل العابرة؛ لا «لماذا؟» على التصنيف؛ 🆕v2: نص ZATCA المضلِّل.

**مقابل المنافسين:** يتفوق في اللغة الأصلية والمراجعة-كطقس والشفافية عن النواقص وOwner Home السردي؛ يتخلف في إقفال-الشهر كطقس، bank feeds، mobile، ومركز إشعارات فعّال.

---

# §7 الديون والمخاطر — السجل الموحَّد النهائي

**من v1 (تبقى كلها):** T1 GL بلا ضريبة · T2 GL بلا isActive · T3 TB/GL على auth.currentUser · T4 غياب Settlements · T5 إهلاك · T6 Δ54.78 · T7 نموذج خطورة مزدوج ومضخَّم (`pre-validation:51,63,118`) · T8 حقل Anomalies ميت+تنبيهات فارغة · T9 مسارات JE ناقصة (restore/3584/dev-sync) · T10 activate بلا dedup سجلات · T11 أربعة سجلات وهمية قائمة · T12 سقف preamble 20 (B1) · T13 UserManagement stubs · T14 override_audit_logs عميلي · T15 D12/D13 · T16 تكرار O(n²) (`expenses:83-101`) · T17 throw يفشل الرفعة (`pre-validation:108`) · T18 types≠إنتاج · T19 كود ميت · T20 dual-write الإعدادات.

**الجديد 🆕v2:**
| # | الدين | الموضع | الأثر | الأولوية | الجهد |
|---|---|---|---|---|---|
| T21 | ادعاء ZATCA بلا QR | `App.tsx:2167` + غياب SmartInvoice | مستند غير قانوني بوسم مطمئن | **حرج** (النص فوراً؛ QR-TLV بعده) | نص: دقائق؛ QR مرحلة-1: صغير-متوسط |
| T22 | ترقيم فواتير زمني | `SmartInvoice:667` | خرق تسلسل ZATCA | حرج ضمن T21 | صغير (عدّاد لكل مستأجر بالخادم) |
| T23 | Gemini بمفتاح عميلي + خروج بيانات | `SmartInvoice:240,266` (+QuotationManager) | تسريب مفتاح + خصوصية | عالٍ | صغير (بروكسي خادمي) |
| T24 | محو NonTaxable في مسارَي Postgres | `db.ts:203`، `server.ts:~2083` | إقرار ضريبي خاطئ عند القطع | **حرج قبل أي هجرة** | دقائق (حرف واحد ×2 + اختبار) |
| T25 | وحدتان متقاعدتان في الشجرة | OwnersSummary/VisualDashboard | تضليل فاحصين + وزن ميت | منخفض | صغير (حذف) |
| T26 | بيانات اعتماد DB افتراضية بالكود | `db.ts:8-10` | خطر بيئات مشتركة | عالٍ قبل الإنتاج | صغير (env إلزامي) |
| T27 | zod غير مفروضة خادمياً | `schemas.ts` وحيدة الاستخدام | مدخلات غير مصفّاة | متوسط | متوسط (تدريجي على مسارات الكتابة) |
| T28 | جزيرة الفواتير خارج الدفتر | SmartInvoice↛records/JE | إيراد مُصدَر لا يظهر في القوائم | عالٍ منتجياً | متوسط (فاتورة→سجل إيراد→قيد) |

**الأداء/الموثوقية/الأمان:** كما في v1 §7.2-7.4 حرفياً (عتبات 10k/50k/100-150k قيد؛ SPOF الملف والعملية والمفتاح؛ تغطية اختبارات آلية 0% مقابل مادة بوابات جاهزة؛ S1..S6) + V3/V7 أعلاه.

---

# §8 خارطة الطريق (تحديث درجات v1 حيث غيّرها الاستكشاف)

| المحور | v1 | v2 | سبب التعديل |
|---|---|---|---|
| الوظائف المحاسبية | 5.5 | 5.5 | — |
| جودة البيانات | 7.5 | 7.5 | — |
| الذكاء المالي | 7 | 7 | — |
| تجربة المستخدم | 6 | 6 | — |
| الجودة التقنية | 4.5 | 4.5 | docker+rules الإيجابيان قابلهما V4/V5/V6 |
| **الامتثال النظامي** | 3 | **2.5** | V1/V2: جبهة الفوترة دون مرحلة-1 مع ادعاء عكسي |
| الجاهزية للإنتاج | 2.5 | 2.5 | — |
| التنافسية | 6.5 | 6.5 | — |

**المراحل** (v1 §8.2-8.4 تبقى الخطة، بتعديلين إلزاميين):
- **المرحلة 1 «قابل للإنتاج»** تضيف بندين: **إصلاح T24 قبل أي هجرة** (شرط قبول للقطع نفسه)، و**تصحيح نص T21 فوراً** + قرار: إما QR مرحلة-1 داخل المرحلة 1 وإما تعطيل وسم «متوافق» حتى يُبنى. الباقي كما هو: Postgres شامل القيود + ذرّية + نسخ، الافتتاحيات، الإهلاك، Settlements v1، إصلاحات T1/T2/T3/T14، إقفال v1، S1/S2، CI للبوابات.
- **المرحلة 2 «منافس خليجي»:** ZATCA-2 كاملة (فوق QR)، أعمار الذمم، bank feeds، مقارنات/نِسب، نشاط-لكل-فرع + إظهار الذكاء، أدوار فعلية، mobile.
- **المرحلة 3 «عالمي»:** عملات، مخزون دائم، توحيد كيانات، API/webhooks، i18n محرّكي.

**المزايا الفريدة المقترحة** (v1 §8.5 كاملة): شهادة المطابقة القابلة للتنزيل؛ ذاكرة التصحيح كخندق بيانات؛ حِزم قطاعات سعودية؛ وضع المحاسب الخارجي؛ «إقرارك في ساعة»؛ السرد العربي التنفيذي فوق البوابات.

---

# §9 اقتراحات التحسين (P1–P15 من v1 تبقى بنصّها؛ الإضافات 🆕v2)

**[P16] إنقاذ الفاتورة الذكية (حزمة T21/T22/T23/T28)**
[المشكلة]: مستند خارجي غير ممتثل بوسم مطمئن، بترقيم زمني، ببيانات تُرسل لطرف ثالث من المتصفح، ومنفصل عن الدفتر. [التصميم]: (أ) فوراً — تصحيح نص `App.tsx:2167` إلى وسم صادق؛ (ب) عدّاد فواتير تسلسلي لكل مستأجر بالخادم (endpoint issue-number ضمن persist القائم)؛ (ج) QR-TLV مرحلة-1 (خمسة حقول Base64 — مكتبة معروفة، يُرسم في `pdf-engine`)؛ (د) بروكسي Gemini خادمي بمفتاح سري؛ (هـ) عند الإصدار: توليد سجل إيراد + قيد عبر نفس خط `syncJournalEntriesForFile` — الفاتورة تدخل الدفتر كأي مستند. [الأثر]: يحوّل أخطر فجوة سمعة إلى ميزة («فاتورة تدخل دفترك وقوائمك لحظياً»). [الأولوية]: حرج (أ فوراً؛ ب-ج مرحلة 1؛ د-هـ مرحلة 1-2). [الجهد]: متوسط إجمالاً.

**[P17] إصلاح V4 + اختبار تكافؤ الفرعين**
[المشكلة]: T24 + «فرع Postgres غير مختبَر» عموماً. [التصميم]: تصحيح الحالة في الموضعين؛ ثم اختبار CI يشغّل نفس رفعة الاختبار على الفرعين (JSON وPostgres عبر docker-compose الموجود) ويقارن السجلات حقلاً-حقلاً. [الأثر]: يحوّل مخاطرة القطع من «مجهولة» إلى «مقاسة». [الأولوية]: حرج قبل الهجرة. [الجهد]: صغير.

**[P18] توصيل header-detection بمعالجَي المصروفات/الإيرادات (يغلق B1/T12)**
[المشكلة]: الحل موجود وغير موصول (V10) والحاجز تنظيمي. [التصميم]: تعديل محدود الموضع في المعالجَين المحميَّين — استبدال حلقة الـ20-صفاً بنداء `detectTabularHeader` بمراسي مصروفات/إيرادات (مورد/فاتورة/إجمالي...)، خلف بوابة regression الكاملة (730+fixtures) كشرط دمج. [الأثر]: إغلاق آخر ثغرة «سجلات مشوهة صامتة» في التفكيك. [الأولوية]: عالٍ (يحتاج توقيع الحماية — وهذا التقرير يوصي بمنحه). [الجهد]: صغير.

**[P19] حذف الوحدتين المتقاعدتين + جرد كود ميت دوري**
[المشكلة]: T25/T19. [التصميم]: حذف OwnersSummary/VisualDashboard وCommandPalette-أو-توصيله وdetectModuleType؛ إضافة فحص وحدات-غير-موصولة (grep routes) لقائمة الصيانة. [الأثر]: نظافة تدقيق. [الأولوية]: منخفض. [الجهد]: صغير.

---

# §10 الملخص التنفيذي — الحكم النهائي (v2)

**ما يستحق الاستثمار (يتأكد بعد الاستكشاف الحر):** النواة الثلاثية الفريدة — عربية تصنيفية مقاسة، حوكمة رفع لا نظير لها، وبرهنة-بالبناء — **موجودة في الكود لا في العرض**، ومعها ثقافة هندسية (قياس-قبل-تغيير، وسم صادق، توثيق قرارات) تجعل كل إصلاح أدناه قابلاً للتنفيذ بثقة. حتى أخطاء النظام «من النوع الجيد»: مكشوفة بالبوابات، موثقة بلا تجميل.

**أكبر خطر إن لم يُعالَج قريباً — اثنان متساويان الآن:**
1. **مستوى البيانات** (كما في v1): ملف JSON غير ذرّي يحمل الحقيقة كلها — حادثة كتابة واحدة عند عميل حقيقي تنهي منتجاً عنوانه الثقة.
2. **🆕v2 فجوة الصدق الوحيدة في المنتج:** نص «متوافق مع ZATCA» فوق فاتورة بلا QR. كل النظام مبني على الوسم الصادق، وهذا السطر يقوّضه — وأثره القانوني على مستخدم فعلي مباشر. **تصحيح النص لا يحتاج مشروعاً — يحتاج قراراً اليوم.**

**الخطوة الواحدة الأعلى أثراً للشهر القادم:** كما في v1 — **قطع Postgres شاملاً القيود بكتابة ذرّية ونسخ، وبوابات القبول في CI شرطَ قبولٍ للهجرة** — مع إلحاق إصلاح T24 وسطر T21 به كبنود يوم-صفر.

**الموقع على المقياس:** `نموذج أولي → [MVP] → منتج → منافس محلي → منافس عالمي` — **«MVP متأخر بنواة منتج ناضجة»** بلا تغيير عن v1، مع تدقيق التقدير الزمني بعد اتساع الفحص: إلى «منتج» 2-3 أشهر مركّزة (المرحلة 1 المعدَّلة)؛ إلى «منافس محلي جاد» +6-9 أشهر (وZATCA-2 هي البوابة لا الزينة)؛ «عالمي» طريق سنتين مشروط بقرار i18n محرّكي. الاحتمال الهندسي مرتفع — أصعب ما في الفئة مبنيٌّ فعلاً؛ الباقي هندسة معروفة الوصفات ونظافة التزام.

---
*نهاية v2. المراجع كلها قابلة للتحقق بتاريخ 2026-07-01. يُوصى بترحيل V1–V10/T21–T28 إلى سجل §0-C في SESSION-HANDOFF، وبقرار فوري بشأن نص App.tsx:2167.*

═══════════════════════════════════════════════════════════════
نهاية الحزمة. ابدأ الآن تقريرك بالأقسام العشرة بالترتيب.
