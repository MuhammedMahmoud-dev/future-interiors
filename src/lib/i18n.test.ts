import { test } from "node:test";
import assert from "node:assert/strict";
import { pick, pickList, switchLocalePath, normalizePhone, whatsappLink, dir } from "./i18n.ts";

test("english falls back to arabic when the english column is empty", () => {
  const row = { title_ar: "شقة 200م", title_en: null };
  assert.equal(pick(row, "title", "en"), "شقة 200م");
  assert.equal(pick(row, "title", "ar"), "شقة 200م");

  const translated = { title_ar: "شقة 200م", title_en: "200 sqm apartment" };
  assert.equal(pick(translated, "title", "en"), "200 sqm apartment");
  // Arabic never falls back to English, even when both exist.
  assert.equal(pick(translated, "title", "ar"), "شقة 200م");
});

test("empty-string english is treated as missing, not as a translation", () => {
  assert.equal(pick({ title_ar: "تأسيس", title_en: "" }, "title", "en"), "تأسيس");
});

test("missing rows and fields yield an empty string, never undefined", () => {
  assert.equal(pick(null, "title", "ar"), "");
  assert.equal(pick({}, "title", "en"), "");
});

test("list fields follow the same fallback rule", () => {
  const row = { bullets_ar: ["كهرباء", "سباكة"], bullets_en: [] };
  assert.deepEqual(pickList(row, "bullets", "en"), ["كهرباء", "سباكة"]);
  assert.deepEqual(pickList({ bullets_ar: ["أ"], bullets_en: ["a"] }, "bullets", "en"), ["a"]);
  assert.deepEqual(pickList(null, "bullets", "ar"), []);
});

test("locale switch preserves the rest of the path", () => {
  assert.equal(switchLocalePath("/ar/works/villa-1", "en"), "/en/works/villa-1");
  assert.equal(switchLocalePath("/en", "ar"), "/ar");
  assert.equal(switchLocalePath("/works", "ar"), "/ar/works");
});

test("direction is per locale", () => {
  assert.equal(dir("ar"), "rtl");
  assert.equal(dir("en"), "ltr");
});

test("phone normalisation strips spaces, +20 and the leading zero", () => {
  const expected = "1012345678";
  for (const input of ["+20 101 234 5678", "0201012345678", "01012345678", "1012345678"]) {
    assert.equal(normalizePhone(input), expected, input);
  }
});

test("whatsapp links carry a url-encoded message", () => {
  const link = whatsappLink("+20 100 000 0000", "مرحبا");
  assert.equal(link.startsWith("https://wa.me/201000000000?text="), true);
  assert.equal(link.includes(" "), false);
});
