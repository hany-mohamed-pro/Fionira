import { IntelligenceRule, Insight, IntelligenceContext } from '../../models';
import { FinancialRecord } from '../../../../../types';

/**
 * Activity-aware rule: professional-services / consulting project-linking suggestion.
 *
 * Design (Phase 3):
 * - Activates ONLY when context.activityProfile === 'professional_services'.
 * - It NEVER changes a record's category. The base engine classifies the expense
 *   correctly and silently; this rule only ADDS an optional "link to project/
 *   client" suggestion via the existing Insight -> ValidationReviewScreen pipeline,
 *   for accurate job/project costing.
 * - It fires ONLY when the description carries an explicit project/client signal,
 *   so general overhead (office rent, salaries, own software) is never nagged.
 *
 * Scope note: this surfaces the SUGGESTION only. Persisting an actual
 * expense<->project/client association is a larger future feature (data model +
 * UI) beyond Phase 3.
 */

// Arabic normalizer so naming variants match (ة/ه, أإآ/ا, ى/ي, tatweel).
const normalizeArabic = (text: string): string =>
  text
    .replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

// Explicit project/client attribution signals. Arabic tokens are matched as
// substrings (so العميل/للعميل/عميلنا and المشروع/لمشروع/بمشروع all match);
// short English tokens require word boundaries to avoid accidental hits.
const LINK_RX =
  /(مشروع|عميل|عملاء|عقد رقم|امر عمل|امر شراء|لصالح|باسم العميل|project|client|\bpo\b|\bwbs\b|job no)/i;

const textOf = (r: FinancialRecord): string =>
  normalizeArabic(`${r.Item_Description || ''} ${r.Entity_Name || ''} ${r.Raw_Entity || ''}`.toLowerCase());

export const professionalServicesRule: IntelligenceRule = {
  name: 'PROFESSIONAL_SERVICES_PROJECT_LINK',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight | null => {
    if (context.activityProfile !== 'professional_services') return null;

    const amount = Math.abs(record.Total_Amount || 0);
    if (amount <= 0) return null;

    if (!LINK_RX.test(textOf(record))) return null;

    return {
      type: 'ACTIVITY_PROJECT_LINK_SUGGESTION',
      severity: 'LOW',
      message: `هذا المصروف (${amount.toFixed(2)} ر.س) يبدو مرتبطاً بمشروع أو عميل محدد.`,
      confidence: 0.7,
      suggestedAction:
        'اقتراح اختياري: اربط المصروف بالمشروع/العميل المحدد لتكلفة مشروع أدق — اعتمد أو تجاهل (لا يغيّر تصنيف الحساب).',
      scoreImpact: 5,
    };
  },
};
