/**
 * Pure, side-effect free formatting utilities for the ERP.
 * No React, no dashboard dependencies, no business logic.
 */

const isValidNumber = (val: any): boolean => {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
};

export const formatAmount = (value: any, minDecimals = 0, maxDecimals = 2): string => {
  if (!isValidNumber(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(value);
};

export const formatCurrency = (value: any, suffix = 'ر.س', forceDecimals = false): string => {
  if (!isValidNumber(value)) return `0 ${suffix}`;
  
  // Format the absolute amount first
  const absValue = Math.abs(value);
  const formattedAmount = formatAmount(absValue, forceDecimals ? 2 : 0, forceDecimals ? 2 : 2);
  
  // Handle negatives explicitly to ensure consistent "minus" sign placement
  if (value < 0) {
    return `-${formattedAmount} ${suffix}`;
  }
  return `${formattedAmount} ${suffix}`;
};

export const formatPercent = (value: any, maxDecimals = 1): string => {
  if (!isValidNumber(value)) return '0%';
  return `${formatAmount(value, 0, maxDecimals)}%`;
};

export const formatCount = (value: any, label?: string): string => {
  if (!isValidNumber(value)) return label ? `0 ${label}` : '0';
  const formattedCount = formatAmount(Math.round(value), 0, 0);
  return label ? `${formattedCount} ${label}` : formattedCount;
};
