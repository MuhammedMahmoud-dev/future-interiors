import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/**
 * A block-level element must never carry dir="ltr" itself.
 *
 * dir sets the element's own direction, so its `text-align: start` and `end`
 * resolve to the LTR sides — inside an Arabic page that strands the content on
 * the wrong side of its box. Every date and amount in the client's statement
 * sat against the wrong column this way, as did the money figures on the
 * dashboard and the codes and phones in the admin tables.
 *
 * Numbers, codes and phones still need an LTR run; it goes on an inline <bdi>
 * inside the block instead. Form fields are exempt: an input's own direction
 * is what the user types in.
 */

function findTsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return findTsx(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const BLOCK_TAGS = new Set(["td", "th", "p", "div", "li", "dt", "h1", "h2", "h3", "h4"]);

/** Every opening tag carrying dir="ltr" that renders as a block. */
function blockLtr(source: string): string[] {
  return [...source.matchAll(/dir="ltr"/g)].flatMap((match) => {
    // The nearest preceding "<tag" — a plain "<" can be a comparison inside a className.
    const opening = [...source.slice(0, match.index).matchAll(/<([a-z][\w.]*)/g)].at(-1);
    if (!opening) return [];
    const tag = opening[1];
    // The whole opening tag: className may come after dir. "=>" is not its end.
    const close = source.slice(match.index).search(/(?<!=)>/);
    const attributes = source.slice(opening.index, match.index + close);
    const block = BLOCK_TAGS.has(tag) || /className=[^>]*\bblock\b/.test(attributes);
    if (!block) return [];
    const line = source.slice(0, match.index).split("\n").length;
    return [`<${tag}> at line ${line}`];
  });
}

test("no block-level element carries dir=\"ltr\" itself", () => {
  const offenders = findTsx("src").flatMap((file) =>
    blockLtr(readFileSync(file, "utf8")).map((where) => `${file}: ${where}`),
  );
  assert.deepEqual(offenders, [], "move dir=\"ltr\" onto an inline <bdi> inside the block");
});

test("the scan sees a cell, a paragraph and a block span — and passes inline ones", () => {
  assert.equal(blockLtr(`<td className="py-3" dir="ltr">{x}</td>`).length, 1);
  assert.equal(blockLtr(`<p\n  className={\`a \${n < 0 ? "b" : ""}\`}\n  dir="ltr"\n>`).length, 1);
  assert.equal(blockLtr(`<span className="brand block text-xs" dir="ltr">`).length, 1);
  assert.equal(blockLtr(`<a\n  href={x}\n  dir="ltr"\n  className="mt-2 block"\n>`).length, 1);
  assert.equal(blockLtr(`<span className="brand text-xs" dir="ltr">`).length, 0);
  assert.equal(blockLtr(`<td><bdi dir="ltr">{x}</bdi></td>`).length, 0);
  assert.equal(blockLtr(`<input name="phone" dir="ltr" />`).length, 0);
});
