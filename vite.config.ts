import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { resolveAppRelease } from "./build/releaseEnvironment";

const appRelease = resolveAppRelease(process.env);

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
