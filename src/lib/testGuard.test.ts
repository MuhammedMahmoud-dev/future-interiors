import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/**
 * No verification script may run against the production database.
 *
 * Every one of them writes — probe projects, storage objects, archives,
 * deletes. During a mutation-testing session a deliberately broken delete swept
 * a real gallery photograph out of the production bucket. With real client
 * ledgers in those tables the same accident is not recoverable.
 *
 * scripts/lib/test-db.mjs is the barrier. This asserts every script actually
 * stands behind it — and does so by READING THE DIRECTORY rather than a list
 * written here, so a script added next month is covered the day it appears
 * instead of the day someone remembers to add it.
 */

const DIR = "scripts";

const verifyScripts = readdirSync(DIR)
  .filter((name) => name.startsWith("verify-") && name.endsWith(".mjs"))
  .map((name) => `${DIR}/${name}`);

test("there are verification scripts to guard", () => {
  // A glob that silently matches nothing would make every test below vacuous.
  assert.ok(verifyScripts.length >= 6, `only found ${verifyScripts.length} verify scripts`);
});

test("every verification script calls the production guard", () => {
  for (const file of verifyScripts) {
    const source = readFileSync(file, "utf8");

    // Matched on the module and the name, not on one exact import line: the
    // scripts import assertSameDatabase alongside it, and pinning the literal
    // text made this fail for a reason that had nothing to do with the guard.
    assert.match(source, /from "\.\/lib\/test-db\.mjs"/, `${file} does not import the guard`);
    assert.match(
      source,
      /\brequireTestDatabase\b[\s\S]*?from "\.\/lib\/test-db\.mjs"/,
      `${file} does not import requireTestDatabase`,
    );

    // Importing is not calling. A script that imports and forgets to call it
    // looks guarded to a grep and writes to production happily — verify-clients
    // did exactly that, and this is the assertion that caught it.
    assert.match(source, /requireTestDatabase\(\)/, `${file} imports the guard but never calls it`);

    // The dev server it drives must read the same database, or the Server
    // Actions it invokes run somewhere else entirely.
    assert.match(source, /assertSameDatabase\(/, `${file} never checks the dev server's database`);
  }
});

test("no verification script reads the connection details behind the guard's back", () => {
  for (const file of verifyScripts) {
    const source = readFileSync(file, "utf8");

    assert.doesNotMatch(
      source,
      /process\.env\.NEXT_PUBLIC_SUPABASE_URL/,
      `${file} reads the URL directly — take it from requireTestDatabase()`,
    );
    assert.doesNotMatch(
      source,
      /process\.env\.SUPABASE_SERVICE_ROLE_KEY/,
      `${file} reads the service key directly — take it from requireTestDatabase()`,
    );
  }
});

/**
 * The deny-list is the check that survives a forgotten environment variable,
 * so it must stay hard-coded. An override flag would defeat the entire point.
 */
test("the guard hard-codes the production ref and offers no override", () => {
  const guard = readFileSync("scripts/lib/test-db.mjs", "utf8");

  assert.match(guard, /const PRODUCTION_REF = "[a-z0-9]{20}"/, "the production ref is not pinned");
  assert.match(guard, /process\.exit\(1\)/, "the guard does not stop the process");
  assert.doesNotMatch(
    guard,
    /FI_ALLOW_PROD|ALLOW_PRODUCTION|FORCE/i,
    "the guard has grown an override — that defeats it",
  );
});
