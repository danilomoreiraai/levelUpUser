import { expect, test } from "@playwright/test";
import type { ShowcaseBatch, ShowcasePage } from "../src/shared/contracts.js";

function showcasePage(name: string): ShowcasePage {
  return {
    slug: `cliente-${name}`,
    handle: `cliente-${name}`,
    preset: "sage",
    blur: 4,
    avatarUrl: null,
    backgroundUrl: null,
    links: [{ label: `Site de ${name}`, url: "https://example.com/" }],
    socials: [{ platform: "instagram", url: "https://instagram.com/example" }],
  };
}

test("shows the published client previews and rotates the carousel ahead of authentication", async ({
  page,
  baseURL,
}) => {
  const first = showcasePage("alfa");
  const second = showcasePage("beta");
  const third = showcasePage("gama");
  await page.route("**/api/public/showcase*", async (route) => {
    const after = new URL(route.request().url()).searchParams.get("after");
    const batch: ShowcaseBatch =
      after === second.slug
        ? { pages: [third], nextCursor: null }
        : { pages: [first, second], nextCursor: second.slug };
    await route.fulfill({ json: batch });
  });
  await page.clock.install();
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  const showcase = page.getByRole("region", { name: "Páginas de clientes" });
  const carousel = showcase.getByRole("region", { name: "Destaques de clientes" });
  const preview = showcase.getByRole("region", { name: "Prévia de @cliente-beta" });
  await expect(preview).toHaveAttribute("data-preset", "sage");
  await expect(preview.locator(".link-background")).toHaveCSS("filter", "blur(4px)");
  await expect(preview.getByText("Site de beta")).toBeVisible();
  await expect(preview.getByRole("list", { name: "Redes sociais" })).toContainText("Instagram");
  await expect(carousel.getByRole("link", { name: "@cliente-alfa" })).toHaveAttribute(
    "href",
    `${baseURL}/${first.slug}`,
  );
  await page.clock.fastForward(5_000);
  await expect(carousel.getByRole("link", { name: "@cliente-beta" })).toBeVisible();

  await carousel.getByRole("button", { name: "Cliente anterior" }).press("Enter");
  await expect(carousel.getByRole("button", { name: "Iniciar rotação" })).toBeVisible();
  await page.clock.fastForward(10_000);
  await expect(carousel.getByRole("link", { name: "@cliente-alfa" })).toBeVisible();
  await showcase.getByRole("button", { name: "Carregar mais" }).click();
  await expect(showcase.getByRole("region", { name: "Prévia de @cliente-gama" })).toBeVisible();
  await expect(
    showcase.getByRole("link", { name: "Abrir página de @cliente-gama" }),
  ).toHaveAttribute("href", `${baseURL}/${third.slug}`);
  await expect(showcase.getByRole("button", { name: "Carregar mais" })).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(carousel.getByRole("button", { name: "Iniciar rotação" })).toBeVisible();
  await page.clock.fastForward(10_000);
  await expect(carousel.getByRole("link", { name: "@cliente-alfa" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
});
