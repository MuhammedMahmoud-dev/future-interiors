/**
 * Schema for the admin content editors.
 *
 * This is also the security boundary for the generic content actions: the table
 * name and every column written come from here, never from the request. A
 * generic "save any table" action without this whitelist would let a crafted
 * request write to `projects` or `login_attempts`.
 *
 * Shared by client and server, so no server-only imports.
 */

export type FieldType = "text" | "textarea" | "number" | "boolean" | "list";

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  dir?: "ltr";
  placeholder?: string;
  required?: boolean;
};

export type ContentSpec = {
  table: string;
  label: string;
  description: string;
  /** A singleton has exactly one row and no add/delete controls. */
  singleton?: boolean;
  orderBy: string;
  fields: FieldSpec[];
};

export const CONTENT_SPECS = {
  services: {
    table: "services",
    label: "الخدمات",
    description: "الكروت الستة اللي بتظهر في الرئيسية وصفحة خدماتنا.",
    orderBy: "order_index",
    fields: [
      { name: "title_ar", label: "العنوان (عربي)", type: "text", required: true },
      { name: "title_en", label: "العنوان (إنجليزي)", type: "text", dir: "ltr" },
      { name: "desc_ar", label: "الوصف (عربي)", type: "textarea" },
      { name: "desc_en", label: "الوصف (إنجليزي)", type: "textarea", dir: "ltr" },
      { name: "bullets_ar", label: "البنود (عربي) — سطر لكل بند", type: "list" },
      { name: "bullets_en", label: "البنود (إنجليزي)", type: "list", dir: "ltr" },
      { name: "icon", label: "الأيقونة", type: "text", dir: "ltr", placeholder: "rough-in" },
      { name: "order_index", label: "الترتيب", type: "number" },
      { name: "is_active", label: "ظاهرة", type: "boolean" },
    ],
  },

  faqs: {
    table: "faqs",
    label: "الأسئلة الشائعة",
    description: "ممنوع أي رقم أو نسبة أو سعر متر في الإجابات.",
    orderBy: "order_index",
    fields: [
      { name: "question_ar", label: "السؤال (عربي)", type: "text", required: true },
      { name: "question_en", label: "السؤال (إنجليزي)", type: "text", dir: "ltr" },
      { name: "answer_ar", label: "الإجابة (عربي)", type: "textarea", required: true },
      { name: "answer_en", label: "الإجابة (إنجليزي)", type: "textarea", dir: "ltr" },
      { name: "order_index", label: "الترتيب", type: "number" },
      { name: "is_active", label: "ظاهر", type: "boolean" },
    ],
  },

  testimonials: {
    table: "testimonials",
    label: "آراء العملاء",
    description: "ماتضيفش رأي غير لما العميل يوافق. شيل علامة «اعرض الاسم» لو وافق على الرأي بس مش على اسمه.",
    orderBy: "order_index",
    fields: [
      { name: "quote_ar", label: "الرأي (عربي)", type: "textarea", required: true },
      { name: "quote_en", label: "الرأي (إنجليزي)", type: "textarea", dir: "ltr" },
      { name: "client_name", label: "اسم العميل", type: "text" },
      { name: "show_name", label: "اعرض الاسم (العميل وافق)", type: "boolean" },
      { name: "compound", label: "الكمبوند", type: "text" },
      { name: "order_index", label: "الترتيب", type: "number" },
      { name: "is_active", label: "ظاهر", type: "boolean" },
    ],
  },

  stats: {
    table: "site_stats",
    label: "أرقام الشريط",
    description: "الأربع أرقام في الرئيسية. القسم كله بيختفي لو الجدول فاضي.",
    orderBy: "order_index",
    fields: [
      { name: "key", label: "المعرّف", type: "text", dir: "ltr", required: true, placeholder: "units" },
      { name: "label_ar", label: "الوصف (عربي)", type: "text", required: true },
      { name: "label_en", label: "الوصف (إنجليزي)", type: "text", dir: "ltr" },
      { name: "value", label: "الرقم", type: "number", required: true },
      { name: "suffix_ar", label: "لاحقة (عربي)", type: "text", placeholder: "م²" },
      { name: "suffix_en", label: "لاحقة (إنجليزي)", type: "text", dir: "ltr" },
      { name: "order_index", label: "الترتيب", type: "number" },
    ],
  },

  engineer: {
    table: "engineer_profile",
    label: "بيانات المهندس",
    description: "منها بييجي رقم التليفون والواتساب في كل الموقع.",
    singleton: true,
    orderBy: "name_ar",
    fields: [
      { name: "name_ar", label: "الاسم (عربي)", type: "text", required: true },
      { name: "name_en", label: "الاسم (إنجليزي)", type: "text", dir: "ltr" },
      { name: "title_ar", label: "المسمى (عربي)", type: "text" },
      { name: "title_en", label: "المسمى (إنجليزي)", type: "text", dir: "ltr" },
      { name: "bio_ar", label: "نبذة (عربي)", type: "textarea" },
      { name: "bio_en", label: "نبذة (إنجليزي)", type: "textarea", dir: "ltr" },
      { name: "phone", label: "التليفون", type: "text", dir: "ltr", placeholder: "01xxxxxxxxx" },
      { name: "whatsapp", label: "واتساب", type: "text", dir: "ltr", placeholder: "201xxxxxxxxx" },
      { name: "syndicate_no", label: "رقم النقابة", type: "text", dir: "ltr" },
      { name: "credentials_ar", label: "المؤهلات (عربي) — سطر لكل مؤهل", type: "list" },
      { name: "credentials_en", label: "المؤهلات (إنجليزي)", type: "list", dir: "ltr" },
    ],
  },

  leads: {
    table: "leads",
    label: "الاستفسارات",
    description: "تسجيل يدوي بس — مفيش فورم على الموقع بيغذّي الجدول ده.",
    orderBy: "created_at",
    fields: [
      { name: "name", label: "الاسم", type: "text" },
      { name: "phone", label: "الموبايل", type: "text", dir: "ltr" },
      { name: "note", label: "ملاحظة", type: "textarea" },
    ],
  },
} as const satisfies Record<string, ContentSpec>;

export type ContentKey = keyof typeof CONTENT_SPECS;

export function isContentKey(value: string): value is ContentKey {
  return Object.hasOwn(CONTENT_SPECS, value);
}

export function getContentSpec(key: ContentKey): ContentSpec {
  return CONTENT_SPECS[key];
}
