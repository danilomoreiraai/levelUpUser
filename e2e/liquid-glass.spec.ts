import { expect, test } from "@playwright/test";

type LiquidGlassRenderer = {
  _rafId?: number;
  captureSnapshot: () => Promise<boolean>;
  lenses: Array<{
    options: {
      reveal: "fade" | "none";
      specular: boolean;
    };
  }>;
};

type LiquidGlassWindow = Window & {
  __liquidGLNoWebGL__?: boolean;
  __liquidGLRenderer__?: LiquidGlassRenderer & {
    __testCaptureCount?: number;
  };
};

const routes = [
  { heading: "Ideas, products, and active builds.", path: "/projects" },
  { heading: "Simple tools for everyday tasks.", path: "/services" },
  { heading: "Privacy Policy", path: "/privacy" },
  { heading: "Terms of Service", path: "/terms" },
  { heading: "Page not found", path: "/missing-page" },
  { heading: "LevelUp User", path: "/" },
] as const;

function recordRuntimeErrors(errors: string[]) {
  return (message: { text(): string; type(): string }) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  };
}

test("keeps one animated glass lens and refreshes it on every route", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Animated glass is a desktop enhancement");
  const runtimeErrors: string[] = [];
  page.on("console", recordRuntimeErrors(runtimeErrors));
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");

  const navigation = page.locator("#levelup-liquid-navigation");
  await expect(navigation).toBeVisible();
  await expect(navigation).toHaveCSS("opacity", "1", { timeout: 3_000 });
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const renderer = (window as LiquidGlassWindow).__liquidGLRenderer__;
        return {
          canvasCount: document.querySelectorAll("body > canvas[data-liquid-ignore]").length,
          lensCount: renderer?.lenses.length ?? 0,
          rendering: Boolean(renderer?._rafId),
        };
      }),
    )
    .toEqual({ canvasCount: 1, lensCount: 1, rendering: true });

  await page.evaluate(() => {
    const renderer = (window as LiquidGlassWindow).__liquidGLRenderer__;

    if (!renderer) {
      throw new Error("liquidGL renderer was not initialized");
    }

    const captureSnapshot = renderer.captureSnapshot.bind(renderer);
    renderer.__testCaptureCount = 0;
    renderer.captureSnapshot = async () => {
      renderer.__testCaptureCount = (renderer.__testCaptureCount ?? 0) + 1;
      return captureSnapshot();
    };
  });

  let previousCaptureCount = 0;

  for (const route of routes) {
    await page.evaluate((path) => {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, route.path);

    await expect(page).toHaveURL(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(route.heading);
    await expect(navigation).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as LiquidGlassWindow).__liquidGLRenderer__?.__testCaptureCount ?? 0,
        ),
      )
      .toBeGreaterThan(previousCaptureCount);

    previousCaptureCount = await page.evaluate(
      () => (window as LiquidGlassWindow).__liquidGLRenderer__?.__testCaptureCount ?? 0,
    );

    const rendererState = await page.evaluate(() => {
      const renderer = (window as LiquidGlassWindow).__liquidGLRenderer__;
      return {
        canvasCount: document.querySelectorAll("body > canvas[data-liquid-ignore]").length,
        lensCount: renderer?.lenses.length ?? 0,
      };
    });

    expect(rendererState).toEqual({ canvasCount: 1, lensCount: 1 });
  }

  await navigation.getByRole("link", { name: "Home" }).focus();
  await page.keyboard.press("Tab");
  const projectsLink = navigation.getByRole("link", { name: "Projects" });
  await expect(projectsLink).toBeFocused();
  await expect(projectsLink).toHaveCSS("box-shadow", /0px 0px 0px 2px/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/projects");
  await expect(projectsLink).toHaveAttribute("aria-current", "page");
  expect(runtimeErrors).toEqual([]);
});

test("uses CSS glass on mobile direct loads and SPA navigation", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Verifies the mobile CSS treatment");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/assets/liquidGL-")) {
      requests.push(request.url());
    }
  });

  await page.goto("/projects");
  const navigation = page.locator("#levelup-liquid-navigation");
  const homeLink = navigation.getByRole("link", { name: "Home" });
  const projectsLink = navigation.getByRole("link", { name: "Projects" });
  await expect(projectsLink).toHaveAttribute("aria-current", "page");
  await expect(navigation).toHaveCSS("backdrop-filter", "blur(12px)");

  await page.goto("/");
  await expect(homeLink).toHaveAttribute("aria-current", "page");
  await homeLink.focus();
  await page.keyboard.press("Tab");
  await expect(projectsLink).toBeFocused();
  await expect(projectsLink).toHaveCSS("box-shadow", /0px 0px 0px 2px/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/projects");
  await expect(projectsLink).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ideas, products, and active builds.",
  );
  await expect(navigation).toHaveCSS("backdrop-filter", "blur(12px)");

  await page.evaluate(() => new Promise<void>((resolve) => requestIdleCallback(() => resolve())));
  await expect(page.locator("body > canvas[data-liquid-ignore]")).toHaveCount(0);
  expect(
    await page.evaluate(() => Boolean((window as LiquidGlassWindow).__liquidGLRenderer__)),
  ).toBe(false);
  expect(requests).toEqual([]);
});

test("does not initialize animation when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("#levelup-liquid-navigation")).toHaveCSS(
    "backdrop-filter",
    "blur(12px)",
  );
  await page.evaluate(() => new Promise<void>((resolve) => requestIdleCallback(() => resolve())));

  const animationState = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll("body > canvas[data-liquid-ignore]").length,
    hasRenderer: Boolean((window as LiquidGlassWindow).__liquidGLRenderer__),
  }));

  expect(animationState).toEqual({ canvasCount: 0, hasRenderer: false });
});

test("keeps navigation usable when WebGL is unavailable", async ({ page, isMobile }) => {
  test.skip(isMobile, "Verifies fallback after a desktop WebGL attempt");
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: unknown[]) {
      if (contextId.startsWith("webgl") || contextId === "experimental-webgl") {
        return null;
      }

      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto("/");

  const navigation = page.locator("#levelup-liquid-navigation");
  await expect
    .poll(() => page.evaluate(() => (window as LiquidGlassWindow).__liquidGLNoWebGL__))
    .toBe(true);
  await expect(navigation).toHaveCSS("backdrop-filter", "blur(12px)");
  await page.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ideas, products, and active builds.",
  );
});
