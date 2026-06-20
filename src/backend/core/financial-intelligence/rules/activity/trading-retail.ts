import { IntelligenceRule, Insight, IntelligenceContext } from '../../models';
import { FinancialRecord } from '../../../../../types';

/**
 * Activity-aware rule: trading / retail edge-case suggestions.
 *
 * Design (Phase 4):
 * - Activates ONLY when context.activityProfile === 'trading_retail'.
 * - It NEVER changes a record's category. The base engine classifies silently;
 *   this rule only ADDS review insights via the existing
 *   Insight -> ValidationReviewScreen pipeline, for the two retail edge cases
 *   that genuinely diverge from the engine's general default.
 *
 * Scope (after Step-1 analysis):
 *  - Sale packaging: the engine routes packaging to COGS (مواد تعبئة وتغليف). For a
 *    pure buy-and-sell retailer, packaging handed to customers (shopping bags, gift
 *    wrap) is a SELLING expense, not COGS. -> suggestion to reclassify.
 *  - Inventory shrinkage (هالك/تالف/عجز جرد): there is NO dedicated shrinkage account
 *    in the chart of accounts (engine is frozen), so it cannot be re-categorized here.
 *    -> advisory insight to track it separately; the missing account is logged as
 *    engine technical debt (see engine-technical-debt.md).
 *
 * NOT handled here (verified to be the engine's job and clear-cut):
 *  - Inbound freight -> COGS shipping (engine already does this).
 *  - Sales-rep commissions -> selling expense (engine already routes via the
 *    marketing/commission rule). Reported in the Phase 4 verification.
 */

// Arabic normalizer so naming variants match (ة/ه, أإآ/ا, ى/ي, tatweel).
const normalizeArabic = (text: string): string =>
  text
    .replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

// Sale packaging handed to customers (not goods bought for resale).
const SALE_PACKAGING_RX =
  /(اكياس تسوق|اكياس تسويق|اكياس بشعار|كيس تسوق|اكياس للعملاء|ورق هدايا|ورق تغليف هدايا|تغليف هدايا|اكياس|تغليف|كرتون تغليف|shopping bag|gift wrap|carrier bag)/i;

// Inventory shrinkage / damaged or missing stock.
const SHRINKAGE_RX =
  /(هالك|هلاك|عجز جرد|عجز مخزون|نقص مخزون|فاقد مخزون|بضاعه تالفه|بضاعه منتهيه|مخزون تالف|تلف بضاعه|shrinkage|stock loss|damaged stock|inventory loss)/i;

const textOf = (r: FinancialRecord): string =>
  normalizeArabic(`${r.Item_Description || ''} ${r.Entity_Name || ''} ${r.Raw_Entity || ''}`.toLowerCase());

export const tradingRetailRule: IntelligenceRule = {
  name: 'TRADING_RETAIL_EDGE_CASES',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight[] | null => {
    if (context.activityProfile !== 'trading_retail') return null;

    const amount = Math.abs(record.Total_Amount || 0);
    if (amount <= 0) return null;

    const text = textOf(record);
    const insights: Insight[] = [];

    // Inventory shrinkage takes precedence (a damaged/lost-stock line that also
    // mentions packaging should be treated as shrinkage, not sale packaging).
    if (SHRINKAGE_RX.test(text)) {
      insights.push({
        type: 'ACTIVITY_INVENTORY_SHRINKAGE',
        severity: 'LOW',
        message: `يبدو أن هذا البند هالك/عجز مخزون (${amount.toFixed(2)} ر.س).`,
        confidence: 0.7,
        suggestedAction:
          'اقتراح: تتبّعه كهالك مخزون منفصل عن تكلفة البضاعة المباعة. (ملاحظة: لا يوجد حساب مخصص للهالك في دليل الحسابات بعد — بند دَين هندسي.)',
        scoreImpact: 5,
      });
      return insights;
    }

    // Sale packaging -> suggest selling expense instead of COGS packaging.
    if (SALE_PACKAGING_RX.test(text)) {
      insights.push({
        type: 'ACTIVITY_SALE_PACKAGING_TREATMENT',
        severity: 'LOW',
        message: `تغليف بيع للعملاء (${amount.toFixed(2)} ر.س) صُنّف ضمن تكلفة المبيعات.`,
        confidence: 0.7,
        suggestedAction:
          'اقتراح اختياري: في تجارة التجزئة يُعامَل تغليف البيع كمصروف بيعي وتسويقي لا كمادة/تكلفة بضاعة — اعتمد أو تجاهل (لا يغيّر الحساب تلقائياً).',
        scoreImpact: 5,
      });
    }

    return insights.length > 0 ? insights : null;
  },
};
