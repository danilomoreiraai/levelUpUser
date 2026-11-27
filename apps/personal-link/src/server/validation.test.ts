import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeLinkUrl } from "../shared/normalizeLinkUrl.js";
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

  it("adds HTTPS to bare addresses in both links and social networks", () => {
    expect(
      readContent({
        ...draft,
        links: [
          { label: "Site", url: " google.com " },
          { label: "Porta", url: "example.com:8443/site?q=1#section" },
          { label: "HTTP", url: "http://example.com" },
        ],
        socials: [{ platform: "instagram", url: "instagram.com/example" }],
      }),
    ).toMatchObject({
      links: [
        { url: "https://google.com/" },
        { url: "https://example.com:8443/site?q=1#section" },
        { url: "http://example.com/" },
      ],
      socials: [{ url: "https://instagram.com/example" }],
    });
  });

  it.each(["admin", "api", "assets", "readyz", "na", "mídia", "a--b", "../../pagina"])(
    "rejects unsafe and reserved slug %s",
    (slug) => expect(() => readSlug(slug)).toThrow(),
  );

  it.each([
    "javascript:alert(0)",
    "data:text/html,test",
    "ftp://example.com",
    "https:example.com",
    "https://user:pass@example.com",
    "https://user@example.com",
    "https://:pass@example.com",
    "user@example.com",
    "@example.com",
    "example.com:",
    "https://",
    "",
    "//example.com",
    "/example.com",
    "arquivo",
    "https://exam ple.com",
    "https://example.com\\test",
    "https://example.com/path\u0000value",
  ])("rejects link destination %s", (url) => {
    expect(() => readContent({ ...draft, links: [{ label: "Rejeitar", url }] })).toThrow();
  });

  it("finds the scheme only at the beginning of an address", () => {
    expect(normalizeLinkUrl("example.com/?next=https://other.example")).toBe(
      "https://example.com/?next=https://other.example",
    );
    expect(normalizeLinkUrl("https://")).toBeNull();
  });

  it("enforces the address length after adding the protocol and encoding characters", () => {
    const prefix = "https://example.com/";
    const longest = prefix + "a".repeat(2_048 - prefix.length);
    const readLink = (url: string) => readContent({ ...draft, links: [{ label: "Site", url }] });
    expect(readLink(longest).links[0].url).toBe(longest);
    expect(readLink(longest.slice("https://".length)).links[0].url).toBe(longest);
    expect(() => readLink(`${longest}a`)).toThrow();
    expect(() => readLink(`${longest.slice(8)}á`)).toThrow();
    expect(() => readLink(prefix + "./".repeat(1_024))).toThrow();
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
