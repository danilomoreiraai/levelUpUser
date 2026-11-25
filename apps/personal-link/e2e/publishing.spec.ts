import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import type { Presentation } from "../src/shared/contracts.js";

const password = process.env.TEST_ADMIN_PASSWORD ?? "personal-link-e2e-only";

test("edits, previews and publishes a shareable page on the visitor's local theme", async ({
  page,
  browser,
  baseURL,
}) => {
  const slug = `demo-${randomUUID()}`;
  const publicPath = `/${slug}`;
  const apiPath = `/api/public/pages/${slug}`;
  const image = await sharp({
    create: { width: 80, height: 48, channels: 3, background: "#6f8799" },
  })
    .png()
    .toBuffer();

  const admin = await page.goto("/admin");
  expect(admin?.headers()["cache-control"]).toContain("no-store");
  const js = await page.locator("script[type=module]").getAttribute("src");
  if (!js) throw new Error("Missing generated module");
  const staticResponse = await page.request.get(js);
  expect(staticResponse.status()).toBe(200);
  expect(staticResponse.headers()["cache-control"]).toContain("immutable");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByLabel("Senha do painel").fill("definitely-incorrect");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toContainText("Senha incorreta.");

  await page.getByLabel("Senha do painel").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Minhas páginas" })).toBeVisible();
  await page.getByLabel("Endereço da página").fill(slug);
  await page.getByRole("button", { name: "Criar página" }).click();
  await expect(page.getByRole("heading", { name: "Editar página" })).toBeFocused();

  await page.getByLabel("Nome de usuário (@)").fill("atelier-ficticio");
  const upload = { name: "fundo-ficticio.png", mimeType: "image/png", buffer: image };
  await page.getByLabel("Foto de perfil", { exact: true }).setInputFiles(upload);
  await page.getByLabel("Imagem de fundo", { exact: true }).setInputFiles(upload);
  const blur = page.getByRole("slider", { name: "Desfoque do fundo" });
  await expect(blur).toBeEnabled();
  await blur.fill("12");
  await page.getByRole("button", { name: "Adicionar link" }).click();
  await page.getByLabel("Título do link 1").fill("Meu site");
  await page.getByLabel("URL do link 1").fill("https://example.com/");
  await page.getByRole("button", { name: "Adicionar link" }).click();
  await page.getByLabel("Título do link 2").fill("Portfólio");
  await page.getByLabel("URL do link 2").fill("https://example.com/portfolio");
  await page.getByRole("button", { name: "Subir link 2" }).click();
  await expect(page.getByLabel("Título do link 1")).toHaveValue("Portfólio");
  await page.getByRole("button", { name: "Adicionar rede social" }).click();
  await page
    .getByRole("combobox", { name: "Rede social 1", exact: true })
    .selectOption("instagram");
  await page.getByLabel("URL da rede social 1").fill("https://example.com/social");

  const preview = page.getByRole("region", { name: "Prévia da página de links" });
  await expect(preview.getByRole("heading", { name: "@atelier-ficticio" })).toBeVisible();
  await expect(preview.locator(".link-background")).toHaveCSS("filter", "blur(12px)");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByText("Rascunho salvo.", { exact: true })).toBeVisible();
  expect((await page.request.get(apiPath)).status()).toBe(404);
  const privatePage = await page.request.get(publicPath);
  expect(privatePage.status()).toBe(404);
  expect(privatePage.headers()["cache-control"]).toContain("no-store");

  await page.getByRole("button", { name: "Publicar página" }).click();
  await expect(page.getByText("Página publicada.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: `${baseURL}${publicPath}` })).toBeVisible();
  await page.getByRole("button", { name: "Copiar link" }).click();
  await expect(page.getByText("Link copiado.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}${publicPath}`);
  const publication = (await (await page.request.get(apiPath)).json()) as Presentation;
  expect(publication).toMatchObject({ handle: "atelier-ficticio", blur: 12 });
  const initialBackground = publication.backgroundUrl;
  const initialAvatar = publication.avatarUrl;
  if (!initialBackground || !initialAvatar) throw new Error("Missing uploaded images");
  expect((await page.request.get(initialBackground)).status()).toBe(200);

  for (const visitor of [
    { timezoneId: "Europe/Dublin", initial: "light", switchTo: "Tema escuro", manual: "dark" },
    { timezoneId: "Asia/Tokyo", initial: "dark", switchTo: "Tema claro", manual: "light" },
  ]) {
    const context = await browser.newContext({ baseURL, timezoneId: visitor.timezoneId });
    try {
      const publicPage = await context.newPage();
      await publicPage.clock.setFixedTime(new Date("2026-11-25T12:00:00Z"));
      const response = await publicPage.goto(publicPath);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const surface = publicPage.getByRole("main");
      await expect(surface.getByRole("heading", { name: "@atelier-ficticio" })).toBeVisible();
      await expect(surface).toHaveAttribute("data-theme", visitor.initial);
      await expect(surface.getByRole("link", { name: "Meu site" })).toHaveAttribute(
        "href",
        "https://example.com/",
      );
      await expect(surface.getByRole("link", { name: "Instagram" })).toHaveAttribute(
        "href",
        "https://example.com/social",
      );
      await surface.getByRole("button", { name: visitor.switchTo }).click();
      await expect(surface).toHaveAttribute("data-theme", visitor.manual);
      await surface.getByRole("button", { name: "Automático" }).click();
      await expect(surface).toHaveAttribute("data-theme", visitor.initial);
      await surface.getByRole("button", { name: visitor.switchTo }).click();
      await publicPage.reload();
      await expect(surface).toHaveAttribute("data-theme", visitor.initial);
    } finally {
      await context.close();
    }
  }

  await page.getByLabel("Nome de usuário (@)").fill("atelier-renomeado");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByText("Rascunho salvo.", { exact: true })).toBeVisible();
  expect(await (await page.request.get(apiPath)).json()).toMatchObject({
    handle: "atelier-ficticio",
  });
  await page.getByRole("button", { name: "Publicar alterações" }).click();
  await expect(page.getByText("Página publicada.", { exact: true })).toBeVisible();
  expect(await (await page.request.get(apiPath)).json()).toMatchObject({
    handle: "atelier-renomeado",
  });

  await page.getByRole("button", { name: "Despublicar página" }).click();
  await expect(page.getByText("Página despublicada.", { exact: true })).toBeVisible();
  for (const url of [publicPath, apiPath, initialAvatar, initialBackground]) {
    expect((await page.request.get(url)).status()).toBe(404);
  }
});
