import { describe, expect, it } from "vitest";

import { resolveAppRelease } from "./releaseEnvironment";

describe("resolveAppRelease", () => {
  it("uses the Easypanel commit SHA when it is available", () => {
    expect(resolveAppRelease({ GIT_SHA: "abc123" })).toBe("abc123");
  });

  it("preserves the documented provider priority", () => {
    expect(
      resolveAppRelease({
        VITE_APP_RELEASE: "manual-release",
        CF_PAGES_COMMIT_SHA: "cloudflare-release",
        GITHUB_SHA: "github-release",
        GIT_SHA: "easypanel-release",
        SOURCE_VERSION: "buildpack-release",
      }),
    ).toBe("manual-release");
  });

  it("ignores empty values and falls back to unknown", () => {
    expect(resolveAppRelease({ VITE_APP_RELEASE: "  ", GIT_SHA: "" })).toBe("unknown");
  });
});
