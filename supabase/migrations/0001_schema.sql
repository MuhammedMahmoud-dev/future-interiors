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
