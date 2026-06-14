/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const WB = "(?:^|[\\s/\\-,()])";
const WE = "(?=[\\s/\\-,()]|$)";

const REGEX_CAR = /(?:^|\s)(سيارة|سياره|سيارات|مركبة|car|vehicle|فحمات|مساعدات|زيت سيارة|زيت سياره|car oil|car oi l|فحص دوري|فلتر زيت|سيارة مبرده)(?=\s|$)/;
const REGEX_DELIVERY = /(?:^|\s)(توصيل طلبية|توصيل بضاعة|توصيل للعميل)(?=\s|$)/;
const REGEX_MAINTENANCE = /(?:^|\s)(صيانة|اصلاح|إصلاح|قطع غيار|كومبرسير|كمبروسر|كمبروسير|مكيف|ثلاجة|رداد|بطارية|سباك|خلاط|maintenance|repair|spare part)(?=\s|$)/;
const REGEX_RAW_MATERIALS = new RegExp(`${WB}(ليمون|دجاج|لحم|بيض|تمر|فواكه|خضار|قرع|ماء ورد|زبادي|بيكربونات|sprinkles|suger|sugar|color|food|ingredient|tasting|appell|oil|زيت طبخ|ورد مجفف|ورد|flower)${WE}`);
const REGEX_CLEANING = new RegExp(`${WB}(نظافة|تنظيف|صابون|معقم|منظفات|أكياس نفاية|ممسحة|مكنسة|كلوركس|ديتول|ضيافة|استقبال|اسفنجة|إسفنجة|فيري|ادوات تنظيف|أدوات تنظيف)${WE}`);
const REGEX_OPERATING = new RegExp(`${WB}(قفازات|gloves|maxi roul|ماكسي رول|cilling filem|cling film|sd17|بايركس|صحون بلاستيك صغيرة|baking paper|قالب كيك|فلين ابيض|ملاعق بلاستيك)${WE}`);
const REGEX_PACKAGING = new RegExp(`${WB}(تغليف|علب|أكياس|كيس|أكواب|كوب|كاسات|قصدير|مصاص|رول|قواعد|شريط|سليف|ستكر|استيكر|استيكرات|ليبل|ملصق|ريبون|رينون|بوكس|بوكسات|بنتو|بورد|تاريخ|اكرليك|أكرليك|طباعة|ملاعق بلاستيك|اعواد اسنان|كوب صوصات|packaging|box|carton|كرتون للشحن 10)${WE}`);
const REGEX_STATIONERY = new RegExp(`${WB}(ورق تصوير|ورق طباعة|اتفاقية|عقد|حبر|أحبار|اقلام|أقلام|ملفات|اختام|بنر|لوحات|كروت|ختم شوكولاته)${WE}`);
const REGEX_STATIONERY_EXCLUDE = new RegExp(`${WB}(انتهاء التواريخ|تلوين)${WE}`);
const REGEX_PROFESSIONAL = new RegExp(`${WB}(مراجعة وتعديل بنود عقد|أتعاب التفاوض|انهاء عقد|اتعاب|أتعاب|استشارات|محاماة|محاسب|تدقيق|تخليص|معقب)${WE}`);
const REGEX_SUBSCRIPTIONS = new RegExp(`${WB}(اشتراك|برنامج|تطبيق|نظام|استضافة|دومين|سيرفر|كلاود|فودكس|cloud|software|app|subscription|hosting|domain|license|renewal|foodics)${WE}`);
const REGEX_DECORATIONS = new RegExp(`${WB}(ديكور|زينة|شجره|شجرة|بطاريات|فانوس|فانوس رمضان|شمع حفلات)${WE}`);
const REGEX_DECORATIONS_EXCLUDE = new RegExp(`${WB}(ماء ورد|ورد مجفف|ورد|flower)${WE}`);
const REGEX_IT_EQUIPMENT = /(?:^|\s)(laptop|computer|لابتوب|كمبيوتر|ماك بوك)(?=\s|$)/;
const REGEX_FUEL = /(?:^|\s)(بنزين|وقود|محروقات|ديزل|petrol|fuel|gasoline|diesel)(?=\s|$)/;
const REGEX_DONATIONS = /(?:^|\s)(صدقة|صدقه|تبرع|جمعية|أوقاف|أيتام|إغاثة|إحسان|donation|charity)(?=\s|$)/;
const REGEX_TRANSPORT_RENTAL = /(?:^|\s)(اجرة|أجرة|ايجار|إيجار|تأجير|rent|hire)(?=\s|$)/;
const REGEX_TRANSPORT_VEHICLE = /(?:^|\s)(دينا|سيارة|شاحنة|مركبة|car|truck|van)(?=\s|$)/;
const REGEX_TRANSPORT_EQUIPMENT = /(?:^|\s)(ثلاجة|معدات|أجهزة|مكيف|كمبروسر|كمبروسير)(?=\s|$)/;
const REGEX_LOANS = /(?:^|\s)(loan|interest|financing|murabaha|قرض|فائدة|فوائد|تمويل|مرابحة)(?=\s|$)/;
const REGEX_SHIPPING = /(?:^|\s)(شحن|توصيل|نقل|freight|shipping)(?=\s|$)/;
const REGEX_SHIPPING_COGS = /(?:^|\s)(مواد|خام|بضاعة|مورد|تغليف|materials|goods|supplier)(?=\s|$)/;
const REGEX_SHIPPING_MAINTENANCE = /(?:^|\s)(صيانة|إصلاح|تصليح|كمبروسر|كمبروسير|مكيف|ثلاجة|معدات|أجهزة|نقل الكوبرسير)(?=\s|$)/;
const REGEX_PERSONNEL = /(?:^|\s)(نهاية خدمة|تذكرة طيران|تجديد إقامة|تأشيرة|تاشيرة|خروج وعودة|راتب|بدل|مكافأة|تأمينات اجتماعية|تأمينات|gosi)(?=\s|$)/;
const REGEX_MARKETING = /(?:^|\s)(عمولة مبيعات|عمولة|حملات إعلانية|حملة ترويجية|دعاية|إعلان|تسويق|promotion|campaign|marketing|advertising)(?=\s|$)/;
const REGEX_MISC_COGS = /(قبعات تخرج|العاب أطفال|مستلزمات متنوعة لليوم الوطنى)/;
const REGEX_FALLBACK_COGS = /(مشتريات|فاتورة|سند|قيد|مبلغ|بضاعة|مواد|اغراض|أغراض|طلب|طلبية|ارسال|إرسال)/;
const REGEX_FALLBACK_PACKAGING = /(تغليف|علب|كرتون|بلاستيك|ورق|أكياس|كيس)/;
const REGEX_FALLBACK_CLEANING = /(منظفات|صابون|نظافة|قفازات|مستهلكات)/;
const REGEX_FALLBACK_SERVICES = /(خدمات|اتعاب|رسوم|اشتراك|تجديد|صيانة|إصلاح)/;
const REGEX_FALLBACK_MAINTENANCE = /(صيانة|إصلاح|تصليح|قطع غيار)/;
const REGEX_FALLBACK_GOV = /(رسوم|حكومي|بلدية|زكاة|ضريبة)/;

export const getExpenseCategory = (name: string, desc: string, amount: number = 0): string => {
  if (!name && !desc) return 'مصروفات عمومية وإدارية - أخرى';
  
  const normalizeArabic = (text: string) => {
    return text
      .replace(/ـ/g, '') // Remove tatweel
      .replace(/[أإآ]/g, 'ا') // Unify alef
      .replace(/ة/g, 'ه') // Unify taa marbouta/haa
      .replace(/ى/g, 'ي') // Unify alef maksoura/yaa
      .replace(/\s+/g, ' '); // Remove extra spaces
  };

  const nameText = normalizeArabic(String(name || '').toLowerCase().trim());
  const descText = normalizeArabic(String(desc || '').toLowerCase().trim());
  const allText = `${nameText} ${descText}`;
  
  let scores: Record<string, number> = {};
  
  const addScore = (cat: string, points: number) => { 
    scores[cat] = (scores[cat] || 0) + points; 
  };

  let detectedRule = 'None';
  let finalCategory = 'مصروفات عمومية وإدارية - أخرى';

  // --- STAGE 0: RULE OVERRIDE LAYER (Highest Priority) ---
  const overrideRules = [
    { regex: /(صيانة|إصلاح|تصليح|كومبرسير|كمبروسر)/, cat: 'مصروفات عمومية وإدارية - صيانة وإصلاح' },
    { regex: /(شاحن|كيبل|كيبيل|سلك|محول طاقة|أدوات طعام|مستلزمات تشغيل)/, cat: 'تكلفة المبيعات - مستهلكات تشغيلية' },
    { regex: /(?:^|\s)(توزيعات|هدايا|هديّة|هديه)(?=\s|$)/, cat: 'مصروفات بيعية وتسويقية - دعاية وإعلان' },
];

  for (const rule of overrideRules) {
    if (rule.regex.test(descText)) {
      finalCategory = rule.cat;
      detectedRule = 'Rule Override Layer (Priority 0)';
      if (process.env.NODE_ENV !== 'production') {
        console.log('=== 🔴 PHASE 5: CATEGORIZATION INPUT TRACE ===');
        console.log(JSON.stringify({
          description: desc || '',
          entity: name || '',
          normalized_input: allText,
          matched_rule: detectedRule,
          final_category: finalCategory
        }, null, 2));
      }
      if (!(globalThis as any)._debugTableRows) { (globalThis as any)._debugTableRows = []; }
      return finalCategory;
    }
  }

  // --- STAGE 1: ENTITY / VENDOR BASED CLASSIFICATION (Base Hint - Score 100-200) ---
  // Vendor gives a very weak baseline, because Description is King.
  const vendors = [
    { regex: /(?:^|\s)(stc|mobily|zain|salam|lebara|virgin|اس تي سي|موبايلي|زين|سلام|ليبارا|فيرجن|اتصالات)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - اتصالات وإنترنت', score: 500 },
    // OPEX - Utilities
    { regex: /(?:^|\s)(sec|شركة الكهرباء|الكهرباء السعودية|nwc|شركة المياه|المياه الوطنية|غاز|\bgas\b|فاتورة كهرباء|فاتورة مياه)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - منافع (كهرباء ومياه)', score: 500 },
    { regex: /(?:^|\s)(جوازات|مقيم|قوى|مدد|زكاة|ضريبة|بلدية|غرفة تجارية|وزارة التجارة|سجل تجاري|qiwa|muqeem|zakat)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رسوم حكومية', score: 500 },
    { regex: /(?:^|\s)(تأمينات|gosi|التأمينات الاجتماعية|المؤسسة العامة للتأمينات الاجتماعية)/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تأمينات اجتماعية', score: 500 },
    { regex: /(?:^|\s)(جاهز|هنقرستيشن|مرسول|تويو|ذا شيفز|نون فود|jahez|hungerstation|mrsool|toyou|the chefz|noon food)(?=\s|$)/, cat: 'مصروفات بيعية وتسويقية - عمولات تطبيقات التوصيل', score: 500 },
    { regex: /(?:^|\s)(سمسا|ارامكس|دي اتش ال|سبل|البريد السعودي|smsa|aramex|dhl|spl|saudi post|naqel|ناقل|ايجيك|egic)(?=\s|$)/, cat: 'مصروفات بيعية وتسويقية - نقل وتوصيل للعملاء', score: 500 },
    { regex: /(?:^|\s)(بوبا|التعاونية|تكافل|ميدغلف|ملاذ|bupa|tawuniya|takaful|medgulf|malath|تأمين|insurance)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تأمين طبي', score: 500 },
    { regex: /(?:^|\s)(مايكروسوفت|جوجل|امازون|ابل|سلة|زد|microsoft|google|aws|apple|salla|zid|canva|zoom|odoo|\berp\b|اشتراك|برنامج|software|subscription|منصة)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - اشتراكات وبرمجيات', score: 400 },
    { regex: /(?:^|\s)(راجحي|أهلي|انماء|رياض|بلاد|جزيرة|فرنسي|ساب|استثمار|مدى|فيزا|ماستركارد|بيفورت|تاب|ميسر|rajhi|snb|alinma|riyad|albilad|mada|visa|mastercard|payfort|tap|moyasar|bank|بنك|مصرف)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رسوم بنكية ونقاط بيع', score: 400 },
    { regex: /(?:^|\s)(مكتبة|جرير|عبيكان|قرطاسية|مطبوعات|jarir|obeikan|stationery|printing)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - قرطاسية ومطبوعات', score: 400 },
    { regex: /(?:^|\s)(مستشفى|مستوصف|عيادة|صيدلية|النهدي|الدواء|hospital|clinic|pharmacy|nahdi|aldawaa)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تأمين طبي', score: 400 },
    { regex: /(?:^|\s)(محطة|ساسكو|الدريس|نفط|بنزين|وقود|sasco|aldrees|naft|petrol|fuel|station)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - محروقات وطاقة', score: 400 },
    { regex: /(?:^|\s)(المراعي|نادك|الصافي|سدافكو|حلواني|وفرة|السنبلة|othaim|عثيم|الدانوب|دانوب|danube|danub|almarai|nadec|nada|sadafco|perfect chef|food|trading|أغذية|اغذية|تموين|مخبز|مخابز|لحوم|دواجن|أسماك|خضار|فواكه|سوبر ماركت|هايبر|بنده|لولو|كارفور|panda|lulu|carrefour)(?=\s|$)/, cat: 'تكلفة المبيعات - مواد خام ومكونات', score: 300 },
    { regex: /(?:^|\s)(بلاستيك|ورق|تغليف|كرتون|napco|نابكو|plastic|paper|packaging|sfaqat|صفقات|قصر البلاستيك|القصر للبلاستيك|تغليف|علب|كراتين)(?=\s|$)/, cat: 'تكلفة المبيعات - مواد تعبئة وتغليف', score: 300 },
    { regex: /(?:^|\s)(صيانة|مقاولات|ورشة|تصليح|maintenance|contracting|repair|garage|فني|تركيب|تأسيس|تمديد)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - صيانة وإصلاح', score: 300 },
    { regex: /(?:^|\s)(عقار|أملاك|املاك|إسكان|اسكان|real estate|property|housing|إيجار|ايجار|دفعة إيجار)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - إيجارات', score: 400 },
    { regex: /(?:^|\s)(محاماة|محاسبون|استشارات|مخلص جمركي|\blaw\b|\bcpa\b|audit|consulting|consultancy|consultant|customs|professional services|خدمات تجارية|أتعاب|اتعاب)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - أتعاب مهنية واستشارات', score: 400 },
    { regex: /(?:^|\s)(اكسترا|ساكو|جرير|extra|saco|jarir|ikea|ايكيا|أثاث|مفروشات|furniture|electronics|الكترونيات|أجهزة|اجهزة)(?=\s|$)/, cat: 'أصول ثابتة - أجهزة ومعدات', score: 300 },
  ];

  vendors.forEach(v => {
    if (v.regex.test(nameText)) addScore(v.cat, v.score);
  });

  // --- STAGE 2: ITEM DESCRIPTION / KEYWORD BASED CLASSIFICATION (Stronger Hint - Score 600-1000) ---
  // Description is usually what was ACTUALLY bought, overriding the vendor's general category.
  const keywords = [
    // COGS - Raw Materials
    { regex: /(\bfood\b|\bmeat\b|\bchicken\b|\bfish\b|\bfruit\b|\bveg\b|\bdairy\b|\bmilk\b|\bcheese\b|\bsugar\b|\bflour\b|\bcoffee\b|\btea\b|\bwater\b|\bjuice\b|\bspice\b|\bsyrup\b|\bsauce\b|\boil\b|\bbutter\b|\bcream\b|\bsalt\b|\bpepper\b|\bonion\b|\bgarlic\b|\bchocolate\b|\bcocoa\b|\bpaste\b|\bpowder\b|\bglucose\b|\btrimoline\b|\bvanilla\b|\byeast\b|\bnut\b|\bnuts\b|\balmond\b|\bpistachio\b|\bflavor\b|\bcolor\b|\bsprinkle\b|\bsprinkles\b|\bingred\b|\bingreadans\b|\brecipe\b|\bbread\b|\btasting\b|\begg\b|\beggs\b|\bappell\b|\bpawder\b|\bdari\b|\brasperry\b|\bstrawberry\b|\bfrozen\b|\bsis\b|\bcoco\b|\bpops\b|\bpectin\b|\bdate\b|\bmaggic\b|\bfondant\b|\blady\b|\bfinger\b|\bcandy\b|(?:^|\s)(لحوم|دجاج|سمك|خضار|خضروات|فواكه|ألبان|أجبان|جبن|حليب|لبن|قشطة|سكر|دقيق|طحين|قهوة|بن|شاي|عصير(?!\s*مصاص)|مياه|بهارات|توابل|زيوت|زيت|زبدة|شوكولاتة|شوكلاتة|شوكولاته|كاكاو|فانيليا|خميرة|مكسرات|لوز|فستق|عسل|مربى|نكهات|نكهة|ألوان|الوان|أقلام تلوين|اقلام تلوين|سيرب|مواد خام|مكونات|خل|فرشلي|رائب|بيض|تمور|غذائي|طعام(?!\s*أدوات)|ثلج|ارز|أرز|مكرونة|صلصة|صوص|مشروب|مخبوزات|خبز|صامولي|برجر|عجينة|بضاعة|مشتريات|مخزون|مواد اولية|مواد أساسية|مكونات إنتاج|مكونات انتاج|زبادي|بيكربونات|ماء ورد|مستكة|مستكه|عجوة|ليمون|رمان|توت|جوز بيكان|هيل|تمر|صفاوي|حلاوه|عنتاب|حلقوم|مواد غذائية|تموين|أغذية|اغذية|رمان|octane 91|اوكتين 91)(?=\s|$))/, cat: 'تكلفة المبيعات - مواد خام ومكونات', score: 600 },
    
    // COGS - Packaging
    { regex: /(\bpackaging\b|\bbox\b|\bbag\b|\bbags\b|\bcup\b|\bwrap\b|\btakeaway\b|\bcontainer\b|\bfoil\b|\bnapkin\b|\btissue\b|\bstraw\b|\bsleeve\b|\bsticker\b|\bribbon\b|\bboard\b|(?:^|\s)(تغليف|علب|أكياس|كيس|أكواب|كوب|كاسات|قصدير|مناديل|منديل|مصاص|مصاصات|مصاصات عصير|رول|قواعد|شريط|سليف|ستكر|استيكر|استيكرات|ليبل|ملصق|ريبون|رينون|بوكس|بوكسات|بنتو|بورد|تاريخ|ورق طباعة انتهاء التواريخ|اكرليك|أكرليك|طباعة|كرتون|كراتين|اكياس شفافة)(?=\s|$))/, cat: 'تكلفة المبيعات - مواد تعبئة وتغليف', score: 600 },
    
    // COGS - Operating Consumables
    { regex: /(\bkitchenware\b|\butensil\b|\bplate\b|\bspoon\b|\bfork\b|\bknife\b|\bpot\b|\bpan\b|\bglass\b|\bcutlery\b|\bbowl\b|\bdish\b|\bmug\b|\btray\b|\bpyrex\b|\btool\b|\btools\b|\bpippng\b|\bflower\b|\bplastic\b|\bpaper\b|\bcarton\b|\bcutter\b|(?:^|\s)(أدوات مطبخ|أدوات طعام|صحون|ملاعق|شوك|سكاكين|قدور|أكواب زجاجية|صواني|طناجر|عجان|ثلاجة|شمع|شمع حفلات|ديكور|زينة|ورد|بايركس|قفازات|كمامات|نايلون|سفرة|عود|اعواد|أعواد|مريلة|مريله|شبك|فحم|حطب|ولاعة|ادوات|أدوات|شجره|شجرة|فانوس|فانوس رمضان|بطاريات|بطارية|قرع|بلاستيك|بلاستك|ورق|كرتون|قالب|فلين|مواد للمطبخ|قطاعة|قطاعات|مستهلكات|منظفات|قوالب كيك المونيوم|صينية زجاج بيضاوى|أدوات طعام|مواد طبخ)(?=\s|$))/, cat: 'تكلفة المبيعات - مستهلكات تشغيلية', score: 600 },
    
    // COGS - Freight Inwards
    { regex: /(?:^|\s)(تخليص جمركي|رسوم جمركية|شحن للداخل|نقل بضاعة|جمارك|نقل مشتريات|customs|clearance)(?=\s|$)/, cat: 'تكلفة المبيعات - شحن ونقل للداخل', score: 600 },

    // OPEX - Fuel & Energy
    { regex: /(?:^|\s)(بنزين|وقود|محروقات|ديزل|gasoline|fuel|diesel|petrol)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - محروقات وطاقة', score: 800 },

    // OPEX - Car Expenses
    { regex: /(?:^|\s)(سيارة|سيارات|كفر|كفرات|اطار|اطارات|زيت سيارة|تغيير زيت|فحص دوري|غسيل سيارة|car|vehicle|oil change|car wash|car oil)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - مصاريف سيارات', score: 700 },

    // OPEX - Maintenance & Repairs
    { regex: /(\bmaintenance\b|\brepair\b|\bspare part\b|\bfix\b|\bservice\b|\boverhaul\b|\bcompressor\b|\bcable\b|\bcharger\b|(?:^|\s)(صيانة|إصلاح|تصليح|قطع غيار|ورشة|سباكة|سباك|كهرباء|تكييف|جوال|شاشة|بطارية|مكينة|كومبرسير|كمبروسر|رداد|خلاط|سلك|مفك|مفكات|صفاية|صفايات|شاحن|كيبيل|كيبل)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - صيانة وإصلاح', score: 600 },
    
    // OPEX - Cleaning & Hospitality
    { regex: /(\bcleaning\b|\bdetergent\b|\bsoap\b|\bbleach\b|\btrash\b|\bglove\b|\bsanitizer\b|\bhygiene\b|\bwipe\b|\bbroom\b|\bmop\b|\bsponge\b|\bdisinfectant\b|\bwash\b|\bclean\b|\btissue\b|\btesho\b|(?:^|\s)(نظافة|تنظيف|صابون|معقم|منظفات|أكياس نفاية|قفازات|ممسحة|مكنسة|كلوركس|ديتول|ضيافة|استقبال|اسفنجة|إسفنجة|فيري|ادوات تنظيف|أدوات تنظيف|إزالة مواد مترسبة|صوف القطن)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - نظافة وضيافة', score: 600 },
    
    // OPEX - Rent
    { regex: /(\brent\b|\blease\b|\breal estate\b|\bwarehouse\b|\baccommodation\b|\bhousing\b|\bproperty\b|\boffice\b|\bshop\b|\bstore\b|(?:^|\s)(إيجار|ايجار|عقار|سكن|مستودع|محل|مكتب)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - إيجارات', score: 600 },
    
    // OPEX - Marketing
    { regex: /(\bmarketing\b|\badvertising\b|\bad\b|\bcampaign\b|\bpromotion\b|\bsnapchat\b|\binstagram\b|\btiktok\b|\bgoogle\b|\bmeta\b|\bfacebook\b|\bseo\b|\bbranding\b|\bpr\b|(?:^|\s)(تسويق|إعلان|دعاية|حملة|ترويج|سناب|انستقرام|تيك توك|لوحات)(?=\s|$))/, cat: 'مصروفات بيعية وتسويقية - دعاية وإعلان', score: 600 },
    
    // OPEX - Delivery & Freight Outwards
    { regex: /(\bdelivery\b|\bshipping\b|\bcourier\b|\btransport\b|(?:^|\s)(توصيل|نقل طلبية|شحن للعملاء|مندوب توصيل|رسوم توصيل|توصيل بضاعة|مرسول|جاهز|هنقرستيشن|شحنة بريد|نقل شحنة|اجرة ديانا)(?=\s|$))/, cat: 'مصروفات بيعية وتسويقية - نقل وتوصيل', score: 600 },

    // OPEX - Travel
    { regex: /(?:^|\s)(طيران|تذاكر|سفر|فندق|سكن|تأشيرة|فيزا|اقامة|جزطيران)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - سفر وانتقالات', score: 600 },

    // OPEX - Petty Cash
    { regex: /(?:^|\s)(عهدة|نثرية|سواق|أغراض)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - عهد ومصروفات نثرية', score: 600 },

    // OPEX - Employee Benefits
    { regex: /(?:^|\s)(أدوية|علاج|طبي|حذاء|ملابس|زي|وجبة|إعاشة)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - مزايا أخرى', score: 600 },

    // OPEX - Government Fees
    { regex: /(?:^|\s)(سجل تجاري|رخصة|بلدية|غرفة تجارية|زكاة|ضريبة|رسوم حكومية|سلامة|دفاع مدني)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رسوم حكومية', score: 600 },

    // OPEX - Storage
    { regex: /(?:^|\s)(تخزين|مستودع|ايجار|إيجار)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - إيجارات', score: 600 },

    // OPEX - Marketing
    { regex: /(\bmarketing\b|\badvertising\b|\bad\b|\bcampaign\b|\bpromotion\b|\bsnapchat\b|\binstagram\b|\btiktok\b|\bgoogle\b|\bmeta\b|\bfacebook\b|\bseo\b|\bbranding\b|\bpr\b|(?:^|\s)(تسويق|إعلان|دعاية|حملة|ترويج|سناب|انستقرام|تيك توك|لوحات|علاقات عامة|هدايا|توزيعات|العاب أطفال|ورق صور|مستلزمات للحملة الترويجية)(?=\s|$))/, cat: 'مصروفات بيعية وتسويقية - دعاية وإعلان', score: 600 },

    // OPEX - Stationery
    { regex: /(?:^|\s)(قرطاسية|مكتبية|ورق طباعة|أقلام|اقلام|طباعة)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - قرطاسية ومطبوعات', score: 600 },

    // OPEX - Uniforms
    { regex: /(\buniform\b|\bunforim\b|\bworkwear\b|\bclothing\b|\btailor\b|\bapparel\b|\battire\b|\bsafety shoes\b|\bhelmet\b|\bvest\b|(?:^|\s)(ملابس|يونيفورم|زي|خياط|مريلة|طاقية)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - زي ومهمات عاملين', score: 600 },
    
    // OPEX - Training
    { regex: /(\btraining\b|\bcourse\b|\bworkshop\b|\bdevelopment\b|\bseminar\b|\beducation\b|\bcertification\b|\blearning\b|(?:^|\s)(تدريب|دورة|معهد|ورشة|تطوير)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تدريب وتطوير', score: 600 },
    
    // OPEX - Travel & Accommodation
    { regex: /(\btravel\b|\bflight\b|\bticket\b|\bhotel\b|\baccommodation\b|\btransportation\b|(?:^|\s)(سفر|تذكرة|تذاكر|طيران|فندق|إقامة|مواصلات|تذاكر سفر|انتقالات|مرتبة للموظف|توصيل موظف|مرتبة)(?=\s|$))/, cat: 'مصروفات عمومية وإدارية - مصاريف سفر وانتقالات', score: 600 },
    
    // OPEX - Government Fees
    { regex: /(?:^|\s)(تجديد|رخصة|رخص|سجل|تصريح|تراخيص|اشتراك غرفه|غرفة تجارية|بلدية|دفاع مدني|زكاة|ضريبة|اقامة|نقل كفالة|خروج وعودة|مكتب العمل|قوى|مقيم|مدد|جوازات|مرور|استمارة|تأشيرة|تاشيرة|فيزا|visa|فيزا عامل)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رسوم حكومية', score: 600 },

    // OPEX - Bank Fees
    { regex: /(?:^|\s)(رسوم تحويل|رسوم ادارية|عمولة بنك|نقاط بيع|مدى|فيزا|ماستركارد|شبكة|كشف حساب|دفتر شيكات|فوائد|مرابحة|تمويل|تحويل بنكي|صراف|بنك)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رسوم بنكية ونقاط بيع', score: 600 },

    // OPEX - Subscriptions & Software
    { regex: /(?:^|\s)(اشتراك|تجديد اشتراك|برنامج|تطبيق|نظام|استضافة|دومين|سيرفر|كلاود|فودكس|موقع|cloud|software|app|subscription|hosting|domain|license|renewal|foodics)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - اشتراكات وبرمجيات', score: 600 },

    // OPEX - Professional Services
    { regex: /(?:^|\s)(اتعاب|استشارات|محاماة|محاسب|مراجعة|تدقيق|تخليص|معقب|خدمات عامة|استقدام|مكتب عمل|professional services|consulting|consultancy|consultant|audit|legal|services)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - أتعاب مهنية واستشارات', score: 600 },

    // OPEX - Telecom & Internet
    { regex: /(?:^|\s)(فاتورة جوال|انترنت|الياف|شحن رصيد|باقة|stc|mobily|zain|internit|internet)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - اتصالات وإنترنت', score: 600 },

    // OPEX - Utilities
    { regex: /(?:^|\s)(كهرباء|مياه|غاز|فاتورة كهرباء|فاتورة مياه)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - منافع (كهرباء ومياه)', score: 600 },

    // OPEX - Stationery & Printing
    { regex: /(?:^|\s)(قرطاسية|مطبوعات|ورق تصوير|حبر|احبار|اقلام|ملفات|اختام|طباعة|تصوير|بنر|لوحات|كروت|أدوات مكتبية|ادوات مكتبية|ختم شوكولاته)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - قرطاسية ومطبوعات', score: 600 },

    // OPEX - Medical & Insurance
    { regex: /(?:^|\s)(تأمين|تامين|طبي|مستشفى|عيادة|صيدلية|دواء|علاج|فحص|تحليل|اشعة|نظارات|اسنان|ولادة|عملية|تنويم|اسعاف|طوارئ)(?=\s|$)/, cat: 'مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تأمين طبي', score: 600 },

    // OPEX - Donations
    { regex: /(\bdonation\b|\bcharity\b|\bwaqf\b|\brelief\b|\borphan\b|\bsadaqah\b|\behsan\b|(?:^|\s)(صدقة|صدقه|تبرع|جمعية|أوقاف|أيتام|إغاثة|إحسان)(?=\s|$))/, cat: 'مصروفات أخرى - تبرعات ومساهمات مجتمعية', score: 600 },
    
    // OPEX - Fines
    { regex: /(\bpenalty\b|\bfine\b|\bviolation\b|\btraffic ticket\b|(?:^|\s)(مخالفة|غرامة|جزاء|ساهر)(?=\s|$))/, cat: 'مصروفات أخرى - غرامات ومخالفات', score: 600 },

    // CAPEX - IT Equipment (High Score to override vendor)
    { regex: /(\blaptop\b|\bmacbook\b|\bcomputer\b|\bpc\b|\bserver\b|\bdesktop\b|\bworkstation\b|(?:^|\s)(لابتوب|حاسب|كمبيوتر|ماك بوك|سيرفر)(?=\s|$))/, cat: 'أصول ثابتة - أجهزة حاسب آلي', score: 1000 },
    
    // CAPEX - Equipment (High Score to override vendor)
    { regex: /(\bhardware\b|\bequipment\b|\bmachinery\b|\bprinter\b|\bmonitor\b|\bespresso machine\b|\bindustrial mixer\b|(?:^|\s)(معدات|آلة|مكينة|فرن|ثلاجة عرض)(?=\s|$))/, cat: 'أصول ثابتة - أجهزة ومعدات', score: 1000 },
    
    // CAPEX - Furniture (High Score to override vendor)
    { regex: /(\bfurniture\b|\bchairs\b|\btables\b|\bdesks\b|\bfixtures\b|(?:^|\s)(أثاث|كراسي|طاولات|مكاتب|ديكورات)(?=\s|$))/, cat: 'أصول ثابتة - أثاث وتركيبات', score: 1000 },
    
    // CAPEX - Vehicles (High Score to override vendor)
    { regex: /(\bcar\b|\btruck\b|\bvan\b|\bvehicle\b|\bmotorcycle\b|(?:^|\s)(سيارة|شاحنة|دباب|مركبة)(?=\s|$))/, cat: 'أصول ثابتة - سيارات ووسائل نقل', score: 1000 },
  ];

  keywords.forEach(k => {
    if (k.regex.test(allText)) addScore(k.cat, k.score);
    if (k.regex.test(descText)) addScore(k.cat, 200); // Bonus for being explicitly in the description
  });

  // --- STAGE 3: CONTEXTUAL OVERRIDES & REFINEMENTS ---
  
  // 1. Vehicle & Car Expenses (Highest Priority for Car related)
  if (REGEX_CAR.test(allText)) {
      if (REGEX_DELIVERY.test(allText)) {
          addScore('مصروفات بيعية وتسويقية - نقل وتوصيل', 4500);
      } else {
          addScore('مصروفات عمومية وإدارية - مصاريف سيارات', 4000);
      }
  }

  // 2. Maintenance & Repairs (Non-vehicle)
  if (REGEX_MAINTENANCE.test(allText)) {
      if (!REGEX_CAR.test(allText)) {
          addScore('مصروفات عمومية وإدارية - صيانة وإصلاح', 3500);
      }
  }

  // 3. Raw Materials & Ingredients (Food)
  if (REGEX_RAW_MATERIALS.test(allText)) {
      addScore('تكلفة المبيعات - مواد خام ومكونات', 3500);
  }

  // 4. Cleaning & Hospitality
  if (REGEX_CLEANING.test(allText)) {
      addScore('مصروفات عمومية وإدارية - نظافة وضيافة', 3500);
  }

  // 4.5 Operating Consumables (Kitchen tools, gloves, film, etc.)
  if (REGEX_OPERATING.test(allText)) {
      addScore('تكلفة المبيعات - مستهلكات تشغيلية', 3500);
  }

  // 5. Packaging & Disposables (Takeaway items)
  if (REGEX_PACKAGING.test(allText)) {
      // If it's a raw material carton (like lemon carton), don't override
      if (!REGEX_RAW_MATERIALS.test(allText)) {
          // If it's an operating consumable, don't override
          if (!REGEX_OPERATING.test(allText)) {
              // If it's explicitly office stationery, don't override
              if (!REGEX_STATIONERY.test(allText)) {
                  addScore('تكلفة المبيعات - مواد تعبئة وتغليف', 3000);
              }
          }
      }
  }

  // 5.5 Stationery Override
  if (REGEX_STATIONERY.test(allText)) {
      if (!REGEX_STATIONERY_EXCLUDE.test(allText)) {
          addScore('مصروفات عمومية وإدارية - قرطاسية ومطبوعات', 3500);
      }
  }

  // 5.6 Professional Fees Override
  if (REGEX_PROFESSIONAL.test(allText)) {
      addScore('مصروفات عمومية وإدارية - أتعاب مهنية واستشارات', 4500);
  }

  // 6. Subscriptions vs Government Fees
  if (REGEX_SUBSCRIPTIONS.test(allText)) {
      addScore('مصروفات عمومية وإدارية - اشتراكات وبرمجيات', 3500);
  }

  // 7. Decorations & Events
  if (REGEX_DECORATIONS.test(descText)) {
      if (!REGEX_DECORATIONS_EXCLUDE.test(descText)) { // Exclude edible/cake decorations
          addScore('مصروفات بيعية وتسويقية - دعاية وإعلان', 3000);
      }
  }

  // 8. IT Equipment & Accessories
  if (REGEX_IT_EQUIPMENT.test(allText)) {
      addScore('أصول ثابتة - أجهزة حاسب آلي', 3500);
  }

  // 9. Fuel overrides vehicle purchase and maintenance
  if (REGEX_FUEL.test(allText)) {
      addScore('مصروفات عمومية وإدارية - محروقات وطاقة', 4000);
  }

  // 10. Donations overrides
  if (REGEX_DONATIONS.test(allText)) {
      addScore('مصروفات أخرى - تبرعات ومساهمات مجتمعية', 4000);
  }

  // 11. Transport/Freight Rentals (e.g. "اجرة دينا")
  if (REGEX_TRANSPORT_RENTAL.test(allText) && REGEX_TRANSPORT_VEHICLE.test(allText)) {
      if (REGEX_TRANSPORT_EQUIPMENT.test(allText)) {
          addScore('مصروفات عمومية وإدارية - صيانة وإصلاح', 4000); // Moving equipment is usually maintenance/setup
      } else {
          addScore('تكلفة المبيعات - شحن ونقل للداخل', 1500); // Default to inbound freight for transport rentals
      }
  } else if (REGEX_TRANSPORT_VEHICLE.test(allText)) {
      if (REGEX_TRANSPORT_EQUIPMENT.test(allText)) {
          addScore('مصروفات عمومية وإدارية - صيانة وإصلاح', 4000);
      } else {
          addScore('تكلفة المبيعات - شحن ونقل للداخل', 1000); // "دينا" usually means transport, not buying a truck
      }
  }

  // 12. If it's a bank but the description mentions loans/interest
  if (REGEX_LOANS.test(allText)) {
      addScore('تكاليف تمويلية - فوائد وعمولات قروض', 4000);
  }

  // 13. If it's shipping/freight AND raw materials are mentioned, it's inbound freight (COGS)
  if (REGEX_SHIPPING.test(allText) && REGEX_SHIPPING_COGS.test(allText)) {
      if (REGEX_SHIPPING_MAINTENANCE.test(allText)) {
          addScore('مصروفات عمومية وإدارية - صيانة وإصلاح', 4000);
      } else {
          addScore('تكلفة المبيعات - شحن ونقل للداخل', 2000);
      }
  }

  // 15. Personnel & Employee Benefits (Higher Priority)
  if (REGEX_PERSONNEL.test(allText)) {
      if (/(نهاية خدمة)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - رواتب ومنافع موظفين - مستحقات نهاية الخدمة', 4500);
      } else if (/(تأمينات اجتماعية|تأمينات|gosi)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تأمينات اجتماعية', 4500);
      } else if (/(تذكرة طيران|تذكرة سفر|flight ticket)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - رواتب ومنافع موظفين - تذاكر طيران', 4500);
      } else if (/(راتب|بدل|مكافأة)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - رواتب ومنافع موظفين - رواتب وأجور', 4500);
      } else if (/(تذكرة|سفر|انتقالات)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - مصاريف سفر وانتقالات', 4500);
      } else if (/(إقامة|اقامة|تجديد|تأشيرة|تاشيرة|سجل تجاري)/.test(allText)) {
          addScore('مصروفات عمومية وإدارية - رسوم حكومية', 4500);
      }
  }

  // 16. Marketing & Sales Commissions
  if (REGEX_MARKETING.test(allText)) {
      addScore('مصروفات بيعية وتسويقية - دعاية وإعلان', 4500);
  }

  // 17. Specific COGS items that were misclassified
  if (REGEX_MISC_COGS.test(allText)) {
      addScore('تكلفة المبيعات - مستهلكات تشغيلية', 4500);
  }

  // --- STAGE 4: RESOLUTION ---
  let max = 0;
  for (const [cat, score] of Object.entries(scores)) {
      if (score > max) { max = score; finalCategory = cat; detectedRule = 'Normal Scoring (Stage 1-3)'; }
  }
  
  // --- STAGE 5: AMOUNT-BASED REFINEMENTS ---
  // If it's categorized as a fixed asset but the amount is small (e.g., < 1500), it's likely an expense
  if (amount > 0 && amount < 1500 && finalCategory.startsWith('أصول ثابتة')) {
      detectedRule = 'Amount-Based Refinement (Stage 5)';
      if (finalCategory.includes('أجهزة حاسب آلي')) {
          finalCategory = 'مصروفات عمومية وإدارية - قرطاسية ومطبوعات'; // e.g., small computer accessories
      } else if (finalCategory.includes('أجهزة ومعدات')) {
          finalCategory = 'تكلفة المبيعات - مستهلكات تشغيلية'; // e.g., small kitchen equipment
      } else if (finalCategory.includes('سيارات ووسائل نقل')) {
          finalCategory = 'مصروفات عمومية وإدارية - صيانة وإصلاح'; // e.g., small car parts
      } else {
          finalCategory = 'تكلفة المبيعات - مستهلكات تشغيلية'; // Fallback for small assets
      }
  }

  // Strictly enforce a valid category, or return the default
  if (!finalCategory || finalCategory.trim() === '') {
      finalCategory = 'مصروفات عمومية وإدارية - أخرى';
      detectedRule = 'Empty Category Guard';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log("=== 🔴 PHASE 5: CATEGORIZATION INPUT TRACE ===");
    console.log(JSON.stringify({
       description: desc || '',
       entity: name || '',
       normalized_input: allText,
       matched_rule: detectedRule,
       final_category: finalCategory
    }, null, 2));
  }
  
  if (!(globalThis as any)._debugTableRows) {
        (globalThis as any)._debugTableRows = [];
  }

  return finalCategory;
};

export const getRevenueCategory = (name: string, desc: string, rawEnt: string): string => {
  const normalizeArabic = (text: string) => {
    return text
      .replace(/ـ/g, '') // Remove tatweel
      .replace(/[أإآ]/g, 'ا') // Unify alef
      .replace(/ة/g, 'ه') // Unify taa marbouta/haa
      .replace(/ى/g, 'ي') // Unify alef maksoura/yaa
      .replace(/\s+/g, ' '); // Remove extra spaces
  };

  const nameText = normalizeArabic(String(name || '').toLowerCase().trim());
  const descText = normalizeArabic(String(desc || '').toLowerCase().trim());
  const rawText = normalizeArabic(String(rawEnt || '').toLowerCase().trim());
  const allText = nameText + " " + descText + " " + rawText;
  
  let scores: Record<string, number> = {};
  const addScore = (cat: string, basePoints: number, isDescMatch = false) => { 
    scores[cat] = (scores[cat] || 0) + basePoints + (isDescMatch ? 150 : 0); 
  };
  const check = (regex: RegExp, cat: string, basePoints = 100) => {
      if (regex.test(allText)) addScore(cat, basePoints, regex.test(descText));
  };

  check(/(noon food|نون فود|noon|نون|فود)/i, 'إيرادات تطبيقات التوصيل', 1200);
  check(/(جاهز|هنقرستيشن|مرسول|تطبيقات توصيل|طلبات|توصيل|تطبيق|jahez|hungerstation|delivery|ذا شيفز|تويو|toyou|ninja|نينجا|كريم|careem|talabat|uber eats|deliveroo|chefz|افضل الطهاة|أفضل الطهاة|keeta|كيتا|the x|ذا اكس|harry poter|harry potter|هاري بوتر|nenja)/i, 'إيرادات تطبيقات التوصيل', 1000);
  
  // B2B keywords should have high priority
  check(/(شركه|شركة|مؤسسه|مؤسسة|مجموعه|مجموعة|مصنع|عقود|عقد|جملة|شركات|b2b|توريد|بيع|إعاشة|اعاشة|تقديم|عطار|مقاولات|تجارة|company|corp|inc|llc|enterprise|wholesale|contract|supply|trading|ايرادات شركات|إيرادات شركات|flowerd|الورود الفاخرة|الورود الفاخره|صالون الفن النقي|bloss|مستشفى|فندق|مكتب|مركز|عيادة|عياده|مدرسة|مدرسه|جامعة|جامعه|معهد|أكاديمية|اكاديمية)/i, 'إيرادات عقود ومبيعات شركات (B2B)', 900); 

  check(/(عميل نقدي|نقدي|شبكة|فيزا|ماستركارد|مدى|كاش|cash|pos|نقطة بيع|أبل باي|apple pay|credit card|debit card|mada|visa|mastercard|card|بطاقة|بطاقه)/i, 'مبيعات نقدية ونقاط بيع (POS)', 800);
  
  check(/(حفل|زواج|مناسب|بوفيه خارجي|تجهيز|كيترينج|تقديمات|catering|event|wedding|party|banquet)/i, 'إيرادات حفلات ومناسبات', 600);
  check(/(كيك|حلويات|مخبوزات|شوكولات|معجنات|cake|sweets|bakery|تورتة|pastry|chocolate|dessert)/i, 'مبيعات حلويات ومخبوزات', 90);
  check(/(مقهى|قهوة|مشروبات|عصائر|شاي|coffee|drinks|cafe|tea|juice|beverage)/i, 'مبيعات مشروبات وقهوة', 90);
  check(/(مطعم|وجبات|طعام|مأكولات|dine|food|صالة|سفري|محلي|restaurant|meal|dining|takeaway)/i, 'مبيعات مطعم (داخلي/سفري)', 85);
  check(/(تاجير|تأجير|رسوم تأخير|غرامات|إيرادات أخرى|اخرى|other|rent|penalty|fine|miscellaneous|misc)/i, 'إيرادات تشغيلية أخرى', 50);

  let bestCategory = 'إيرادات مبيعات متنوعة'; 
  
  // If we have strong matches for specific channels, don't fallback to 'diversified'
  const topCat = Object.entries(scores).sort((a,b) => b[1] - a[1])[0];
  if (topCat && topCat[1] >= 400) {
      bestCategory = topCat[0];
  } else {
      let max = 0;
      for (const [cat, score] of Object.entries(scores)) {
          if (score > max) { max = score; bestCategory = cat; }
      }
  }
  return bestCategory;
};

export const getPayrollCategory = (name: string, desc: string): string => {
  // In the payroll module, each row typically represents a full payslip 
  // (Basic, Allowances, Deductions, Net) via its columns.
  // Categorizing the entire row based on a keyword in the description (e.g., "خصم") 
  // incorrectly moves the entire payslip to a "Deductions" category.
  // Therefore, all payroll records should be grouped under a single main category,
  // and the breakdown is handled by the column values.
  return 'رواتب وأجور وما في حكمها';
};
