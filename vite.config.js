import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The brand mark is inlined rather than loaded, so the logo paints on the
 * first frame with no request. Both pages need it, so it lives in one
 * partial and gets injected at build/dev time via `<!--#include sprite-->`.
 */
function htmlPartials() {
  return {
    name: "exira-html-partials",
    transformIndexHtml(html) {
      const sprite = readFileSync(
        resolve(__dirname, "src/partials/sprite.html"),
        "utf8"
      );
      return html.replace("<!--#include sprite-->", sprite);
    },
  };
}

export default defineConfig({
  plugins: [htmlPartials()],
  server: { port: 5173, open: true },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        thesis: resolve(__dirname, "thesis.html"),
      },
    },
  },
});
