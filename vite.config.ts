import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const appRelease =
  process.env.VITE_APP_RELEASE ??
  process.env.CF_PAGES_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  process.env.SOURCE_VERSION ??
  "unknown";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(appRelease),
  },
  plugins: [
    react(),
    {
      name: "release-metadata",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "release.json",
          source: `${JSON.stringify({ release: appRelease })}\n`,
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
