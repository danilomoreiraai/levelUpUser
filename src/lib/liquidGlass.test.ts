import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initializeLiquidGlass } from "./liquidGlass";

const { liquidGL } = vi.hoisted(() => ({ liquidGL: vi.fn() }));
vi.mock("liquid-gl", () => ({ default: liquidGL }));

describe("initializeLiquidGlass", () => {
  let target: HTMLDivElement;

  beforeEach(() => {
    target = document.createElement("div");
    target.id = "test-navigation";
    document.body.append(target);
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
  });

  afterEach(() => {
    target.remove();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps touch-only navigation on CSS even on wide screens", async () => {
    const requestIdleCallback = vi.fn();
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("(hover: none) and (pointer: coarse)"),
    }));

    await initializeLiquidGlass({ target, targetSelector: "#test-navigation" });

    expect(requestIdleCallback).not.toHaveBeenCalled();
    expect(liquidGL).not.toHaveBeenCalled();
  });

  it("rechecks the viewport before importing after idle", async () => {
    let narrow = false;
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: narrow && query.includes("(max-width: 767px)"),
    }));
    const requestIdleCallback = vi.fn((callback: () => void) => {
      narrow = true;
      callback();
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);

    await initializeLiquidGlass({ target, targetSelector: "#test-navigation" });

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(liquidGL).not.toHaveBeenCalled();
  });
});
