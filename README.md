<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b84a137f-d14f-4f22-9a56-d63a14d5b973

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Dev-only Firebase admin claims

The local app still requires real Firebase Auth custom claims before it renders the authenticated dashboard. This is a development setup helper only; it does not bypass client or server auth checks.

1. Sign in once with Google and copy the Firebase Auth UID for that user from the Firebase Console.
2. Make Firebase Admin credentials available with one of these options:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to a local service-account JSON file path.
   - Or keep a complete local `firebase-service-account.json` in the project root.
3. Assign dev admin claims:
   `npm run dev:set-admin-claims -- --uid=<firebase-user-uid>`
4. Optional: use a separate tenant id:
   `npm run dev:set-admin-claims -- --uid=<firebase-user-uid> --tenantId=<tenant-id>`
5. Sign out and sign in again, or force-refresh the Firebase ID token, before testing the dashboard.

The script refuses to run when `NODE_ENV=production` and requires an explicit UID.

## Dev-only local auth for browser verification

If Google popup sign-in is blocked by the local/in-app browser, you can enable a local-only dev auth button for UI verification.

Add these values to `.env.local`, then restart `npm run dev`:

```env
VITE_ENABLE_DEV_AUTH=true
VITE_DEV_AUTH_TENANT_ID=<local-dev-tenant-id>
VITE_DEV_AUTH_UID=<local-dev-user-id>
VITE_DEV_AUTH_EMAIL=dev-admin@local.test
```

This mode is active only when Vite is running in development and `VITE_ENABLE_DEV_AUTH=true`. It provides a local admin-shaped user with tenantId and module permissions so the UI can be verified against existing local records. Do not enable it in production.
