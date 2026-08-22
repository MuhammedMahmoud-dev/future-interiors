/**
 * The barrier between the verification scripts and the real client data.
 *
 * Every verify script writes: it creates probe projects, uploads storage
 * objects, archives, deletes. Run one against production and it is operating on
 * a live ledger. During a mutation-testing session exactly that happened — a
 * deliberately broken delete swept a real gallery photograph out of the
 * production bucket. With real client names and real money in those tables, the
 * same accident is not recoverable from an export taken last week.
 *
 * Two independent checks, because one is a single point of failure:
 *
 *   1. A DENY-LIST of the production project ref, hard-coded in this file. This
 *      is the check that actually matters: it lives in committed source, so
 *      forgetting an environment variable cannot defeat it. Point a script at
 *      production and it stops before the first write, whatever the env says.
 *
 *   2. A POSITIVE assertion that the environment declares itself a test
 *      database (FI_TEST_DB=1). This catches a third project that is neither
 *      production nor the intended test target.
 *
 * The production ref is not a secret. It is the hostname in
 * NEXT_PUBLIC_SUPABASE_URL, which ships to every browser that loads the site —
 * committing it here reveals nothing that curl does not already show, and is
 * what makes check 1 unforgeable.
 *
 * There is deliberately no override flag. Every script guarded by this writes
 * data; none of them has a legitimate reason to write to production. If that
 * ever changes, the change should be a visible edit to this file, not an
 * environment variable somebody sets once and forgets.
 */

const PRODUCTION_REF = "gtfgogayoxmamldvttls";

/** `https://abcd.supabase.co` -> `abcd` */
export function projectRef(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

function die(lines) {
  console.error(`\n${"═".repeat(64)}`);
  console.error("REFUSING TO RUN");
  console.error("═".repeat(64));
  for (const line of lines) console.error(line);
  console.error("═".repeat(64) + "\n");
  process.exit(1);
}

/**
 * Call this before the first write in every verification script.
 *
 * Returns the resolved config so a script cannot accidentally read the
 * environment directly and skip the check on the way past.
 */
export function requireTestDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!url || !secret) {
    die([
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
      "",
      "The verification scripts run against the TEST database:",
      "  node --env-file=.env.test scripts/<script>.mjs",
      "",
      "See OPERATIONS.md — Setting up the test database.",
    ]);
  }

  const ref = projectRef(url);

  /*
   * The API URL, not the dashboard one. Pasting
   * https://supabase.com/dashboard/project/<ref> is the easy mistake — it looks
   * right, it contains the ref, and it is what the browser shows. It parses to
   * a hostname of "supabase.com", which is neither production nor obviously
   * wrong, so every request afterwards 404s for reasons that read like
   * something else entirely.
   */
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.(co|in)$/.test(url.replace(/\/+$/, ""))) {
    die([
      `NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase API URL:`,
      `  ${url}`,
      "",
      "It should be the Project URL from Project Settings -> API:",
      "  https://<ref>.supabase.co",
      "",
      "Not the dashboard address (https://supabase.com/dashboard/project/<ref>),",
      "which contains the same ref but is not an API endpoint.",
    ]);
  }

  if (ref === PRODUCTION_REF) {
    die([
      `This is the PRODUCTION database (${ref}).`,
      "",
      "These scripts create, archive and delete projects, and remove storage",
      "objects. Against production that is real client data.",
      "",
      "Use the test project instead:",
      "  node --env-file=.env.test scripts/<script>.mjs",
    ]);
  }

  if (process.env.FI_TEST_DB !== "1") {
    die([
      `The database at ${ref} does not declare itself a test database.`,
      "",
      "Add this line to .env.test:",
      "  FI_TEST_DB=1",
      "",
      "It exists so a project that is neither production nor your test target",
      "cannot be written to by accident.",
    ]);
  }

  return { url, secret, sessionSecret, ref };
}

/**
 * The other half of the isolation, and the half that is easy to miss.
 *
 * A verification script talks to the database directly AND drives the dev
 * server over HTTP. The guard above only covers the first. The Server Actions
 * the script invokes run inside Next, which loads .env.local — production —
 * unless the server was started with the test env. So `npm run dev` in one
 * terminal and `npm run verify:lifecycle` in another means fixtures created in
 * the test database and deletes executed against production.
 *
 * Worse, it does not fail loudly. verify-privacy would publish its probe to the
 * test database, grep pages rendered from production, find nothing, and report
 * every page clean — a green run that checked nothing at all.
 *
 * So: write a marker row here, and require the server to see it.
 *
 *   npm run dev:test    — the dev server on the test database
 */
export async function assertSameDatabase({ url, secret, sessionSecret, site }) {
  const { createSessionToken } = await import("../../src/lib/session.ts");

  const marker = `zz-samedb-${Date.now().toString(36)}`;
  const api = (path, init = {}) =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

  const insert = await api("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug: marker,
      title_ar: marker,
      supervision_rate: 0.15,
      status: "in_progress",
    }),
  });

  if (!insert.ok) {
    die([`Could not write a marker row to ${projectRef(url)}:`, `  ${await insert.text()}`]);
  }

  /*
   * die() calls process.exit, which does NOT run a finally block — so every
   * failing check used to leave its marker project behind in the database.
   * Found exactly that way: a stray zz-samedb-* row after a guard fired.
   */
  const removeMarker = () => api(`projects?slug=eq.${marker}`, { method: "DELETE" });
  const dieCleanly = async (lines) => {
    await removeMarker();
    die(lines);
  };

  try {
    const cookie = `fi_admin=${createSessionToken(
      process.env.ADMIN_EMAIL ?? "eng@futureinteriors.test",
      sessionSecret,
      "admin",
      60 * 60,
    )}`;

    const res = await fetch(`${site}/admin/projects`, { headers: { cookie } });

    /*
     * Separate "could not ask" from "asked and the answer was no".
     *
     * An earlier version reported a database mismatch whenever the marker was
     * absent — and the first time it fired, the real cause was a 500 from a
     * too-short SESSION_SECRET. Announcing the wrong cause confidently is the
     * failure this whole audit is about, so a non-200 is now its own message.
     */
    if (res.status !== 200) {
      await dieCleanly([
        `${site}/admin/projects answered ${res.status}, so the database it reads`,
        "could not be determined.",
        "",
        res.status === 500
          ? "A 500 here is usually SESSION_SECRET: it must be at least 32 characters."
          : "Is the dev server running, and is the admin session valid?",
        "",
        "  npm run dev:test",
      ]);
    }

    const html = await res.text();

    if (!html.includes(marker)) {
      await dieCleanly([
        `The dev server at ${site} is NOT reading the same database.`,
        "",
        `A row written to ${projectRef(url)} is not visible to it, so the`,
        "Server Actions this script calls would run against a different",
        "database — most likely production, via .env.local.",
        "",
        "Start the server with the test environment instead:",
        "  npm run dev:test",
      ]);
    }
  } finally {
    await removeMarker();
  }
}
