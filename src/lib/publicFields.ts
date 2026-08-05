/**
 * The leak barrier.
 *
 * The realistic way private data reaches a public page is `select('*')` on
 * `projects`, which would ship unit_no, client_name and supervision_rate
 * straight into the rendered HTML. So public queries never use `*` — they use
 * this allowlist, and a test asserts it contains none of the private fields.
 *
 * Kept dependency-free so it can be imported by both the server client and the
 * test runner.
 */

/**
 * `compound` and `district` were here. Nothing on the public site renders a
 * location any more, so they come off the allowlist too — a column that cannot
 * be selected cannot be leaked back onto a page by a later edit.
 *
 * They remain in the database, in the admin, and in the client's own portal,
 * which has its own `select` in lib/portal.ts.
 */
export const PUBLIC_PROJECT_COLUMNS = [
  "id",
  "slug",
  "title_ar",
  "title_en",
  "description_ar",
  "description_en",
  "area_m2",
  "start_date",
  "end_date",
  "status",
  "cover_image",
].join(",");

/**
 * Never selectable on a public page. The project code is private too — it is
 * the portal key. `client_id` is listed because selecting it would let a public
 * query embed `clients(...)` and pull a name and mobile number with it.
 */
export const PRIVATE_PROJECT_FIELDS = [
  "code",
  "unit_no",
  "building_no",
  "client_id",
  "clients",
  "supervision_rate",
] as const;

export const PUBLIC_MEDIA_COLUMNS = [
  "id",
  "url",
  "type",
  "caption_ar",
  "caption_en",
  "phase",
  "stage_id",
  "sort_order",
].join(",");
