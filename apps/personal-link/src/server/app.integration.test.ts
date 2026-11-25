import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminPage, Presentation } from "../shared/contracts.js";
import { createApp } from "./app.js";
import { hashPassword } from "./auth.js";
import { Database } from "./database.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const origin = "https://personal-link.example";
const password = "synthetic-admin-password-only";

function testSlug() {
  return `test-${randomUUID()}`;
}

describe.skipIf(!databaseUrl)("Personal Link API with PostgreSQL", () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let db: Database;
  let cookie: string;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("Set TEST_DATABASE_URL to an isolated database.");
    db = new Database(databaseUrl);
    await db.migrate();
    app = await createApp({
      database: db,
      origin,
      passwordHash: await hashPassword(password),
      release: "test",
    });
    const session = await app.inject({
      method: "POST",
      url: "/api/admin/session",
      headers: { origin },
      payload: { password },
    });
    expect(session.statusCode).toBe(200);
    const value = session.cookies[0];
    expect(value).toMatchObject({ httpOnly: true, secure: true, sameSite: "Strict", path: "/" });
    cookie = `${value.name}=${value.value}`;
  });

  afterAll(async () => {
    if (app) await app.close();
    else if (db) await db.close();
  });

  it("requires a valid session and guards cross-origin writes", async () => {
    expect((await app.inject("/api/admin/pages")).statusCode).toBe(401);
    const foreign = await app.inject({
      method: "POST",
      url: "/api/admin/pages",
      headers: { cookie, origin: "https://foreign.example" },
      payload: { slug: testSlug() },
    });
    expect(foreign.statusCode).toBe(403);
    const readiness = await app.inject("/readyz");
    expect(readiness.json()).toEqual({ status: "ready", release: "test" });
  });

  it("publishes only saved versions, protects new images, locks the address and revokes public media", async () => {
    const headers = { origin, cookie };
    const slug = testSlug();
    const created = await app.inject({
      method: "POST",
      url: "/api/admin/pages",
      headers,
      payload: { slug },
    });
    expect(created.statusCode).toBe(201);
    const page = created.json<AdminPage>();
    const base = `/api/admin/pages/${page.id}`;
    const publicUrl = `/api/public/pages/${slug}`;
    expect((await app.inject(publicUrl)).statusCode).toBe(404);

    const picture = await sharp({
      create: { width: 16, height: 16, channels: 3, background: "#bbccdd" },
    })
      .png()
      .toBuffer();
    const draft = {
      slug,
      handle: "primeira",
      preset: "sage",
      blur: 12,
      links: [{ label: "Site", url: "https://example.com/" }],
      socials: [{ platform: "other", url: "https://example.com/social" }],
    };
    const saved = await app.inject({
      method: "PUT",
      url: `${base}/draft`,
      headers,
      payload: {
        ...draft,
        revision: page.revision,
        avatar: `data:image/png;base64,${picture.toString("base64")}`,
      },
    });
    expect(saved.statusCode).toBe(200);
    const persisted = saved.json<AdminPage>();
    const mediaUrl = persisted.draft.avatarUrl ?? "";
    const proposedPublicMedia = `${publicUrl}/media/${mediaUrl.split("/").at(-1)}`;
    expect((await app.inject(mediaUrl)).statusCode).toBe(401);
    expect((await app.inject(proposedPublicMedia)).statusCode).toBe(404);

    const publish = await app.inject({
      method: "POST",
      url: `${base}/publish`,
      headers,
      payload: { revision: persisted.revision },
    });
    expect(publish.statusCode).toBe(200);
    const firstPublic = await app.inject(publicUrl);
    expect(firstPublic.headers["cache-control"]).toContain("no-store");
    expect(firstPublic.json<Presentation>()).toMatchObject({
      handle: "primeira",
      blur: 12,
      avatarUrl: proposedPublicMedia,
    });
    expect((await app.inject(proposedPublicMedia)).headers["content-type"]).toBe("image/webp");

    const revision = publish.json<AdminPage>().revision;
    const changedSlug = await app.inject({
      method: "PUT",
      url: `${base}/draft`,
      headers,
      payload: { ...draft, slug: testSlug(), revision },
    });
    expect(changedSlug.statusCode).toBe(409);
    const writes = await Promise.all(
      ["segunda", "segundo-rascunho"].map((handle) =>
        app.inject({
          method: "PUT",
          url: `${base}/draft`,
          headers,
          payload: { ...draft, revision, handle, avatar: null },
        }),
      ),
    );
    expect(writes.map(({ statusCode }) => statusCode).sort()).toEqual([200, 409]);
    const latest = writes.find(({ statusCode }) => statusCode === 200)?.json<AdminPage>();
    expect((await app.inject(publicUrl)).json<Presentation>().handle).toBe("primeira");
    expect((await app.inject(proposedPublicMedia)).statusCode).toBe(200);

    const updated = await app.inject({
      method: "POST",
      url: `${base}/publish`,
      headers,
      payload: { revision: latest?.revision },
    });
    expect(updated.statusCode).toBe(200);
    expect((await app.inject(publicUrl)).json<Presentation>().handle).toBe(latest?.draft.handle);
    expect((await app.inject(proposedPublicMedia)).statusCode).toBe(404);

    const unpublish = await app.inject({
      method: "POST",
      url: `${base}/unpublish`,
      headers,
      payload: { revision: updated.json<AdminPage>().revision },
    });
    expect(unpublish.json<AdminPage>()).toMatchObject({ slug, slugLocked: true, published: false });
    expect((await app.inject(publicUrl)).statusCode).toBe(404);
    expect((await app.inject(proposedPublicMedia)).statusCode).toBe(404);
  });

  it("limits failed attempts without blocking another direct client or trusting spoofed headers", async () => {
    const attempt = (remoteAddress: string, provided: unknown, forwarded?: string) =>
      app.inject({
        method: "POST",
        url: "/api/admin/session",
        remoteAddress,
        headers: { origin, ...(forwarded ? { "x-forwarded-for": forwarded } : {}) },
        payload: { password: provided },
      });

    for (let index = 0; index < 10; index += 1) {
      expect((await attempt("192.0.2.1", null)).statusCode).toBe(401);
    }
    const throttled = await attempt("192.0.2.1", password, "198.51.100.123");
    expect(throttled.statusCode).toBe(429);
    expect(Number(throttled.headers["retry-after"])).toBeGreaterThan(0);
    expect((await attempt("192.0.2.2", password)).statusCode).toBe(200);
  });

  it("invalidates a session after logout", async () => {
    const session = await app.inject({
      method: "POST",
      url: "/api/admin/session",
      headers: { origin },
      payload: { password },
    });
    const value = session.cookies[0];
    const extra = `${value.name}=${value.value}`;
    expect(
      (await app.inject({ url: "/api/admin/session", headers: { cookie: extra } })).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: "/api/admin/session",
          headers: { origin, cookie: extra },
        })
      ).statusCode,
    ).toBe(204);
    expect(
      (await app.inject({ url: "/api/admin/session", headers: { cookie: extra } })).statusCode,
    ).toBe(401);
  });
});
