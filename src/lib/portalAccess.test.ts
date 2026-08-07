import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizePhone } from "./i18n.ts";

/**
 * Archiving a client is housekeeping for the admin's own list. It must never
 * revoke that client's access to the statement for work they paid for.
 *
 * The guarantee lives in an *absence* — verifyCredentials does not filter on
 * clients.archived_at — and absences are easy to destroy by accident while
 * "tidying up". These are source-level guards so that edit fails loudly here
 * rather than silently locking a real client out of their own project.
 *
 * The end-to-end proof (actually signing in before and after archiving) is
 * scripts/verify-clients.mjs.
 */

const PORTAL = readFileSync("src/lib/portal.ts", "utf8");

/** Body of verifyCredentials, up to the next top-level declaration. */
function verifyCredentialsBody(): string {
  const start = PORTAL.indexOf("export async function verifyCredentials");
  assert.notEqual(start, -1, "verifyCredentials not found in portal.ts");
  const rest = PORTAL.slice(start + 1);
  const next = rest.indexOf("\nexport ");
  return next === -1 ? rest : rest.slice(0, next);
}

test("the portal login never filters on archived_at", () => {
  const body = verifyCredentialsBody();
  assert.equal(
    /archived/i.test(body),
    false,
    "verifyCredentials must not consider archived_at — archiving a client would then lock them out of their own project",
  );
});

test("the portal login reads the phone through the clients relation", () => {
  const body = verifyCredentialsBody();
  assert.equal(/clients\s*\(/.test(body), true, "expected an embed of clients(phone)");
  // The old duplicated column must be gone, not merely unused.
  assert.equal(/client_phone/.test(PORTAL), false, "projects.client_phone no longer exists");
});

test("no public data path embeds the clients relation", () => {
  // lib/data.ts serves the public site. A clients embed there would put a real
  // name and mobile number into a public page.
  const publicData = readFileSync("src/lib/data.ts", "utf8");
  assert.equal(
    /from\("projects"\)[\s\S]{0,200}clients\s*\(/.test(publicData),
    false,
    "public project queries must never embed clients(...)",
  );
});

/*
 * portal_access_enabled is the engineer's explicit per-project decision. It is a
 * different thing from archiving a client, and the two must stay unrelated:
 * archiving must never close the portal, and closing the portal must never be
 * expressed in terms of the archive flag.
 */

test("the access check is a separate condition from anything about archiving", () => {
  const body = verifyCredentialsBody();
  assert.equal(/portal_access_enabled/.test(body), true, "expected the access flag to be checked");

  // Guard the absence above from being satisfied by an expression that mixes
  // the two, e.g. `!archived_at && portal_access_enabled`.
  const mixed = /portal_access_enabled[^;\n]*archiv|archiv[^;\n]*portal_access_enabled/i;
  assert.equal(mixed.test(body), false, "the two must never appear in one expression");
});

test("access is only checked after the phone has matched", () => {
  const body = verifyCredentialsBody();
  const phoneCompared = body.indexOf("given !== stored");
  const accessChecked = body.indexOf("portal_access_enabled === false");

  assert.notEqual(phoneCompared, -1, "phone comparison not found");
  assert.notEqual(accessChecked, -1, "access check not found");

  // Order is a security property. Refusing on the flag before the credentials
  // match would let anyone holding a bare code learn that the code is real,
  // because the distinct "disabled" message would answer differently from the
  // generic one.
  assert.ok(
    phoneCompared < accessChecked,
    "portal_access_enabled must be checked AFTER the phone matches, or the distinct message becomes an oracle for probing codes",
  );
});

test("a closed portal is reported distinctly, not as bad credentials", () => {
  const body = verifyCredentialsBody();
  assert.equal(/reason:\s*"disabled"/.test(body), true, "expected a distinct disabled reason");
  assert.equal(/reason:\s*"invalid"/.test(body), true, "expected the generic invalid reason");
});

test("the phone used to sign in is unaffected by archiving", () => {
  // Archiving writes only archived_at. The lookup key is the normalised phone,
  // which is a different column and is not touched, so every input format that
  // worked before archiving still resolves to the same stored value.
  const stored = normalizePhone("01115134141");
  for (const typed of ["01115134141", "+20 111 513 4141", "00201115134141", "201115134141"]) {
    assert.equal(normalizePhone(typed), stored, typed);
  }
});
