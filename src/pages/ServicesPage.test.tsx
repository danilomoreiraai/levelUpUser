import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServicesPage } from "@/pages/ServicesPage";

describe("ServicesPage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["https://links.example.test/", "https://links.example.test/admin"],
    ["http://127.0.0.1:3000", "http://127.0.0.1:3000/admin"],
  ])("opens the editor at the configured origin %j", (origin, destination) => {
    vi.stubEnv("VITE_PERSONAL_LINK_ORIGIN", origin);
    render(<ServicesPage />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: "Personalized Link Page" })).toHaveAttribute(
      "href",
      destination,
    );
  });

  it.each(["", "invalid-origin", "ftp://links.example.test"])(
    "uses the service information page when the configured origin is %j",
    (origin) => {
      vi.stubEnv("VITE_PERSONAL_LINK_ORIGIN", origin);
      render(<ServicesPage />, { wrapper: MemoryRouter });

      expect(screen.getByRole("link", { name: "Personalized Link Page" })).toHaveAttribute(
        "href",
        "/services/link-page",
      );
    },
  );
});
