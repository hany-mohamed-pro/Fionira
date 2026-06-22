// Bank-native transaction classification.
//
// A bank statement is NOT an expense chart-of-accounts. Its lines describe the
// NATURE of a cash movement (a fee, a VAT charge, an internal transfer, a POS
// purchase, an incoming remittance, …) against a COUNTERPARTY (a merchant, a
// person, a government body). This module classifies each line along three
// axes the bank pages actually need:
//
//   1. transactionType — normalized movement nature (entity-resolution over the
//      many phrasings Saudi banks use: "رسوم تحويل" / "رسوم عملية نقاط بيع" both
//      roll up to رسوم بنكية, per the project's classification principle).
//   2. counterparty     — the other side of the movement, from the narrative.
//   3. glAccount        — the general-ledger account the movement maps to, so
//      bank data can feed the accounting layer and reconciliation.
//
// Source text is NEVER rewritten; the original details/narrative remain on the
// record. This is a classification layer only.

export type BankFlow = 'debit' | 'credit';

export interface BankClassification {
  transactionType: string;   // normalized Arabic label
  glAccount: string;         // GL account label
  counterparty: string;      // extracted counterparty / purpose
}

interface TypeRule {
  type: string;
  gl: string;
  // Matched against the (normalized) "التفاصيل" nature text. First hit wins,
  // so order from most specific to most general.
  patterns: RegExp[];
}

// Ordered most-specific → most-general. Fees and VAT must precede the broad
// transfer/purchase rules because their narratives often contain those words.
const TYPE_RULES: TypeRule[] = [
  { type: 'ضريبة القيمة المضافة', gl: 'ضريبة القيمة المضافة', patterns: [/ضريبة القيمة المضافة/, /ضريبة/, /\bvat\b/i] },
  { type: 'رسوم بنكية',            gl: 'مصروفات ورسوم بنكية', patterns: [/رسوم/, /\bfee/i, /charge/i, /عمول[ةه]/] },
  { type: 'تحويل داخلي',           gl: 'تحويلات بين الحسابات', patterns: [/تحويل داخلي/, /داخلي/, /بين الحسابات/, /internal transfer/i] },
  { type: 'حوالة صادرة',           gl: 'تحويلات وحوالات صادرة', patterns: [/حوالة فورية/, /حوالة صادرة/, /حواله/, /حوالة/, /sarie/i, /remittance/i] },
  { type: 'مدفوعات نقاط بيع',      gl: 'إيرادات نقاط البيع', patterns: [/إيداع نقاط بيع/, /ايداع نقاط بيع/, /نقاط بيع/, /نقاط البيع/, /\bpos\b/i, /point of sale/i, /مدى/, /mada/i] },
  { type: 'مشتريات بالبطاقة',      gl: 'مشتريات ومدفوعات', patterns: [/شراء محلي/, /شراء عبر/, /مشتريات/, /شراء/, /purchase/i, /pos purchase/i] },
  { type: 'سحب نقدي',              gl: 'نقدية بالصندوق', patterns: [/سحب نقدي/, /صرف نقدي/, /سحب من الصراف/, /\batm\b/i, /cash withdrawal/i] },
  { type: 'إيداع نقدي',            gl: 'نقدية بالبنك', patterns: [/إيداع نقدي/, /ايداع نقدي/, /إيداع/, /ايداع/, /deposit/i] },
  { type: 'رواتب',                 gl: 'رواتب وأجور', patterns: [/راتب/, /رواتب/, /payroll/i, /salary/i] },
  { type: 'رصيد افتتاحي',          gl: 'رصيد افتتاحي', patterns: [/رصيد افتتاحي/, /opening balance/i] },
];

// GL accounts roll up into accounting NATURES so reconciliation can be read the
// way an accountant reads a statement: what increased cash, what reduced it, and
// what is merely an intermediary/transfer movement vs. a real income/expense.
export const GL_NATURES: { nature: string; accounts: string[] }[] = [
  { nature: 'نقدية وما يعادلها', accounts: ['نقدية بالصندوق', 'نقدية بالبنك'] },
  { nature: 'إيرادات ومقبوضات', accounts: ['إيرادات نقاط البيع', 'مقبوضات أخرى'] },
  { nature: 'مصروفات ورسوم', accounts: ['مصروفات ورسوم بنكية', 'مشتريات ومدفوعات', 'مدفوعات أخرى'] },
  { nature: 'ضرائب', accounts: ['ضريبة القيمة المضافة'] },
  { nature: 'تحويلات وحسابات وسيطة', accounts: ['تحويلات وحوالات صادرة', 'تحويلات بين الحسابات'] },
  { nature: 'رواتب وأجور', accounts: ['رواتب وأجور'] },
  { nature: 'أرصدة افتتاحية', accounts: ['رصيد افتتاحي'] },
];

const GL_TO_NATURE: Record<string, string> = GL_NATURES.reduce((m, g) => {
  g.accounts.forEach(a => { m[a] = g.nature; });
  return m;
}, {} as Record<string, string>);

// Map a GL account label (or the legacy bank Category سحب/إيداع بنكي) to its
// accounting nature. Unknown accounts roll up under "أخرى".
export function glNature(glAccount: string): string {
  if (!glAccount) return 'أخرى';
  if (GL_TO_NATURE[glAccount]) return GL_TO_NATURE[glAccount];
  if (/إيداع/.test(glAccount)) return 'إيرادات ومقبوضات';
  if (/سحب/.test(glAccount)) return 'مصروفات ورسوم';
  return 'أخرى';
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[ً-ْ]/g, '')        // strip Arabic diacritics
    .replace(/[إأآا]/g, 'ا')                 // unify alef forms
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract a usable counterparty/purpose from the narrative ("الوصف"). Banks
// pad it with merchant codes, city tags ("CITY:"), and long numeric ids — we
// keep the most meaningful human-readable fragment.
export function extractCounterparty(narrative: string, fallback: string): string {
  const raw = String(narrative || '').trim();
  if (!raw) return fallback || 'غير محدد';
  let v = raw
    .replace(/CITY\s*:/gi, ' ')
    .replace(/\b\d{6,}\b/g, ' ')            // drop long reference numbers
    .replace(/\s+/g, ' ')
    .trim();
  if (!v) return fallback || 'غير محدد';
  // If a colon-tagged merchant is present (e.g. "NOON CITY:000"), keep the head.
  const head = v.split(/[:|/]/)[0].trim();
  return (head.length >= 2 ? head : v).slice(0, 60);
}

export function classifyBankTransaction(
  details: string,
  narrative: string,
  flow: BankFlow
): BankClassification {
  const d = normalize(details);
  const n = normalize(narrative);

  // The movement NATURE lives in التفاصيل (details). The narrative is the
  // counterparty/merchant text and must NOT drive the type — e.g. a card
  // purchase whose merchant string contains "MADA" or "شراء بضاعة" must stay a
  // purchase, not become a POS/transfer line. So match details first; only if
  // details yields nothing do we fall back to the narrative.
  const matchIn = (hay: string) => TYPE_RULES.find(rule => rule.patterns.some(p => p.test(hay)));
  let matched = matchIn(d);
  if (!matched && !d) matched = matchIn(n); // narrative only as a last resort

  if (matched) {
    return {
      transactionType: matched.type,
      glAccount: matched.gl,
      counterparty: extractCounterparty(narrative, matched.type),
    };
  }

  // Unknown nature → fall back to direction so the record is never uncategorized.
  return {
    transactionType: flow === 'debit' ? 'سحب / مدفوعات أخرى' : 'إيداع / مقبوضات أخرى',
    glAccount: flow === 'debit' ? 'مدفوعات أخرى' : 'مقبوضات أخرى',
    counterparty: extractCounterparty(narrative, details || 'غير محدد'),
  };
}
