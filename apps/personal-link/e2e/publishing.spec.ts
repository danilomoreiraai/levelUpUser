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
  const portfolioOrigin = process.env.VITE_LEVELUP_SITE_ORIGIN;
  if (portfolioOrigin) {
    const navigation = page.getByRole("navigation", { name: "Navegação do LevelUp User" });
    await expect(navigation.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      `${portfolioOrigin}/`,
    );
    await expect(navigation.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      `${portfolioOrigin}/projects`,
    );
    await expect(navigation.getByRole("link", { name: "Services" })).toHaveAttribute(
      "href",
      `${portfolioOrigin}/services`,
    );
  }
  await expect(page.getByRole("button", { name: "Entrar" })).toHaveCSS(
    "background-color",
    "rgb(0, 102, 214)",
  );
  await page.getByLabel("Senha do painel").fill("definitely-incorrect");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toContainText("Senha incorreta.");

  await page.getByLabel("Senha do painel").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Minhas páginas" })).toBeVisible();
  await page.getByLabel("Endereço da página").fill(slug);
  await page.getByRole("button", { name: "Criar página" }).click();
  await expect(page.getByRole("heading", { name: "Editar página" })).toBeFocused();

  const preview = page.getByRole("region", { name: "Prévia da página de links" });
  await expect(page.getByRole("radio", { name: "Original" })).toBeChecked();
  await expect(preview).toHaveAttribute("data-preset", "original");
  const placeholder = preview.locator(".original-avatar--placeholder");
  await expect(placeholder).toBeVisible();
  await expect(preview.locator("img.original-avatar")).toHaveCount(0);
  const originalBackground = preview.locator(".original-background img");
  await expect
    .poll(() => originalBackground.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole("slider", { name: "Desfoque do fundo" }).fill("6");
  await expect(originalBackground).toHaveCSS("filter", "blur(6px)");
  for (const [label, palette] of [
    ["Neutro", "neutral"],
    ["Sálvia", "sage"],
    ["Crepúsculo", "dusk"],
  ]) {
    await page.getByRole("radio", { name: label }).check();
    await expect(preview).toHaveAttribute("data-preset", palette);
    await expect(placeholder).toBeVisible();
    await expect(preview.locator(".original-theme-knob")).toBeVisible();
    await expect(originalBackground).toHaveCSS("filter", "blur(6px)");
  }
  await page.getByRole("radio", { name: "Original" }).check();

  await page.getByLabel("Nome de usuário (@)").fill("atelier-ficticio");
  await expect(page.getByRole("button", { name: "Buscar foto do Instagram" })).toBeDisabled();
  await expect(page.getByText("Ative a integração da Meta", { exact: false })).toBeVisible();
  await expect(placeholder).toBeVisible();
  const upload = { name: "fundo-ficticio.png", mimeType: "image/png", buffer: image };
  await page.getByLabel("Foto de perfil", { exact: true }).setInputFiles(upload);
  await expect(preview.locator("img.original-avatar")).toHaveCSS("border-radius", "50%");
  await expect(preview.locator("img.original-avatar")).toHaveCSS("border-top-width", "2px");
  await page.getByLabel("Imagem de fundo", { exact: true }).setInputFiles(upload);
  const blur = page.getByRole("slider", { name: "Desfoque do fundo" });
  await expect(blur).toBeEnabled();
  await blur.fill("12");
  await page.getByRole("button", { name: "Adicionar link" }).click();
  await page.getByLabel("Título do link 1").fill("Meu site");
  await page.getByLabel("URL do link 1").fill("google.com");
  await page.getByLabel("URL do link 1").press("Tab");
  await expect(page.getByLabel("URL do link 1")).toHaveValue("https://google.com/");
  await page.getByRole("button", { name: "Adicionar link" }).click();
  await page.getByLabel("Título do link 2").fill("Portfólio");
  await page.getByLabel("URL do link 2").fill("https://example.com/portfolio");
  await page.getByRole("button", { name: "Subir link 2" }).click();
  await expect(page.getByLabel("Título do link 1")).toHaveValue("Portfólio");
  await page.getByRole("button", { name: "Adicionar rede social" }).click();
  await page
    .getByRole("combobox", { name: "Rede social 1", exact: true })
    .selectOption("instagram");
  await page.getByLabel("URL da rede social 1").fill("example.com/social");

  await expect(preview.getByRole("heading", { name: "@atelier-ficticio" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
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
  expect(publication).toMatchObject({ handle: "atelier-ficticio", blur: 12, preset: "original" });
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
      await publicPage.clock.install({ time: new Date("2026-11-25T12:00:00Z") });
      const response = await publicPage.goto(publicPath);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const surface = publicPage.getByRole("main");
      await expect(surface.getByRole("heading", { name: "@atelier-ficticio" })).toBeVisible();
      await expect(surface).toHaveAttribute("data-theme", visitor.initial);
      await expect(surface.locator("img.original-avatar")).toHaveCSS("border-radius", "50%");
      await expect(surface.locator("img.original-avatar")).toHaveCSS("border-top-width", "2px");
      await expect(surface.locator("footer")).toHaveText(
        "@atelier-ficticio 2026. Todos os direitos reservados.",
      );
      await expect(surface.getByRole("link", { name: "Meu site" })).toHaveAttribute(
        "href",
        "https://google.com/",
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
      if (visitor.timezoneId === "Europe/Dublin") {
        await publicPage.clock.setSystemTime(new Date("2026-12-31T23:59:00Z"));
        await publicPage.reload();
        await expect(surface.locator("footer")).toHaveText(
          "@atelier-ficticio 2026. Todos os direitos reservados.",
        );
        await publicPage.clock.fastForward(60_000);
        await expect(surface.locator("footer")).toHaveText(
          "@atelier-ficticio 2027. Todos os direitos reservados.",
        );
      }
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

test("shares single-page editing without granting administrator access", async ({
  page,
  browser,
  baseURL,
}) => {
  const slug = `cliente-${randomUUID()}`;
  const publicPath = `/api/public/pages/${slug}`;
  await page.goto("/admin");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByLabel("Senha do painel").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByLabel("Endereço da página").fill(slug);
  await page.getByRole("button", { name: "Criar página" }).click();
  await page.getByRole("button", { name: "Gerar link de edição" }).click();

  const address = page.getByLabel("Endereço de edição do cliente");
  await expect(address).toHaveValue(/\/edit\/[\da-f-]{36}#[\w-]{43}$/u);
  const clientLink = await address.inputValue();
  await page.getByRole("button", { name: "Copiar link de edição" }).click();
  await expect(page.getByText("Link de edição copiado.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(clientLink);

  const viewport = page.viewportSize() ?? undefined;
  const client = await browser.newContext({ baseURL, viewport });
  try {
    const editor = await client.newPage();
    await editor.goto(clientLink);
    await expect(editor.getByRole("heading", { name: "Editar página" })).toBeFocused();
    await expect(editor).toHaveURL(new URL(clientLink).href.split("#")[0]);
    await expect(editor.getByRole("button", { name: "Gerar link de edição" })).toHaveCount(0);
    await expect(editor.getByLabel("Senha do painel")).toHaveCount(0);
    expect((await editor.request.get("/api/admin/pages")).status()).toBe(401);

    await editor.getByLabel("Nome de usuário (@)").fill("@cliente-ficticio");
    await editor.getByRole("button", { name: "Adicionar link" }).click();
    await editor.getByLabel("Título do link 1").fill("Meu site");
    await editor.getByLabel("URL do link 1").fill("google.com");
    await editor.getByRole("button", { name: "Publicar página" }).click();
    await expect(editor.getByText("Página publicada.", { exact: true })).toBeVisible();
    expect(await (await editor.request.get(publicPath)).json()).toMatchObject({
      handle: "cliente-ficticio",
      links: [{ label: "Meu site", url: "https://google.com/" }],
    });

    await editor.reload();
    await expect(editor.getByLabel("Nome de usuário (@)")).toHaveValue("cliente-ficticio");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Revogar link de edição" }).click();
    await expect(page.getByText("Link de edição revogado.", { exact: true })).toBeVisible();

    const unavailable = editor.getByRole("heading", { name: "Link de edição indisponível" });
    await editor.reload();
    await expect(unavailable).toBeVisible();
    await editor.goto(clientLink);
    await expect(unavailable).toBeVisible();
    expect((await editor.request.get(publicPath)).status()).toBe(200);
  } finally {
    await client.close();
  }
});
