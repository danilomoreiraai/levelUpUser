import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminPage, Presentation } from "../shared/contracts.js";
import { createApp } from "./app.js";
import { digest, hashPassword } from "./auth.js";
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
  let clientDirectory: string;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("Set TEST_DATABASE_URL to an isolated database.");
    db = new Database(databaseUrl);
    await db.migrate();
    clientDirectory = await mkdtemp(join(tmpdir(), "personal-link-api-"));
    await mkdir(join(clientDirectory, "assets"));
    await writeFile(join(clientDirectory, "index.html"), "<!doctype html><title>Editor</title>");
    app = await createApp({
      database: db,
      origin,
      passwordHash: await hashPassword(password),
      release: "test",
      clientDirectory,
      instagramAvatar: async (username) => `synthetic-image-for-${username}`,
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
    if (clientDirectory) await rm(clientDirectory, { recursive: true, force: true });
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

  it("grants login-free editing for one page and invalidates its links and sessions", async () => {
    async function createPage() {
      const response = await app.inject({
        method: "POST",
        url: "/api/admin/pages",
        headers: { origin, cookie },
        payload: { slug: testSlug() },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<AdminPage>().hasClientLink).toBe(false);
      return response.json<AdminPage>();
    }

    const [page, other] = await Promise.all([createPage(), createPage()]);
    const issueUrl = `/api/admin/pages/${page.id}/client-link`;
    const base = `/api/client/pages/${page.id}`;
    const otherBase = `/api/client/pages/${other.id}`;
    const publicUrl = `/api/public/pages/${page.slug}`;
    const shell = await app.inject(`/edit/${page.id}`);
    expect(shell.statusCode).toBe(200);
    expect(shell.headers["x-robots-tag"]).toBe("noindex");
    expect(shell.headers["cache-control"]).toContain("no-store");
    expect(shell.body).toContain("<title>Editor</title>");
    const issue = (method: "POST" | "DELETE", authCookie = cookie) =>
      app.inject({ method, url: issueUrl, headers: { origin, cookie: authCookie } });
    const exchange = (token: string, pageUrl = base, exchangeOrigin = origin) =>
      app.inject({
        method: "POST",
        url: `${pageUrl}/session`,
        headers: { origin: exchangeOrigin },
        payload: { token },
      });

    expect((await issue("POST", "")).statusCode).toBe(401);
    const issued = await issue("POST");
    expect(issued.statusCode).toBe(200);
    expect(issued.headers["cache-control"]).toContain("no-store");
    const { token } = issued.json<{ token: string }>();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const adminPage = await app.inject({ url: `/api/admin/pages/${page.id}`, headers: { cookie } });
    expect(adminPage.json<AdminPage>().hasClientLink).toBe(true);
    expect(adminPage.body).not.toContain(token);
    const pages = await app.inject({ url: "/api/admin/pages", headers: { cookie } });
    expect(adminPage.json<AdminPage>().instagramLookupAvailable).toBe(true);
    expect(pages.json<AdminPage[]>()).toContainEqual(
      expect.objectContaining({ id: page.id, hasClientLink: true }),
    );
    expect(pages.body).not.toContain(token);
    expect((await app.inject(base)).statusCode).toBe(401);
    expect((await exchange(token, otherBase)).statusCode).toBe(401);
    expect((await exchange(token, base, "https://foreign.example")).statusCode).toBe(403);

    const session = await exchange(token);
    expect(session.statusCode).toBe(204);
    const value = session.cookies[0];
    expect(value).toMatchObject({
      name: "__Secure-personal_link_client",
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: base,
    });
    const clientCookie = `${value.name}=${value.value}`;
    const headers = { origin, cookie: clientCookie };
    const editor = await app.inject({ url: base, headers });
    expect(editor.statusCode).toBe(200);
    expect(editor.json<AdminPage>()).not.toHaveProperty("hasClientLink");
    expect((await app.inject({ url: otherBase, headers })).statusCode).toBe(401);
    expect((await app.inject({ url: "/api/client/pages", headers })).statusCode).toBe(404);
    expect((await app.inject({ url: "/api/admin/pages", headers })).statusCode).toBe(401);
    expect((await issue("POST", clientCookie)).statusCode).toBe(401);
    expect((await issue("DELETE", clientCookie)).statusCode).toBe(401);

    const lookup = (url: string, handle: string) =>
      app.inject({
        method: "POST",
        url: `${url}/instagram-avatar`,
        headers,
        payload: { handle },
      });
    const imported = await lookup(base, "@Pessoa.Exemplo");
    expect(imported.statusCode).toBe(200);
    expect(imported.json()).toEqual({ image: "synthetic-image-for-pessoa.exemplo" });
    expect((await lookup(base, "@invalido!")).statusCode).toBe(400);
    expect((await lookup(otherBase, "@pessoa.exemplo")).statusCode).toBe(401);

    const picture = await sharp({
      create: { width: 16, height: 16, channels: 3, background: "#446688" },
    })
      .png()
      .toBuffer();
    const draft = {
      ...page.draft,
      handle: "editado-pelo-cliente",
      slug: page.slug,
      revision: page.revision,
      avatar: `data:image/png;base64,${picture.toString("base64")}`,
    };
    expect(
      (await app.inject({ method: "PUT", url: `${otherBase}/draft`, headers, payload: draft }))
        .statusCode,
    ).toBe(401);
    const saved = await app.inject({
      method: "PUT",
      url: `${base}/draft`,
      headers,
      payload: draft,
    });
    expect(saved.statusCode).toBe(200);
    const updated = saved.json<AdminPage>();
    expect(updated).not.toHaveProperty("hasClientLink");
    const media = updated.draft.avatarUrl ?? "";
    expect(media).toMatch(new RegExp(`^${base}/media/`));
    expect((await app.inject(media)).statusCode).toBe(401);
    expect((await app.inject({ url: media, headers })).headers["content-type"]).toBe("image/webp");
    const otherMedia = media.replace(base, otherBase);
    expect((await app.inject({ url: otherMedia, headers })).statusCode).toBe(401);
    const otherLink = await app.inject({
      method: "POST",
      url: `/api/admin/pages/${other.id}/client-link`,
      headers: { origin, cookie },
    });
    const otherSession = await exchange(otherLink.json<{ token: string }>().token, otherBase);
    expect(otherSession.statusCode).toBe(204);
    const otherValue = otherSession.cookies[0];
    expect(
      (
        await app.inject({
          url: otherMedia,
          headers: { cookie: `${otherValue.name}=${otherValue.value}` },
        })
      ).statusCode,
    ).toBe(404);
    expect((await app.inject(publicUrl)).statusCode).toBe(404);

    const publication = (action: "publish" | "unpublish", revision: number, pageUrl = base) =>
      app.inject({ method: "POST", url: `${pageUrl}/${action}`, headers, payload: { revision } });
    expect((await publication("publish", other.revision, otherBase)).statusCode).toBe(401);
    const published = await publication("publish", updated.revision);
    expect(published.statusCode).toBe(200);
    expect((await app.inject(publicUrl)).json<Presentation>().handle).toBe(draft.handle);
    const unpublished = await publication("unpublish", published.json<AdminPage>().revision);
    expect(unpublished.statusCode).toBe(200);
    expect((await app.inject(publicUrl)).statusCode).toBe(404);

    const rotated = await issue("POST");
    expect(rotated.statusCode).toBe(200);
    const next = rotated.json<{ token: string }>().token;
    expect(next).not.toBe(token);
    expect((await exchange(token)).statusCode).toBe(401);
    expect((await app.inject({ url: base, headers })).statusCode).toBe(401);
    expect((await app.inject({ url: media, headers })).statusCode).toBe(401);
    await expect(
      db.changePublication(
        page.id,
        unpublished.json<AdminPage>().revision,
        "publish",
        digest(token),
      ),
    ).rejects.toMatchObject({ status: 401 });

    const nextSession = await exchange(next);
    expect(nextSession.statusCode).toBe(204);
    const nextValue = nextSession.cookies[0];
    const nextHeaders = { cookie: `${nextValue.name}=${nextValue.value}` };
    expect((await app.inject({ url: base, headers: nextHeaders })).statusCode).toBe(200);
    expect((await issue("DELETE")).statusCode).toBe(204);
    expect((await exchange(next)).statusCode).toBe(401);
    expect((await app.inject({ url: base, headers: nextHeaders })).statusCode).toBe(401);
    const revoked = await app.inject({ url: `/api/admin/pages/${page.id}`, headers: { cookie } });
    expect(revoked.json<AdminPage>().hasClientLink).toBe(false);
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
