# AG-RAPID-S1-R2 — Archive, Restore, and Purge UX Contract

This contract defines standard lifecycle semantics, in-app warning text, and future-governed purge policies.

## 1. Archival Semantics
- **Wording**: `أرشفة / إزالة من التقارير` (Archive / Remove from Reports).
- **Icon**: `Archive` (lucide-react).
- **Target Modal Text**:
  `سيتم أرشفة الملف وإزالته من التقارير الحالية، مع الاحتفاظ بسجله لإمكانية المراجعة أو الاستعادة لاحقًا.`
- **Financial Status Output**: The file status transitions to `archived`, which excludes its records from financial reports instantly.

## 2. Restoration Semantics
- **Wording**: `استعادة الملف للتقارير` (Restore File to Reports).
- **Icon**: `RefreshCw`.
- **Target Modal Text**:
  `سيتم إعادة الملف المؤرشف إلى التقارير إذا لم ينتج عن ذلك تكرار أو تعارض مع ملف نشط آخر.`
- **Conflict Prevention**: If a duplicate active version already exists in active reports, the backend blocks reactivation.

## 3. Governed Purge Policy Placeholder
- **Wording**: `حذف نهائي محكوم` (Governed Final Purge).
- **Status**: Disabled (read-only/policy notification only).
- **Tooltip/Title & Notice**:
  `الحذف النهائي غير متاح في هذه المرحلة. سيتم تفعيله لاحقًا بسياسة حوكمة تتضمن الصلاحيات، سبب الحذف، الموافقات، وفترة الاحتفاظ، مع الاحتفاظ بسجل رقابي مختصر.`
- **Backend Behavior**: Unimplemented. Purging is strictly forbidden in this phase.
