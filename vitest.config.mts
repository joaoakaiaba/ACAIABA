import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

export default defineConfig({
  resolve: {
    // Vitest does not read `paths` from tsconfig.json, so the `@/*` alias used
    // throughout `src/` has to be declared here too. Without it, any test that
    // imports a module which itself uses `@/...` fails to resolve.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // src/server/auth/jwt.ts has no fallback secret by design and throws without
    // one, so the suite supplies its own. It is generated per run instead of being
    // a literal in the repository, so nothing here could ever sign a real session.
    env: {
      JWT_SECRET: `test-only-${randomBytes(32).toString("hex")}`,
    },
  },
});
