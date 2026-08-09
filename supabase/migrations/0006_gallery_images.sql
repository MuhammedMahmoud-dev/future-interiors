-- Future Interiors — the works gallery becomes site content
--
-- The portfolio stopped being project pages a while ago: /works is a lightbox of
-- photographs with no titles, no areas and no links. But the photographs stayed
-- in project_media, attached to a project by foreign key, which meant a gallery
-- photo had to belong to *some* project — and the restore script duly invented
-- three fake ones to hang them from.
--
-- Deleting a project then deleted the gallery. That is correct behaviour for a
-- photo that belongs to a project, and catastrophic for a photo that is really
-- site content. It happened, twice.
--
-- So a gallery photograph gets its own table, with the same standing as a
-- service or an FAQ: content the engineer publishes, owned by nothing.

create table gallery_images (
  id         uuid primary key default gen_random_uuid(),

  -- Object path inside the private 'media' bucket. Served through signed URLs
  -- like every other image; the path is never public.
  url        text not null,

  caption_ar text,
  caption_en text,

  -- Display order on /works and on the homepage. Not unique: two photos may
  -- briefly share a position mid-reorder, and refusing that would make the
  -- move-up button fail rather than the order look odd for one render.
  sort_order int     not null default 0,

  -- Uploaded photographs are visible by default. Unlike project_media there is
  -- no client privacy at stake here: nothing reaches this table except by the
  -- engineer deliberately uploading it to the gallery.
  is_public  boolean not null default true,

  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- no owner
--
-- There is deliberately NO project_id, and no foreign key to anything.
--
-- That absence is the entire point of this migration, so it is worth stating
-- plainly rather than leaving to be inferred: nothing about a project's
-- lifecycle may touch these rows. Deleting a project, archiving it, unlinking
-- its client — none of it can reach the gallery, because there is no path from
-- one to the other. A test asserts this file contains no `references`.
--
-- project_media keeps the opposite job, and keeps its foreign key: those are
-- the stage photographs a client sees in their own portal, they belong to one
-- project, and they should die with it.

create index gallery_images_order_idx on gallery_images (sort_order);

-- RLS on with zero policies, like every other table: anon and authenticated are
-- denied outright and only the server's service_role key gets in.
alter table gallery_images enable row level security;

comment on table gallery_images is
  'Public works gallery. Site content with no owner — never attach it to a project.';
