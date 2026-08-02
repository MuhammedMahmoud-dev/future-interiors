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
    eyebrow: "أكتوبر • الشيخ زايد • الكمبوندات",
    title: "تشطيبات بإشراف هندسي كامل",
    subtitle:
      "تنفيذ كامل لشقتك من التأسيس للتسليم، بإشراف هندسي يومي وكشف حساب مفصّل بكل بند وكل فاتورة تتابعه أول بأول.",
    ctaWorks: "شوف أعمالنا",
    ctaBook: "احجز معاينة",
  },

  services: {
    title: "خدماتنا",
    subtitle: "كل مراحل التشطيب تحت إشراف هندسي واحد",
    viewAll: "كل الخدمات",
    pageSubtitle: "تفاصيل كل مرحلة من مراحل التنفيذ",
  },

  works: {
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
    title: "أرقامنا",
  },

  testimonials: {
    title: "آراء العملاء",
    anonymous: "عميل",
  },

  faq: {
    title: "أسئلة شائعة",
    subtitle: "أكتر الأسئلة اللي بتتسأل قبل بداية الشغل",
    cta: "اسأل سؤالك",
  },

  workSystem: {
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
    title: "عن المهندس",
    bioTitle: "نبذة",
    syndicate: "نقابة المهندسين",
    credentials: "المؤهلات والشهادات",
    empty: "بيانات المهندس هتتعرض هنا أول ما تتضاف.",
  },

  contact: {
    title: "تواصل معانا",
    subtitle: "واتساب هو أسرع طريقة توصلنا بيها.",
    whatsappCta: "ابعتلنا على واتساب",
    phone: "تليفون",
  },

  track: {
    title: "متابعة مشروعك",
    soonTitle: "بوابة المتابعة بتتفعل قريباً",
    soonBody:
      "صفحة متابعة مشروعك — البنود والدفعات وصور مراحل التنفيذ — بتتفعل قريباً. لحد ما تشتغل، كلمنا على واتساب وهنبعتلك كشف حساب مشروعك.",
    whatsappCta: "كلمنا على واتساب",
  },

  footer: {
    blurb:
      "تنفيذ وتشطيب شقق بإشراف هندسي كامل، بشفافية في كل بند وكل فاتورة.",
    links: "روابط",
    services: "خدماتنا",
    contact: "تواصل",
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
  },
};

export type Dictionary = typeof ar;
