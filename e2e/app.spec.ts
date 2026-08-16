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
