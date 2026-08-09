# Operations

Running Future Interiors after launch. For architecture and the security model,
see `README.md`.

---

## 1. Resetting the admin password

There is nothing to recover. The plaintext password is stored nowhere — only a
salted hash — so a forgotten password is replaced, never retrieved.

1. Generate a new hash:

   ```bash
   node scripts/admin-password.mjs "the new password"
   ```

   It prints one ready-to-paste line:

   ```
   ADMIN_PASSWORD_HASH=69b57fdda6…:268d14e7f6…
   ```

   Two hex halves separated by a colon — a random salt and the scrypt digest of
   the password with that salt. Both are needed; copy the whole value after the
   `=`.

2. Set it as `ADMIN_PASSWORD_HASH`:
   - **Production:** Vercel → Project → Settings → Environment Variables → edit
     `ADMIN_PASSWORD_HASH` → Save. Paste only the part after `=`.
   - **Locally:** replace the whole line in `.env.local` — the script's output is
     already in that format.

3. **Redeploy.** Environment variables are read at boot; the old hash stays live
   until the deployment is replaced. On Vercel: Deployments → latest → Redeploy.

4. Sign in at `/admin/login` with `ADMIN_EMAIL` and the new password.

The hash is safe to paste into Vercel's UI and safe to keep in `.env.local`. It
is not safe to commit — `.env.local` is gitignored, keep it that way.

**Changing `ADMIN_EMAIL` works the same way.** There is one admin user and no
sign-up, so both values are set by hand.

---

## 2. Environment variables

Ordered by what breaks without them.

| Variable | Missing means | Where it comes from |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Nothing loads. Every page renders its empty state. | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Nothing loads. **Server-only — never prefix it `NEXT_PUBLIC_` and never import it into a client component.** It bypasses RLS. | Supabase → Project Settings → API |
| `SESSION_SECRET` | Client portal and admin login both fail. Changing it signs everyone out. | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `ADMIN_EMAIL` | Admin unreachable. | You choose it |
| `ADMIN_PASSWORD_HASH` | Admin unreachable. | `scripts/admin-password.mjs` (§1) |
| `NEXT_PUBLIC_SITE_URL` | Canonical links, Open Graph and `sitemap.xml` all point at `localhost`. The site works; search and link previews are wrong. | Your production URL, e.g. `https://futureinteriors.example` |
| `NEXT_PUBLIC_WHATSAPP` | Falls back to `engineer_profile.whatsapp`, then `.phone`. Works, but explicit is safer. | International digits, no `+`: `201115134141` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Only `npm run verify` (the RLS check) fails. The site is unaffected. | Supabase → Project Settings → API |

After changing any of them in Vercel, **redeploy**.

---

## 3. Migrations

Run in the Supabase SQL editor, in this order, on a new project:

| Order | File | What it does |
| --- | --- | --- |
| 1 | `supabase/migrations/0001_schema.sql` | Tables, RLS, `gen_project_code()`, the storage bucket |
| 2 | `supabase/migrations/0002_seed_lookups.sql` | Six stages, six services, seven FAQs |
| 3 | `supabase/migrations/0003_clients.sql` | Clients as their own table |
| 4 | `supabase/migrations/0004_portal_access.sql` | `projects.portal_access_enabled` |
| 5 | `supabase/migrations/0005_project_lifecycle.sql` | `projects.archived_at`, `deleted_projects_log` |

**They are not idempotent.** Running one twice raises an error (`already exists`)
rather than doing nothing. On an existing database run only the ones that have
not been applied.

**Take a backup before every migration** (§4). A migration is exactly the kind of
change that cannot be undone on the free plan.

---

## 4. Backups

Supabase's free plan has **no point-in-time recovery**. These exports are the
only way back from a mistaken delete or a bad migration.

### Taking one

```bash
node --env-file=.env.local scripts/backup-export.mjs
```

Writes `backups/<YYYY-MM-DD>/` with one JSON file per table plus
`manifest.json`. The script cross-checks every table against the server's own
row count and **exits non-zero if any disagree** — if that happens, do not treat
the export as a backup.

`backups/` is gitignored: the files contain client names, phone numbers and every
figure in every statement. Keep them somewhere private.

**How often:** weekly, and always immediately before running a migration.

### Restoring

Deliberately manual. An automated restore that has never been run is a false
comfort; this procedure is honest about being a careful, checked operation.

1. Open `manifest.json` and note the row count for each table.
2. Restore in the order given by `restore_order` in that same manifest —
   parents before children, or the foreign keys reject the insert:

   ```
   clients → stages → projects → expenses → payments → project_stages
   → project_media → services → testimonials → faqs → site_stats
   → engineer_profile → leads
   ```

3. For each table, POST its file back:

   ```bash
   curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     --data-binary @backups/2026-08-07/clients.json
   ```

4. Verify each table's count matches the manifest before moving to the next.

Rows keep their original `id`, so relationships survive. Restoring into a table
that still holds rows will collide on the primary key — restore into an empty
table, or delete the conflicting rows first.

**Storage is not covered.** Project photographs live in the Supabase `media`
bucket, and this exports the database only — `project_media.url` will point at
objects that must still exist. Download the bucket separately if you need a
complete restore.

### Running it automatically

Not set up. Two options, with the trade-off stated plainly:

**Vercel Cron.** Add an API route (e.g. `app/api/backup/route.ts`) guarded by a
`CRON_SECRET`, and a `crons` entry in `vercel.json`. Vercel's filesystem is
ephemeral, so the route cannot keep a file — it has to upload, most simply to a
private Supabase Storage bucket.

> **The caveat that matters:** backing Supabase up *into* Supabase protects
> against application-level accidents — a wrong delete, a bad migration — but
> not against losing the Supabase project itself. For that, the destination has
> to be somewhere else.

Vercel's Hobby plan allows one cron run per day.

**Scheduled locally.** Windows Task Scheduler running the command above weekly,
onto a machine you control. Less automatic, genuinely off-site.

Recommendation: the local schedule is the real backup; add the cron later if a
daily copy is wanted as well.

---

## 5. Adding a client and a project

1. Sign in at `/admin`.
2. **Projects → مشروع جديد.**
3. In the client picker, search by name or phone. Any format is accepted —
   `01115134141`, `+20 111 513 4141` and `00201115134141` all find the same
   person.
   - **If they already exist, link them.** A returning client with a second
     apartment must not be entered twice; that is what the clients table is for.
   - If not, fill in the name and phone to create them from the same form.
4. Fill in the project. `unit_no` and `building_no` are private and never appear
   on a public page — see the leak barrier in `src/lib/publicFields.ts`.
5. Save. **The project code is generated automatically** in the form
   `FI-XX-XXXX`, using a random, non-sequential generator. It cannot be chosen.
6. Leave **"العميل يقدر يتابع المشروع من البوابة"** ticked — the default — so the
   client can open their portal (§6).

### Sending the code to the client

The client needs two things:

- the **project code**, exactly as shown on the project page
- the **mobile number on file** — theirs; whatever format they type is normalised

Send the code **by hand over WhatsApp**. There is no SMS and no automatic
delivery, deliberately: the code is the real credential, and it is handed over
in a conversation you control.

Suggested message:

> كود متابعة مشروعك: `FI-XX-XXXX`
> افتح الرابط واكتب الكود ورقم موبايلك: `https://<site>/ar/track`

The code never appears in a URL after signing in, so a shared screenshot of the
dashboard does not leak it.

---

## 6. Opening and closing a client's portal

Each project has its own switch: **Projects → the project → "وصول العميل
للبوابة"**. On by default.

- **Unticking it** closes that client's portal. It takes effect immediately — an
  existing session is refused on its next page view, not when the eight-hour
  cookie expires.
- The client sees a distinct, non-blaming message pointing them at WhatsApp, not
  the generic "wrong code or number".
- **Ticking it again** restores access.

**This has nothing to do with archiving a client.** Archiving only hides them
from the admin's active list; an archived client whose switch is on still signs
in normally. That separation is enforced by `src/lib/portalAccess.test.ts` and
proved end to end by `npm run verify:clients   # portal access and archiving, end to end
npm run verify:lifecycle # archive/delete refusals, called straight at the action`.

---

## 7. Retiring a project: archive, or delete

Both live at the bottom of a project's **بيانات المشروع** tab.

**Archiving is the normal one.** It hides the project from the admin list and
does nothing else — the photos stay in the public gallery if the project was
published, and the client's portal keeps working. There is a
`عرض المؤرشف (n)` link above the list to bring them back into view, and
`استرجاع المشروع` on the project itself. Archive a finished project; that is
what it is for.

**Deleting is for a project that should never have existed** — a duplicate, a
typo, a test row. It is permanent, and it is refused outright if the project has
even one expense or one payment. That refusal is enforced on the server, not by
the button: `deleteProject` counts both ledgers before it deletes anything
(`src/lib/projectDelete.test.ts` asserts that ordering). If you genuinely need a
project with a ledger gone, empty the ledger first — deliberately, row by row.

A delete also removes the project's photographs from storage, and writes the
code, title, client id and timestamp into `deleted_projects_log`. That log is
the only trace left, and it exists because project codes get written down and
asked about weeks later. It is included in the backup set.

To confirm a delete you type the project's code. Nothing else enables the
button.

---

## 8. Routine checks

```bash
npm test              # 61 unit tests, no network
npm run lint
npm run build
```

Against the live project, with `npm run dev` running:

```bash
npm run verify          # RLS, the privacy sweep, canonical tags
npm run verify:admin    # admin guards, session isolation, the money figures
npm run verify:clients  # archiving and portal access
npm run verify:lifecycle # archive and delete, called straight at the action
```

Each writes a throwaway probe row and deletes it again. Safe to run against
production, though it is better run against a staging project if one exists.
