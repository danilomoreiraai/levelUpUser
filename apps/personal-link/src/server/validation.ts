import { type PageContent, platforms, presets } from "../shared/contracts.js";
import { normalizeLinkUrl } from "../shared/normalizeLinkUrl.js";
import { RequestError } from "./errors.js";

const reservedSlugs = new Set(["admin", "api", "assets", "health", "healthz", "readyz", "media"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validSlug(slug: string): boolean {
  return (
    slug.length >= 3 && slug.length <= 48 && slugPattern.test(slug) && !reservedSlugs.has(slug)
  );
}

export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestError(400, "Envie os dados no formato solicitado.");
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, size: number, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > size) {
    throw new RequestError(400, message);
  }
  return value.trim();
}

export function readSlug(value: unknown): string {
  const slug = requiredText(value, 48, "Informe um endereço para a página.").toLowerCase();
  if (!validSlug(slug)) {
    throw new RequestError(400, "Use de 3 a 48 letras sem acento, números ou hífens no endereço.");
  }
  return slug;
}

export function readRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new RequestError(400, "A revisão da página é inválida.");
  }
  return value;
}

function readUrl(value: unknown): string {
  const url = typeof value === "string" ? normalizeLinkUrl(value) : null;
  if (!url) throw new RequestError(400, "Informe um endereço válido, como exemplo.com.");
  return url;
}

function readCollection(value: unknown, max: number, message: string): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new RequestError(400, message);
  }
  return value;
}

export function readContent(body: Record<string, unknown>): PageContent {
  const handle = requiredText(body.handle, 65, "Informe um @ com até 64 caracteres.").replace(
    /^@/,
    "",
  );
  if (handle.length < 1 || handle.length > 64 || /[\s@\p{C}]/u.test(handle)) {
    throw new RequestError(400, "Informe um @ com até 64 caracteres, sem espaços.");
  }

  const links = readCollection(body.links, 20, "Adicione até 20 links.").map((entry) => {
    const { label, url } = object(entry);
    return {
      label: requiredText(label, 80, "Informe um título com até 80 caracteres para cada link."),
      url: readUrl(url),
    };
  });

  const socials = readCollection(body.socials, 10, "Adicione até 10 redes sociais.").map(
    (entry) => {
      const { platform, url } = object(entry);
      const found = platforms.find((allowed) => allowed === platform);
      if (!found) {
        throw new RequestError(400, "Selecione uma rede social para cada endereço.");
      }
      return { platform: found, url: readUrl(url) };
    },
  );

  const preset = presets.find((allowed) => allowed === body.preset);
  const blur = body.blur;
  if (!preset || typeof blur !== "number" || !Number.isInteger(blur) || blur < 0 || blur > 24) {
    throw new RequestError(400, "Selecione um fundo e um desfoque entre 0 e 24.");
  }
  return { handle, links, socials, preset, blur };
}
