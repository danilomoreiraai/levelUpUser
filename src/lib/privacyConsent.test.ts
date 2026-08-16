import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCookieConsent,
  hasCookieConsent,
  saveCookieConsent,
  subscribeToCookieConsentChange,
} from "@/lib/privacyConsent";

const storageKey = "levelupuser.cookieConsent";

describe("privacy consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no valid preference exists", () => {
    expect(getCookieConsent()).toBeNull();

    window.localStorage.setItem(storageKey, "not-json");
    expect(getCookieConsent()).toBeNull();
  });

  it("saves granular preferences and publishes the change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCookieConsentChange(listener);

    const consent = saveCookieConsent({
      analytics: true,
      marketing: false,
      monitoring: true,
    });

    expect(consent.version).toBe(2);
    expect(getCookieConsent()).toEqual(consent);
    expect(hasCookieConsent("analytics")).toBe(true);
    expect(hasCookieConsent("marketing")).toBe(false);
    expect(listener).toHaveBeenCalledWith(consent);

    unsubscribe();
  });

  it("migrates legacy consent without granting analytics or marketing", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        choice: "accepted",
        version: 1,
        updatedAt: "2026-08-16T00:00:00.000Z",
      }),
    );

    expect(getCookieConsent()).toEqual({
      preferences: {
        analytics: false,
        marketing: false,
        monitoring: true,
      },
      version: 2,
      updatedAt: "2026-08-16T00:00:00.000Z",
    });
  });
});
