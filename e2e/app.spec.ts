import { expect, test } from "@playwright/test";

test("navigates between lazy-loaded routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /LevelUp User/ })).toBeVisible();

  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByRole("link", { name: "Projects", exact: true }).click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", { name: "Ideas, products, and active builds." }),
  ).toBeVisible();
});

test("persists granular privacy choices", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Manage" }).click();
  await page.getByRole("checkbox", { name: /Analytics/ }).check();
  await page.getByRole("button", { name: "Save choices" }).click();

  await page.reload();
  await expect(page.getByRole("button", { name: "Privacy choices" })).toBeVisible();
  await page.getByRole("button", { name: "Privacy choices" }).click();
  await expect(page.getByRole("checkbox", { name: /Analytics/ })).toBeChecked();
});

test("shows the not-found route", async ({ page }) => {
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
});

test("serves HTML and hashed assets with safe cache policies", async ({ request }) => {
  const documentResponse = await request.get("/");
  const documentHtml = await documentResponse.text();
  const entryAsset = documentHtml.match(/src="\/(assets\/index-[^"]+\.js)"/)?.[1];

  expect(documentResponse.headers()["cache-control"]).toContain("max-age=0");
  expect(entryAsset).toBeTruthy();

  const assetResponse = await request.get(`/${entryAsset}`);
  expect(assetResponse.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");

  const missingAssetResponse = await request.get("/assets/removed-release-chunk.js");
  expect(missingAssetResponse.status()).toBe(404);
  expect(missingAssetResponse.headers()["content-type"]).toBeUndefined();
});
