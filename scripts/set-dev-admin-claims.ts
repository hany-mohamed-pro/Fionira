import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEV_ADMIN_PERMISSIONS = [
  'expenses',
  'revenues',
  'payroll',
  'banks',
  'reports',
  'smart_invoice',
  'quotations'
] as const;

const getArgValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim();

  const flagIndex = process.argv.indexOf(`--${name}`);
  if (flagIndex >= 0) return process.argv[flagIndex + 1]?.trim();

  return undefined;
};

const uid = getArgValue('uid') || process.env.FIREBASE_UID;
const tenantId = getArgValue('tenantId') || process.env.FIREBASE_TENANT_ID || uid;

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to set dev admin claims while NODE_ENV=production.');
}

if (!uid) {
  throw new Error('Missing Firebase UID. Pass --uid=<firebase-user-uid> or set FIREBASE_UID.');
}

if (!tenantId) {
  throw new Error('Missing tenantId. Pass --tenantId=<tenant-id> or set FIREBASE_TENANT_ID.');
}

const initializeAdmin = () => {
  if (admin.apps.length) return;

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const resolvedCredentialsPath = resolve(credentialsPath);
    if (!existsSync(resolvedCredentialsPath)) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS does not point to a readable file: ${resolvedCredentialsPath}`);
    }
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    return;
  }

  const localServiceAccountPath = resolve('firebase-service-account.json');
  if (!existsSync(localServiceAccountPath)) {
    throw new Error(
      'Missing Firebase Admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS or add firebase-service-account.json locally.'
    );
  }

  const serviceAccount = JSON.parse(readFileSync(localServiceAccountPath, 'utf8')) as admin.ServiceAccount;
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS or provide a complete firebase-service-account.json.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
};

const main = async () => {
  initializeAdmin();

  const claims = {
    role: 'admin',
    tenantId,
    permissions: [...DEV_ADMIN_PERMISSIONS]
  };

  await admin.auth().setCustomUserClaims(uid, claims);

  console.log(`Dev admin claims set for Firebase UID: ${uid}`);
  console.log(`Tenant ID: ${tenantId}`);
  console.log('Sign out and sign in again, or force-refresh the Firebase ID token, before testing the dashboard.');
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
