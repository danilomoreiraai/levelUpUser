import { normalizeLinkUrl } from "../shared/normalizeLinkUrl.js";
import { RequestError } from "./errors.js";
import { readImage } from "./images.js";

const maxPhotoBytes = 5 * 1024 * 1024;
const unavailable =
  "Não foi possível buscar a foto do Instagram agora. Você pode enviar uma imagem.";
const missing = "Foto indisponível para este @. A busca atende contas profissionais do Instagram.";
const profileHosts = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const nonProfilePaths = new Set([
  "accounts",
  "direct",
  "explore",
  "p",
  "reel",
  "reels",
  "share",
  "stories",
  "tv",
]);

export function instagramUsername(value: unknown): string {
  const username = typeof value === "string" ? value.trim().replace(/^@/u, "").toLowerCase() : "";
  if (!/^[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/u.test(username) || username.includes("..")) {
    throw new RequestError(400, "Informe um @ válido do Instagram.");
  }
  return username;
}

export function instagramProfileUsername(value: unknown): string {
  const address = typeof value === "string" ? normalizeLinkUrl(value) : null;
  const url = address ? new URL(address) : null;
  const handle = url && /^\/([\w.]+)\/?$/u.exec(url.pathname)?.[1]?.toLowerCase();
  if (
    !url ||
    !handle ||
    !profileHosts.has(url.hostname) ||
    url.port ||
    nonProfilePaths.has(handle)
  ) {
    throw new RequestError(400, "Informe o link de um perfil do Instagram.");
  }
  return instagramUsername(handle);
}

function photoUrl(value: unknown): URL {
  if (typeof value !== "string") throw new RequestError(404, missing);
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !/(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$/u.test(url.hostname)
  ) {
    throw new RequestError(502, unavailable);
  }
  return url;
}

async function photoBytes(response: Response): Promise<Buffer> {
  if (!response.body || Number(response.headers.get("content-length")) > maxPhotoBytes) {
    await response.body?.cancel();
    throw new RequestError(502, unavailable);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks, length);
      length += value.byteLength;
      if (length > maxPhotoBytes) throw new RequestError(502, unavailable);
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createInstagramAvatarLookup(env: NodeJS.ProcessEnv, request = fetch) {
  const api = env.INSTAGRAM_GRAPH_API_URL;
  const account = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
  if (!api && !account && !token) return undefined;
  if (
    !api ||
    !/^https:\/\/graph\.facebook\.com\/v\d+\.\d+$/u.test(api) ||
    !account ||
    !/^\d+$/u.test(account) ||
    !token
  ) {
    throw new Error("Invalid Instagram Graph API configuration");
  }

  let windowEnds = 0;
  let remaining = 0;
  return async (username: string): Promise<string> => {
    const now = Date.now();
    if (now >= windowEnds) {
      windowEnds = now + 60_000;
      remaining = 40;
    }
    if (remaining <= 0) throw new RequestError(429, "Aguarde um minuto para buscar outra foto.");
    remaining -= 1;

    const graph = new URL(`${api}/${account}`);
    graph.searchParams.set(
      "fields",
      `business_discovery.username(${username}){profile_picture_url}`,
    );
    const init = { redirect: "error", signal: AbortSignal.timeout(8_000) } as const;
    try {
      const result = await request(graph, {
        ...init,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!result.ok) {
        const body = (await result.json().catch(() => null)) as {
          error?: { code?: number };
        } | null;
        const code = body?.error?.code;
        if (
          result.status === 401 ||
          result.status === 403 ||
          code === 190 ||
          code === 10 ||
          code === 200
        ) {
          throw new RequestError(
            503,
            "A conexão com a Meta precisa ser atualizada. Você pode enviar uma foto.",
          );
        }
        if (result.status === 400 && code === 100) throw new RequestError(404, missing);
        throw new RequestError(502, unavailable);
      }
      const profile = (await result.json()) as {
        business_discovery?: { profile_picture_url?: unknown };
      };
      const photo = await request(photoUrl(profile.business_discovery?.profile_picture_url), init);
      const mime = photo.headers.get("content-type")?.split(";")[0];
      if (!photo.ok || !mime || !/^image\/(?:jpeg|png|webp)$/u.test(mime)) {
        await photo.body?.cancel();
        throw new RequestError(502, unavailable);
      }
      const source = await photoBytes(photo);
      const optimized = await readImage(
        `data:${mime};base64,${source.toString("base64")}`,
        "avatar",
      );
      if (!optimized) throw new RequestError(502, unavailable);
      return `data:image/webp;base64,${optimized.toString("base64")}`;
    } catch (error) {
      if (error instanceof RequestError && error.status !== 400) throw error;
      throw new RequestError(502, unavailable);
    }
  };
}
