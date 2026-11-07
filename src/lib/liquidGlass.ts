import type { LiquidGLOptions } from "liquid-gl";

const initializedTargets = new WeakSet<Element>();
const initializingTargets = new WeakMap<Element, Promise<void>>();

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
  const usesMobileNavigation = window.matchMedia(
    "(max-width: 767px), (hover: none) and (pointer: coarse)",
  ).matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasLimitedCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;

  return !usesMobileNavigation && !prefersReducedMotion && !hasLimitedCpu;
}

function createOptions(targetSelector: string): LiquidGLOptions {
  return {
    target: targetSelector,
    snapshot: "body",
    resolution: 1.5,
    refraction: 0.01,
    aberration: 0,
    bevelDepth: 0.052,
    bevelWidth: 0.211,
    frost: 1,
    shadow: true,
    specular: true,
    reveal: "fade",
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
async function initializeTarget({ target, targetSelector }: InitializeLiquidGlassOptions) {
  const canInitialize = () =>
    target.isConnected && !initializedTargets.has(target) && shouldInitializeLiquidGlass();

  if (!canInitialize()) {
    return;
  }

  await waitForIdleTime();

  if (!canInitialize()) {
    return;
  }

  const { default: liquidGL } = await import("liquid-gl");

  if (!canInitialize()) {
    return;
  }

  liquidGL(createOptions(targetSelector));
  initializedTargets.add(target);
}

export async function initializeLiquidGlass(options: InitializeLiquidGlassOptions) {
  if (initializedTargets.has(options.target)) {
    return;
  }

  const pendingInitialization = initializingTargets.get(options.target);

  if (pendingInitialization) {
    await pendingInitialization;
    return;
  }

  const initialization = initializeTarget(options);
  initializingTargets.set(options.target, initialization);

  try {
    await initialization;
  } finally {
    if (initializingTargets.get(options.target) === initialization) {
      initializingTargets.delete(options.target);
    }
  }
}

/**
 * Refreshes the captured page behind an existing lens after SPA navigation.
 *
 * liquidGL only observes size changes by default. Routes with similar document
 * heights can otherwise keep rendering the previous page in the glass texture.
 */
export async function refreshLiquidGlassSnapshot(target: Element) {
  const pendingInitialization = initializingTargets.get(target);

  if (pendingInitialization) {
    await pendingInitialization;
  }

  const canRefresh = () =>
    target.isConnected && initializedTargets.has(target) && shouldInitializeLiquidGlass();

  if (!canRefresh()) {
    return;
  }

  await waitForIdleTime();

  if (!canRefresh()) {
    return;
  }

  const { default: liquidGL } = await import("liquid-gl");

  // Passing an empty collection uses liquidGL's public refresh path without
  // registering route content as a permanently dynamic element.
  liquidGL.registerDynamic([]);
}
