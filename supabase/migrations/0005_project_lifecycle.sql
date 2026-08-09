-- Future Interiors — project archiving, and a trace of deletions
--
-- Two gaps this closes. A finished project cluttered the admin list with no way
-- to put it away, and a project entered by mistake could only be removed from
-- the Supabase dashboard.
--
-- Archiving is the ordinary case and deletion is the exception, so archiving is
-- what the interface leads with.

-- ---------------------------------------------------------------- archiving
--
-- Exactly the semantics clients.archived_at already has: housekeeping for the
-- admin's own list and NOTHING else. It must never affect
--   * the client's portal access — that is projects.portal_access_enabled, a
--     separate and explicit decision
--   * public visibility — that stays is_public AND publish_approved_at
--
-- A finished project is the likeliest thing to be archived, and its photographs
-- are exactly what the engineer wants to keep in the public gallery.

alter table projects
  add column archived_at timestamptz;

create index projects_active_idx on projects (archived_at);

comment on column projects.archived_at is
  'Hidden from the admin project list. Never affects portal access or public visibility.';

-- ---------------------------------------------------------------- delete log
--
-- Deletion is only ever permitted for a project with no expenses and no
-- payments, so nothing financial is ever lost. What IS lost without this table
-- is the knowledge that a code was issued at all — and codes get written down,
-- sent over WhatsApp, and asked about weeks later. This is cheap insurance
-- against "what was FI-4V-F7UC?".
--
-- client_id is deliberately NOT a foreign key. This is an audit record, not a
-- relation: it has to outlive whatever it points at, and a real FK would either
-- block deleting the client (RESTRICT) or quietly erase the link (SET NULL).
-- Keeping the raw uuid preserves the fact even when the row it named is gone.

create table deleted_projects_log (
  id         uuid primary key default gen_random_uuid(),
  code       text        not null,
  title_ar   text,
  client_id  uuid,
  deleted_at timestamptz not null default now()
);

create index deleted_projects_log_code_idx on deleted_projects_log (code);

-- RLS on with zero policies, like every other table: anon and authenticated are
-- denied outright and only the server's service_role key gets in.
alter table deleted_projects_log enable row level security;

comment on table deleted_projects_log is
  'Trace of deleted projects. Deletion requires an empty ledger, so no financial record is ever lost here.';
