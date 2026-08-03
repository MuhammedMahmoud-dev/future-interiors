import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "./password.ts";

test("a password verifies against its own hash", () => {
  const stored = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", stored), true);
});

test("a wrong password is rejected", () => {
  const stored = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("Correct horse battery staple", stored), false);
  assert.equal(verifyPassword("", stored), false);
  assert.equal(verifyPassword("correct horse battery stapl", stored), false);
});

test("the plaintext password never appears in the stored hash", () => {
  const password = "sup3r-s3cret-passphrase";
  assert.equal(hashPassword(password).includes(password), false);
});

test("the same password hashes differently every time", () => {
  // Distinct salts, so a stolen hash cannot be matched against a rainbow table.
  const a = hashPassword("same password");
  const b = hashPassword("same password");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("same password", a), true);
  assert.equal(verifyPassword("same password", b), true);
});

test("malformed stored values are rejected without throwing", () => {
  for (const bad of ["", "nosalt", "salt:", ":hash", "salt:zzzz", "salt:abcd"]) {
    assert.equal(verifyPassword("anything", bad), false, bad);
  }
});

test("a fast unsalted digest would not validate", () => {
  // Guards against someone swapping scrypt for sha256 to make login snappier.
  const password = "another password";
  const [salt] = hashPassword(password).split(":");
  const naive = `${salt}:${createHash("sha256").update(password).digest("hex")}`;
  assert.equal(verifyPassword(password, naive), false);
});
