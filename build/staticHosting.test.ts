import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Cloudflare Pages routing", () => {
  it("uses the platform SPA fallback while keeping missing hashed assets as 404", () => {
    expect(existsSync(resolve("public/_redirects"))).toBe(false);

    const assetNotFoundPage = readFileSync(resolve("public/assets/404.html"), "utf8");
    expect(assetNotFoundPage).toContain("Asset not found");
    expect(assetNotFoundPage).toContain('name="robots" content="noindex"');
  });
});
