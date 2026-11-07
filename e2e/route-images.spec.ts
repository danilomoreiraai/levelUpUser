import { expect, type Locator, test } from "@playwright/test";

const featuredThumbnailPath = /\/projects\/levelup-user-(640|1200)\.webp$/;
const criticalImagePath =
  /\/assets\/danilo-portrait-.*\.webp$|\/projects\/levelup-user(?:\.jpg|-(?:640|1200)\.webp)$/;

async function expectPreloadedImage(image: Locator, requests: string[]) {
  await expect(image).toBeVisible();
  const { url, initiators } = await image.evaluate(async (element: HTMLImageElement) => {
    await element.decode();
    const url = element.currentSrc;
    const entries = performance.getEntriesByName(url, "resource") as PerformanceResourceTiming[];
    return { url, initiators: entries.map((entry) => entry.initiatorType) };
  });
  expect(requests).toEqual([url]);
  expect(initiators).toEqual(["link"]);
  return url;
}

test("serves preloads only for matching direct routes", async ({ request }) => {
  const [home, projects, services, internal] = await Promise.all([
    request.get("/"),
    request.get("/Projects/?from=portfolio"),
    request.get("/services"),
    request.get("/.route-preloads/home.html"),
  ]);

  const homeHtml = await home.text();
  const projectsHtml = await projects.text();
  expect(homeHtml).toContain('data-route-image="/"');
  expect(homeHtml).toMatch(/<link rel="modulepreload" href="\/assets\/HomePage-/);
  expect(homeHtml).not.toContain('data-route-image="/projects"');
  expect(projectsHtml).toContain('data-route-image="/projects"');
  expect(projectsHtml).toContain(
    'imagesrcset="/projects/levelup-user-640.webp 640w, /projects/levelup-user-1200.webp 1200w"',
  );
  expect(projectsHtml).toMatch(/<link rel="modulepreload" href="\/assets\/ProjectsPage-/);
  expect(projectsHtml).not.toContain("danilo-portrait-");
  expect(await services.text()).not.toContain("data-route-image=");
  expect(internal.status()).toBe(404);
});

test("a direct route requests only the image used by its critical element", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (criticalImagePath.test(request.url())) requests.push(request.url());
  });

  await page.goto("/");
  await expectPreloadedImage(
    page.getByRole("img", { name: "Danilo Moreira", exact: true }),
    requests,
  );

  requests.length = 0;
  await page.goto("/projects");
  const thumbnail = page.getByRole("img", { name: "LevelUp User website thumbnail" });
  const thumbnailUrl = await expectPreloadedImage(thumbnail, requests);
  const expectedWidth = testInfo.project.use.isMobile ? 1200 : 640;
  expect(thumbnailUrl).toContain(`/projects/levelup-user-${expectedWidth}.webp`);
  await expect(thumbnail).toHaveAttribute("loading", "eager");
  await expect(thumbnail).toHaveCSS("transition-property", "transform");
});

test("client-side navigation preloads the destination image without unrelated downloads", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (criticalImagePath.test(request.url())) requests.push(request.url());
  });
  await page.goto("/services");
  await page.getByRole("button", { name: "Reject optional" }).click();
  expect(requests).toEqual([]);

  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await expectPreloadedImage(
    page.getByRole("img", { name: "LevelUp User website thumbnail" }),
    requests,
  );

  requests.length = 0;
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expectPreloadedImage(
    page.getByRole("img", { name: "Danilo Moreira", exact: true }),
    requests,
  );
  await expect(page.locator('link[data-route-image="/projects"]')).toHaveCount(0);
});

test("keeps the Projects thumbnail lazy in a short, narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/projects");
  const thumbnail = page.getByRole("img", { name: "LevelUp User website thumbnail" });
  await expect(thumbnail).toHaveAttribute("loading", "lazy");
  const preload = page.locator('link[data-route-image="/projects"]');
  expect(await preload.evaluate((link: HTMLLinkElement) => matchMedia(link.media).matches)).toBe(
    false,
  );
});

test("retains the Projects preview fallback when the thumbnail fails", async ({ page }) => {
  let releaseThumbnail = () => {};
  const canLoadThumbnail = new Promise<void>((resolve) => {
    releaseThumbnail = resolve;
  });
  await page.route(featuredThumbnailPath, async (route) => {
    await canLoadThumbnail;
    await route.abort();
  });
  const skeleton = page.getByRole("status", { name: "Loading LevelUp User preview" });
  try {
    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await expect(skeleton).toBeVisible();
  } finally {
    releaseThumbnail();
  }
  await expect(skeleton).toHaveCount(0);
  await expect(page.getByRole("img", { name: "LevelUp User website thumbnail" })).toHaveCount(0);
  await expect(page.getByText("Preview", { exact: true })).toBeVisible();
});
