/**
 * Project slugs.
 *
 * `projects.slug` is NOT NULL UNIQUE, so every project needs one — but nothing
 * reads it any more. /works/[slug] was removed when the portfolio became a
 * photo gallery, getProjectBySlug went with it, and no route, sitemap entry or
 * link resolves a project by slug today.
 *
 * So the engineer no longer types it. It comes from the project code, which is
 * already unique by database constraint, already what he quotes to a client
 * over WhatsApp, and already made of nothing but A-Z, 0-9 and hyphens — so
 * lowercasing is the entire transformation. There is no name to reject, which
 * means there is no way for this to block a save.
 */

/** `FI-HK-XSVR` -> `fi-hk-xsvr`. */
export function slugFromCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Picks the first free slug in the `base`, `base-2`, `base-3` sequence.
 *
 * A code-derived slug should never collide — codes are unique. This exists for
 * the one case that can: a project created before this change, carrying a
 * hand-typed slug that happens to read like a code. Numbering past it beats
 * showing the engineer a constraint violation for a field he cannot even see.
 *
 * `taken` is every slug already starting with `base`, which is one query rather
 * than one per attempt.
 */
export function firstFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
