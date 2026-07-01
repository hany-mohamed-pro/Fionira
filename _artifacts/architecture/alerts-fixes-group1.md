# اقتراح — إصلاحات صفحة التنبيهات/الأخطاء، المجموعة الأولى

**الحالة:** معتمد ✓ (المستخدم — 2026-07-01) · **النطاق:** توثيق معماري.
**السياق:** ناتج عن التشخيص الكامل لصفحة التنبيهات (سطحان: `AlertsReport` الإداري
المُغذّى من حقل `Anomalies` الميت، و`ValidationReviewScreen` بعد الرفع). هذه المجموعة
تعالج بندين من ستة: (أ) الصفوف الجزئية الوهمية، (ب) تعطّل زر التصعيد.

---

## إصلاح أ — استبعاد الصفوف الجزئية (ingestion-engine.ts)

### المعيار الدقيق (مبني على البيانات الفعلية)
فحص الـ1138 سجلاً أثبت أن المميّز **ليس** فرق `null`/`0` (الصفوف الوهمية تحمل
`Total_Amount = 0` رقماً لا `null`)، بل **اجتماع غياب الهوية مع غياب أي مبلغ**:

| الحالة | مثال حقيقي | القرار |
|---|---|---|
| صف جزئي (يُستبعد) | `{ent:"غير محدد", inv:null, desc:"", date:null, tot:0, vat:0, net:0}` (صفوف 365، 378) | استبعاد — 4 سجلات |
| صفر مقصود بهوية (يبقى) | `{ent:"مستودع عفش للتخزين", inv:null, tot:0, net:0}` | إبقاء — 2 سجل |
| بلا هوية لكن بمبلغ حقيقي (يبقى + يُوسَم) | (لا يوجد حالياً) | إبقاء ثم `MISSING_VENDOR` |

### الحارس المقترح (الخيار الأشد المعتمد — اشتراط غياب التاريخ أيضاً)
```ts
// ingestion-engine.ts — بعد بناء finalRecords (السطر ~139)، مكان مركزي واحد لكل الأقسام
const nilOrZero = (v: any) => v === null || v === undefined || v === 0;

const isEmptyPartialRow = (r: any) => {
  const hasIdentity =
    (r.Entity_Name && r.Entity_Name !== 'غير محدد' && r.Entity_Name !== 'UNKNOWN_ENTITY') ||
    !!r.Invoice_Number ||
    (r.Item_Description && String(r.Item_Description).trim() !== '') ||
    !!r.Invoice_Date;                     // الخيار الأشد: وجود تاريخ = هوية زمنية
  const hasMoney = ![r.Total_Amount, r.Taxable_Amount, r.NonTaxable_Amount, r.VAT_Amount, r.Net_Amount]
    .every(nilOrZero);                    // مبلغ واحد ≠ 0/null يكفي للإبقاء
  return !hasIdentity && !hasMoney;       // لا هوية (اسم/فاتورة/وصف/تاريخ) ولا مال → صف فارغ فعلياً
};
```
- **الموضع:** `ingestion-engine.ts` عند مرحلة `finalRecords` (السطر ~139) — مكان مركزي
  واحد يشمل الأقسام الخمسة (كل المعالجات تُخرج نفس الحقول)، دون لمس المعالجات الفردية.
- **السلوك:** الصف المستبعَد يُنقل إلى `allSkipped` (لا يُحذف صامتاً) بسبب واضح
  (`'Structural: صف فارغ بلا هوية ولا مبالغ'`) — يظهر في عدّاد «المتخطّاة» لا كخطأ/سجل
  وهمي، ويبقى قابلاً للتتبّع.
- **لماذا آمن:** لا يمسّ أي صف له كيان/فاتورة/وصف/تاريخ أو أي مبلغ (بما فيه الصفر المقصود
  بهوية). صف بلا هوية لكن بمبلغ حقيقي يبقى ويُوسَم `MISSING_VENDOR`.
- **لا يمسّ `categorization-engine.ts` ولا `erp-engine.ts`** — حارس بنيوي بحت.

### بوابة القبول (إثبات حي)
- عدد المستبعَد من السجل الحالي = **4** المتوقعة.
- الصفر المقصود بهوية الباقي = **2** المتوقعة.
- إجمالي السجلات الصالحة = 1138 − 4 = **1134**.
- بوابة الميزانية تبقى متوازنة **0.00** بالهللة.

---

## إصلاح ب — توجيه التصعيد عبر الخادم (server.ts) — [خطوة لاحقة منفصلة]

### اكتشاف: مخزن حوكمة قائم وشغّال
`devMemoryDb.governanceRequests` مُحمَّل/محفوظ في `governance_requests.json` عبر
`persistGovernanceRequests()` (server.ts:457/439)، مع endpoint مثبَت النمط
`POST /api/erp/files/governance/:fileId/review-request` (server.ts:1563-1614). سنبني عليه.

### الـendpoint المقترح
```ts
app.post('/api/erp/governance/escalate-record', authenticate, wrap(async (req, res) => {
  const tenantId = req.userProfile?.tenantId || req.user.uid;
  const { recordId, sessionId, record, issues, severity, moduleType } = req.body;
  if (!recordId || !record) { res.status(400).json({ success:false, error:'INVALID_REQUEST' }); return; }
  const existing = devMemoryDb.governanceRequests.find(
    r => r.tenantId===tenantId && r.type==='RECORD_ESCALATION'
      && r.recordId===recordId && r.sessionId===sessionId && r.status==='PENDING_APPROVAL');
  if (existing) return { success:true, request: existing };            // idempotent
  const newRequest = {
    id: crypto.randomUUID(), type:'RECORD_ESCALATION', tenantId, recordId, sessionId,
    record, issues: issues||[], severity: severity||'HIGH', moduleType: moduleType||'expenses',
    status:'PENDING_APPROVAL', source:'cfo_console',
    requestedBy: req.userProfile?.uid || tenantId, timestamp: new Date().toISOString(),
  };
  devMemoryDb.governanceRequests.push(newRequest);
  persistGovernanceRequests();
  return { success:true, request: newRequest };
}));
```

### التخزين
يُعاد استخدام `governanceRequests` (مُحمَّل/محفوظ أصلاً) مع `type: 'RECORD_ESCALATION'` —
بلا plumbing جديد. (البديل: مجموعة `governanceQueue` مستقلة — غير ضروري.)

### تحديث حالة السجل بشكل موثوق (بعد النجاح لا قبله)
في `ValidationReviewScreen.tsx` تُستبدل كتابة Firestore المباشرة في الدوال الثلاث
(`handleSingleEscalate` :403، `handleFullEscalate` :443، `handleEscalate`) بـ`fetch` إلى
الـendpoint، مع الحصول على التوكن عبر `useAuth().user.getIdToken()` (نمط dev-auth العامل)،
و**تحديث الحالة إلى ESCALATED مشروطاً بنجاح الاستجابة وخارج كتلة الكتابة** — عكس الحالي
حيث التحديث داخل `try` بعد `addDoc` الفاشل صامتاً (:428-434).

### هل يمسّ المحرّكات؟
**لا.** التصعيد يخزّن طلب حوكمة ويُحدّث حالة UI فقط. لا `categorization-engine.ts`
(لا تصنيف) ولا `erp-engine.ts` (السجل المُصعَّد مُستبعَد من الاعتماد فلا يدخل مسار القيود).
التغيير محصور في `server.ts` (endpoint) + `ValidationReviewScreen.tsx` (fetch + توقيت).

---

## ملخّص الأثر
| البند | الملفات | يمسّ المحرّكات؟ |
|---|---|---|
| إصلاح أ | `ingestion-engine.ts` (حارس مركزي واحد) | لا |
| إصلاح ب | `server.ts` (endpoint) + `ValidationReviewScreen.tsx` | لا |

الترتيب: (أ) أولاً مع إثبات حي، ثم (ب) في خطوة منفصلة بعد الاعتماد.
