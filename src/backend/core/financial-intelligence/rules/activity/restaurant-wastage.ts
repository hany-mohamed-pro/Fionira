import { IntelligenceRule, Insight, IntelligenceContext } from '../../models';
import { FinancialRecord } from '../../../../../types';

/**
 * Activity-aware rule: abnormal food-wastage detection for Restaurants / F&B.
 *
 * Design (Phase 1):
 * - Activates ONLY when context.activityProfile === 'restaurant_fb'. For any
 *   other activity (or unset), execute() returns null and nothing changes.
 * - It NEVER changes a record's category. The base categorization engine still
 *   classifies wastage silently as an ordinary operational expense. This rule
 *   only ADDS a review insight when a wastage record looks abnormal, reusing the
 *   existing Insight -> ValidationReviewScreen pipeline.
 * - "Normal vs abnormal" is measured against THIS tenant's own wastage pattern
 *   (historical + current batch), not a rigid universal number. When there is
 *   insufficient wastage history, it falls back to a conservative absolute
 *   threshold and says so explicitly in the insight.
 */

// Wastage / spoilage signals (Arabic + English). Applied to a normalized blob
// of the record's descriptive fields.
const WASTAGE_RX =
  /(هدر|تالف|تلف|هالك|اتلاف|إتلاف|منتهي? الصلاحي|انتهاء الصلاحي|فاقد|expired|wastage|waste|spoil|spoilage|damaged)/i;

const MIN_SAMPLE = 3; // need >= 3 wastage records to trust the tenant baseline
const OUTLIER_Z = 3; // z-score beyond which an amount is a statistical outlier
const SPIKE_MULTIPLE = 3; // amount above mean * this is also abnormal
const CONSERVATIVE_DEFAULT = 5000; // SAR fallback when history is insufficient

interface WastageBaseline {
  sampleSize: number;
  mean: number;
  stdDev: number;
}

// Cache the per-batch baseline so we compute it once per analysis pass, not
// once per record. The context object is stable across a single batch.
const baselineCache = new WeakMap<IntelligenceContext, WastageBaseline>();

const textOf = (r: FinancialRecord): string =>
  `${r.Item_Description || ''} ${r.Category || ''} ${r.Entity_Name || ''} ${r.Raw_Entity || ''}`;

const isWastageRecord = (r: FinancialRecord): boolean => WASTAGE_RX.test(textOf(r));

function computeBaseline(context: IntelligenceContext): WastageBaseline {
  const cached = baselineCache.get(context);
  if (cached) return cached;

  const pool = [...(context.historicalData || []), ...(context.currentBatch || [])];
  const amounts = pool
    .filter(isWastageRecord)
    .map((r) => Math.abs(r.Total_Amount || 0))
    .filter((a) => a > 0);

  const sampleSize = amounts.length;
  const mean = sampleSize > 0 ? amounts.reduce((s, a) => s + a, 0) / sampleSize : 0;
  const variance =
    sampleSize > 1
      ? amounts.reduce((s, a) => s + (a - mean) * (a - mean), 0) / (sampleSize - 1)
      : 0;
  const baseline: WastageBaseline = { sampleSize, mean, stdDev: Math.sqrt(variance) };

  baselineCache.set(context, baseline);
  return baseline;
}

export const restaurantWastageRule: IntelligenceRule = {
  name: 'RESTAURANT_FOOD_WASTAGE',
  execute: (record: FinancialRecord, context: IntelligenceContext): Insight | null => {
    // Inert unless this tenant is a restaurant / F&B business.
    if (context.activityProfile !== 'restaurant_fb') return null;

    // Only evaluate records that actually look like wastage/spoilage.
    if (!isWastageRecord(record)) return null;

    const amount = Math.abs(record.Total_Amount || 0);
    if (amount <= 0) return null;

    const baseline = computeBaseline(context);

    let isAbnormal = false;
    let basisArabic = '';
    let confidence = 0.7;

    if (baseline.sampleSize >= MIN_SAMPLE && baseline.stdDev > 0) {
      const zScore = (amount - baseline.mean) / baseline.stdDev;
      if (zScore > OUTLIER_Z || amount > baseline.mean * SPIKE_MULTIPLE) {
        isAbnormal = true;
        confidence = 0.85;
        basisArabic = `يتجاوز النطاق المعتاد لهدر هذه المنشأة (متوسط ${baseline.mean.toFixed(0)} ر.س عبر ${baseline.sampleSize} سجل)`;
      }
    } else {
      // Insufficient wastage history for this tenant — conservative fallback,
      // disclosed transparently per the activity profile.
      if (amount > CONSERVATIVE_DEFAULT) {
        isAbnormal = true;
        confidence = 0.5;
        basisArabic = `لا يوجد تاريخ هدر كافٍ لهذه المنشأة بعد؛ استُخدم حدّ تحفّظي مؤقت (${CONSERVATIVE_DEFAULT} ر.س)`;
      }
    }

    // Normal wastage stays silent — no insight, classified as ordinary expense.
    if (!isAbnormal) return null;

    return {
      type: 'ABNORMAL_FOOD_WASTAGE',
      severity: 'MEDIUM',
      message: `هدر غذائي مرتفع غير معتاد بقيمة ${amount.toFixed(2)} ر.س. ${basisArabic}.`,
      confidence,
      suggestedAction:
        'مراجعة إدارية: تحقّق من ظروف التخزين والصلاحية والكميات — قد يشير ارتفاع الهدر لمشكلة تشغيلية تستدعي الانتباه.',
      scoreImpact: 20,
    };
  },
};
