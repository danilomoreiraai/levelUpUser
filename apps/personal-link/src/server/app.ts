import { join, sep } from "node:path";
import cookies from "@fastify/cookie";
import helmet from "@fastify/helmet";
import staticFiles from "@fastify/static";
import Fastify, { type FastifyReply, type FastifyRequest, LogController } from "fastify";
import { digest, newSessionToken, readPasswordHash, sessionDurationSeconds } from "./auth.js";
import type { Database, EditorAccess } from "./database.js";
import { RequestError } from "./errors.js";
import { readImage } from "./images.js";
import { instagramProfileUsername, instagramUsername } from "./instagram.js";
import { object, readContent, readRevision, readSlug, validSlug } from "./validation.js";

type Options = {
  database: Database;
  origin: string;
  passwordHash: string;
  release: string;
  clientDirectory?: string;
  logger?: boolean;
  trustedProxies?: string[];
  instagramAvatar?: (username: string) => Promise<string>;
};

type PageParams = { id: string };

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const tokenFormat = /^[\w-]{43}$/u;
const noStore = "private, no-store, max-age=0";

function readId(value: string): string {
  if (!uuid.test(value)) throw new RequestError(404, "Página ou imagem não encontrada.");
  return value;
}

function publicSlug(value: string): string {
  if (!validSlug(value)) throw new RequestError(404, "Página não encontrada.");
  return value;
}

function readClientToken(value: unknown): string {
  if (typeof value !== "string" || !tokenFormat.test(value)) {
    throw new RequestError(401, "Este link de edição é inválido ou foi revogado.");
  }
  return value;
}

async function sendMedia(reply: FastifyReply, content: Buffer | null) {
  if (!content) throw new RequestError(404, "Imagem não encontrada.");
  return reply.type("image/webp").send(content);
}

export async function createApp(options: Options) {
  const { database, origin, release } = options;
  const password = readPasswordHash(options.passwordHash);
  const secureCookies = origin.startsWith("https://");
  const sessionName = secureCookies ? "__Host-personal_link_session" : "personal_link_session";
  const clientSessionName = secureCookies
    ? "__Secure-personal_link_client"
    : "personal_link_client";
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustedProxies ?? false,
    routerOptions: { ignoreTrailingSlash: true },
    logController: new LogController({ disableRequestLogging: true }),
  });
  const sessionCookie = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
  } as const;

  await app.register(cookies);
  await app.register(helmet, {
    strictTransportSecurity: secureCookies,
    referrerPolicy: { policy: "no-referrer" },
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: secureCookies ? [] : null,
      },
    },
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("Cache-Control", noStore);
    if (
      ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
      request.headers.origin !== origin
    ) {
      throw new RequestError(403, "A solicitação deve ser feita pelo próprio painel.");
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof RequestError) {
      return reply.code(error.status).send({ error: error.message });
    }
    const failure = error as { code?: string; statusCode?: number } | null;
    if (failure?.code === "23505") {
      return reply.code(409).send({ error: "Este endereço já está em uso." });
    }
    if (failure?.statusCode === 413) {
      return reply.code(413).send({ error: "O envio excedeu o tamanho permitido." });
    }
    if (failure?.statusCode === 400 || failure?.statusCode === 415) {
      return reply.code(failure.statusCode).send({ error: "Verifique os dados enviados." });
    }
    request.log.error({ code: failure?.code }, "Personal Link request failed");
    return reply.code(503).send({ error: "O serviço está indisponível. Tente novamente." });
  });
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({ error: "Página não encontrada." }),
  );

  function sessionToken(request: FastifyRequest): string | undefined {
    const token = request.cookies[sessionName];
    return token && tokenFormat.test(token) ? token : undefined;
  }

  async function requireSession(request: FastifyRequest): Promise<void> {
    const token = sessionToken(request);
    if (!token || !(await database.hasSession(token, password.tag))) {
      throw new RequestError(401, "Entre para acessar o painel.");
    }
  }

  let loginInProgress = false;
  const loginWindows = new Map<string, { remaining: number; resetAt: number }>();
  const maxLoginWindows = 4_096;
  app.get("/api/admin/session", { onRequest: requireSession }, async () => ({
    authenticated: true,
  }));
  app.post("/api/admin/session", { bodyLimit: 4_096 }, async (request, reply) => {
    const now = Date.now();
    const previous = loginWindows.get(request.ip);
    const window =
      previous && previous.resetAt > now ? previous : { remaining: 10, resetAt: now + 60_000 };
    if (!previous && loginWindows.size >= maxLoginWindows) {
      for (const [ip, entry] of loginWindows) {
        if (entry.resetAt <= now) loginWindows.delete(ip);
      }
    }
    if (
      loginInProgress ||
      window.remaining <= 0 ||
      (!previous && loginWindows.size >= maxLoginWindows)
    ) {
      reply.header(
        "Retry-After",
        loginInProgress ? "1" : Math.ceil((window.resetAt - now) / 1_000),
      );
      throw new RequestError(429, "Muitas tentativas. Aguarde um momento e tente novamente.");
    }

    const provided = object(request.body).password;
    loginInProgress = true;
    window.remaining -= 1;
    loginWindows.set(request.ip, window);
    try {
      if (!(await password.verify(provided))) {
        throw new RequestError(401, "Senha incorreta.");
      }
      const currentToken = sessionToken(request);
      if (currentToken) await database.revokeSession(currentToken);
      const token = newSessionToken();
      await database.createSession(token, password.tag);
      loginWindows.delete(request.ip);
      return reply
        .setCookie(sessionName, token, { ...sessionCookie, maxAge: sessionDurationSeconds })
        .send({ authenticated: true });
    } finally {
      loginInProgress = false;
    }
  });
  app.delete("/api/admin/session", async (request, reply) => {
    const token = sessionToken(request);
    if (token) await database.revokeSession(token);
    return reply.clearCookie(sessionName, sessionCookie).code(204).send();
  });

  const protectedRoute = { onRequest: requireSession };
  app.get("/api/admin/pages", protectedRoute, async () => database.listPages());
  app.post("/api/admin/pages", protectedRoute, async (request, reply) => {
    const page = await database.createPage(readSlug(object(request.body).slug));
    return reply.code(201).send(page);
  });
  app.post<{ Params: PageParams }>(
    "/api/admin/pages/:id/client-link",
    protectedRoute,
    async (request) => {
      const token = newSessionToken();
      await database.setClientLink(readId(request.params.id), digest(token));
      return { token };
    },
  );
  app.delete<{ Params: PageParams }>(
    "/api/admin/pages/:id/client-link",
    protectedRoute,
    async (request, reply) => {
      await database.setClientLink(readId(request.params.id), null);
      return reply.code(204).send();
    },
  );

  function clientDigest(request: FastifyRequest): Buffer {
    return digest(readClientToken(request.cookies[clientSessionName]));
  }

  app.post<{ Params: PageParams }>(
    "/api/client/pages/:id/session",
    { bodyLimit: 4_096 },
    async (request, reply) => {
      const id = readId(request.params.id);
      const token = readClientToken(object(request.body).token);
      await database.requireClientAccess(id, digest(token));
      return reply
        .setCookie(clientSessionName, token, {
          ...sessionCookie,
          path: `/api/client/pages/${id}`,
          maxAge: sessionDurationSeconds,
        })
        .code(204)
        .send();
    },
  );

  function registerEditorRoutes(scope: "admin" | "client") {
    const base = `/api/${scope}/pages/:id`;
    const onRequest = async (request: FastifyRequest<{ Params: PageParams }>) => {
      if (scope === "admin") return requireSession(request);
      await database.requireClientAccess(readId(request.params.id), clientDigest(request));
    };
    const access = (request: FastifyRequest): EditorAccess =>
      scope === "admin" ? "admin" : clientDigest(request);

    app.get<{ Params: PageParams }>(base, { onRequest }, async (request) => ({
      ...(await database.getEditorPage(readId(request.params.id), access(request))),
      instagramLookupAvailable: Boolean(options.instagramAvatar),
    }));
    app.post<{ Params: PageParams }>(
      `${base}/instagram-avatar`,
      { onRequest, bodyLimit: 8_192 },
      async (request) => {
        if (scope === "admin") await database.getEditorPage(readId(request.params.id), "admin");
        if (!options.instagramAvatar) {
          throw new RequestError(
            503,
            "A busca do Instagram ainda precisa ser ativada. Você pode enviar uma foto.",
          );
        }
        const { handle, profileUrl } = object(request.body);
        const username =
          profileUrl === undefined
            ? instagramUsername(handle)
            : instagramProfileUsername(profileUrl);
        return { image: await options.instagramAvatar(username) };
      },
    );
    app.put<{ Params: PageParams }>(
      `${base}/draft`,
      { onRequest, bodyLimit: 15 * 1024 * 1024 },
      async (request) => {
        const id = readId(request.params.id);
        const body = object(request.body);
        const revision = readRevision(body.revision);
        const slug = readSlug(body.slug);
        const content = readContent(body);
        const avatar = await readImage(body.avatar, "avatar");
        const background = await readImage(body.backgroundImage, "background");
        return database.saveDraft(id, revision, slug, content, avatar, background, access(request));
      },
    );
    for (const action of ["publish", "unpublish"] as const) {
      app.post<{ Params: PageParams }>(`${base}/${action}`, { onRequest }, async (request) =>
        database.changePublication(
          readId(request.params.id),
          readRevision(object(request.body).revision),
          action,
          access(request),
        ),
      );
    }
    app.get<{ Params: PageParams & { media: string } }>(
      `${base}/media/:media`,
      { onRequest },
      async (request, reply) =>
        sendMedia(
          reply,
          await database.getEditorMedia(
            readId(request.params.id),
            readId(request.params.media),
            access(request),
          ),
        ),
    );
  }
  registerEditorRoutes("admin");
  registerEditorRoutes("client");

  app.get<{ Querystring: { after?: string } }>("/api/public/showcase", async (request) => {
    const { after } = request.query;
    if (after !== undefined && (typeof after !== "string" || !validSlug(after))) {
      throw new RequestError(400, "Endereço de paginação inválido.");
    }
    return database.listPublishedPages(after ?? null);
  });

  app.get<{ Params: { slug: string } }>("/api/public/pages/:slug", async (request) => {
    const page = await database.getPublicPage(publicSlug(request.params.slug));
    if (!page) throw new RequestError(404, "Página não encontrada.");
    return page;
  });
  app.get<{ Params: { slug: string; media: string } }>(
    "/api/public/pages/:slug/media/:media",
    async (request, reply) =>
      sendMedia(
        reply,
        await database.getPublicMedia(
          publicSlug(request.params.slug),
          readId(request.params.media),
        ),
      ),
  );

  app.get("/readyz", async (_request, reply) => {
    try {
      await database.ready();
      return { status: "ready", release };
    } catch {
      return reply.code(503).send({ status: "unavailable", release });
    }
  });

  if (options.clientDirectory) {
    const directory = options.clientDirectory;
    const assets = join(directory, "assets");
    await app.register(staticFiles, {
      root: assets,
      prefix: "/assets/",
      maxAge: "1y",
      immutable: true,
      setHeaders(response, path) {
        if (path.startsWith(`${assets}${sep}`)) {
          response.header("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    });
    function sendShell(reply: FastifyReply) {
      return reply.sendFile("index.html", directory, { cacheControl: false });
    }

    const editorShell = async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.header("X-Robots-Tag", "noindex");
      return sendShell(reply);
    };
    app.get("/", async (_request, reply) => reply.redirect("/admin"));
    app.get("/admin", editorShell);
    app.get("/admin/*", editorShell);
    app.get("/edit/:id", editorShell);
    app.get<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
      const { slug } = request.params;
      if (!validSlug(slug) || !(await database.getPublicPage(slug))) {
        reply.code(404);
      }
      return sendShell(reply);
    });
  }

  app.addHook("onClose", () => database.close());
  return app;
}
