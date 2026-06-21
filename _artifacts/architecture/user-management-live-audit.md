# User Management — Live Practical Audit

> First **live-tested** audit (server actually run, browser actually driven, endpoints actually called).
> **Generated:** 2026-06-21 · **HEAD:** `b0a88ba` · Backend ran in **JSON-fallback mode** (Postgres unavailable on this machine — itself an observed environment fact).
> Every claim below is tagged **[LIVE]** (observed via running system) or **[CODE]** (read-only, clearly not a substitute for live) or **[NOT TESTABLE]** (with reason).

## STEP 0 — Environment parity: ✅ all 5 checks passed
HEAD `b0a88ba` (contains security commits 464ccdc/09974d8 as ancestors); git clean except known pre-existing; SA key rotated (`34262ed4…`, not the revoked `a3e0edf3`); `node_modules` present + `npm run build` exit 0; `.env.local` has the 3 dev-auth vars. Server booted "SERVER STARTED SUCCESSFULLY" on :3100.

## TASK 1 — Code intent (orientation)
`UserManagement.tsx`: admin-only page (gate `profile.role!=='admin'` → "غير مصرح"); lists users via `GET /api/erp/users`; changes role via `POST /api/erp/users/promote`; toggles per-module permissions (same promote endpoint); deletes via `DELETE /api/erp/users/:uid`. **No add/invite feature in the UI.** Server intent — the three data endpoints are **stubs**: `GET /api/erp/users` → `return []` ([server.ts:953-955](../../server.ts)); `POST …/promote` → `return {success:true, message:'User promoted'}` ([:957-959](../../server.ts)); `DELETE …/:targetUid` → `return {success:true}` ([:961-963](../../server.ts)). No `setCustomUserClaims`, no DB write.

## TASK 3 — Real actions, observed results

| # | Action | Observed result | vs intent | Severity |
|---|---|---|---|---|
| **PRIMARY** | Navigate to User Management as logged-in admin (top nav → Settings → all 4 sub-tabs → account menu → Ctrl+K → full DOM search incl. hidden) | **[LIVE] Unreachable.** Zero "إدارة المستخدمين / المستخدمون والصلاحيات / Users & Roles" nav element exists in the running DOM. The `NewAppShell.tsx:202` nav item is not rendered; the component needs `appMode='settings' && activeTab='user_management'` but no visible control sets it. | Page exists in code but a real admin **cannot open it** | 🔴 High (feature inaccessible) |
| **A** | View user list (`GET /api/erp/users`, dev-admin token) | **[LIVE] `200 {"success":true,"data":[]}`** — always empty; even the logged-in admin is absent | Matches the `return []` stub | 🟠 Medium (no real data ever) |
| **B** | Add/invite a new user | **[CODE] No such feature** — no add button, no invite endpoint exists | N/A — capability absent | 🟠 Medium (gap) |
| **C** | Change a user's role (`POST …/promote {targetUid:"some-uid", role:"accountant"}`) | **[LIVE] `200 {"success":true,"message":"User promoted"}`** — fakes success, persists nothing; "promoted" a **nonexistent** uid with no error | Stub: returns success, does nothing | 🔴 High (misleading success, no effect) |
| **E** | Invalid action — delete nonexistent user (`DELETE …/some-uid`) | **[LIVE] `200 {"success":true}`** — fake success, no validation, no Arabic error | No guarding; everything "succeeds" | 🟠 Medium (no error surfaced) |
| **D** | Access as non-admin | **[LIVE] API auth enforced:** no-token → `401`, bad-bearer → `401`. **[NOT TESTABLE] component gate:** dev-auth always synthesizes an **admin** identity, so I could not obtain a valid *non-admin* session to exercise the "غير مصرح" screen or a `403` from `requireAdmin`. Reported as a real dev-auth testing limitation, not assumed. | API correctly rejects unauthenticated; non-admin path unverified live | 🟢 Low (auth present; gap is test coverage) |
| **F** | Console errors during A–E | **[LIVE]** Only pre-existing app-wide `Error subscribing to settings: permission-denied` (dev token isn't a real Firebase token). **No User-Management-specific errors.** | — | 🟢 Low |

## TASK 4 — Promote flow vs the security work (live)
The UI's `updateUserRole` posts to `/api/erp/users/promote` with `{targetUid, role}` — confirmed by code, and the endpoint is auth-correct (`authenticate, requireAdmin`; **[LIVE]** 401 without a valid admin token). **But [LIVE] the endpoint is a no-op stub** that returns `{success:true}` without calling `setCustomUserClaims` or writing any store. Therefore a "freshly-promoted user" **never actually receives a new role** — there is no claim to refresh on next login. **[NOT TESTABLE end-to-end]**: I could not run a full *promote-real-user → re-login → observe role* cycle because (a) no second real user exists (list is permanently empty) and (b) dev-auth offers only the one hardcoded admin identity. The stub being a verified no-op makes the outcome certain regardless: **the promote→role-refresh mechanic cannot function as built.**

## TASK 5 — Honest verdict
User Management is a **polished UI shell over three stub endpoints, and the page is not even reachable** through the running app's navigation. Live-observed: empty list, fake-success role changes and deletes (even on nonexistent uids), no add feature, and no way to open the page as an admin. **Security risk is low** — the stubs cannot escalate anyone (they do nothing), and the API layer correctly requires auth + admin. **Functionality is effectively zero.** The danger to watch: if these stubs are later wired to real `setCustomUserClaims` without re-reviewing auth, the unreachable-but-present surface becomes live.

**What could NOT be tested live (stated plainly):** (1) the non-admin component gate and `requireAdmin` 403 — dev-auth only yields an admin identity; (2) a full promote→re-login role-refresh cycle — no second real user + no-op endpoint. Neither was substituted with code-reading presented as observation.

## TASK 6 — Fix proposals (NOT implemented — awaiting confirmation)
1. **Make the page reachable** — wire a Settings sub-tab or account-menu item that sets `appMode='settings'; activeTab='user_management'` (the `NewAppShell`/CommandPalette definitions exist but don't render / use the wrong `appMode='users'`). Smallest fix: add the missing nav entry, or correct the CommandPalette `mode:'users'`→`'settings'` mismatch.
2. **Implement the three endpoints** against the real user store (`tenant_users` table / Firebase custom claims), tenant-scoped, behind the existing `requireAdmin`: `GET` returns the tenant's users; `promote` calls `setCustomUserClaims` + persists; `delete` revokes. This is the change that makes promote→re-login actually grant roles.
3. **Stop faking success** — until implemented, the stubs should return an explicit "not yet available" state rather than `{success:true}`, so the UI doesn't show "تم التحديث بنجاح" for actions that did nothing.
4. **Minor UI bug noted [CODE]:** the role badge ([UserManagement.tsx:201](../../src/modules/UserManagement.tsx)) renders `accountant` as "مشاهد" (viewer) — only admin vs non-admin is distinguished; the "محاسب" (accountant) role is mislabeled in the badge (the dropdown is correct).

These are security/RBAC-adjacent but touch no financial logic. Awaiting your go-ahead before any implementation.

---

## Update — Fix #1 (Reachability) outcome, 2026-06-21

**Correction to the PRIMARY finding (honest):** the page is **NOT unreachable**. Live re-test proved it. The original "unreachable" conclusion was a **test-gap**: the User Management entry lives in the Settings **hover mega-menu** (`NewAppShell.tsx:202`, group `settings`), and my earlier automated DOM search/clicks never triggered the hover, so the item wasn't in the DOM when I looked. A real admin who **hovers** the «الإعدادات» top-nav sees «المستخدمون والصلاحيات» and clicking it routes correctly.

**[LIVE] re-verification:**
- Dispatched hover on «الإعدادات» → mega-menu opened, «المستخدمون والصلاحيات» present.
- Clicked it → `UserManagement` rendered: heading «إدارة المستخدمين والصلاحيات», breadcrumb الرئيسية/الإعدادات/إدارة المستخدمين, **empty body below the header** (= the empty-list stub). Screenshot captured.
- So `NewAppShell.tsx:202` wiring is **correct** (`handleNavClick('settings','user_management')`); there was **no wiring bug to fix** there.

**The one genuine mismatch (fixed):** `CommandPalette.tsx:55` used `mode:'users'` while the render gate ([App.tsx:2459](../../src/App.tsx)) requires `appMode==='settings'`. Changed `mode:'users'` → `mode:'settings'`. **Caveat [LIVE]:** this is **inert today** — the command palette has **no open-trigger** anywhere in `src` (`setIsCommandPaletteOpen(true)` does not exist; its only Ctrl+K handler *closes* it), so the palette never opens. The fix is correctness/future-proofing, **not** a reachability change. Build passes (exit 0).

**Real residual issues (not bugs in reachability, flagged for awareness):**
- **Discoverability:** the page is reachable only by *hovering* «الإعدادات» — *clicking* «الإعدادات» goes to the Settings page (Company/Alerts/Security/Regional sub-tabs), which has **no** user-management entry. Hover-only discovery is a UX weakness, not a break.
- **Dead command palette:** rendered but never opened (no trigger). Separate dead-code matter, out of this fix's scope.

**Item D (non-admin gate) — still NOT testable live:** dev-auth hardcodes `role:'admin'` on both client (`getDevAuthProfile`) and server (dev-token branch). No valid non-admin session is obtainable without code changes; the "غير مصرح" screen and `requireAdmin` 403 remain unverified by live observation.

**Net:** the page was already reachable (corrected); the only real wiring mismatch (CommandPalette mode) is fixed though inert; endpoints remain stubs (Fixes #2/#3/#4 deferred to a separate session as instructed).
