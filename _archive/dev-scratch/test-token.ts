import { GoogleAuth } from 'google-auth-library';
import sa from './firebase-service-account.json' with { type: 'json' };

async function test() {
  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    console.log("Got token!", token);
  } catch (e: any) {
    console.error("Token error:", e);
  }
}
test();
