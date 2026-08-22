import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ledgerBlocksDelete, ledgerRefusal } from "./projectLifecycle.ts";

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

test("one ledger row is enough to refuse a delete", () => {
  // Runs the rule. The previous version of this test compared the POSITIONS of
  // three substrings in actions.ts, so raising the threshold from > 0 to
  // > 999999 left it green while a project with a full ledger was destroyed.
  assert.equal(ledgerBlocksDelete({ expenses: 1, payments: 0 }), true);
  assert.equal(ledgerBlocksDelete({ expenses: 0, payments: 1 }), true);
  assert.equal(ledgerBlocksDelete({ expenses: 7, payments: 3 }), true);
});

test("only a completely empty ledger permits a delete", () => {
  assert.equal(ledgerBlocksDelete({ expenses: 0, payments: 0 }), false);
});

test("the refusal names what is actually in the way", () => {
  const message = ledgerRefusal({ expenses: 3, payments: 2 });
  assert.match(message, /3/);
  assert.match(message, /2/);
  assert.match(message, /أرشفه بدل ما تحذفه/);
});

/**
 * The rule is only worth anything if the action consults it. This stays
 * source-level because deleteProject cannot be invoked without the Next
 * runtime — the live counterpart is scripts/verify-lifecycle.mjs.
 */
test("deleteProject consults the rule and returns on refusal", () => {
  const body = deleteProjectBody();
  const consulted = body.indexOf("ledgerBlocksDelete(");
  const deleted = body.indexOf(".delete()");

  assert.notEqual(consulted, -1, "deleteProject no longer consults the ledger rule");
  assert.match(body, /return \{ error: ledgerRefusal\(/, "deleteProject does not return the refusal");
  assert.ok(consulted < deleted, "the rule must be consulted before the delete");
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
