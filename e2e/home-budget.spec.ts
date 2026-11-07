import { expect, type Response, test } from "@playwright/test";
import {
  fontAllowanceBytes,
  homeBudgetBytes,
  normalizedBodyBytes,
} from "../scripts/home-budget.mjs";

const textContentType = /^(?:text\/|application\/(?:javascript|json)|image\/svg\+xml)/i;

test("keeps the cold homepage within its response body budget", async ({
  baseURL,
  context,
  page,
}) => {
  if (!baseURL) throw new Error("The homepage budget test requires a base URL");
  const origin = new URL(baseURL).origin;
  await context.route(
    (url) => url.origin !== origin,
    (route) => route.abort(),
  );

  const responses: Response[] = [];
  page.on("response", (response) => {
    const status = response.status();
    if (new URL(response.url()).origin === origin && (status < 300 || status >= 400)) {
      responses.push(response);
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /LevelUp User/ })).toBeVisible();
  await expect(page.getByRole("img", { name: "Danilo Moreira", exact: true })).toBeVisible();
  // Wait for route assets requested after the initial document load.
  await page.waitForLoadState("networkidle");

  const assets = await Promise.all(
    responses.map(async (response) => ({
      path: new URL(response.url()).pathname,
      bytes: normalizedBodyBytes(
        await response.body(),
        textContentType.test(response.headers()["content-type"] ?? ""),
      ),
    })),
  );
  expect(assets.some(({ path }) => path === "/")).toBe(true);

  const total = assets.reduce((sum, asset) => sum + asset.bytes, fontAllowanceBytes);
  const details = assets
    .sort((left, right) => right.bytes - left.bytes)
    .map(({ path, bytes }) => `${path} ${bytes} B`)
    .join("\n");
  expect(total, `Cold home response bodies with font allowance\n${details}`).toBeLessThanOrEqual(
    homeBudgetBytes,
  );
});
