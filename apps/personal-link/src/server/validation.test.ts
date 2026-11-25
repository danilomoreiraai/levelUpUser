import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readImage } from "./images.js";
import { readContent, readSlug } from "./validation.js";

const draft = {
  handle: "@MinhaPagina",
  links: [{ label: "Site", url: "https://example.com" }],
  socials: [{ platform: "instagram", url: "https://instagram.com/example" }],
  preset: "dusk",
  blur: 14,
};

describe("draft validation", () => {
  it("normalizes a slug, handle and link", () => {
    expect(readSlug(" Minha-Pagina ")).toBe("minha-pagina");
    expect(readContent(draft)).toMatchObject({
      handle: "MinhaPagina",
      links: [{ label: "Site", url: "https://example.com/" }],
      preset: "dusk",
      blur: 14,
    });
  });

  it.each(["admin", "api", "assets", "readyz", "na", "mídia", "a--b", "../../pagina"])(
    "rejects unsafe and reserved slug %s",
    (slug) => expect(() => readSlug(slug)).toThrow(),
  );

  it.each([
    "javascript:alert(0)",
    "data:text/html,test",
    "https://user:pass@example.com",
    "//example.com",
    "https://exam ple.com",
    "https://example.com\\test",
  ])("rejects link destination %s", (url) => {
    expect(() => readContent({ ...draft, links: [{ label: "Rejeitar", url }] })).toThrow();
  });

  it("rejects out-of-range blur, incomplete handles and unknown platforms", () => {
    expect(() => readContent({ ...draft, blur: 25 })).toThrow();
    expect(() => readContent({ ...draft, handle: "@" })).toThrow();
    expect(() =>
      readContent({ ...draft, socials: [{ platform: "bad", url: "https://example.com" }] }),
    ).toThrow();
  });
});

describe("image processing", () => {
  it("re-encodes valid images and drops source metadata", async () => {
    const input = await sharp({
      create: { width: 900, height: 900, channels: 3, background: "#8899ab" },
    })
      .jpeg()
      .withMetadata()
      .toBuffer();
    const output = await readImage(`data:image/jpeg;base64,${input.toString("base64")}`, "avatar");
    expect(output).toBeInstanceOf(Buffer);
    if (!output) throw new Error("Missing processed image");
    expect(await sharp(output).metadata()).toMatchObject({
      format: "webp",
      width: 512,
      height: 512,
      hasProfile: false,
    });
    expect((await sharp(output).metadata()).exif).toBeUndefined();
  });

  it("keeps undefined and null distinct, and rejects unexpected and fake types", async () => {
    await expect(readImage(undefined, "avatar")).resolves.toBeUndefined();
    await expect(readImage(null, "avatar")).resolves.toBeNull();
    await expect(readImage("data:image/svg+xml;base64,PHN2Zz4K", "avatar")).rejects.toThrow();
    await expect(readImage("data:image/png;base64,PGh0bWw+", "avatar")).rejects.toThrow();
  });
});
