import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/**
 * A Server Action is a public HTTP endpoint. Being imported by a page that
 * calls requireAdmin() protects the page, not the action — anyone who knows the
 * action id can POST to it directly. So every exported action in the admin
 * action files must call requireAdmin() itself.
 *
 * This is a source-level guard: it fails when someone adds an action later and
 * forgets the check.
 */

/**
 * Discovered from the filesystem, never listed by hand.
 *
 * This used to be three paths typed into this file. src/app/admin/gallery/
 * actions.ts was added months later with four new Server Actions and the list
 * was never updated, so none of them was covered here — a whole unguarded
 * action module would have been invisible to the check whose entire job is
 * finding unguarded action modules. Walking the directory means a file added
 * tomorrow is covered the moment it exists.
 */
function findActionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return findActionFiles(path);
    return entry.name === "actions.ts" ? [path] : [];
  });
}

const GUARDED_FILES = findActionFiles("src/app/admin");

/** Deliberately unguarded: these are how you obtain or drop a session. */
const EXEMPT = new Set(["adminLogin", "adminLogout"]);

/** /admin/login is the one page that must NOT require a session to reach. */
const EXEMPT_PAGES = new Set(["src/app/admin/login/page.tsx"]);

function findPageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return findPageFiles(path);
      return entry.name === "page.tsx" ? [path] : [];
    })
    .filter((path) => !EXEMPT_PAGES.has(path));
}

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
  // Discovered too — an admin page added later must not slip past unguarded.
  const pages = findPageFiles("src/app/admin");
  for (const page of pages) {
    assert.match(readFileSync(page, "utf8"), /await requireAdmin\(\)/, `${page} is unguarded`);
  }
});
