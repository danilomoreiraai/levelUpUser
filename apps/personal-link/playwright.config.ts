import { execFileSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set TEST_DATABASE_URL to a disposable PostgreSQL database.");
}

const origin = "http://127.0.0.1:4175";
const password = process.env.TEST_ADMIN_PASSWORD ?? "personal-link-e2e-only";
const passwordHash = execFileSync(process.execPath, ["dist/server/hash-password.js"], {
  encoding: "utf8",
  input: `${password}\n`,
}).trim();

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: origin,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm start",
    url: `${origin}/readyz`,
    env: {
      NODE_ENV: "test",
      APP_ORIGIN: origin,
      PORT: "4175",
      DATABASE_URL: databaseUrl,
      ADMIN_PASSWORD_HASH: passwordHash,
      APP_RELEASE: "playwright",
    },
  },
});
