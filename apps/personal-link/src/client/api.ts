import type { AdminPage, Presentation } from "../shared/contracts";

export type DraftRequest = Omit<Presentation, "avatarUrl" | "backgroundUrl"> & {
  revision: number;
  slug: string;
  avatar?: string | null;
  backgroundImage?: string | null;
};

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

function pagePath(id: string): string {
  return `/api/admin/pages/${encodeURIComponent(id)}`;
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

export function loadPage(id: string, signal: AbortSignal): Promise<AdminPage> {
  return read(pagePath(id), signal);
}

export async function saveDraft(id: string, draft: DraftRequest): Promise<AdminPage> {
  return (await request(`${pagePath(id)}/draft`, json("PUT", draft))).json() as Promise<AdminPage>;
}

export async function changePublication(
  id: string,
  action: "publish" | "unpublish",
  revision: number,
): Promise<AdminPage> {
  return (
    await request(`${pagePath(id)}/${action}`, json("POST", { revision }))
  ).json() as Promise<AdminPage>;
}

export function loadPublicPage(slug: string, signal: AbortSignal): Promise<Presentation> {
  return read(`/api/public/pages/${encodeURIComponent(slug)}`, signal);
}

export function getPublicUrl(slug: string): string {
  return new URL(`/${encodeURIComponent(slug)}`, window.location.origin).href;
}
