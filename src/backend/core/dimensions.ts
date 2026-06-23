// ─────────────────────────────────────────────────────────────────────────
// System-wide foundational data dimension: BRANCH / ACTIVITY
//
// `branchId` is a CORE dimension of every financial record — conceptually on
// the same footing as `tenantId`. A business may run multiple branches /
// activities, each with its own expenses, revenues, payroll, AND bank accounts.
// Modelling this once, centrally, means every module (expenses, revenues,
// payroll, banks) can adopt the SAME field additively instead of reinventing an
// incompatible per-module notion later.
//
// Design constraints honoured here:
//  • Zero migration: every record defaults to one implicit "default" branch per
//    tenant, so all current single-branch tenants are unaffected.
//  • No database table / no branch-management entity / no UI today — this is a
//    record-level field with a sane default, nothing more.
//  • branchId is SEPARATE from any module-specific identity (e.g. a bank
//    account number). A branch may own several bank accounts; the account
//    number identifies the account, branchId identifies the business unit.
// ─────────────────────────────────────────────────────────────────────────

/** The implicit single branch every tenant has until branches are configured. */
export const DEFAULT_BRANCH_ID = 'default';

/** Human label for the default branch (display only; no entity behind it yet). */
export const DEFAULT_BRANCH_LABEL = 'الفرع الرئيسي';

/**
 * The branch dimension carried by every financial record. Only `branchId` is
 * populated today (always the default); `branchName`/`branchActivity` are
 * reserved for when branch management is introduced — additively.
 */
export interface BranchDimension {
  branchId: string;
  branchName?: string;
  branchActivity?: string;
}

/**
 * Attach the branch dimension to a record. Any processor (banks today;
 * expenses/revenues/payroll in future) calls this identically. Passing no
 * branchId yields the default branch, which is the correct behaviour for every
 * current single-branch tenant.
 */
export function withBranch<T extends object>(
  record: T,
  branchId: string = DEFAULT_BRANCH_ID
): T & { branchId: string } {
  return { ...record, branchId: branchId && String(branchId).trim() ? String(branchId).trim() : DEFAULT_BRANCH_ID };
}

/** Normalise any incoming branch id to a non-empty value. */
export function normalizeBranchId(branchId?: string | null): string {
  const v = (branchId ?? '').toString().trim();
  return v || DEFAULT_BRANCH_ID;
}
