const releaseEnvironmentKeys = [
  "VITE_APP_RELEASE",
  "CF_PAGES_COMMIT_SHA",
  "GITHUB_SHA",
  "GIT_SHA",
  "SOURCE_VERSION",
] as const;

export function resolveAppRelease(environment: Record<string, string | undefined>): string {
  for (const key of releaseEnvironmentKeys) {
    const value = environment[key]?.trim();

    if (value) {
      return value;
    }
  }

  return "unknown";
}
