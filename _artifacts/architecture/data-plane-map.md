# Fionira — Data-Plane Map

> **Purpose:** Evidence-based input document for the Architecture Bundle session.
> Produced as a **read-only audit** — no source files were modified.
> **Generated:** 2026-06-15 · **Base commit:** `464ccdc` (Security Layer complete)
>
> Every claim below cites a file and line. Nothing here is assumed.

---

## 1. Current split-plane reality (evidence-based)

Fionira persists data across **two independent planes that do not share a source of truth**. The frontend writes financial/master data **directly to Firestore** using the client SDK, while the Express backend persists an **overlapping** set of the same domains to **PostgreSQL (with a JSON fallback)**. The only bridge between them is the dev-only `/api/erp/dev/sync` endpoint.

### Plane A — Backend: PostgreSQL → JSON fallback (NO Firestore)

- `server.ts` imports `getFirestore` ([server.ts:25](server.ts)) but **never calls it** — there are **zero `.collection()` / `getFirestore()` invocations** in the backend. The import is vestigial.
- Backend data access is **PostgreSQL via `await query(...)` / `transaction(...)`**, with **272** call-sites guarded by `isConnected()` that fall back to the in-memory JSON store `devMemoryDb`.
- Fallback is defined in [src/backend/utils/db.ts:38-44](src/backend/utils/db.ts): on connection failure it logs *"Falling back to volatile local JSON database"* and sets `dbConnected = false`. `query()` then throws ([db.ts:48-49](src/backend/utils/db.ts)), and callers branch to `devMemoryDb`.

**Postgres tables** (from `initializeSchema`, [db.ts:72-148](src/backend/utils/db.ts)):
| Table | Purpose |
|---|---|
| `tenant_users` | users/roles |
| `uploaded_files` | uploaded source files |
| `records` | parsed financial records |
| `rejected_records` | governance/validation rejects |
| `audit_logs` | hash-chained audit trail |

**JSON fallback store** (`devMemoryDb`, persisted to disk — from boot log):
- `uploads.json` → uploadedFiles (51 files loaded)
- `erp_registry.json` → journalEntries (1179) + records (1138)
- `governance_requests.json` → governance queue (1)

### Plane B — Frontend: Firestore (client SDK, direct writes)

**12 frontend files** call Firestore write/subscribe APIs (`setDoc`/`addDoc`/`updateDoc`/`deleteDoc`/`writeBatch`/`onSnapshot`) directly:

| File | Notes |
|---|---|
| `src/lib/settings-service.ts` | **dual-write** (see §3) |
| `src/lib/invoice-history-service.ts` | savedInvoices |
| `src/lib/smart-invoice-service.ts` | smartInvoiceCatalog |
| `src/modules/QuotationManager.tsx` | quotations |
| `src/modules/SmartInvoice.tsx` | invoices/catalog |
| `src/modules/StatementOfAccount.tsx` | customers/statements |
| `src/modules/GroupedPurchases.tsx` | purchases |
| `src/modules/RawDataInspector.tsx` | records/raw |
| `src/modules/UserManagement.tsx` | users |
| `src/modules/ValidationReviewScreen.tsx` | validation/records |
| `src/App.tsx` | app-level reads/writes |
| `src/contexts/AuthProvider.tsx` | **import-only — no actual write** (see note) |

> **AuthProvider note:** It imports `doc, getDoc, setDoc` and `db` ([AuthProvider.tsx:2-4](src/contexts/AuthProvider.tsx)) but the grep count of body usages is **2 = the two import lines only**. The real auth flow reads role/tenant **from ID-token custom claims** and, if missing, calls **`POST /api/erp/users/init`** via `fetch` ([AuthProvider.tsx:93](src/contexts/AuthProvider.tsx)). The Firestore imports here are **vestigial** and should be removed during architecture cleanup.

**Firestore collections** (declared in [firestore.rules](firestore.rules)): `users`, `uploadedFiles` (+ `records`/`skippedRows`/`chunks`/`skippedChunks` subcollections), `smartInvoiceCatalog`, `quotations`, `savedInvoices`, `journalEntries`, `customers`, `vendors`, `items`, `auditLogs`, `rejected_records_log`, `rejected_records`, `governance_queue`, `appSettings`, `tenants`.

---

## 2. Per-question findings

### A) `src/contexts/AuthProvider.tsx`
- **Writes to Firestore directly?** No (imports only; vestigial).
- **Firestore vs API split:** Identity/role/tenant come from **Firebase ID-token custom claims**; bootstrap happens via **Express API `/api/erp/users/init`** ([AuthProvider.tsx:88-127](src/contexts/AuthProvider.tsx)). A `dev-auth` short-circuit path supplies a synthetic profile for local UI ([AuthProvider.tsx:52-65](src/contexts/AuthProvider.tsx)).

### B) `src/lib/settings-service.ts`
- **Both.** In dev (`IS_DEV`, [settings-service.ts:47](src/lib/settings-service.ts)) it `fetch`es **`/api/erp/settings`** for read ([:54](src/lib/settings-service.ts)) and write ([:88](src/lib/settings-service.ts)). **Regardless of dev/prod** it then reads/writes Firestore **`appSettings/{tenantId}`** directly via `getDoc`/`setDoc`/`onSnapshot` ([:67, :103, :132](src/lib/settings-service.ts)). → **dual-write conflict zone.**

### C) `src/backend/utils/db.ts`
- **Exact fallback chain:** **PostgreSQL (primary)** → on connect failure → **volatile in-memory JSON `devMemoryDb`** (persisted to `uploads.json` / `erp_registry.json` / `governance_requests.json`). There is **no third tier**; Firestore is **not** part of the backend chain.
- **Tables:** `tenant_users`, `uploaded_files`, `records`, `rejected_records`, `audit_logs` ([db.ts:76-147](src/backend/utils/db.ts)).
- **Does `runStartupMigration` move ALL data?** **No — partial, one-directional, idempotent-on-empty.** It migrates **only 4 domains** (uploaded_files, records, rejected_records, audit_logs) from JSON → Postgres, and **only when the target table is empty** (`count === 0`, [db.ts:158, 196, 232, 258](src/backend/utils/db.ts)). It does **NOT** migrate: **journalEntries** (no Postgres table exists for them), customers, vendors, items, quotations, savedInvoices, smartInvoiceCatalog, or appSettings.

### D) `server.ts`
- **Routes reading/writing Firestore directly:** **None.** Backend never touches Firestore.
- **Routes reading/writing Postgres/JSON directly:** Effectively **all** ERP data routes — **272** `query()`/`devMemoryDb`/`isConnected()` call-sites across the file (uploads, records, governance, audit, settings, etc.).
- **Routes writing to BOTH planes:** None write Firestore. The closest cross-plane route is **`POST /api/erp/dev/sync`** ([server.ts:565](server.ts)), which **ingests frontend state** (journalEntries, uploadedFiles, records, skippedRows, rejectedRecords, customers, vendors, items, auditLogs, settings) into `devMemoryDb`. This is the de-facto **Firestore→backend bridge** in dev.

### E) `src/modules/FileManagement.tsx`
- **Express API only.** **14 `fetch()` calls, zero Firestore** imports/usages. This module is already a clean API client and needs **no wrapper work**.

---

## SPLIT-PLANE MAP

```
FIRESTORE PLANE  (frontend client SDK — direct writes)
  appSettings ........... settings-service.ts        (ALSO API in dev)
  savedInvoices ......... invoice-history-service.ts
  smartInvoiceCatalog ... smart-invoice-service.ts, SmartInvoice.tsx
  quotations ............ QuotationManager.tsx
  customers ............. StatementOfAccount.tsx
  journalEntries ........ (frontend writes; NO Postgres table)
  users ................. UserManagement.tsx
  records (raw) ......... RawDataInspector.tsx, ValidationReviewScreen.tsx
  vendors / items ....... (rules present; written from modules/App)

POSTGRES / JSON PLANE  (Express API → query()/devMemoryDb)
  uploaded_files ........ FileManagement.tsx → API (pure client)
  records ............... ingestion/validation routes
  rejected_records ...... governance routes
  audit_logs ............ audit routes (hash-chained)
  tenant_users .......... users/init, promote routes
  settings (dev) ........ /api/erp/settings → devMemoryDb.settings

OVERLAP / CONFLICT ZONES  (same domain, two stores, no reconciliation)
  1. appSettings ........ Firestore (always) + API/JSON (dev)        [settings-service.ts]
  2. uploadedFiles ...... Firestore `uploadedFiles` + PG `uploaded_files`
  3. records ............ Firestore `uploadedFiles/records` + PG `records`
  4. rejected_records ... Firestore `rejected_records(_log)` + PG `rejected_records`
  5. auditLogs .......... Firestore `auditLogs` + PG `audit_logs`
  6. journalEntries ..... Firestore `journalEntries` + JSON only (NO PG table)
  BRIDGE: POST /api/erp/dev/sync pushes frontend→devMemoryDb (dev only)
```

---

## 3. What migrating to a single source of truth (Postgres) requires

1. **Create the missing Postgres tables** for domains that live only in Firestore/JSON today: `journal_entries`, `customers`, `vendors`, `items`, `quotations`, `saved_invoices`, `smart_invoice_catalog`, `app_settings`. (Currently Postgres has only 5 tables; Firestore declares ~19 collections.)
2. **Build Express API endpoints** (read/write, tenant-scoped, claims-authenticated) for each Firestore-only domain — mirroring the pattern FileManagement already uses.
3. **Replace direct Firestore SDK calls** in the 11 writing frontend files with `fetch` wrappers to those endpoints.
4. **Replace `onSnapshot` real-time subscriptions** (settings-service, and any module using live updates) with a polling or SSE/websocket equivalent, since Postgres has no client push.
5. **One-time data backfill** Firestore → Postgres for live tenant data (the existing `runStartupMigration` only covers 4 domains and only JSON→PG).
6. **Decommission** the dev-only `/api/erp/dev/sync` bridge and the vestigial Firestore imports (`server.ts:25`, `AuthProvider.tsx`).

---

## 4. Risk assessment — what breaks if Firestore is turned off today

| Area | Impact if Firestore off | Severity |
|---|---|---|
| **App settings** | `settings-service` Firestore read/write/subscribe fail; dev still works via API fallback, **prod loses settings entirely** | 🔴 High |
| **Quotations** | `QuotationManager` cannot read/write — feature dead in prod | 🔴 High |
| **Saved invoices** | `invoice-history-service` dead | 🔴 High |
| **Smart invoice catalog** | `smart-invoice-service` / `SmartInvoice` dead | 🔴 High |
| **Journal entries** | Frontend JE views dead; **no Postgres table to fall back to** | 🔴 High |
| **Customers / statements** | `StatementOfAccount` dead | 🟠 Medium |
| **User management** | `UserManagement` Firestore views dead (but auth still works via claims + API init) | 🟠 Medium |
| **File management / uploads** | **Unaffected** — already 100% API/Postgres | 🟢 None |
| **Ingestion / validation / audit / governance** | **Unaffected** — backend is Postgres/JSON | 🟢 None |
| **Login / RBAC** | **Unaffected** — claims-based, API init (AuthProvider doesn't truly use Firestore) | 🟢 None |

**Bottom line:** Turning Firestore off today **breaks all customer-facing financial *master-data* features** (settings, quotations, invoices, catalog, journal entries, customers) while leaving the **ingestion/audit/file pipeline intact**. The backend is already migration-ready; the frontend is not.

---

## 5. Estimated scope per area

| Work area | Scope | Rationale |
|---|---|---|
| Postgres schema additions (8 tables) | **Medium** | Mechanical, but `journal_entries` needs careful column design (double-entry) |
| New API endpoints (per domain) | **Large** | ~8 domains × CRUD + tenant scoping + claims auth |
| Frontend wrapper migration (11 files) | **Large** | Each module's Firestore calls + `onSnapshot` → fetch/polling |
| `settings-service` de-dual-write | **Small** | Single file; remove Firestore branch, keep API |
| Real-time subscription replacement | **Medium** | Pattern decision (poll vs SSE) then apply where `onSnapshot` is used |
| Firestore→Postgres data backfill | **Medium** | One-time, per-tenant, must preserve `journalEntries` (no PG table yet) |
| Remove vestigial Firestore imports | **Small** | `server.ts:25`, `AuthProvider.tsx` |
| Decommission `/api/erp/dev/sync` | **Small** | Dev-only route removal once frontend writes via API |

---

## Appendix — Evidence index
- Backend has no Firestore: grep `getFirestore(`/`.collection(` in `server.ts` → only the import at line 25; all `.set(` hits are JS `Map`/`Reflect`.
- Backend Postgres/JSON: 272 hits of `await query(`/`transaction(`/`isConnected()`/`devMemoryDb.`/`persist*` in `server.ts`.
- FileManagement pure-API: 14 `fetch(`, 0 Firestore in `src/modules/FileManagement.tsx`.
- Firestore-writing modules: 12 files match `setDoc|addDoc|updateDoc|deleteDoc|writeBatch|onSnapshot` under `src/` (one — AuthProvider — is import-only).
- Postgres schema & migration: `src/backend/utils/db.ts:72-292`.
- Dual-write: `src/lib/settings-service.ts:47-115`.
