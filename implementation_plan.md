# AG-RAPID-S1-R2 — Isolated Lifecycle UX Hardening Before PostgreSQL/Supabase Data Model

UX/Governance hardening sprint to transition the isolated purchases lifecycle sandbox (V1) into a production-grade interface with clear, safe, Arabic-only terminology and in-app confirmation modals. This sprint is strictly isolated: real data remains untouched, and no PostgreSQL/Supabase database work is authorized.

## User Review Required

> [!IMPORTANT]
> **Arabic-Only In-App Modals**: All native browser confirmation dialogs (`confirm()`) and alert popups are replaced with customized, styled, in-app Arabic confirmation dialogs.
> - **Reset confirmation**: A warning detailing that reset only affects the sandbox test environment.
> - **Archival confirmation**: Replaces destructive delete options with a confirmation that files are archived and excluded from reports, but preserved for later recovery.
> - **Restoration confirmation**: Clarifies that files will be restored if no conflicts or duplicates exist.

> [!IMPORTANT]
> **Explicit Status and Report Impact**: File cards will now feature unambiguous, color-coded Arabic status labels clearly showing whether the file's records contribute to current financial reports.

---

## Open Questions

None. The UX guidelines and specific Arabic text strings are fully specified by the governance rules.

---

## Proposed Changes

We will group the proposed changes by component: Frontend Sandbox UI Components and Backend API Audit Logging.

### 1. Frontend Sandbox UI

We will update the sandbox components to replace native alerts/confirms, clarify actions and statuses, and clean up technical wording.

#### [MODIFY] [FileManagement.tsx](file:///d:/Projects/files-mentioned-by-the-user-fionira/src/modules/FileManagement.tsx)
* Import the `Archive` icon from `lucide-react` to replace the naked `Trash2` icon for archiving active files.
* Replace the button labeled with a trash icon with a styled button labeled "أرشفة الملف" (Archive File).
* Declare `fileToRestore` component state to manage the restoration confirmation modal.
* Update active file archival confirmation modal title to `تأكيد أرشفة الملف وإزالته` and body text to:
  `سيتم أرشفة الملف وإزالته من التقارير الحالية، مع الاحتفاظ بسجله لإمكانية المراجعة أو الاستعادة لاحقًا.`
* Implement the custom restoration confirmation modal with body text:
  `سيتم إعادة الملف المؤرشف إلى التقارير إذا لم ينتج عن ذلك تكرار أو تعارض مع ملف نشط آخر.`
* Group actions in staged uploads list to show:
  - `إضافة كمصدر جديد` (instead of `إضافة إلى التقارير` / `إضافة كملف جديد`)
  - `استخدامه كبديل` (instead of `استبدال الملف الحالي` / `استبدال الملف`)
  - `إلغاء الملف المرفوع`
* Add `عرض السجل` to the archived files list actions to ensure parity.
* Add a disabled button placeholder for `حذف نهائي محكوم` (Governed Purge) in the archived actions with a tooltip/title containing:
  `الحذف النهائي المحكوم سيُتاح لاحقًا وفق سياسة احتفاظ وصلاحيات خاصة، ولن يكون متاحًا للملفات النشطة أو الفترات المعتمدة.`
* Append an informational disclaimer box at the bottom of the archived files section.
* Standardize status labels on all cards:
  - Active files: `نشط — يؤثر على التقارير` (colored green).
  - Staged files: `غير صالح — لا يؤثر على التقارير` if classification is invalid, or `قيد القرار — لا يؤثر على التقارير (تصنيف)` otherwise.
  - Archived files: Check if another file has `originalId === file.id` to show `مستبدل — محفوظ في السجل ولا يؤثر على التقارير` (colored blue), or `مؤرشف — لا يؤثر على التقارير` (colored gray) otherwise.
* Clean up history drawer mapping to translate English log actions to clean user-facing Arabic lifecycle events.

#### [MODIFY] [App.tsx](file:///d:/Projects/files-mentioned-by-the-user-fionira/src/App.tsx)
* Replace native `alert` calls inside the sandbox reset callback with the in-app `showAlert` UI modal.
* Add a delay before reloading the page to allow the user to read the success message.

---

### 2. Backend API Audit Logging

We will modify backend handlers to add missing lifecycle events to audit trails and ensure Arabic-only details.

#### [MODIFY] [server.ts](file:///d:/Projects/files-mentioned-by-the-user-fionira/server.ts)
* Log staged uploads in `/api/erp/files/governance/staged-upload`: `action: 'upload_staged_file'`, `details: 'تم رفع الملف'`
* Log classifications in `/api/erp/files/governance/staged-upload`: `action: 'classify_staged_file'`, `details: 'تم تصنيف الملف'`
* Log cancel staging in `/api/erp/files/lifecycle/:stagedId/cancel`: `action: 'cancel_staged_file'`, `details: 'تم إلغاء الملف المرفوع'`
* Update the audit log details for:
  - `activate_new_source` to: `تم تفعيل الملف في التقارير`
  - `replace_active_source` to: `تم استبدال الملف`
  - `archive_active_source` to: `تم أرشفة الملف`
  - `restore_archived_source` to: `تم استعادة الملف للتقارير`
* Exclude all raw database IDs, storage paths, or English developer terminology from the log details fields.

---

## Verification Plan

We will run automated integration checks and verify sandbox isolation remains secure.

### Automated Tests
- Build and type-checking verification:
  ```powershell
  npm run lint
  ```
- End-to-end integration test runner:
  ```powershell
  npx tsx scratch/rapid_s1_test_runner.ts
  ```

### Manual Verification
- Deploy/start locally at `http://127.0.0.1:3100/rapid-s1`.
- Verify the reset confirmation modal opens and clears ONLY sandbox data.
- Verify active file cards display `أرشفة الملف` instead of a naked delete button, and open the Arabic warning modal.
- Verify archived cards display `استعادة الملف للتقارير` with the confirmation modal, and show `حذف نهائي محكوم` as disabled.
- Verify status labels match: `نشط — يؤثر على التقارير`, `قيد القرار — لا يؤثر على التقارير`, `غير صالح — لا يؤثر على التقارير`, `مستبدل — محفوظ في السجل ولا يؤثر على التقارير`, and `مؤرشف — لا يؤثر على التقارير`.
- Check `عرض السجل` drawer for clean, user-friendly Arabic logging.
