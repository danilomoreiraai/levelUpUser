import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { getCookieConsent } from "@/lib/privacyConsent";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("rejects all optional categories", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole("button", { name: "Reject optional" }));

    expect(getCookieConsent()?.preferences).toEqual({
      analytics: false,
      marketing: false,
      monitoring: false,
    });
    expect(screen.getByRole("button", { name: "Privacy choices" })).toBeVisible();
  });

  it("stores granular preferences and lets users reopen them", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.click(screen.getByRole("checkbox", { name: /Analytics/ }));
    await user.click(screen.getByRole("button", { name: "Save choices" }));

    expect(getCookieConsent()?.preferences.analytics).toBe(true);
    expect(getCookieConsent()?.preferences.marketing).toBe(false);

    await user.click(screen.getByRole("button", { name: "Privacy choices" }));
    expect(screen.getByRole("checkbox", { name: /Analytics/ })).toBeChecked();
  });
});
