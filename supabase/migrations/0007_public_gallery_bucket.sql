-- ---------------------------------------------------------------- public gallery bucket
-- The works gallery moves out of the private 'media' bucket into a public one,
-- so its photographs are served by links that never expire.
--
-- Public pages are cached and rebuilt only when visited, and the visitor who
-- triggers a rebuild receives the old copy. With 24-hour signed links, a page
-- left unvisited for a day reached its next visitor with dead image links
-- (measured on production 2026-11-01). See galleryUrl in src/lib/media.ts.
--
-- Only the gallery moves. Stage photos stay in 'media', private and signed.
-- Object paths are unchanged ('gallery/<uuid>.<ext>'), so gallery_images.url
-- needs no update; scripts/copy-gallery-to-public.mjs copies the objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = true;
