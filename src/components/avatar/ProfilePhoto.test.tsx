import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfilePhoto } from "./ProfilePhoto";

describe("ProfilePhoto", () => {
  it("offers three portrait densities in a fixed-size layout", () => {
    render(<ProfilePhoto />);

    const portrait = screen.getByRole("img", { name: "Danilo Moreira" });
    expect(portrait).toHaveAttribute("width", "144");
    expect(portrait).toHaveAttribute("height", "144");
    expect(portrait).toHaveAttribute("srcset", expect.stringMatching(/ 1x, .* 2x, .* 3x$/));
  });

  it("blocks the portrait context menu and native dragging", () => {
    render(<ProfilePhoto />);

    const portrait = screen.getByRole("img", { name: "Danilo Moreira" });
    expect(fireEvent.contextMenu(portrait)).toBe(false);
    expect(portrait).toHaveAttribute("draggable", "false");
  });
});
