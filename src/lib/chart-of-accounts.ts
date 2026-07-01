/**
 * Chart-of-Accounts type layer (Balance-Sheet Foundation — Phase A, read-only).
 *
 * A PURE classifier that maps a journal-entry account NAME → its accounting type,
 * using the naming conventions `erp-engine.ts::generateJournalEntries` already
 * emits (account prefixes) + the existing category lists. It does NOT change how
 * accounts/journal entries are generated, and it does NOT touch
 * categorization-engine.ts or erp-engine.ts — it only READS and labels.
 *
 * This is the single structural piece that was missing: journal entries + per-
 * account balances already exist (TrialBalance), but accounts were untyped, so a
 * real Balance Sheet could not be grouped from them.
 */

import { COGS_CATEGORIES, CAPEX_CATEGORIES } from './pnl-core';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'unclassified';

export interface AccountClass {
  type: AccountType;
  subtype: string; // human-readable Arabic grouping label
}

const norm = (s: string): string =>
  String(s || '').replace(/ـ/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

const COGS_SET = new Set(COGS_CATEGORIES.map(norm));
const CAPEX_SET = new Set(CAPEX_CATEGORIES.map(norm));

/**
 * Classify an account name into its accounting type + subtype.
 * Ordered most-specific → most-general; first match wins.
 */
export function classifyAccount(account: string): AccountClass {
  const a = norm(account);
  if (!a) return { type: 'unclassified', subtype: 'غير مصنّف' };

  // ── Taxes (must precede generic asset/liability/expense) ──
  if (a.includes('ضريبه المدخلات') || a.includes('vat input')) return { type: 'asset', subtype: 'ضريبة قيمة مضافة قابلة للاسترداد' };
  if (a.includes('ضريبه المخرجات') || a.includes('vat output')) return { type: 'liability', subtype: 'ضريبة قيمة مضافة مستحقة' };
  if (a === 'الضرائب') return { type: 'liability', subtype: 'ضرائب مستحقة' };

  // ── ASSETS ──
  // Fixed assets / CAPEX (before generic 'مصروفات' never applies — these start with 'اصول ثابته')
  if (a.startsWith('اصول ثابته') || a.startsWith('اصول غير ملموسه') || CAPEX_SET.has(a)) return { type: 'asset', subtype: 'أصول ثابتة' };
  if (a.startsWith('اعمال تحت التنفيذ')) return { type: 'asset', subtype: 'أعمال تحت التنفيذ (WIP)' }; // Phase B posts here
  if (a.startsWith('البنوك') || a.includes('نقديه بالبنك') || a.includes('نقديه بالصندوق') || a.includes('نقد') || a.includes('صندوق') || a.includes('حساب تسويه البنك (مدينه)')) return { type: 'asset', subtype: 'نقد وبنوك' };
  if (a.startsWith('العملاء')) return { type: 'asset', subtype: 'ذمم مدينة (عملاء)' };
  if (a.startsWith('مخزون')) return { type: 'asset', subtype: 'مخزون' };

  // ── LIABILITIES ──
  if (a.startsWith('الموردين') || a.startsWith('الذمم الدائنه') || a.startsWith('ذمم دائنه')) return { type: 'liability', subtype: 'ذمم دائنة (موردون)' };
  if (a.includes('مستحقه الدفع') || a.includes('مستحق') || a.includes('حساب تسويه البنك (دائنه)')) return { type: 'liability', subtype: 'مصروفات/رواتب مستحقة' };
  if (a.includes('ايراد مقدم') || a.includes('غير مكتسب')) return { type: 'liability', subtype: 'إيراد مقدم (غير مكتسب)' }; // Phase B (D12)
  if (a.includes('قرض') || a.includes('تمويل') || a.includes('مرابحه')) return { type: 'liability', subtype: 'قروض وتمويل' };

  // ── EQUITY ──
  if (a.includes('مسحوبات')) return { type: 'equity', subtype: 'مسحوبات الملاك' }; // Phase B (item 11), contra-equity
  if (a.includes('راس المال') || a.includes('ارباح مبقاه') || a.includes('حقوق الملكيه')) return { type: 'equity', subtype: 'رأس المال' };

  // ── REVENUE ── (exclude "تكلفة المبيعات" / COGS, which also contains "مبيعات")
  if (a.startsWith('ايرادات') || (a.includes('مبيعات') && !a.includes('تكلفه'))) return { type: 'revenue', subtype: 'إيرادات' };

  // ── EXPENSE ──
  if (COGS_SET.has(a) || a.startsWith('تكلفه المبيعات')) return { type: 'expense', subtype: 'تكلفة المبيعات' };
  if (a.startsWith('مصروفات') || a.startsWith('مصروف') || a.includes('رواتب') || a.includes('اجور') || a.includes('بدل')) return { type: 'expense', subtype: 'مصروفات تشغيلية' };

  return { type: 'unclassified', subtype: 'غير مصنّف' };
}
