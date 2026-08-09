import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Deleting a project is the one destructive action in the admin, and the only
 * thing standing between a mis-click and a lost ledger is the order of a few
 * lines inside deleteProject. The UI disables the button, but a Server Action
 * is a public HTTP endpoint — anyone who can reach it can call it with any id,
 * and the disabled attribute means nothing there.
 *
 * So these are source-level guards on the server function itself: the ledger
 * count, the typed-code comparison and the admin check must all come BEFORE
 * the delete. The live counterpart — actually POSTing to the action for a
 * project that has one expense — is in scripts/verify-admin.mjs.
 */

const ACTIONS = readFileSync("src/app/admin/projects/actions.ts", "utf8");

/** Body of deleteProject, up to the next top-level declaration. */
function deleteProjectBody(): string {
  const start = ACTIONS.indexOf("export async function deleteProject");
  assert.notEqual(start, -1, "deleteProject not found in actions.ts");
  const rest = ACTIONS.slice(start + 1);
  const next = rest.indexOf("\nexport ");
  return next === -1 ? rest : rest.slice(0, next);
}

test("the ledger is counted before anything is deleted", () => {
  const body = deleteProjectBody();

  const counted = body.indexOf('count: "exact"');
  const refused = body.indexOf("أرشفه بدل ما تحذفه");
  const deleted = body.indexOf(".delete()");

  assert.notEqual(counted, -1, "deleteProject no longer counts expenses/payments");
  assert.notEqual(refused, -1, "deleteProject no longer refuses a non-empty ledger");
  assert.notEqual(deleted, -1, "deleteProject no longer deletes anything");

  assert.ok(counted < deleted, "the ledger count must run before the delete");
  assert.ok(refused < deleted, "the refusal must return before the delete");
});

test("both ledger tables are counted, not just one", () => {
  const body = deleteProjectBody();
  assert.match(body, /from\("expenses"\)/, "expenses are not counted");
  assert.match(body, /from\("payments"\)/, "payments are not counted");
});

test("the typed project code is compared before the delete", () => {
  const body = deleteProjectBody();
  const compared = body.indexOf("project.code.toUpperCase()");
  const deleted = body.indexOf(".delete()");

  assert.notEqual(compared, -1, "the typed confirmation is no longer compared to the code");
  assert.ok(compared < deleted, "the code comparison must run before the delete");
});

test("every lifecycle action authenticates before touching the database", () => {
  for (const name of ["deleteProject", "setProjectArchived"]) {
    const start = ACTIONS.indexOf(`export async function ${name}`);
    assert.notEqual(start, -1, `${name} not found in actions.ts`);
    const rest = ACTIONS.slice(start + 1);
    const next = rest.indexOf("\nexport ");
    const body = next === -1 ? rest : rest.slice(0, next);

    const guarded = body.indexOf("requireAdmin()");
    const db = body.indexOf("requireDb()");
    assert.notEqual(guarded, -1, `${name} does not call requireAdmin`);
    assert.ok(guarded < db, `${name} must call requireAdmin before requireDb`);
  }
});

/**
 * Archiving borrows the exact semantics clients.archived_at already has, and
 * the whole point is that it is inert everywhere except the admin's own list.
 * The portal already has its own guard (portalAccess.test.ts asserts the login
 * never reads archived_at); this asserts the other half — that the archive
 * action never quietly reaches for the access flag or the publish flags while
 * "tidying up".
 */
test("archiving touches archived_at and nothing else", () => {
  const start = ACTIONS.indexOf("export async function setProjectArchived");
  const rest = ACTIONS.slice(start + 1);
  const next = rest.indexOf("\nexport ");
  const body = next === -1 ? rest : rest.slice(0, next);

  assert.match(body, /archived_at/, "setProjectArchived no longer sets archived_at");
  assert.doesNotMatch(body, /portal_access_enabled/, "archiving must not touch portal access");
  assert.doesNotMatch(body, /is_public|publish_approved_at/, "archiving must not touch publishing");
});
