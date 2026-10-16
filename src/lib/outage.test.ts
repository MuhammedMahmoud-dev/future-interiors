import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A database outage must reach Next as an error, never as an empty result.
 *
 * Every public page is cached and rebuilt in the background. A rebuild that
 * throws leaves the last good copy in place; a rebuild that returns — even an
 * empty list — replaces it. The readers in data.ts and signMedia used to catch
 * the failure and return nothing, so when the Supabase project was paused,
 * /works and the homepage were rebuilt with no photographs and served that way
 * while every row and file sat intact.
 *
 * These call the real readers against a stand-in Supabase that either drops
 * the connection (an unreachable project) or answers normally. Run under the
 * react-server condition so `server-only` resolves to its empty module.
 */

type Mode = "up" | "down" | "http500" | "empty";
let mode: Mode = "up";
let server: http.Server;

const ROWS = [
  { id: "a", url: "gallery/00-a.jpeg", caption_ar: null, caption_en: null, sort_order: 0 },
  { id: "b", url: "gallery/01-b.jpeg", caption_ar: null, caption_en: null, sort_order: 1 },
];

let data: typeof import("./data.ts");
let media: typeof import("./media.ts");

before(async () => {
  server = http.createServer((req, res) => {
    if (mode === "down") return req.socket.destroy();
    if (mode === "http500") {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "internal error" }));
    }
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      if (req.url?.startsWith("/storage/v1/object/sign/")) {
        const { paths = [] } = JSON.parse(raw || "{}");
        return res.end(
          JSON.stringify(
            paths.map((p: string) => ({ path: p, signedURL: `/object/sign/media/${p}?t=x`, error: null })),
          ),
        );
      }
      const body = mode === "empty" || !req.url?.startsWith("/rest/v1/gallery_images") ? [] : ROWS;
      res.end(JSON.stringify(body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  // Must be set before the modules load: getSupabase() caches its client.
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  delete process.env.NEXT_PUBLIC_WHATSAPP;

  data = await import("./data.ts");
  media = await import("./media.ts");
});

after(() => server.close());

test("an unreachable database makes the gallery reader throw", async () => {
  mode = "down";
  await assert.rejects(data.getGalleryImages(), /getGalleryImages/);
});

test("an HTTP error from the database throws too", async () => {
  mode = "http500";
  await assert.rejects(data.getGalleryImages(), /getGalleryImages/);
});

/**
 * Four of these used to ignore `error` entirely rather than catch it — the
 * same outcome by a different route, and the easiest kind to miss.
 *
 * An HTTP 500 rather than a dropped connection: postgrest-js retries a
 * dropped GET three times with 1s/2s/4s backoff, so six readers would cost
 * ~42s. The dropped-connection path is proven once, on the gallery, above;
 * every reader here shares the same unwrap(), so the 500 is enough to show
 * each one routes its error through it.
 */
test("every public content reader throws on a database error", async () => {
  mode = "http500";
  const readers = {
    getServices: data.getServices,
    getFaqs: data.getFaqs,
    getStats: data.getStats,
    getTestimonials: data.getTestimonials,
    getEngineer: data.getEngineer,
    getWhatsappNumber: data.getWhatsappNumber,
  };
  for (const [name, read] of Object.entries(readers)) {
    await assert.rejects(read(), `${name} returned instead of throwing`);
  }
});

test("a failed signing request throws instead of hiding every photo", async () => {
  mode = "down";
  await assert.rejects(media.signMedia(["gallery/00-a.jpeg"]), /signMedia/);
});

/** The other side of the line: real emptiness is not an error. */
test("a healthy database still returns its rows", async () => {
  mode = "up";
  const rows = await data.getGalleryImages();
  assert.equal(rows.length, 2);

  const signed = await media.signMedia(rows.map((row) => row.url));
  assert.equal(signed.size, 2);
});

test("a genuinely empty table is an empty list, not an error", async () => {
  mode = "empty";
  assert.deepEqual(await data.getGalleryImages(), []);
  assert.deepEqual(await data.getServices(), []);
  assert.equal(await data.getEngineer(), null);
});
