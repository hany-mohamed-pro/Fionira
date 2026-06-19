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

export interface AppSettings {
  companyName: string;
  logo?: string;
  activity: ActivityKey | string; // stable enum key (legacy free-text tolerated, treated as unset)
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
    try {
      await fetch('/api/erp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake-token-for-dev`
        },
        body: JSON.stringify(settings)
      });
    } catch(e) {
      console.warn("Dev settings save failed", e);
    }
  }

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

  const unsub = onSnapshot(doc(db, COLLECTION_NAME, tenantId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings);
    } else {
      callback({ ...DEFAULT_SETTINGS, tenantId });
    }
  }, (error) => {
    if (error.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota')) {
       console.warn("[DEV SAFE] Settings subscription paused (Quota Limit). Using API fallback.");
       if (IS_DEV) {
          fallbackInterval = setInterval(async () => {
             const sets = await getSettings(tenantId);
             callback(sets);
          }, 3000);
       }
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
