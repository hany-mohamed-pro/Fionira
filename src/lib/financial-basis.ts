export type ExpenseBeforeVatBasis = 'net' | 'taxable_plus_non_taxable' | 'total_minus_vat' | 'gross_fallback';

export type ExpenseAmountLike = {
  Net_Amount?: unknown;
  Taxable_Amount?: unknown;
  Non_Taxable_Amount?: unknown;
  NonTaxable_Amount?: unknown;
  Total_Amount?: unknown;
  VAT_Amount?: unknown;
  taxAmount?: unknown;
};

export type ExpenseBeforeVatResult = {
  amount: number;
  basis: ExpenseBeforeVatBasis;
  usedGrossFallback: boolean;
};

const hasNumericValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  const normalized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  return Number.isFinite(Number(normalized));
};

export const safeNumber = (value: unknown): number => {
  if (!hasNumericValue(value)) return 0;
  return Number(typeof value === 'string' ? value.replace(/,/g, '').trim() : value);
};

export const getExpenseVat = (record: ExpenseAmountLike): number => {
  if (hasNumericValue(record?.VAT_Amount)) return safeNumber(record.VAT_Amount);
  if (hasNumericValue(record?.taxAmount)) return safeNumber(record.taxAmount);
  return 0;
};

export const getExpenseBeforeVatBasis = (record: ExpenseAmountLike): ExpenseBeforeVatResult => {
  if (hasNumericValue(record?.Net_Amount)) {
    return { amount: safeNumber(record.Net_Amount), basis: 'net', usedGrossFallback: false };
  }

  const taxableExists = hasNumericValue(record?.Taxable_Amount);
  const nonTaxableSource = hasNumericValue(record?.Non_Taxable_Amount) ? record.Non_Taxable_Amount : record?.NonTaxable_Amount;
  const nonTaxableExists = hasNumericValue(nonTaxableSource);
  if (taxableExists || nonTaxableExists) {
    return {
      amount: safeNumber(record?.Taxable_Amount) + safeNumber(nonTaxableSource),
      basis: 'taxable_plus_non_taxable',
      usedGrossFallback: false
    };
  }

  if (hasNumericValue(record?.Total_Amount) && (hasNumericValue(record?.VAT_Amount) || hasNumericValue(record?.taxAmount))) {
    return {
      amount: safeNumber(record.Total_Amount) - getExpenseVat(record),
      basis: 'total_minus_vat',
      usedGrossFallback: false
    };
  }

  return {
    amount: safeNumber(record?.Total_Amount),
    basis: 'gross_fallback',
    usedGrossFallback: hasNumericValue(record?.Total_Amount)
  };
};

export const getExpenseBeforeVat = (record: ExpenseAmountLike): number => {
  return getExpenseBeforeVatBasis(record).amount;
};

export const getExpenseTotalIncludingVat = (record: ExpenseAmountLike): number => {
  if (hasNumericValue(record?.Total_Amount)) return safeNumber(record.Total_Amount);
  if (hasNumericValue(record?.Net_Amount)) return safeNumber(record.Net_Amount) + getExpenseVat(record);
  return safeNumber(record?.Net_Amount);
};

export const getVendorExposureIncludingVat = (record: ExpenseAmountLike): number => {
  return getExpenseTotalIncludingVat(record);
};
