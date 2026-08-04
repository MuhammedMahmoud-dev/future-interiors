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
