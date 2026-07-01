# اقتراح معماري — B-أ-2: المزامنة التزايدية للقيود عند الرفع

**الحالة:** معتمد ✓ (المستخدم — 2026-07-01) · **التنفيذ:** لم يبدأ بعد
**النطاق:** توثيق معماري فقط. لا يُعدَّل أي كود بموجب هذه الوثيقة.
**يكمّل:** [`je-sync-proposal.md`](je-sync-proposal.md) (B-أ الأصلي) · **يلي:** B-أ-1 (backfill، محلول commit `270ee10c`).

---

## الفكرة
بدل إعادة تشغيل `scripts/je_backfill.ts` يدوياً بعد كل رفع، تُولَّد قيود الملف تلقائياً
عند كل نقطة تُضاف فيها سجلات — بنفس منطق الـbackfill (تجميع بالـmodule، استبعاد اليتيم،
idempotency بـ`sourceFileId`).

## 1) الدالة المشتركة `syncJournalEntriesForFile` — التوقيع ونقاط الاستدعاء

### التوقيع المقترح
```ts
// server.ts — helper جديد (لا يلمس المحرّكات)
const VALID_MODS = ['expenses','revenues','payroll','banks','inventory'];

async function syncJournalEntriesForFile(
  records: any[],                    // السجلات المُضافة للتو
  fallbackModule: string,           // module احتياطي حين يفتقده السجل
  tenantId: string,
  extraRemoveFileIds: string[] = []  // لحالة replace: مفاتيح الملف المؤرشف
): Promise<void> {
  const { generateJournalEntries } = await import('./src/backend/core/erp-engine.ts');

  // (1) مفاتيح الإزالة = ملفات هذه الدفعة ∪ مفاتيح إضافية (للـreplace)
  const removeIds = new Set<string>([
    ...records.map(r => r.fileId).filter(Boolean),
    ...extraRemoveFileIds,
  ]);
  // (2) إزالة idempotent: احذف قيود تلك الملفات فقط (نمط الحذف-بالملف، server.ts:3292)
  devMemoryDb.journalEntries =
    devMemoryDb.journalEntries.filter(je => !removeIds.has(je.sourceFileId));

  // (3) إعادة توليد per-module (نفس منطق je_backfill.ts) مع استبعاد اليتيم
  const byMod = new Map<string, any[]>();
  for (const r of records) {
    const m = r.moduleType || fallbackModule;
    if (!VALID_MODS.includes(m)) continue;      // ← استبعاد اليتيم (السؤال 4)
    (byMod.get(m) ?? byMod.set(m, []).get(m)!).push(r);
  }
  for (const [mod, recs] of byMod) {
    const gen = generateJournalEntries(recs, mod as any);
    gen.forEach(je => { je.tenantId = tenantId; je.isActive = true; });
    devMemoryDb.journalEntries.push(...gen);
  }
  persistRegistry();
}
```
> ملاحظة تصميم: الدالة تُجمّع بالـmodule داخلياً (لا تعتمد على module واحد) — فتصلح
> للمواضع أحادية الملف (activate/replace/restore) والمجمّعة متعددة الـmodule (dev/sync) معاً.

### نقاط الاستدعاء (السطور الفعلية)

| # | السطر | المعالج | الاستدعاء المقترح (بعد `records.push`) | ملاحظة |
|---|---|---|---|---|
| 1 | **2139** | `activate` | `await syncJournalEntriesForFile(parsedRecords, staged.moduleType, tenantId)` | الهوك الأساسي — ملف واحد، `fileId = staged.fileHash` |
| 2 | **2353** | `replace` | `await syncJournalEntriesForFile(parsedRecords, staged.moduleType, tenantId, [targetFile.id, targetFile.fileHash])` | **يمرّر مفاتيح الملف المؤرشف** ليُزيل قيوده القديمة (الملف الجديد له hash مختلف) |
| 3 | **3259** | `restore` | `await syncJournalEntriesForFile(parsedRecords, targetFile.moduleType, tenantId)` | يعيد استخدام نفس `fileHash` → الإزالة-بالـfileId تكفي |
| 4 | **669** | `dev/sync` | `await syncJournalEntriesForFile(dedupedRecords, 'expenses', tenantId)` | dev-only، متعدد الـmodule؛ **يُلغي حاجة body.journalEntries** المُرسلة يدوياً. لا عميل حي يستدعيه → أولوية منخفضة/اختياري لكن يُضاف للاتساق |
| 5 | **3584** | `fixedRecord` | **لا يستخدم الدالة** ⚠️ | معالجة منفصلة أدناه |

**استثناء السطر 3584 (تصحيح سجل مفرد):** هنا يُعتمد سجل واحد كان مرفوضاً ويُضاف لملف قائم
فيه سجلات أخرى لها قيود. **الإزالة-بالملف ستمحو قيود بقية سجلات الملف** — خطأ. الصواب
idempotency **بالسجل** لا بالملف:
```ts
// بعد devMemoryDb.records.push(fixedRecord)  (3584)
devMemoryDb.journalEntries =
  devMemoryDb.journalEntries.filter(je => je.sourceRecordId !== fixedRecord.id);
const gen = generateJournalEntries([fixedRecord], rejectedRecord.moduleType);
gen.forEach(je => { je.tenantId = fixedRecord.tenantId; je.isActive = true; });
devMemoryDb.journalEntries.push(...gen);  // ثم persistRegistry()
```
أو تأجيله والاعتماد على المزامنة عند التفعيل التالي. التوصية: المعالجة-بالسجل أعلاه
(دقيقة ومحدودة الأثر).

**تنظيف عرضي:** activate/replace/restore تستدعي `persistRegistry()` أصلاً؛ بما أن الدالة
تحفظ، يُحذف الاستدعاء المزدوج (وظيفياً غير ضار، لكن الأنظف إزالته).

## 2) «نفس الملف يُرفع مرتين» — تأكيد الـidempotency
- **طبقة أولى (upstream):** مصنّف الـstaged-upload يكتشف الـ`fileHash` المطابق ويوجّهه
  كـOVERLAP/CORRECTED — فالرفع المطابق لا يصل عادةً إلى activate جديد ينتج سجلات مكرّرة.
- **طبقة ثانية (الدالة — الحاسمة):** الخطوة (2) `filter(je => !removeIds.has(je.sourceFileId))`
  **تحذف كل قيود ذلك الملف قبل التوليد**. فأي عدد من عمليات إعادة التفعيل لنفس الملف
  يتقارب إلى **مجموعة قيود واحدة بالضبط** لكل ملف — لا تكرار، بحكم البناء.
- **أمان إضافي مؤكَّد من الكود:** `generateJournalEntries` يولّد معرّفات حتمية
  `je_${record.id}` (`erp-engine.ts:44`) — نفس السجل ⇒ نفس معرّف القيد. لكن الضمان الفعلي
  هو فلتر الـ`sourceFileId`.

**الخلاصة:** نعم، الـidempotency بـ`sourceFileId` يمنع التكرار فعلياً (delete-then-regenerate)،
وهو نفس النمط المُطبَّق في حذف الملف (`server.ts:3292`) وفي الـbackfill الذي أثبت 0.00.

## 3) هل تحتاج تعديل `erp-engine.ts` أو `categorization-engine.ts`؟
**لا — مؤكَّد من الكود الفعلي:**
- `generateJournalEntries` (`erp-engine.ts:40-149`) **دالة نقية**: تقرأ `record.Category`
  (سطر 57) و`Net_Amount`/`VAT_Amount` وتُصدر Dr/Cr — **لا تُصنّف**. الفئة مُسندة مسبقاً
  على السجل وقت الإدخال. الـbackfill (B-أ-1) استخدمها **دون أي تعديل** واجتاز البوابتين ⇒
  لا حاجة لأي تغيير فيها.
- `categorization-engine.ts` **لا تُمَسّ إطلاقاً** — الدالة لا تستدعيها؛ التصنيف يحدث قبل
  هذه الـendpoints. تبقى مجمّدة (@DO_NOT_MODIFY).
- **الكود الجديد كله في `server.ts` فقط:** الدالة + أسطر الاستدعاء. صفر تعديل في المحرّكات.

## 4) أثر السجل اليتيم (بلا module/tenant/fileId)
**يُعالَج بنفس الاستبعاد التلقائي كالـbackfill بالضبط:**
- الحارس `if (!VALID_MODS.includes(m)) continue` في الخطوة (3) يُسقط أي سجل بلا module
  صالح ⇒ **لا يُولَّد له قيد**.
- سجل بلا `fileId` لا يُسهم بـ`sourceFileId` (اليتيم كان كذلك) ⇒ مُستبعَد تلقائياً من
  الإزالة والتوليد.
- وبما أن `computePnLCore` يقرأ السجلات بالـmodule أيضاً، يبقى الطرفان (القيود ↔ قائمة
  الدخل) **متطابقين** — نفس ضمان الـbackfill (توازن 0.00، Δ54.78 فقط).

## المخاطر والحدود
- **مسار Postgres** (`isConnected()`): لا جدول قيود بعد — القيود dev فقط؛ فروع
  `if (isConnected())` في المعالجات تبقى دون هوك حتى يُبنى جدول القيود لاحقاً.
- **الأداء:** التوليد per-file صغير (سجلات ملف واحد لكل رفع) — لا قلق.
- **`je_backfill.ts` بعدها:** يصبح أداة **هجرة/إصلاح لمرة واحدة** فقط (لا يُحتاج بعد كل
  رفع)، ويبقى شبكة أمان لإعادة المزامنة الكاملة عند الحاجة.

## التوصية (تنفيذ مرحلي عند الموافقة)
1. إضافة `syncJournalEntriesForFile` + الهوك في **activate (2139)** أولاً — الأهم والأعلى تكراراً.
2. ثم **replace (2353)** بمفاتيح الإزالة الإضافية، و**restore (3259)**.
3. المعالجة-بالسجل لـ**3584**، والهوك الاختياري لـ**dev/sync (669)**.
4. إثبات حي حقيقي بعد كل مجموعة: رفع/استبدال ملف فعلي → بوابتا القبول (توازن 0.00 +
   Δ≤54.78) على القيود المُولَّدة تلقائياً، دون تشغيل الـbackfill يدوياً.
