/**
 * Lets the unit tests import app modules as they are written.
 *
 * App code imports siblings without an extension ("./supabase"), which Next's
 * bundler resolves and plain Node does not. Tests that only touch pure helpers
 * never noticed; outage.test.ts has to load data.ts itself, and fails before
 * running a single assertion. This retries an extensionless relative import
 * with .ts and .tsx — for `npm test` only, nothing in the app depends on it.
 */
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const relative = specifier.startsWith("./") || specifier.startsWith("../");
      if (!relative || /\.[cm]?[jt]sx?$/.test(specifier)) throw error;
      for (const extension of [".ts", ".tsx"]) {
        try {
          return nextResolve(specifier + extension, context);
        } catch {
          // try the next extension
        }
      }
      throw error;
    }
  },
});
