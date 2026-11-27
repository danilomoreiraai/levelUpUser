import sharp from "sharp";
import { expect, it, vi } from "vitest";
import { createInstagramAvatarLookup, instagramUsername } from "./instagram.js";

const graph = "https://graph.facebook.com/v27.0";
const photo = "https://images.cdninstagram.com/avatar.png";
const env = {
  INSTAGRAM_GRAPH_API_URL: graph,
  INSTAGRAM_BUSINESS_ACCOUNT_ID: "123",
  INSTAGRAM_GRAPH_ACCESS_TOKEN: "test-token",
};

it("normalizes an Instagram handle and rejects Graph expressions and malformed usernames", () => {
  expect(instagramUsername(" @Atelier.Real ")).toBe("atelier.real");
  for (const handle of ["foo..bar", "@", "foo){id}", "https://example.com", "a".repeat(31)]) {
    expect(() => instagramUsername(handle)).toThrow();
  }
  expect(createInstagramAvatarLookup({})).toBeUndefined();
  expect(() => createInstagramAvatarLookup({ ...env, INSTAGRAM_GRAPH_API_URL: photo })).toThrow();
});

it("fetches the authorized Graph field and returns an optimized, same-origin preview payload", async () => {
  const png = await sharp({
    create: { width: 3, height: 3, channels: 3, background: "#005fa6" },
  })
    .png()
    .toBuffer();
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ business_discovery: { profile_picture_url: photo } }))
    .mockResolvedValueOnce(
      new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } }),
    );
  const lookup = createInstagramAvatarLookup(env, request);
  expect(await lookup?.("atelier.real")).toMatch(/^data:image\/webp;base64,/u);
  const [graphUrl, graphOptions] = request.mock.calls[0];
  expect(String(graphUrl)).toContain(`${graph}/123?fields=`);
  expect(new URL(String(graphUrl)).searchParams.get("fields")).toBe(
    "business_discovery.username(atelier.real){profile_picture_url}",
  );
  expect(graphOptions).toMatchObject({
    redirect: "error",
    headers: { Authorization: "Bearer test-token" },
  });
  expect(String(request.mock.calls[1][0])).toBe(photo);
  expect(request.mock.calls[1][1]?.headers).toBeUndefined();
});

it("rejects unsupported profiles and unsafe CDN destinations without requesting them", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ error: { code: 100 } }, { status: 400 }))
    .mockResolvedValueOnce(
      Response.json({
        business_discovery: { profile_picture_url: "https://cdninstagram.com.example.com/a.png" },
      }),
    );
  const lookup = createInstagramAvatarLookup(env, request);
  await expect(lookup?.("personal")).rejects.toMatchObject({ status: 404 });
  await expect(lookup?.("atelier")).rejects.toMatchObject({ status: 502 });
  expect(request).toHaveBeenCalledTimes(2);
});
