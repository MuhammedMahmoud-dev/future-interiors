-- Future Interiors — full setup. Paste into Supabase SQL editor and Run.
-- Generated from migrations/ in order.

-- Future Interiors — core schema
-- Security model: RLS is enabled on every table with ZERO policies.
-- That denies anon and authenticated completely. Only the service_role key
-- (server-side only) bypasses RLS. There is no client-side data access.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- lookups

create table stages (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  name_en     text,
  order_index int  not null default 0
);

-- ---------------------------------------------------------------- projects

create table projects (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,          -- PRIVATE. default set below, after gen_project_code() exists
  slug        text unique not null,

  -- public-facing, deliberately vague title: "شقة 200م - كمبوند كالما"
  title_ar    text not null,
  title_en    text,
  description_ar text,
  description_en text,

  -- PRIVATE — must never reach a public page
  unit_no      text,
  building_no  text,
  client_name  text,
  client_phone text,
  supervision_rate numeric(5,4) not null default 0.15
    check (supervision_rate >= 0 and supervision_rate <= 1),

  -- public metadata
  compound   text,
  district   text,
  area_m2    numeric(8,2),
  start_date date,
  end_date   date,
  status     text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'on_hold')),

  cover_image text,

  -- a project is public only when BOTH are set (client consent gate)
  is_public           boolean not null default false,
  publish_approved_at timestamptz,

  created_at timestamptz not null default now()
);

create index projects_public_idx on projects (is_public, publish_approved_at);
create index projects_status_idx on projects (status);

-- Random, non-sequential project code: FI-32-K7Q4
-- The code is the real access control for the client portal, so it uses
-- pgcrypto's CSPRNG, not random(). Alphabet excludes 0/O and 1/I.
-- search_path is pinned so gen_random_bytes resolves whether pgcrypto lives
-- in public or in Supabase's extensions schema.
create or replace function gen_project_code() returns text
language plpgsql volatile
set search_path = extensions, public, pg_temp
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';  -- 32 chars
  bytes    bytea;
  chars    text;
  candidate text;
begin
  for attempt in 1..10 loop
    bytes := gen_random_bytes(6);
    chars := '';
    for i in 0..5 loop
      -- 256 % 32 = 0, so (byte % 32) is uniform — no modulo bias
      chars := chars || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    candidate := 'FI-' || substr(chars, 1, 2) || '-' || substr(chars, 3, 4);
    if not exists (select 1 from projects where code = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'gen_project_code: no free code after 10 attempts';
end;
$$;

alter table projects alter column code set default gen_project_code();

-- ---------------------------------------------------------------- money

create table expenses (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  date       date not null,
  item_ar    text not null,
  item_en    text,
  -- negative amounts are legitimate: they are discounts / returns.
  -- deliberately NOT constrained to > 0.
  amount     numeric(14,2) not null,
  stage_id   uuid references stages(id) on delete set null,
  sort_order int not null default 0
);

create index expenses_project_idx on expenses (project_id, date, sort_order);

create table payments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  date       date not null,
  label_ar   text not null,
  label_en   text,
  amount     numeric(14,2) not null,
  seq        int not null default 0
);

create index payments_project_idx on payments (project_id, date, seq);

-- ---------------------------------------------------------------- progress

create table project_stages (
  project_id   uuid not null references projects(id) on delete cascade,
  stage_id     uuid not null references stages(id)   on delete cascade,
  status       text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  started_at   date,
  completed_at date,
  note_ar      text,
  note_en      text,
  primary key (project_id, stage_id)
);

create table project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  stage_id   uuid references stages(id) on delete set null,
  url        text not null,                 -- storage object path inside the 'media' bucket
  type       text not null default 'image' check (type in ('image', 'video')),
  caption_ar text,
  caption_en text,
  phase      text check (phase in ('before', 'during', 'after')),
  is_public  boolean not null default false,
  sort_order int not null default 0
);

create index project_media_project_idx on project_media (project_id, sort_order);

-- ---------------------------------------------------------------- site content

create table services (
  id          uuid primary key default gen_random_uuid(),
  title_ar    text not null,
  title_en    text,
  desc_ar     text,
  desc_en     text,
  bullets_ar  text[] not null default '{}',
  bullets_en  text[] not null default '{}',
  icon        text,                          -- key mapped to an inline SVG in the app
  order_index int not null default 0,
  is_active   boolean not null default true
);

create table testimonials (
  id          uuid primary key default gen_random_uuid(),
  client_name text,
  -- per-client consent: false renders as "عميل — كمبوند كذا" with no name
  show_name   boolean not null default false,
  quote_ar    text not null,
  quote_en    text,
  compound    text,
  order_index int not null default 0,
  is_active   boolean not null default true
);

create table faqs (
  id          uuid primary key default gen_random_uuid(),
  question_ar text not null,
  question_en text,
  answer_ar   text not null,
  answer_en   text,
  order_index int not null default 0,
  is_active   boolean not null default true
);

create table site_stats (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  label_ar    text not null,
  label_en    text,
  value       numeric(14,2) not null,
  suffix_ar   text,
  suffix_en   text,
  order_index int not null default 0
);

create table engineer_profile (
  id             uuid primary key default gen_random_uuid(),
  name_ar        text not null,
  name_en        text,
  title_ar       text,
  title_en       text,
  bio_ar         text,
  bio_en         text,
  phone          text,
  whatsapp       text,
  syndicate_no   text,
  credentials_ar text[] not null default '{}',
  credentials_en text[] not null default '{}'
);

create table leads (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  phone      text,
  note       text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- rate limiting
-- Used by the client portal login (phase 2): 5 attempts / 15 min per (ip + code).
-- Lives in Postgres because an in-memory counter does not survive serverless
-- instances on Vercel.

create table login_attempts (
  id           bigserial primary key,
  ip           text not null,
  code         text not null,
  attempted_at timestamptz not null default now()
);

create index login_attempts_lookup_idx on login_attempts (ip, code, attempted_at desc);

-- ---------------------------------------------------------------- RLS
-- Enabled with no policies == total denial for anon/authenticated.
-- service_role bypasses RLS and is the only path in, server-side only.

alter table projects         enable row level security;
alter table expenses         enable row level security;
alter table payments         enable row level security;
alter table stages           enable row level security;
alter table project_stages   enable row level security;
alter table project_media    enable row level security;
alter table services         enable row level security;
alter table testimonials     enable row level security;
alter table faqs             enable row level security;
alter table site_stats       enable row level security;
alter table engineer_profile enable row level security;
alter table leads            enable row level security;
alter table login_attempts   enable row level security;

-- ---------------------------------------------------------------- storage
-- Private bucket. Public pages render short-lived signed URLs generated
-- server-side, so nothing is world-readable by object path.

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;


-- Future Interiors — lookup + structural content seed
--
-- This seeds ONLY content that is fixed by the spec itself: the six execution
-- stages, the six service categories, and the FAQ topics.
--
-- Deliberately NOT seeded (must stay empty until filled with real data):
--   projects · project_media · site_stats · testimonials · engineer_profile
-- The public site hides those sections entirely while they are empty.
--
-- Wording here is a first draft derived from the spec — review and edit it.

-- ---------------------------------------------------------------- stages

insert into stages (name_ar, name_en, order_index) values
  ('تأسيس',           'Rough-in',          1),
  ('محارة',           'Plastering',        2),
  ('سيراميك',         'Tiling',            3),
  ('جبس بورد',        'Gypsum board',      4),
  ('نقاشة',           'Painting',          5),
  ('تشطيبات نهائية',  'Final finishes',    6);

-- ---------------------------------------------------------------- services

insert into services (title_ar, title_en, desc_ar, desc_en, bullets_ar, bullets_en, icon, order_index) values
  ('تأسيس', 'Rough-in',
   'تأسيس الكهرباء والسباكة من الصفر بمواسير ومسارات مدروسة قبل أي تشطيب.',
   'Electrical and plumbing rough-in laid out from scratch before any finishing work.',
   array['تأسيس كهرباء ولوحات توزيع', 'تأسيس سباكة وصرف', 'مسارات تكييف', 'اختبار ضغط قبل التغطية'],
   array['Electrical rough-in and distribution boards', 'Plumbing and drainage rough-in', 'HVAC routing', 'Pressure testing before closing'],
   'rough-in', 1),

  ('محارة وأرضيات', 'Plastering & screed',
   'ضبط الحوائط والأرضيات بميزان الليزر عشان كل اللي بعدها يركب مظبوط.',
   'Walls and floors levelled with a laser so every later trade lands square.',
   array['محارة بالليزر', 'ضبط الزوايا والفتحات', 'صبة الأرضيات', 'عزل المناطق الرطبة'],
   array['Laser-guided plastering', 'Squaring corners and openings', 'Floor screed', 'Wet-area waterproofing'],
   'plaster', 2),

  ('سيراميك ورخام', 'Tiling & marble',
   'تركيب الأرضيات والحوائط بتوزيع مدروس يقلل الهدر ويضبط خطوط الفواصل.',
   'Floor and wall tiling set out to cut waste and keep joint lines true.',
   array['سيراميك وبورسلين', 'رخام أرضيات ودرج', 'تجهيز الحمامات والمطبخ', 'ضبط فواصل ومناسيب'],
   array['Ceramic and porcelain', 'Marble floors and stairs', 'Bathroom and kitchen prep', 'Joint and level control'],
   'tiling', 3),

  ('جبس بورد', 'Gypsum board',
   'أسقف وديكورات جبس بورد بإضاءة مخفية متوافقة مع تأسيس الكهرباء.',
   'Gypsum ceilings and features with cove lighting coordinated with the electrical rough-in.',
   array['أسقف معلقة', 'بيوت نور وإضاءة مخفية', 'ديكورات حوائط', 'تجهيز أماكن السبوتات'],
   array['Suspended ceilings', 'Cove and concealed lighting', 'Wall features', 'Spotlight cut-outs'],
   'gypsum', 4),

  ('دهانات', 'Painting',
   'معجون ودهانات بطبقات كاملة مع تجهيز السطح، مش طبقة واحدة على السريع.',
   'Full putty and paint build-up with proper surface prep, not a single quick coat.',
   array['معجون وسنفرة', 'سيلر وأساس', 'دهانات بلاستيك وزيت', 'دهانات وديكورات خاصة'],
   array['Putty and sanding', 'Sealer and primer', 'Emulsion and oil paint', 'Specialty decorative finishes'],
   'paint', 5),

  ('تشطيبات نهائية', 'Final finishes',
   'تركيب الأطقم والأبواب والمطابخ وتسليم الشقة جاهزة للسكن.',
   'Fixtures, doors, kitchens and joinery installed and the unit handed over ready to live in.',
   array['أطقم حمامات وخلاطات', 'أبواب وشبابيك', 'مطابخ ودواليب', 'تركيب إنارة وتسليم'],
   array['Sanitary ware and mixers', 'Doors and windows', 'Kitchens and wardrobes', 'Light fitting and handover'],
   'finishes', 6);

-- ---------------------------------------------------------------- faqs
-- No figures, rates, or price-per-metre anywhere in these answers.

insert into faqs (question_ar, question_en, answer_ar, answer_en, order_index) values
  ('إزاي بتتحدد التكلفة النهائية؟',
   'How is the final cost determined?',
   'التكلفة النهائية بتتبني على التكلفة الفعلية للخامات والعمالة زي ما اتصرفت بالظبط، مش رقم مقطوع متحدد من الأول. كل بند بيتسجل بتاريخه وبيظهر في كشف حساب مشروعك أول بأول. تقدر تشوف تفاصيل الطريقة في صفحة نظام العمل.',
   'The final cost is built from the actual money spent on materials and labour, not a lump sum fixed up front. Every line item is logged with its date and appears in your project statement as it happens. The work system page explains the method in full.',
   1),

  ('أقدر أتابع الفواتير أول بأول؟',
   'Can I follow the invoices as they happen?',
   'أيوة. كل بند بيتسجل في صفحة متابعة خاصة بمشروعك بتفتحها بكود خاص بيك، وبتلاقي فيها البنود والدفعات وصور مراحل التنفيذ محدّثة، من غير ما تستنى كشف حساب ورقي في آخر الشهر.',
   'Yes. Every line item is logged on a tracking page specific to your project, opened with your own code. You see items, payments and stage photos as they are updated, without waiting for a paper statement at month end.',
   2),

  ('الخامات بتتشترى باسم مين؟',
   'Whose name are the materials bought in?',
   'الخامات بتتشترى باسمك إنت ومن الموردين مباشرة، وكل فاتورة بتوصلك. ده معناه إن الأسعار اللي بتتحاسب عليها هي أسعار السوق الحقيقية اللي إنت شايفها بنفسك.',
   'Materials are bought in your name, directly from suppliers, and every invoice reaches you. That means the prices you are charged are the real market prices you can see for yourself.',
   3),

  ('مين المشرف على الشغل يومياً؟',
   'Who supervises the work day to day?',
   'الإشراف الهندسي اليومي مسؤولية المهندس محمود الحديدي شخصياً — متابعة الفنيين، مراجعة جودة كل مرحلة قبل ما اللي بعدها تبدأ، وتوثيق التنفيذ بالصور.',
   'Day-to-day engineering supervision is Eng. Mahmoud El-Hadidy''s own responsibility — following the trades, checking the quality of each stage before the next begins, and documenting the work in photos.',
   4),

  ('التنفيذ بياخد قد إيه؟',
   'How long does execution take?',
   'المدة بتختلف حسب مساحة الوحدة ومستوى التشطيب ونطاق الشغل المطلوب. بعد المعاينة بتستلم جدول زمني بمراحل واضحة وتاريخ متوقع لكل مرحلة، وبتقدر تتابع تقدم كل مرحلة من صفحة المتابعة.',
   'It varies with the unit''s area, the finishing level and the scope of work. After the site visit you receive a schedule with clear stages and an expected date for each, and you can follow each stage''s progress from the tracking page.',
   5),

  ('فيه ضمان بعد التسليم؟',
   'Is there a warranty after handover?',
   'أيوة، فيه فترة ضمان على أعمال التنفيذ بتتحدد وتتكتب في الاتفاق قبل بداية الشغل، بتغطي عيوب التنفيذ. الخامات نفسها بيغطيها ضمان الشركة المنتجة والفواتير باسمك فبتقدر ترجعلهم مباشرة.',
   'Yes. A warranty period on the execution work is agreed and written into the contract before work starts, covering workmanship defects. The materials themselves are covered by their manufacturer''s warranty, and since the invoices are in your name you can go back to them directly.',
   6),

  ('الدفع بيكون على دفعات؟',
   'Are payments made in instalments?',
   'أيوة، الدفع بيكون على دفعات مربوطة بمراحل التنفيذ مش دفعة واحدة. كل دفعة بتتسجل بتاريخها في كشف حساب مشروعك، وبتشوف في أي وقت إجمالي اللي اتدفع مقابل إجمالي اللي اتصرف.',
   'Yes. Payments are made in instalments tied to execution stages, not in one go. Each payment is logged with its date in your project statement, and at any time you can see total paid against total spent.',
   7);


-- Future Interiors — clients as their own table
--
-- Client identity used to live as client_name / client_phone columns on
-- projects. That models a project, not a person: a returning client with a
-- second apartment produced a second unlinked copy of their details, and there
-- was no way to ask how many projects someone has with us.
--
-- Safe to drop the old columns outright: every project table was verified empty
-- before this ran, so there is nothing to migrate.

create table clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Stored already normalised (no +20, no leading zero) so the unique index
  -- below actually bites: +20 111…, 0111… and 20111… collapse to one row.
  phone       text not null,
  created_at  timestamptz not null default now(),
  -- null = active. Archiving hides a client from the admin list and nothing
  -- else — it must never affect their portal access.
  archived_at timestamptz
);

create unique index clients_phone_key on clients (phone);
create index clients_active_idx on clients (archived_at);

-- RLS on, zero policies: anon and authenticated denied outright, same as every
-- other table. Only the server's service_role key gets in.
alter table clients enable row level security;

-- on delete restrict, deliberately: a client holding projects must be archived,
-- never deleted, so a ledger can never be orphaned from the person it belongs to.
alter table projects
  add column client_id uuid references clients(id) on delete restrict,
  drop column client_name,
  drop column client_phone;

create index projects_client_idx on projects (client_id);


