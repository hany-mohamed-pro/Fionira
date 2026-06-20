import { IntelligenceRule, Insight, IntelligenceContext } from '../../models';
import { FinancialRecord } from '../../../../../types';

/**
 * Activity-aware rule: manufacturing / food-production divergent-case suggestions.
 *
 * Design (Phase 2):
 * - Activates ONLY when context.activityProfile === 'manufacturing_food'.
 * - It NEVER changes a record's category. The base categorization engine keeps
 *   the strict-correct default; this rule only ADDS a plain-language suggestion
 *   for the TWO genuinely divergent cases, reusing the existing
 *   Insight -> ValidationReviewScreen suggest/confirm/dismiss pipeline.
 *
 * Clear-cut cases (direct ingredients, inbound freight, finished packaging,
 * production wastage) are intentionally NOT handled here — they are the
 * categorization engine's responsibility and are classified silently. See the
 * Phase 2 deliverable for the verified before/after of those cases and for the
 * note that "production wastage as a separate account" is out of scope under the
 * engine-freeze constraint.
 */

// Arabic normalizer so naming variants (ة/ه, أإآ/ا, ى/ي, tatweel) match — the
// same canonicalization principle the categorization engine uses. Patterns below
// are authored in normalized form.
const normalizeArabic = (text: string): string =>
  text
    .replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

// Case 1 — production tools/molds that are NOT consumed into the product.
// Strict-correct default: manufacturing overhead / small fixed asset.
// Practical simplification (user-approved, low value only): treat as raw material.
const TOOLS_RX = /(قالب|قوالب|اسطمب|استامب|اسطوانه|قطاعه|قطاعات|عده تصنيع|ادوات تصنيع|mold|molds|cutter)/i;
const TOOLS_LOW_VALUE_MAX = 1500; // simplification only makes sense for immaterial items

// Case 2 — moving an asset/equipment (e.g. relocating a fridge or oven).
// Strict-correct default: capitalize the transport into the asset's cost.
// Practical simplification (user-approved, immaterial only): general transport expense.
const TRANSPORT_RX = /(نقل|ترحيل|نقليات|توصيل)/i;
const EQUIPMENT_RX = /(ثلاجه|فريزر|فرن|مكينه|ماكينه|معدات|معده|كومبرسير|كمبروسر|تكييف|جهاز|equipment|machine|fridge|freezer|oven)/i;

const textOf = (r: FinancialRecord): string =>
  normalizeArabic(`${r.Item_Description || ''} ${r.Category || ''} ${r.Entity_Name || ''} ${r.Raw_Entity || ''}`.toLowerCase());

export const manufacturingFoodRule: IntelligenceRule = {
  name: 'MANUFACTURING_FOOD_DIVERGENT_CASES',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight[] | null => {
    if (context.activityProfile !== 'manufacturing_food') return null;

    const text = textOf(record);
    const amount = Math.abs(record.Total_Amount || 0);
    const insights: Insight[] = [];

    // Case 1: low-value production tools/molds — offer the raw-material simplification.
    if (TOOLS_RX.test(text) && amount > 0 && amount < TOOLS_LOW_VALUE_MAX) {
      insights.push({
        type: 'ACTIVITY_TOOLS_SIMPLIFICATION',
        severity: 'LOW',
        message: `أداة/قالب إنتاج منخفض القيمة (${amount.toFixed(2)} ر.س). التصنيف الدقيق: تكلفة تشغيل/أصل صغير.`,
        confidence: 0.7,
        suggestedAction:
          'تبسيط مقبول للبنود منخفضة القيمة: يمكن معاملته كمادة خام بدل أصل/تكلفة غير مباشرة لتقليل التعقيد — اعتمد أو تجاهل.',
        scoreImpact: 5,
      });
    }

    // Case 2: asset/equipment transport — offer capitalize-vs-expense choice.
    if (TRANSPORT_RX.test(text) && EQUIPMENT_RX.test(text) && amount > 0) {
      insights.push({
        type: 'ACTIVITY_ASSET_TRANSPORT_TREATMENT',
        severity: 'LOW',
        message: `نقل أصل/معدة (${amount.toFixed(2)} ر.س). التصنيف الدقيق: يُضاف إلى تكلفة الأصل (رسملة).`,
        confidence: 0.7,
        suggestedAction:
          'تبسيط مقبول إذا كانت القيمة غير جوهرية: يمكن تسجيله كمصروف نقل عام بدل رسملته على الأصل — اعتمد أو تجاهل.',
        scoreImpact: 5,
      });
    }

    return insights.length > 0 ? insights : null;
  },
};
