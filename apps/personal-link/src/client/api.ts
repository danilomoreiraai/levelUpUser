import type { AdminPage, Presentation } from "../shared/contracts";

export type DraftRequest = Omit<Presentation, "avatarUrl" | "backgroundUrl"> & {
  revision: number;
  slug: string;
  avatar?: string | null;
  backgroundImage?: string | null;
};

export type EditorScope = "admin" | "client";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const networkError = "A conexão falhou. Verifique a sua internet e tente novamente.";

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : networkError;
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (response.ok) return response;

  const body: unknown = await response.json().catch(() => null);
  const message =
    typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : "O serviço não respondeu como esperado. Tente novamente.";
  throw new ApiError(response.status, message);
}

async function read<T>(url: string, signal?: AbortSignal): Promise<T> {
  return (await request(url, { signal })).json() as Promise<T>;
}

function json(method: "POST" | "PUT", body: unknown): RequestInit {
  return { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } };
}

function pagePath(id: string, scope: EditorScope = "admin"): string {
  return `/api/${scope}/pages/${encodeURIComponent(id)}`;
}

export async function checkSession(signal: AbortSignal): Promise<void> {
  await request("/api/admin/session", { signal });
}

export async function signIn(password: string): Promise<void> {
  await request("/api/admin/session", json("POST", { password }));
}

export async function signOut(): Promise<void> {
  await request("/api/admin/session", { method: "DELETE" });
}

export function listPages(signal: AbortSignal): Promise<AdminPage[]> {
  return read("/api/admin/pages", signal);
}

export async function createPage(slug: string): Promise<AdminPage> {
  return (await request("/api/admin/pages", json("POST", { slug }))).json() as Promise<AdminPage>;
}

export function loadPage(id: string, signal: AbortSignal, scope?: EditorScope): Promise<AdminPage> {
  return read(pagePath(id, scope), signal);
}

export async function saveDraft(
  id: string,
  draft: DraftRequest,
  scope?: EditorScope,
): Promise<AdminPage> {
  return (
    await request(`${pagePath(id, scope)}/draft`, json("PUT", draft))
  ).json() as Promise<AdminPage>;
}

export async function changePublication(
  id: string,
  action: "publish" | "unpublish",
  revision: number,
  scope?: EditorScope,
): Promise<AdminPage> {
  return (
    await request(`${pagePath(id, scope)}/${action}`, json("POST", { revision }))
  ).json() as Promise<AdminPage>;
}

export async function issueClientLink(id: string): Promise<string> {
  const response = await request(`${pagePath(id)}/client-link`, { method: "POST" });
  const { token } = (await response.json()) as { token: string };
  const url = new URL(`/edit/${encodeURIComponent(id)}`, window.location.origin);
  url.hash = token;
  return url.href;
}

export async function revokeClientLink(id: string): Promise<void> {
  await request(`${pagePath(id)}/client-link`, { method: "DELETE" });
}

export async function openClientSession(
  id: string,
  token: string,
  signal: AbortSignal,
): Promise<void> {
  await request(`${pagePath(id, "client")}/session`, { ...json("POST", { token }), signal });
}

export async function importInstagramAvatar(
  id: string,
  handle: string,
  scope: EditorScope,
): Promise<string> {
  const response = await request(
    `${pagePath(id, scope)}/instagram-avatar`,
    json("POST", { handle }),
  );
  const { image } = (await response.json()) as { image: string };
  return image;
}

export function loadPublicPage(slug: string, signal: AbortSignal): Promise<Presentation> {
  return read(`/api/public/pages/${encodeURIComponent(slug)}`, signal);
}

export function getPublicUrl(slug: string): string {
  return new URL(`/${encodeURIComponent(slug)}`, window.location.origin).href;
}
