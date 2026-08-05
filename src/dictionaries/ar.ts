/**
 * Arabic is the source dictionary and the fallback for everything.
 * `en.ts` is typed against it, so a missing English key is a compile error.
 *
 * REVIEW BEFORE LAUNCH: the journey step durations and the work-system copy are
 * first drafts written from the spec. Confirm them with the engineer.
 */
export const ar = {
  meta: {
    siteName: "Future Interiors",
    title: "Future Interiors — تشطيبات بإشراف هندسي",
    description:
      "تنفيذ وتشطيب شقق بإشراف هندسي كامل، بكشف حساب مفصّل تقدر تتابعه أول بأول.",
  },

  topbar: {
    call: "اتصل بنا",
    whatsapp: "واتساب",
  },

  nav: {
    home: "الرئيسية",
    works: "أعمالنا",
    services: "خدماتنا",
    workSystem: "نظام العمل",
    about: "عن المهندس",
    contact: "تواصل",
    track: "متابعة مشروعك",
    openMenu: "افتح القائمة",
    closeMenu: "اقفل القائمة",
    switchLang: "English",
  },

  hero: {
    title: "تشطيبات بإشراف هندسي كامل",
    ctaWorks: "شوف أعمالنا",
    ctaBook: "احجز معاينة",
  },

  services: {
    eyebrow: "اللي بنعمله",
    title: "خدماتنا",
    subtitle: "كل مراحل التشطيب تحت إشراف هندسي واحد",
    viewAll: "كل الخدمات",
    pageSubtitle: "تفاصيل كل مرحلة من مراحل التنفيذ",
  },

  /**
   * "ليه تختارنا" (§8.4). Deliberately free of any number, rate or price per
   * metre — same rule the work-system page runs under.
   */
  why: {
    eyebrow: "ليه تختارنا",
    title: "إشراف هندسي، مش مقاولة",
    subtitle:
      "الفرق إن إحنا بنشرف على التنفيذ ونراجع كل مرحلة، والتعاقد مع الموردين بيفضل باسمك إنت.",
    points: [
      "الخامات بتتشترى باسمك ومن الموردين مباشرة",
      "كل فاتورة بتوصلك بتاريخها وقيمتها",
      "بوابة متابعة خاصة بمشروعك تفتحها في أي وقت",
      "إشراف يومي على الطبيعة، مش زيارات متفرقة",
      "مراجعة جودة كل مرحلة قبل ما اللي بعدها تبدأ",
    ],
    cards: [
      {
        title: "شفافية من أول يوم",
        body: "كل بند وكل دفعة قدامك أول بأول، مش كشف بيتسلّم في آخر الشغل.",
      },
      {
        title: "التعاقد باسمك",
        body: "إحنا بنختار ونراجع الخامات، لكن الفاتورة والتعاقد بينك وبين المورد.",
      },
      {
        title: "تنفيذ على مراحل",
        body: "كل مرحلة بتتقفل وتتصور وتتراجع قبل ما التالية تبدأ.",
      },
    ],
  },

  works: {
    eyebrow: "أعمالنا",
    title: "أعمالنا",
    subtitle: "مشاريع اتنفذت بالكامل",
    pageSubtitle: "مشاريع مكتملة، معروضة بموافقة أصحابها",
    viewAll: "كل الأعمال",
    empty: "الأعمال هتتعرض هنا أول ما تتضاف.",
    filterAll: "الكل",
    loadMore: "تحميل المزيد",
    area: "المساحة",
    location: "الموقع",
    duration: "مدة التنفيذ",
    year: "سنة التنفيذ",
    months: "شهر",
    sqm: "م²",
  },

  project: {
    about: "عن المشروع",
    beforeAfter: "قبل وبعد",
    dragHint: "اسحب للمقارنة",
    before: "قبل",
    after: "بعد",
    timeline: "مراحل التنفيذ",
    gallery: "معرض الصور",
    ctaTitle: "عايز نتيجة زي دي؟",
    ctaText: "ابعتلنا على واتساب واحجز معاينة لشقتك.",
    ctaButton: "احجز معاينة",
    related: "مشاريع تانية تهمك",
    closeGallery: "اقفل",
    stageDone: "تم",
    stageInProgress: "جاري التنفيذ",
    stageNotStarted: "لسه ما بدأش",
  },

  journey: {
    eyebrow: "خطوة بخطوة",
    title: "رحلة العميل",
    subtitle: "من أول معاينة لحد استلام المفتاح",
    steps: [
      { title: "معاينة ومقايسة", duration: "ثلاثة أيام إلى أسبوع" },
      { title: "اتفاق وجدول زمني", duration: "ثلاثة أيام" },
      { title: "تنفيذ على مراحل", duration: "حسب المساحة" },
      { title: "متابعة أول بأول", duration: "طول فترة التنفيذ" },
      { title: "تسليم", duration: "حسب الاتفاق مع العميل" },
    ],
  },

  stats: {
    eyebrow: "مبنية على الثقة",
    title: "أرقامنا",
  },

  testimonials: {
    eyebrow: "اللي بيتقال عننا",
    title: "آراء العملاء",
    anonymous: "عميل",
  },

  faq: {
    eyebrow: "أسئلة وإجابات",
    title: "أسئلة شائعة",
    subtitle: "أكتر الأسئلة اللي بتتسأل قبل بداية الشغل",
    cta: "اسأل سؤالك",
  },

  workSystem: {
    eyebrow: "طريقة شغلنا",
    title: "نظام العمل",
    subtitle: "إزاي بنشتغل، خطوة بخطوة",
    steps: [
      {
        title: "المعاينة",
        body: "بنعاين الوحدة على الطبيعة، ناخد المقاسات، ونتفق على مستوى التشطيب المطلوب ونطاق الشغل قبل أي كلام تاني.",
      },
      {
        title: "شراء الخامات باسمك",
        body: "الخامات بتتشترى باسمك إنت ومن الموردين مباشرة. إحنا بنختار ونراجع الجودة، بس التعاقد والفاتورة باسمك.",
      },
      {
        title: "كل فاتورة بتوصلك",
        body: "كل فاتورة بتتصور وتتسجل بتاريخها وقيمتها. مفيش بند بيتحاسب عليه من غير ما يكون قدامك.",
      },
      {
        title: "صفحة متابعة خاصة بيك",
        body: "بتفتح صفحة مشروعك بكود خاص، وتلاقي فيها البنود والدفعات وصور كل مرحلة محدّثة، بدل كشف الحساب الورقي.",
      },
      {
        title: "إشراف هندسي يومي",
        body: "متابعة يومية للفنيين على الطبيعة، ومراجعة جودة كل مرحلة قبل ما اللي بعدها تبدأ.",
      },
    ],
  },

  about: {
    eyebrow: "مين وراء الشغل",
    title: "عن المهندس",
    bioTitle: "نبذة",
    syndicate: "نقابة المهندسين",
    credentials: "المؤهلات والشهادات",
    empty: "بيانات المهندس هتتعرض هنا أول ما تتضاف.",
  },

  contact: {
    eyebrow: "كلمنا",
    title: "تواصل معانا",
    subtitle: "واتساب هو أسرع طريقة توصلنا بيها.",
    whatsappCta: "ابعتلنا على واتساب",
    phone: "تليفون",
  },

  track: {
    title: "متابعة مشروعك",
    subtitle: "ادخل كود المشروع ورقم الموبايل المسجّل عندنا.",
    codeLabel: "كود المشروع",
    codePlaceholder: "FI-00-0000",
    phoneLabel: "رقم الموبايل",
    phonePlaceholder: "01xxxxxxxxx",
    submit: "دخول",
    submitting: "بيتحقق…",
    // Deliberately does not say which field was wrong.
    error: "الكود أو الرقم مش صحيح.",
    rateLimited: "حاولت كتير. استنى ربع ساعة وجرب تاني.",
    unavailable: "في مشكلة مؤقتة. جرب تاني بعد شوية.",
    help: "معرفتش الكود؟",
    whatsappCta: "كلمنا على واتساب",
  },

  portal: {
    status: {
      in_progress: "جاري التنفيذ",
      completed: "مكتمل",
      on_hold: "متوقف مؤقتاً",
    },
    progress: "تقدم التنفيذ",
    totalCost: "التكلفة الكلية",
    supervisionFee: "الإشراف الهندسي",
    grandTotal: "الإجمالي",
    totalPayments: "إجمالي المدفوع",
    balance: "الفارق",
    balanceCredit: "ليك",
    balanceDue: "عليك",
    currency: "ج.م",
    tabs: {
      expenses: "البنود",
      payments: "الدفعات",
      photos: "الصور",
    },
    search: "دور على بند…",
    dateFrom: "من تاريخ",
    dateTo: "لتاريخ",
    subtotal: "إجمالي المعروض",
    showing: "بند",
    columns: {
      date: "التاريخ",
      item: "البند",
      amount: "المبلغ",
      label: "الدفعة",
    },
    noExpenses: "لسه مفيش بنود مسجلة.",
    noPayments: "لسه مفيش دفعات مسجلة.",
    noPhotos: "لسه مفيش صور مرفوعة.",
    noResults: "مفيش نتايج للبحث ده.",
    unassignedStage: "غير مصنّف",
    downloadPdf: "تحميل كشف الحساب",
    print: "اطبع / احفظ PDF",
    contactEngineer: "تواصل مع المهندس",
    logout: "خروج",
    statementTitle: "كشف حساب المشروع",
    projectCode: "كود المشروع",
    issuedAt: "تاريخ الكشف",
    expensesSection: "البنود المنصرفة",
    paymentsSection: "الدفعات المستلمة",
    summarySection: "الملخص",
    whatsapp: "السلام عليكم يا هندسة، عندي استفسار عن مشروعي.",
  },

  /** The dark call-to-action strip that closes the homepage (§8.11). */
  cta: {
    eyebrow: "جاهزين نبدأ",
    title: "خلينا نتكلم عن شقتك",
    text: "ابعتلنا على واتساب واحنا نرتب معاينة في الوقت اللي يناسبك.",
    button: "ابعتلنا على واتساب",
  },

  footer: {
    blurb:
      "تنفيذ وتشطيب شقق بإشراف هندسي كامل، بشفافية في كل بند وكل فاتورة.",
    links: "روابط",
    services: "خدماتنا",
    contact: "تواصل",
    social: "تابعنا",
    rights: "© 2026 Future Interiors",
  },

  whatsapp: {
    float: "كلمنا على واتساب",
    book: "السلام عليكم، حابب أحجز معاينة لشقة.",
    ask: "السلام عليكم، عندي سؤال عن التشطيب.",
    project: "السلام عليكم، شفت مشروع",
    projectSuffix: "على الموقع وحابب أعرف تفاصيل أكتر.",
    trackHelp: "السلام عليكم، معرفتش كود متابعة مشروعي.",
  },

  common: {
    unavailable: "المحتوى هيتعرض هنا أول ما يتضاف.",
    backHome: "الرجوع للرئيسية",
    notFound: "الصفحة مش موجودة",
    readMore: "اعرف أكتر",
  },
};

export type Dictionary = typeof ar;
