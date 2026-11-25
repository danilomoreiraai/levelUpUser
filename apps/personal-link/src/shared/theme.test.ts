import { describe, expect, it, vi } from "vitest";

import { getLocalTheme, getMillisecondsUntilThemeBoundary } from "./theme";

describe("getLocalTheme", () => {
  it.each([
    [0, 0, "dark"],
    [5, 59, "dark"],
    [6, 0, "light"],
    [17, 59, "light"],
    [18, 0, "dark"],
    [23, 59, "dark"],
  ])("at %i:%i it is %s", (hour, minute, expected) => {
    expect(getLocalTheme(new Date(2026, 10, 25, hour, minute))).toBe(expected);
  });

  it("reads the local clock by default", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 10, 25, 12));
      expect(getLocalTheme()).toBe("light");
      expect(getMillisecondsUntilThemeBoundary()).toBe(6 * 60 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getMillisecondsUntilThemeBoundary", () => {
  it.each([
    [0, 0, 6 * 60 * 60 * 1000],
    [5, 59, 60 * 1000],
    [6, 0, 12 * 60 * 60 * 1000],
    [17, 59, 60 * 1000],
    [18, 0, 12 * 60 * 60 * 1000],
    [23, 59, 6 * 60 * 60 * 1000 + 60 * 1000],
  ])("at %i:%i it waits %i ms", (hour, minute, expected) => {
    expect(getMillisecondsUntilThemeBoundary(new Date(2026, 10, 25, hour, minute))).toBe(expected);
  });

  it("resets seconds and milliseconds when scheduling the boundary", () => {
    const now = new Date(2026, 10, 25, 17, 59, 59, 900);
    expect(getMillisecondsUntilThemeBoundary(now)).toBe(100);
    expect(now.getHours()).toBe(17);
  });

  it("crosses the year boundary after midnight", () => {
    const now = new Date(2026, 11, 31, 23, 59, 59, 999);
    expect(new Date(now.getTime() + getMillisecondsUntilThemeBoundary(now))).toEqual(
      new Date(2027, 0, 1, 6),
    );
  });
});
