import { IntelligenceRule, Insight, IntelligenceContext } from '../../models';
import { FinancialRecord } from '../../../../../types';

/**
 * Activity-aware rules: contracting / construction.
 *
 * Design (Phase 5):
 * - Activate ONLY when context.activityProfile === 'contracting_construction'.
 * - They NEVER change a record's category. The base engine classifies silently;
 *   these rules only ADD suggestions via the existing Insight ->
 *   ValidationReviewScreen pipeline.
 * - For this activity, linking a cost to a specific project is the NORM, not the
 *   exception — so the project-link suggestion fires on any cost that cites a
 *   project, framed as a direct project cost (WIP).
 *
 * Two rules are exported: one for the expenses domain and one for the revenues
 * domain (customer advance payments -> deferred revenue).
 */

const normalizeArabic = (text: string): string =>
  text
    .replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

const textOf = (r: FinancialRecord): string =>
  normalizeArabic(`${r.Item_Description || ''} ${r.Entity_Name || ''} ${r.Raw_Entity || ''}`.toLowerCase());

// A reference to a specific project/site (the pivotal signal for this activity).
const PROJECT_RX = /(مشروع|موقع|فيلا|عماره|برج|كمباوند|مخطط|عقد رقم|wbs|project|\bsite\b)/i;
// Daily / temporary site labor (a direct project cost, not general payroll).
const DAILY_LABOR_RX = /(عماله يوميه|عمال يوميين|عمال يوميه|اجور يوميه|يوميات عمال|عماله مؤقته|daily labor|day labor)/i;
// Customer advance / down payment (revenue side -> deferred/unearned revenue).
const ADVANCE_RX = /(دفعه مقدمه|مقدم اعمال|دفعه اولي|عربون|دفعه مقدم|سلفه عميل|سلفه مشروع|مقدم عقد|advance|down payment)/i;

/** Expenses-domain rule: project-cost linking + direct daily labor. */
export const contractingExpenseRule: IntelligenceRule = {
  name: 'CONTRACTING_PROJECT_COSTS',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight[] | null => {
    if (context.activityProfile !== 'contracting_construction') return null;
    const amount = Math.abs(record.Total_Amount || 0);
    if (amount <= 0) return null;

    const text = textOf(record);
    const insights: Insight[] = [];

    if (PROJECT_RX.test(text)) {
      insights.push({
        type: 'ACTIVITY_PROJECT_COST_LINK',
        severity: 'LOW',
        message: `هذه التكلفة (${amount.toFixed(2)} ر.س) تبدو مرتبطة بمشروع/موقع محدد.`,
        confidence: 0.7,
        suggestedAction:
          'اقتراح: اربطها كتكلفة مباشرة على المشروع (أعمال تحت التنفيذ WIP) لتكلفة مشروع دقيقة — اعتمد أو تجاهل (لا يغيّر الحساب).',
        scoreImpact: 5,
      });
    }

    if (DAILY_LABOR_RX.test(text)) {
      insights.push({
        type: 'ACTIVITY_DIRECT_PROJECT_LABOR',
        severity: 'LOW',
        message: `عمالة يومية/موقعية (${amount.toFixed(2)} ر.س).`,
        confidence: 0.7,
        suggestedAction:
          'اقتراح: عاملها كتكلفة عمالة مباشرة على المشروع لا كرواتب عامة — اعتمد أو تجاهل.',
        scoreImpact: 5,
      });
    }

    return insights.length > 0 ? insights : null;
  },
};

/** Revenues-domain rule: customer advance payment -> deferred revenue. */
export const contractingRevenueRule: IntelligenceRule = {
  name: 'CONTRACTING_ADVANCE_PAYMENT',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight | null => {
    if (context.activityProfile !== 'contracting_construction') return null;
    const amount = Math.abs(record.Total_Amount || 0);
    if (amount <= 0) return null;

    if (!ADVANCE_RX.test(textOf(record))) return null;

    return {
      type: 'ACTIVITY_ADVANCE_PAYMENT',
      severity: 'LOW',
      message: `دفعة مقدمة من عميل (${amount.toFixed(2)} ر.س).`,
      confidence: 0.7,
      suggestedAction:
        'اقتراح: سجّلها كإيراد مقدم (التزام/غير مكتسب) يُعترف به مع تقدّم الأعمال، لا كإيراد فوري — اعتمد أو تجاهل. (ملاحظة: لا يوجد حساب "إيراد مقدم" في دليل الحسابات بعد — بند دَين هندسي.)',
      scoreImpact: 5,
    };
  },
};
