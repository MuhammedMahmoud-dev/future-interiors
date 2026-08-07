-- Future Interiors — per-project portal access
--
-- Whether a client can still open their own statement after handover was
-- previously undefined: the portal simply stayed open forever. The engineer now
-- decides per project rather than by a blanket rule.
--
-- Defaults to true, so every existing project keeps working exactly as it did.
--
-- Deliberately NOT related to clients.archived_at. Archiving is housekeeping for
-- the admin's own list and must never revoke access to paid-for work; this flag
-- is a separate, explicit decision. The two are checked independently and
-- scripts/verify-clients.mjs proves an archived client with access enabled still
-- signs in.

alter table projects
  add column portal_access_enabled boolean not null default true;

comment on column projects.portal_access_enabled is
  'Client can open the tracking portal for this project. Independent of clients.archived_at.';
