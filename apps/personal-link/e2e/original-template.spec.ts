import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import sharp from "sharp";
import type { AdminPage, PageContent, Presentation } from "../src/shared/contracts.js";

// julianaLinktree at c9f954d55dbcb67381b947e9ec3b34bcd15d850f, with source CSS
// normalized to LF and its HTML structure reproduced with fictitious destinations.
const referenceCss = new URL("./fixtures/juliana-linktree.css.txt", import.meta.url);
const artwork = new URL("../src/client/template-assets/", import.meta.url);
const font = new URL(
  import.meta.resolve("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"),
);
const referenceAssets = {
  "avatar-light.png": "8d81a58540b0cd299e313c59fa7f115d4949c290",
  "avatar.png": "8d81a58540b0cd299e313c59fa7f115d4949c290",
  "bg-desktop-light.jpg": "c48c623ab10936f6d6e8e8a6da45341244911b00",
  "bg-desktop.jpg": "b051cbe448903253cb5ec54177ba7b0d4b42257a",
  "bg-mobile-light.jpg": "70b8996f94100ce8dac42971772deefa924ad449",
  "bg-mobile.jpg": "e619b566100781b3a646188b08d15854fdb1ec26",
  "logo-instagram.svg": "dada6d9eff1f52851873b9ce062eb786022b5468",
  "logo-youtube.svg": "3ea6896ab4d4dc1183007583ec941bbfc52e2d1a",
  "moon-stars.svg": "794c5b37db533367308c136a2f15f9c32fa28840",
  "sun.svg": "c8815ac4b068e0e2efe755d1d818544a70a5a3be",
};
const model: PageContent = {
  handle: "juliana.manduca",
  links: [
    "Mentoria",
    "Comunidade",
    "Contato atendimento",
    "Instagram",
    "julianamanduca.com.br",
  ].map((label, index) => ({ label, url: `https://example.com/${index + 1}` })),
  socials: [
    { platform: "instagram", url: "https://example.com/instagram" },
    { platform: "youtube", url: "https://example.com/youtube" },
  ],
  preset: "original",
  blur: 0,
};

const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
};

function gitBlobHash(bytes: Buffer) {
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

async function publishModel(request: APIRequestContext, origin: string) {
  const headers = { origin };
  const password = process.env.TEST_ADMIN_PASSWORD ?? "personal-link-e2e-only";
  await expect(await request.post("/api/admin/session", { data: { password }, headers })).toBeOK();

  const slug = `modelo-${randomUUID()}`;
  const created = await request.post("/api/admin/pages", { data: { slug }, headers });
  await expect(created).toBeOK();
  const page: AdminPage = await created.json();
  const path = `/api/admin/pages/${page.id}`;
  const portrait = await readFile(new URL("avatar.png", artwork));
  const saved = await request.put(`${path}/draft`, {
    data: {
      ...model,
      slug,
      revision: page.revision,
      avatar: `data:image/png;base64,${portrait.toString("base64")}`,
    },
    headers,
  });
  await expect(saved).toBeOK();
  const draft: AdminPage = await saved.json();
  const published = await request.post(`${path}/publish`, {
    data: { revision: draft.revision },
    headers,
  });
  await expect(published).toBeOK();
  const publicResult = await request.get(`/api/public/pages/${slug}`);
  const { avatarUrl }: Presentation = await publicResult.json();
  if (!avatarUrl) throw new Error("Missing original-comparison avatar");
  return { slug, avatarUrl };
}

async function renderReference(page: Page, theme: "dark" | "light", avatarUrl: string) {
  const [css, instagram, youtube] = await Promise.all([
    readFile(referenceCss, "utf8"),
    readFile(new URL("logo-instagram.svg", artwork), "utf8"),
    readFile(new URL("logo-youtube.svg", artwork), "utf8"),
  ]);
  const socialIcons = [instagram, youtube];
  await page.route("**/assets/*", async (route) => {
    const filename = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    const contentType = mimeTypes[filename.split(".").at(-1) ?? ""];
    if (!Object.hasOwn(referenceAssets, filename) || !contentType) return route.abort();
    await route.fulfill({ contentType, body: await readFile(new URL(filename, artwork)) });
  });
  await page.route("**/comparacao-original-inter.woff2", async (route) => {
    await route.fulfill({ contentType: "font/woff2", body: await readFile(font) });
  });
  await page.route("**/comparacao-original", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html>
<html lang="pt-br" class="${theme === "light" ? "light" : ""}">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @font-face {
      font-family: Inter;
      src: url(/comparacao-original-inter.woff2) format("woff2");
      font-weight: 400 500;
    }
    ion-icon { display: inline-block; width: 1em; height: 1em; }
    ion-icon svg { display: block; width: 100%; height: 100%; fill: currentColor; }
    ${css}
    /* The portrait frame and footer text are the requested changes to the source. */
    #profile img { height: 112px; border: 2px solid var(--stroke-color); border-radius: 50%; object-fit: cover; }
  </style>
</head>
<body>
  <div id="container">
    <div id="profile"><img alt="" src="${avatarUrl}"><p>@${model.handle}</p></div>
    <div id="switch"><button></button><span></span></div>
    <ul>${model.links.map(({ label, url }) => `<li><a href="${url}">${label}</a></li>`).join("")}</ul>
    <div id="social-links">
      ${model.socials.map(({ url }, index) => `<a href="${url}"><ion-icon>${socialIcons[index]}</ion-icon></a>`).join("")}
    </div>
    <footer>@${model.handle} 2026. Todos os direitos reservados.</footer>
  </div>
</body>
</html>`,
    }),
  );
  await page.goto("/comparacao-original");
}

async function boxes(page: Page, selectors: string[]) {
  return Promise.all(
    selectors.map(async (selector) => {
      const elements = await page.locator(selector).all();
      expect(elements.length, selector).toBeGreaterThan(0);
      return Promise.all(elements.map((element) => element.boundingBox()));
    }),
  );
}

async function screenshot(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  return page.screenshot({ animations: "disabled", scale: "css" });
}

async function pixelDifference(reference: Buffer, actual: Buffer) {
  const [before, after] = await Promise.all(
    [reference, actual].map((image) =>
      sharp(image).ensureAlpha().raw().toBuffer({
        resolveWithObject: true,
      }),
    ),
  );
  expect(after.info).toEqual(before.info);
  const { channels, width, height } = before.info;
  let changed = 0;
  let noticeable = 0;
  let maxChannelDelta = 0;
  const bounds = { left: width, top: height, right: -1, bottom: -1 };
  const diff = Buffer.alloc(before.data.length);
  for (let offset = 0; offset < before.data.length; offset += channels) {
    const delta = Math.max(
      Math.abs(before.data[offset] - after.data[offset]),
      Math.abs(before.data[offset + 1] - after.data[offset + 1]),
      Math.abs(before.data[offset + 2] - after.data[offset + 2]),
    );
    if (delta) {
      const x = (offset / channels) % width;
      const y = Math.floor(offset / channels / width);
      bounds.left = Math.min(bounds.left, x);
      bounds.top = Math.min(bounds.top, y);
      bounds.right = Math.max(bounds.right, x);
      bounds.bottom = Math.max(bounds.bottom, y);
      changed += 1;
    }
    noticeable += Number(delta > 2);
    maxChannelDelta = Math.max(maxChannelDelta, delta);
    diff[offset] = delta > 0 ? 255 : 0;
    diff[offset + 3] = 255;
  }
  return {
    changed,
    noticeable,
    maxChannelDelta,
    total: width * height,
    bounds,
    diff: await sharp(diff, { raw: { width, height, channels } }).png().toBuffer(),
  };
}

test.use({ timezoneId: "UTC" });

test("keeps the original template stylesheet and artwork", async () => {
  const css = await readFile(referenceCss, "utf8");
  expect(gitBlobHash(Buffer.from(css.replace(/\r?\n/g, "\r\n")))).toBe(
    "b15e69b32667c9e41c465892130c21dba3bf5eea",
  );
  for (const [filename, hash] of Object.entries(referenceAssets)) {
    const bytes = await readFile(new URL(filename, artwork));
    // The two theme illustrations add an accessible title to the original paths.
    const sourceBytes =
      filename === "sun.svg" || filename === "moon-stars.svg"
        ? Buffer.from(bytes.toString("utf8").replace(/^<title>[^<>]+<\/title>\r?\n/m, ""))
        : bytes;
    expect(gitBlobHash(sourceBytes), filename).toBe(hash);
  }
});

for (const theme of ["dark", "light"] as const) {
  test(`matches the published original template in ${theme} mode`, async ({
    baseURL,
    context,
    page,
    request,
  }, testInfo) => {
    if (!baseURL) throw new Error("Missing personal link app origin");
    const { slug, avatarUrl } = await publishModel(request, baseURL);
    const viewport = testInfo.project.name.startsWith("desktop")
      ? { width: 1440, height: 960 }
      : { width: 393, height: 851 };
    const original = await context.newPage();
    await Promise.all([original.setViewportSize(viewport), page.setViewportSize(viewport)]);
    await page.clock.setFixedTime(new Date(`2026-11-26T${theme === "light" ? 12 : 22}:00:00Z`));
    const [, publicPage] = await Promise.all([
      renderReference(original, theme, avatarUrl),
      page.goto(`/${slug}`),
    ]);
    expect(publicPage?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: `@${model.handle}` })).toBeVisible();
    await expect(page.getByRole("main")).toHaveAttribute("data-theme", theme);
    const [reference, rendered] = await Promise.all([screenshot(original), screenshot(page)]);
    const { diff, ...summary } = await pixelDifference(reference, rendered);
    if (summary.changed > 0) {
      for (const [name, body] of [
        ["juliana-linktree", reference],
        ["modelo-inicial", rendered],
        ["pixel-difference", diff],
      ] as const) {
        const path = testInfo.outputPath(`${name}.png`);
        await writeFile(path, body);
        await testInfo.attach(name, { path, contentType: "image/png" });
      }
    }
    const selectors = [
      ["#profile > img", ".original-profile > img"],
      ["#profile > p", ".original-profile > h1"],
      ["#switch > button", ".original-theme-knob"],
      ["#switch > span", ".original-theme-track"],
      ["ul > li > a", ".original-links > li > a"],
      ["#social-links > a", ".original-socials a"],
      ["footer", ".original-container footer"],
    ];
    const [expectedBoxes, actualBoxes] = await Promise.all([
      boxes(
        original,
        selectors.map(([selector]) => selector),
      ),
      boxes(
        page,
        selectors.map(([, selector]) => selector),
      ),
    ]);
    expect.soft(actualBoxes).toEqual(expectedBoxes);
    expect(summary.changed, JSON.stringify(summary)).toBe(0);
  });
}
