import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './firebase-service-account.json' with { type: 'json' };
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  projectId: firebaseConfig.projectId
});

const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
? firebaseConfig.firestoreDatabaseId
: undefined;

const db = getFirestore(app, dbId); 
console.log("Connecting...");
db.collection('uploadedFiles').limit(1).get().then(() => {
  console.log("Connected");
  process.exit(0);
}).catch(e => {
  console.error("Failed:", e.message);
  process.exit(1);
});
