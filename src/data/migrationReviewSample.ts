export const migrationOverviewData = {
  vendorGroupsNeedingReview: 113,
  suggestedAccountStandardizations: 125,
  roundingDifferencesCount: 798,
  totalRoundingDifference: 0.2323,
  trialBalanceMatched: true,
  overallReadiness: 'PENDING'
};

export const vendorReviewGroups = [
  {
    id: 'grp-001',
    suggestedMainName: 'شركة التوريدات الحديثة',
    confidence: '98%',
    variants: ['شركة التوريدات الحديثة م.ض', 'التوريدات الحديثة', 'Modern Supplies Co'],
    transactionCount: 450,
    totalAmount: 1250000.00,
    riskExplanation: 'أسماء متشابهة جدًا أو متطابقة في الرقم الضريبي',
    status: 'PENDING'
  },
  {
    id: 'grp-002',
    suggestedMainName: 'مؤسسة الأفق للتجارة',
    confidence: '85%',
    variants: ['الافق للتجارة', 'مؤسسة الافق', 'Horizon Trading Est'],
    transactionCount: 120,
    totalAmount: 45000.50,
    riskExplanation: 'اختلاف في المسافات أو الحروف (الهمزة)',
    status: 'PENDING'
  },
  {
    id: 'grp-003',
    suggestedMainName: 'خدمات التقنية الذكية',
    confidence: '70%',
    variants: ['خدمات التقنيه', 'التقنية الذكية لتقنية المعلومات'],
    transactionCount: 30,
    totalAmount: 8500.00,
    riskExplanation: 'احتمالية تشابه في الأسماء، يحتاج مراجعة محاسبية',
    status: 'PENDING'
  }
];

export const apStandardizationCandidates = [
  {
    id: 'ap-001',
    legacyAccount: '210100 - التوريدات الحديثة (مورد)',
    standardAccount: '210000 - حساب الموردين الرئيسي',
    transactionCount: 450,
    amountImpact: 1250000.00,
    status: 'PENDING'
  },
  {
    id: 'ap-002',
    legacyAccount: '210101 - الأفق للتجارة (ذمم دائنة)',
    standardAccount: '210000 - حساب الموردين الرئيسي',
    transactionCount: 120,
    amountImpact: 45000.50,
    status: 'PENDING'
  }
];

export const roundingDifferences = [
  {
    id: 'rnd-001',
    vendor: 'شركة الاتصالات',
    month: '2023-05',
    affectedEntries: 5,
    largestDifference: 0.05,
    status: 'PENDING'
  },
  {
    id: 'rnd-002',
    vendor: 'خدمات الشحن السريع',
    month: '2023-06',
    affectedEntries: 12,
    largestDifference: 0.04,
    status: 'PENDING'
  }
];

export const trialBalanceComparison = {
  legacyTotalDebit: 45000000.00,
  legacyTotalCredit: 45000000.00,
  legacyAPTotal: 3450000.00,
  normalizedTotalDebit: 45000000.00,
  normalizedTotalCredit: 45000000.00,
  normalizedAPTotal: 3450000.00,
  reclassificationShift: 1133561.74,
  status: 'BALANCED'
};
