import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * A Server Action is a public HTTP endpoint. Being imported by a page that
 * calls requireAdmin() protects the page, not the action — anyone who knows the
 * action id can POST to it directly. So every exported action in the admin
 * action files must call requireAdmin() itself.
 *
 * This is a source-level guard: it fails when someone adds an action later and
 * forgets the check.
 */

const GUARDED_FILES = [
  "src/app/admin/projects/actions.ts",
  "src/app/admin/content/actions.ts",
];

/** Deliberately unguarded: these are how you obtain or drop a session. */
const EXEMPT = new Set(["adminLogin", "adminLogout"]);

function exportedActions(source: string): string[] {
  return [...source.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((match) => match[1]);
}

/** Body of a function, from its declaration to the next top-level export. */
function bodyOf(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  const rest = source.slice(start + 1);
  const nextExport = rest.indexOf("\nexport ");
  return nextExport === -1 ? rest : rest.slice(0, nextExport);
}

for (const file of GUARDED_FILES) {
  test(`every exported action in ${file} calls requireAdmin`, () => {
    const source = readFileSync(file, "utf8");
    const actions = exportedActions(source);

    assert.ok(actions.length > 0, `no exported actions found in ${file}`);
    assert.match(source, /^"use server";/m, `${file} must be a server action module`);

    for (const action of actions) {
      if (EXEMPT.has(action)) continue;
      assert.match(
        bodyOf(source, action),
        /await requireAdmin\(\)/,
        `${action} in ${file} does not call requireAdmin()`,
      );
    }
  });
}

test("the generic content action cannot be pointed at an arbitrary table", () => {
  const source = readFileSync("src/app/admin/content/actions.ts", "utf8");
  // The table must come from the whitelist, never straight from the caller.
  assert.match(source, /isContentKey\(key\)/);
  assert.match(source, /getContentSpec\(key\)/);
  assert.doesNotMatch(source, /\.from\(\s*key\s*\)/, "table name must not be taken from the request");
});

test("admin pages guard themselves too", () => {
  const pages = [
    "src/app/admin/page.tsx",
    "src/app/admin/projects/page.tsx",
    "src/app/admin/projects/new/page.tsx",
    "src/app/admin/projects/[id]/page.tsx",
    "src/app/admin/content/[section]/page.tsx",
    "src/app/admin/leads/page.tsx",
  ];
  for (const page of pages) {
    assert.match(readFileSync(page, "utf8"), /await requireAdmin\(\)/, `${page} is unguarded`);
  }
});
