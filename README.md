# Future Interiors

Portfolio and client-tracking site for an engineer-supervised apartment finishing
practice. Next.js 16 (App Router) · Tailwind v4 · Supabase · Arabic-first with English.

**Phase 1 (this repo state):** database schema + the full public site.
Phase 2: client portal (`/track`) + PDF statement. Phase 3: admin dashboard.

## Setup

1. **Environment.** Copy `.env.example` to `.env.local` and fill in from
   Supabase → Project Settings → API:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

   `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is server-only and must never be
   given a `NEXT_PUBLIC_` prefix or imported into a client component.

2. **Database.** In the Supabase SQL editor, run in order:

   - `supabase/migrations/0001_schema.sql` — tables, RLS, `gen_project_code()`, storage bucket
   - `supabase/migrations/0002_seed_lookups.sql` — the six stages, six services, seven FAQs

3. **Run.**

   ```bash
   npm run dev
   ```

## Checks

```bash
npm test
```

Covers the mandatory acceptance case from the spec — `total_cost 893,004 →
supervision_fee 133,951 → grand_total 1,026,955 → payments 1,060,000 → balance
+33,045` — plus the leak-barrier assertion that no private project field can be
selected publicly.

```bash
npm run build
```

```bash
npm run verify
```

Runs against the live Supabase project (dev server must be up). Confirms the
migrations landed, RLS denies the publishable key on every table, project codes
auto-generate in the right shape, and — by publishing a throwaway project full of
distinctive private values and grepping every public page for them — that nothing
private reaches the HTML. The probe row is deleted afterwards.

## Adding content

Until the admin dashboard lands in phase 3, content is entered through the
Supabase **Table Editor**. Nothing is seeded with placeholder data, and every
data-driven section hides itself entirely while its table is empty — so the site
is presentable at any stage of filling it in.

| What | Where | Notes |
| --- | --- | --- |
| Hero photograph | `public/hero.jpg` | One real photo. A file, not a database row. |
| The four headline numbers | `site_stats` | Section stays hidden until rows exist |
| Projects | `projects` | `code` auto-generates. Set **both** `is_public` and `publish_approved_at` to publish |
| Photos | `project_media` + `media` bucket | `url` is the object path inside the bucket; set `is_public` per photo |
| Before/after | `project_media.phase` | The comparison slider appears only when a `before` **and** an `after` photo both exist |
| Stage progress | `project_stages` | Drives the project timeline |
| Testimonials | `testimonials` | `show_name` is the per-client consent flag — false renders anonymously |
| Engineer bio, phone, syndicate no. | `engineer_profile` | Supplies the phone and WhatsApp number site-wide |

Review before launch: the FAQ answers, the service descriptions, and the client
journey step durations are first drafts written from the spec.

## What is private

These never appear on a public page, enforced by an allowlist in
`src/lib/publicFields.ts` and asserted by a test:

`projects.code` · `unit_no` · `building_no` · `client_name` · `client_phone` ·
`supervision_rate`

The supervision rate is private everywhere, including its own page: `/work-system`
explains the process with no figure, percentage, or price per metre in it.

## Layout notes

- `src/proxy.ts` — Next 16 renamed the `middleware` convention to `proxy`. Redirects `/` → `/ar`.
- `src/app/[locale]/layout.tsx` is the root layout (it owns `<html lang dir>`); there is deliberately no `src/app/layout.tsx`.
- `src/lib/finance.ts` is the only place money is added up. Postgres returns
  `numeric` as a **string**, so every amount goes through `Number()` there.
- Storage is a private bucket; images are served as server-signed URLs valid 24h,
  against pages that revalidate hourly.
- Every table has RLS enabled with zero policies: anon and authenticated are denied
  outright, and the server's service_role key is the only way in.
