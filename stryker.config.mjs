export default {
  mutate: ["src/lib/privacyConsent.ts"],
  testRunner: "vitest",
  reporters: ["clear-text", "progress"],
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
  vitest: {
    configFile: "vitest.config.ts",
    related: true,
  },
};
