import type { LiquidGLOptions } from "liquid-gl";

const initializedTargets = new WeakSet<Element>();

type InitializeLiquidGlassOptions = {
  target: Element;
  targetSelector: string;
};

function waitForIdleTime() {
  return new Promise<void>((resolve) => {
    const requestIdleCallback = window.requestIdleCallback?.bind(window);

    if (requestIdleCallback) {
      requestIdleCallback(() => resolve(), { timeout: 2_000 });
      return;
    }

    setTimeout(resolve, 1_500);
  });
}

function shouldInitializeLiquidGlass() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasLimitedCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;

  return !prefersReducedMotion && !hasLimitedCpu;
}

function createOptions(targetSelector: string): LiquidGLOptions {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallViewport = window.matchMedia("(max-width: 767px)").matches;

  return {
    target: targetSelector,
    snapshot: "body",
    resolution: isSmallViewport ? 1 : 1.5,
    refraction: 0.01,
    aberration: 0,
    bevelDepth: 0.052,
    bevelWidth: 0.211,
    frost: 1,
    shadow: true,
    specular: !prefersReducedMotion,
    reveal: prefersReducedMotion ? "none" : "fade",
    tilt: false,
    magnify: 1,
  };
}

/**
 * Initializes liquidGL once for a persistent DOM target.
 *
 * liquidGL 2.0.1 does not expose a destroy API, so callers must keep the target
 * mounted for the lifetime of the app. The WeakSet also prevents React
 * StrictMode from creating a duplicate lens during development.
 */
export async function initializeLiquidGlass({
  target,
  targetSelector,
}: InitializeLiquidGlassOptions) {
  if (initializedTargets.has(target)) {
    return;
  }

  if (!shouldInitializeLiquidGlass()) {
    return;
  }

  await waitForIdleTime();

  if (!target.isConnected || initializedTargets.has(target)) {
    return;
  }

  const { default: liquidGL } = await import("liquid-gl");

  if (!target.isConnected || initializedTargets.has(target)) {
    return;
  }

  liquidGL(createOptions(targetSelector));
  initializedTargets.add(target);
}
