import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * package.json already declared `"test": "vitest run"` and carried jsdom,
 * @testing-library/* and @vitejs/plugin-react — but there was no config and no
 * test file, so the script had never run anything.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
