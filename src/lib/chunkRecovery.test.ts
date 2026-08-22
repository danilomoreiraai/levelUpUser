import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleVitePreloadError } from "@/lib/chunkRecovery";
import { captureRuntimeError } from "@/lib/monitoring";

vi.mock("@/lib/monitoring", () => ({
  captureRuntimeError: vi.fn(),
}));

describe("chunk recovery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("reloads once after preventing the first preload failure", () => {
    const firstEvent = new Event("vite:preloadError", { cancelable: true });
    const reloadPage = vi.fn();

    expect(handleVitePreloadError(firstEvent, reloadPage)).toBe(true);
    expect(firstEvent.defaultPrevented).toBe(true);
    expect(reloadPage).toHaveBeenCalledOnce();

    const repeatedEvent = new Event("vite:preloadError", { cancelable: true });
    expect(handleVitePreloadError(repeatedEvent, reloadPage)).toBe(false);
    expect(repeatedEvent.defaultPrevented).toBe(false);
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it("keeps the loaded application available when the browser is offline", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    const event = new Event("vite:preloadError", { cancelable: true });
    const reloadPage = vi.fn();

    expect(handleVitePreloadError(event, reloadPage)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(captureRuntimeError).not.toHaveBeenCalled();
    expect(reloadPage).not.toHaveBeenCalled();
  });
});
