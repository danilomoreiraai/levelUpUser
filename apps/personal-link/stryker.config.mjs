export default {
  mutate: ["src/shared/theme.ts", "src/server/publication.ts"],
  testRunner: "vitest",
  reporters: ["clear-text", "progress"],
  thresholds: { high: 80, low: 60, break: 60 },
  vitest: { related: true },
};
