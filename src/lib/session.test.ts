import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, readSessionToken, generateSecret } from "./session.ts";

const SECRET = generateSecret();
const PROJECT = "11111111-2222-3333-4444-555555555555";

test("a freshly signed token round-trips to its project id", () => {
  assert.equal(readSessionToken(createSessionToken(PROJECT, SECRET), SECRET), PROJECT);
});

test("the token never contains the project code", () => {
  // Only an id and an expiry are signed, so a leaked cookie cannot be replayed
  // as a credential at the login form.
  const token = createSessionToken(PROJECT, SECRET);
  assert.equal(token.split(".").length, 3);
  assert.equal(token.startsWith(`${PROJECT}.`), true);
});

test("a tampered project id is rejected", () => {
  const token = createSessionToken(PROJECT, SECRET);
  const [, expiresAt, signature] = token.split(".");
  const forged = `99999999-2222-3333-4444-555555555555.${expiresAt}.${signature}`;
  assert.equal(readSessionToken(forged, SECRET), null);
});

test("an extended expiry is rejected", () => {
  const token = createSessionToken(PROJECT, SECRET);
  const [id, expiresAt, signature] = token.split(".");
  const stretched = `${id}.${Number(expiresAt) + 86_400_000}.${signature}`;
  assert.equal(readSessionToken(stretched, SECRET), null);
});

test("a token signed with another secret is rejected", () => {
  const token = createSessionToken(PROJECT, generateSecret());
  assert.equal(readSessionToken(token, SECRET), null);
});

test("an expired token is rejected", () => {
  const now = Date.now();
  const token = createSessionToken(PROJECT, SECRET, 60, now);
  assert.equal(readSessionToken(token, SECRET, now + 30_000), PROJECT);
  assert.equal(readSessionToken(token, SECRET, now + 61_000), null);
});

test("malformed input is rejected without throwing", () => {
  for (const bad of [undefined, null, "", "a", "a.b", "a.b.c.d", "....", "a.b.c"]) {
    assert.equal(readSessionToken(bad, SECRET), null, String(bad));
  }
});
