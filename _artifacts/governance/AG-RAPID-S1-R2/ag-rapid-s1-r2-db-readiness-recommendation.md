# AG-RAPID-S1-R2 — Database Readiness Recommendation

Following the successful hardening of isolated V1 UI/UX semantics, we present the recommended data modeling mapping for the future database sprint (AG-DB-S1).

## 1. Database Table Recommendations (PostgreSQL/Supabase)

### Table: `source_files`
- `id` (UUID, Primary Key) -> maps to V1 `SourceFileId` / `id`
- `file_name` (Text) -> V1 `fileName`
- `original_file_name` (Text) -> V1 `originalFileName`
- `display_name` (Text) -> V1 `displayName`
- `file_hash` (Text, Unique) -> V1 `fileHash`
- `module_type` (Text) -> `expenses` | `revenues`
- `upload_date` (Timestamp) -> V1 `uploadDate`
- `uploaded_by` (UUID) -> V1 `uploadedBy`
- `record_count` (Integer) -> V1 `recordCount`
- `status` (Text) -> `active` | `staged` | `archived` | `replaced`
- `original_id` (UUID, Nullable, Foreign Key references `source_files.id`) -> V1 `originalId` (lineage indicator)
- `deleted_at` (Timestamp, Nullable) -> V1 `deletedAt`
- `storage_path` (Text) -> V1 `storagePath`

### Table: `source_records`
- `id` (UUID, Primary Key)
- `source_file_id` (UUID, Foreign Key references `source_files.id`)
- `invoice_number` (Text)
- `entity_name` (Text)
- `invoice_date` (Date)
- `taxable_amount` (Numeric)
- `vat_amount` (Numeric)
- `total_amount` (Numeric)
- `raw_data` (JSONB) -> for flexibility and integrity verification

### Table: `file_lifecycle_audit_logs`
- `id` (UUID, Primary Key)
- `action` (Text) -> `upload_staged_file` | `classify_staged_file` | `activate_new_source` | `replace_active_source` | `archive_active_source` | `restore_archived_source` | `cancel_staged_file`
- `timestamp` (Timestamp)
- `performed_by` (UUID)
- `details` (Text, Arabic)
- `before_state` (JSONB, Nullable)
- `after_state` (JSONB, Nullable)

## 2. Transition Plan
- The backend API proxy layer will be replaced with direct database query repositories (e.g. using Drizzle or Prisma, or Supabase client).
- The validation logic (`pre-validation-engine`) will query `source_files` and `source_records` for record business keys overlap checks.
- Purge job scheduler: A background cron worker can be safely implemented to purge `source_files` (and cascade deletes to `source_records`) where `status = 'archived'` and `deleted_at < NOW() - INTERVAL '30 days'` under governed admin permissions.
