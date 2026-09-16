import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfilePhoto } from "./ProfilePhoto";

describe("ProfilePhoto", () => {
  it("blocks the portrait context menu and native dragging", () => {
    render(<ProfilePhoto />);

    const portrait = screen.getByRole("img", { name: "Danilo Moreira" });
    expect(fireEvent.contextMenu(portrait)).toBe(false);
    expect(portrait).toHaveAttribute("draggable", "false");
  });
});
