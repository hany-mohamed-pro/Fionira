import type { User } from 'firebase/auth';

export const DEV_AUTH_STORAGE_KEY = 'fionira.devAuth.enabled';

const DEV_AUTH_PERMISSIONS = ['expenses', 'revenues', 'payroll', 'banks', 'reports', 'smart_invoice', 'quotations'];

const getViteEnv = () => ((import.meta as any).env || {}) as Record<string, string | boolean | undefined>;

export const isDevAuthEnabled = () => {
  const env = getViteEnv();
  return env.DEV === true && env.VITE_ENABLE_DEV_AUTH === 'true';
};

export const getDevAuthProfile = () => {
  const env = getViteEnv();
  const uid = String(env.VITE_DEV_AUTH_UID || env.VITE_DEV_AUTH_TENANT_ID || 'test-user');
  const tenantId = String(env.VITE_DEV_AUTH_TENANT_ID || uid);
  return {
    uid,
    email: String(env.VITE_DEV_AUTH_EMAIL || 'dev-admin@local.test'),
    role: 'admin' as const,
    tenantId,
    createdAt: new Date(0).toISOString(),
    permissions: DEV_AUTH_PERMISSIONS
  };
};

export const createDevAuthUser = (): User => {
  const profile = getDevAuthProfile();
  const devToken = `fake-token-for-dev:${encodeURIComponent(profile.tenantId)}:${encodeURIComponent(profile.uid)}`;
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: 'DEV AUTH Admin',
    isAnonymous: false,
    emailVerified: true,
    phoneNumber: null,
    photoURL: null,
    providerId: 'dev-auth',
    metadata: {} as any,
    providerData: [],
    refreshToken: 'dev-auth',
    tenantId: null,
    delete: async () => undefined,
    getIdToken: async () => devToken,
    getIdTokenResult: async () => ({
      token: devToken,
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      signInProvider: 'dev-auth',
      signInSecondFactor: null,
      claims: {
        role: profile.role,
        tenantId: profile.tenantId,
        permissions: profile.permissions
      }
    } as any),
    reload: async () => undefined,
    toJSON: () => ({ uid: profile.uid, email: profile.email, providerId: 'dev-auth' })
  } as User;
};

export const startDevAuthSession = () => {
  if (!isDevAuthEnabled()) return false;
  window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true');
  window.location.reload();
  return true;
};

export const clearDevAuthSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
  }
};

export const hasDevAuthSession = () => {
  return isDevAuthEnabled() && typeof window !== 'undefined' && window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true';
};
