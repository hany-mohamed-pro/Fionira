# Fionira — First Real-User Onboarding Checklist

> **Purpose:** Get the first real admin user logged in **today**.
> **Read-only audit** — no source files modified. Every claim cites file:line.
> **Generated:** 2026-06-16 · **Base:** `a9e16bc` (Security Layer + PATCH-7 on master)

---

## 🚨 HEADLINE BLOCKER — read this first

After the PR-1 security hardening, the **in-app self-bootstrap path is dead for brand-new users.** A net-new Firebase user **cannot create their own claims**, because the endpoints that would do it are gated behind the very claims they are meant to create:

- `AuthProvider` calls `POST /api/erp/users/init` when claims are missing ([AuthProvider.tsx:88-98](src/contexts/AuthProvider.tsx)).
- That route is registered as `app.post("/api/erp/users/init", authenticate, …)` ([server.ts:821](server.ts)).
- `authenticate` now **returns 403** when the token lacks `role`/`tenantId` (PR-1): *"Forbidden: token missing tenantId/role claims"* ([server.ts:784-786](server.ts)).
- The error-screen **"fix-role" button** calls `POST /api/erp/admin/fix-role` ([App.tsx:2018](src/App.tsx)) — also behind `authenticate` ([server.ts:838](server.ts)) → **same 403**.

**Consequence:** A user with no custom claims hits the *"مشكلة في الصلاحيات"* (permissions problem) screen ([App.tsx:1998-2013](src/App.tsx)) and **cannot self-recover** — the fix-role button 403s too.

➡️ **Claims MUST be set out-of-band before first login.** The only supported tool in this repo is the `dev:set-admin-claims` script. There is **no production claims-provisioning endpoint** in the codebase — flag for the Architecture/Ops backlog.

---

## A) Exact custom claims the app expects

Three claims, set as Firebase Auth **custom claims** on the user:

| Claim | Type | Values | Required? |
|---|---|---|---|
| `role` | string | `'admin'` \| `'accountant'` \| `'viewer'` | **Yes** — 403 without it |
| `tenantId` | string | the company/tenant id (often = uid for a solo admin) | **Yes** — 403 without it |
| `permissions` | string[] | subset of `['expenses','revenues','payroll','banks','reports','smart_invoice','quotations']` | Optional (defaults to `[]`) |

**Evidence:**
- Enforced server-side: [server.ts:784-797](server.ts) — requires `role` + `tenantId`; `permissions` falls back to `[]` if not an array.
- Expected client-side: [AuthProvider.tsx:86](src/contexts/AuthProvider.tsx) — `claimsValid = role && tenantId`; profile built from `claims.role`/`claims.tenantId`/`claims.permissions` ([:146-153](src/contexts/AuthProvider.tsx)).
- Canonical permission list: [dev-auth.ts:5](src/lib/dev-auth.ts) and [set-dev-admin-claims.ts:5-13](scripts/set-dev-admin-claims.ts) (identical 7-item list).

## B) Does `set-dev-admin-claims.ts` set ALL required claims correctly?

**Yes** — it sets all three correctly ([set-dev-admin-claims.ts:78-84](scripts/set-dev-admin-claims.ts)):
```
{ role: 'admin', tenantId, permissions: [7-item list] }  → admin.auth().setCustomUserClaims(uid, claims)
```
Guards/behavior:
- **Refuses in production:** throws if `NODE_ENV=production` ([:29-31](scripts/set-dev-admin-claims.ts)). To provision a *real* prod-project user, run it in a shell where `NODE_ENV` is **not** `production`, pointed at the prod Firebase project via the service-account key — claims land on the Firebase project regardless of local `NODE_ENV`.
- **Requires `--uid`** ([:33-35](scripts/set-dev-admin-claims.ts)); `tenantId` defaults to `uid` if omitted ([:27](scripts/set-dev-admin-claims.ts)).
- **Credentials:** `GOOGLE_APPLICATION_CREDENTIALS` or a complete `firebase-service-account.json` ([:44-72](scripts/set-dev-admin-claims.ts)). ⚠️ Use the **newly rotated** key (old one `a3e0edf3…` was revoked; current `34262ed4…`).
- Only sets `role: 'admin'` — for `accountant`/`viewer` users you must `setCustomUserClaims` manually or extend the script.

## C) What `AuthProvider` does when claims are missing/malformed

1. Reads token claims; if `role`/`tenantId` absent and not yet initialized this session → calls `POST /api/erp/users/init` **once** ([:88-98](src/contexts/AuthProvider.tsx)).
2. After init, **re-checks claims with retries** (up to 2×, 1s apart) ([:114-127](src/contexts/AuthProvider.tsx)); a second path retries 2× at 0.5s if init already ran ([:128-143](src/contexts/AuthProvider.tsx)).
3. If still invalid → throws *"AUTH INITIALIZATION FAILED…"* → sets `authError`, `profile = null` ([:157-167](src/contexts/AuthProvider.tsx)).
4. `App.tsx` then renders the **permissions-error screen** (`user && !profile`) with the (now-ineffective) fix-role button ([App.tsx:1998-2031](src/App.tsx)).

⚠️ **Post-hardening reality:** step 1's `init` call **403s** for a no-claims user (see Headline Blocker), so the retry loop always exhausts → error screen. The self-heal design predates PR-1 and no longer functions for net-new users.

## D) Minimum for a new real user to log in successfully

1. A **Firebase Auth account** exists (e.g., first Google sign-in created it).
2. **Custom claims `role` + `tenantId`** set on that account **out-of-band** (the in-app bootstrap won't do it).
3. **Token refreshed** after claims are set (sign out/in, or force ID-token refresh).

That's it — with valid `role`+`tenantId`, `authenticate` passes and the user reaches the app shell.

---

## ✅ Step-by-step: onboard the first real ADMIN user

> Prerequisites: backend running (`$env:PORT=3100; npm run dev`), Postgres reachable (or JSON fallback), and the **rotated** `firebase-service-account.json` at project root.

1. **Create the Firebase user.** Have them sign in once with Google in the app. They will land on the *"مشكلة في الصلاحيات"* permissions screen — expected (no claims yet).
2. **Get their UID.** Firebase Console → Authentication → Users → copy the UID.
3. **Make admin credentials available** (one of):
   - `setx GOOGLE_APPLICATION_CREDENTIALS "D:\…\firebase-service-account.json"` (new shell), or
   - keep the complete rotated `firebase-service-account.json` at project root.
4. **Set claims** (ensure `NODE_ENV` ≠ `production` in this shell):
   ```powershell
   npm run dev:set-admin-claims -- --uid=<FIREBASE_UID> --tenantId=<TENANT_ID>
   ```
   (omit `--tenantId` to default it to the uid). Expect: *"Dev admin claims set for Firebase UID: …"*.
5. **Refresh the token:** user signs out and back in (or hard-reloads). `AuthProvider` now reads valid claims and builds the profile ([AuthProvider.tsx:146-156](src/contexts/AuthProvider.tsx)).
6. **Verify:** user lands on the **Global Dashboard** (default `appMode='dashboard'`, [App.tsx:164](src/App.tsx)) — empty until data is uploaded (see `dashboard-data-flow.md`).

**For `accountant`/`viewer` users:** repeat, but set claims manually (the script is admin-only):
```js
admin.auth().setCustomUserClaims(uid, { role: 'accountant', tenantId, permissions: [...] })
```

---

## What must exist in Firebase Auth before login works
- ✅ The user account (Auth provider sign-in).
- ✅ Custom claims `role` + `tenantId` on that account.
- ✅ A service-account key (rotated) with permission to `setCustomUserClaims`.
- ❌ **Not required:** a Firestore `users/{uid}` document for login itself — identity/role come from **token claims**, not Firestore (backend reads claims; `AuthProvider`'s Firestore imports are vestigial).

## What the user sees if a step is missing

| Missing step | What the user sees | Source |
|---|---|---|
| Not signed in | Login screen | [App.tsx:1994-1996](src/App.tsx) |
| Signed in, **no claims** | Spinner *"جاري تهيئة الصلاحيات…"*, then **permissions-error screen**; fix-role button **also fails (403)** | [App.tsx:1985-2031](src/App.tsx), [server.ts:784,821,838](server.ts) |
| Claims set but **token not refreshed** | Still permissions-error until re-login/refresh (claims cached in old token) | [AuthProvider.tsx:79-83,114-127](src/contexts/AuthProvider.tsx) |
| Valid claims, **no data uploaded** | Global Dashboard with *"لا توجد بيانات كافية"* empty states | see `dashboard-data-flow.md` |
| API/token call fails | Backend returns 401/403; `AuthProvider` logs *"CRITICAL AUTH FAILURE"* | [AuthProvider.tsx:160-167](src/contexts/AuthProvider.tsx) |

---

## Recommended fixes for true operational readiness (not done — out of scope here)
1. **Unblock first-user bootstrap:** either (a) add a narrowly-scoped, separately-authenticated provisioning endpoint that can mint the first admin's claims, or (b) make onboarding explicitly an out-of-band admin task and **remove the dead self-heal UI** (`users/init` call + fix-role button) so users aren't shown a recovery action that 403s.
2. **Add a production claims-provisioning path** (Cloud Function / admin console) — the repo only ships a dev script.
3. **Document the rotated service-account key** handling and confirm `firebase-service-account.json` is git-ignored.
