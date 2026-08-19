import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveCookieConsent } from "@/lib/privacyConsent";
import { trackProjectMetric } from "@/lib/tracking";

describe("project metrics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.gtag = vi.fn();
  });

  it("does not emit a project metric without analytics consent", () => {
    trackProjectMetric({
      action: "project_link_click",
      phase: "delivered",
      projectTitle: "Example",
      status: "Live",
    });

    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("emits analytics events without creating monitoring issues", () => {
    saveCookieConsent({ analytics: true, marketing: false, monitoring: false });

    trackProjectMetric({
      action: "project_link_click",
      phase: "delivered",
      projectTitle: "Example",
      status: "Live",
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "project_link_click", {
      project_phase: "delivered",
      project_status: "Live",
      project_title: "Example",
    });
  });

  it("deduplicates hover events within a browser session", () => {
    saveCookieConsent({ analytics: true, marketing: false, monitoring: false });
    const metric = {
      action: "project_card_hover" as const,
      phase: "delivered",
      projectTitle: "Example",
      status: "Live",
    };

    trackProjectMetric(metric);
    trackProjectMetric(metric);

    expect(window.gtag).toHaveBeenCalledOnce();
  });
});
