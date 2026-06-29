import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Stable activity keys used to drive activity-aware classification logic.
 * The empty string means "unset" and preserves today's exact behavior
 * (no activity-specific rule activates). Matching logic depends on these
 * keys, never on the Arabic display label.
 */
export type ActivityKey =
  | ''
  | 'trading_retail'
  | 'manufacturing_food'
  | 'professional_services'
  | 'contracting_construction'
  | 'restaurant_fb';

export const ACTIVITY_OPTIONS: { key: ActivityKey; label: string }[] = [
  { key: '', label: 'غير محدد' },
  { key: 'trading_retail', label: 'تجارة التجزئة والجملة' },
  { key: 'manufacturing_food', label: 'التصنيع والمنتجات الغذائية' },
  { key: 'professional_services', label: 'الخدمات المهنية والاستشارية' },
  { key: 'contracting_construction', label: 'المقاولات والإنشاءات' },
  { key: 'restaurant_fb', label: 'المطاعم وخدمات الأغذية' },
];

/**
 * A tenant branch / activity unit. `id` is a stable key (rides on every record as
 * branchId); `name` is the Arabic display label. Tenants with no branches behave
 * as a single implicit "الفرع الرئيسي" (the DEFAULT_BRANCH_ID), so existing
 * single-branch tenants are unaffected (zero migration).
 */
export interface Branch {
  id: string;
  name: string;
}

/** Generate a stable, collision-resistant branch id from a name. */
export const makeBranchId = (name: string): string =>
  'br_' + (name || 'branch').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\wء-ي]/g, '').slice(0, 24) + '_' + Math.random().toString(36).slice(2, 7);

/**
 * A section-level budget plan (IA Phase 3 MVP). One row per (branch, period).
 * `period` is a year string (e.g. "2025") — annual section-level is the MVP;
 * monthly/per-category are the documented next layers. Stored in AppSettings
 * (config store, NOT the financial registry) — kept separate from actuals.
 * Net budget is derived: revenue − cogs − opex (never stored, never drifts).
 */
export interface BudgetEntry {
  branchId: string;   // 'default' or a branch id
  period: string;     // year, e.g. "2025"
  revenue: number;
  cogs: number;
  opex: number;
}

/**
 * A construction/job-costing PROJECT (D11). Direct costs attributed to an
 * `active` project accumulate as WIP (أعمال تحت التنفيذ) and are DEFERRED from the
 * P&L; on `completed` they are recognized as COGS (completed-contract method).
 * Stored in AppSettings (config store, NOT the financial registry). Branch-aware.
 * Cost attribution is by project-name match in the cost description (the same
 * signal Phase 5's project-link insight already surfaces) — transparent and
 * user-controlled (the user defines the project and marks it complete).
 */
export interface Project {
  id: string;
  name: string;
  startDate?: string;
  expectedCompletion?: string;
  status: 'active' | 'completed';
  branchId: string; // 'default' or a branch id
}

/** Generate a stable, collision-resistant project id from a name. */
export const makeProjectId = (name: string): string =>
  'prj_' + (name || 'project').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\wء-ي]/g, '').slice(0, 24) + '_' + Math.random().toString(36).slice(2, 7);

export interface AppSettings {
  companyName: string;
  logo?: string;
  activity: ActivityKey | string; // stable enum key (legacy free-text tolerated, treated as unset)
  branches?: Branch[]; // tenant branches; empty/undefined = single implicit "الفرع الرئيسي"
  budgets?: BudgetEntry[]; // section-level annual budget plan (IA Phase 3); empty = no budget set
  projects?: Project[]; // construction/job-costing projects (D11); empty = none
  taxId: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  preparerName: string;
  // Multi-tenant
  tenantId?: string;
  // Regional
  currency: string;
  timezone: string;
  dateFormat: string;
  // Notifications
  enableEmailAlerts: boolean;
  enableSystemAlerts: boolean;
  // Security
  sessionTimeout: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: '',
  activity: '', // unset by default = today's exact classification behavior
  branches: [], // no branches → single implicit "الفرع الرئيسي" (zero migration)
  budgets: [], // no budget set by default
  projects: [], // no construction projects by default (D11)
  taxId: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  preparerName: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  dateFormat: 'YYYY-MM-DD',
  enableEmailAlerts: true,
  enableSystemAlerts: true,
  sessionTimeout: 30,
};

const COLLECTION_NAME = 'appSettings';

// Check for dev mode cleanly
const IS_DEV = process.env.NODE_ENV !== 'production';

export const getSettings = async (tenantId: string): Promise<AppSettings> => {
  if (!tenantId) return DEFAULT_SETTINGS;
  
  if (IS_DEV) {
    try {
      const res = await fetch('/api/erp/settings', {
        headers: { 'Authorization': `Bearer fake-token-for-dev` } // We could get token but dev bypasses it when needed
      });
      if (res.ok) {
        const json = await res.json();
        return { ...DEFAULT_SETTINGS, ...json.data };
      }
    } catch(e) {
      console.warn("Dev settings fetch failed", e);
    }
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, tenantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings;
    }
    return { ...DEFAULT_SETTINGS, tenantId };
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota')) {
      console.warn("[DEV SAFE] Settings fetch paused (Quota Limit). Fallback to DEFAULT_SETTINGS.");
    } else {
      console.error("Error fetching settings:", error);
    }
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (tenantId: string, settings: AppSettings): Promise<void> => {
  if (!tenantId) throw new Error("tenantId is required to save settings");

  if (IS_DEV) {
    // In dev / local (including dev-auth), the dev API + devMemoryDb is the AUTHORITATIVE store.
    // There is no real Firebase session in dev-auth, so a direct Firestore write is rejected with
    // `permission-denied` — that is EXPECTED, not a save failure. So: determine success from the dev
    // API call, and treat the Firestore mirror as best-effort (never fatal in dev). This removes the
    // false "خطأ في الحفظ" the user saw while the data had actually persisted to the dev store.
    const res = await fetch('/api/erp/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fake-token-for-dev`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      // A genuine dev-store failure SHOULD surface — we are not hiding real errors.
      throw new Error(`DEV settings save failed (HTTP ${res.status})`);
    }

    // Best-effort mirror to Firestore if a real session ever exists; its absence is normal in dev-auth.
    try {
      await setDoc(doc(db, COLLECTION_NAME, tenantId), { ...settings, tenantId }, { merge: true });
    } catch (err: any) {
      console.warn("[DEV] Firestore mirror skipped (no authenticated session — expected in dev-auth):", err?.code || err?.message || err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ERP_SETTINGS_UPDATED', { detail: settings }));
    }
    return;
  }

  // Production: Firestore is the authoritative store; real auth is present, so write errors are real.
  const docRef = doc(db, COLLECTION_NAME, tenantId);
  try {
    await setDoc(docRef, { ...settings, tenantId }, { merge: true });
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('quota') || String(err).toLowerCase().includes('quota')) {
      console.warn("[DEV SAFE] Settings setDoc paused (Quota Limit).");
    } else {
      throw err;
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ERP_SETTINGS_UPDATED', { detail: settings }));
  }
};

export const subscribeToSettings = (tenantId: string, callback: (settings: AppSettings) => void) => {
  if (!tenantId) {
    callback(DEFAULT_SETTINGS);
    return () => {};
  }
  
  let fallbackInterval: any = null;

  const handleCustomEvent = (e: any) => {
    callback(e.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('ERP_SETTINGS_UPDATED', handleCustomEvent);
  }

  // In dev / local (including dev-auth) there is no real Firebase session, so the Firestore
  // onSnapshot below fails with permission-denied. Load from the dev API immediately so
  // App-level state (branches, activity) is populated without waiting on Firestore.
  if (IS_DEV) {
    getSettings(tenantId).then(callback).catch(() => { /* dev API unavailable → keep defaults */ });
  }

  const unsub = onSnapshot(doc(db, COLLECTION_NAME, tenantId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings);
    } else {
      callback({ ...DEFAULT_SETTINGS, tenantId });
    }
  }, (error: any) => {
    const isQuota = error?.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota');
    if (IS_DEV) {
       // dev-auth has no Firebase session → permission-denied (or quota). The dev API is
       // authoritative here, so fall back to polling it instead of surfacing an error.
       console.warn("[DEV] Settings subscription using API fallback:", error?.code || (isQuota ? 'quota' : error?.message));
       if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
             const sets = await getSettings(tenantId);
             callback(sets);
          }, 3000);
       }
    } else if (isQuota) {
       console.warn("[DEV SAFE] Settings subscription paused (Quota Limit).");
    } else {
       console.error("Error subscribing to settings:", error);
    }
  });

  return () => {
     unsub();
     if (fallbackInterval) clearInterval(fallbackInterval);
     if (typeof window !== 'undefined') window.removeEventListener('ERP_SETTINGS_UPDATED', handleCustomEvent);
  }
};
