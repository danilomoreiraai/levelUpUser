import { lazy, Suspense, useEffect, useState } from "react";

import type { Presentation } from "../shared/contracts";
import { ApiError, getErrorMessage, loadPublicPage } from "./api";
import { LinkPage } from "./LinkPage";
import { formatHandle } from "./presentation";
import { useLocalTheme } from "./useLocalTheme";

const AdminApp = lazy(() => import("./AdminApp").then((module) => ({ default: module.AdminApp })));
const ClientEditor = lazy(() =>
  import("./ClientEditor").then((module) => ({ default: module.ClientEditor })),
);

type PublicState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "failed"; message: string }
  | { kind: "loaded"; page: Presentation };

function PublicPage({ slug }: { slug: string | null }) {
  const theme = useLocalTheme();
  const [state, setState] = useState<PublicState>({ kind: slug ? "loading" : "missing" });

  useEffect(() => {
    if (!slug || state.kind !== "loading") return;

    const controller = new AbortController();
    loadPublicPage(slug, controller.signal).then(
      (page) => {
        if (controller.signal.aborted) return;
        document.title = formatHandle(page.handle);
        setState({ kind: "loaded", page });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 404) {
          setState({ kind: "missing" });
        } else {
          setState({ kind: "failed", message: getErrorMessage(error) });
        }
      },
    );
    return () => controller.abort();
  }, [slug, state.kind]);

  if (state.kind === "loaded") return <LinkPage presentation={state.page} />;

  return (
    <main className="link-page" data-theme={theme} data-preset="neutral">
      <div className="link-content public-message">
        {state.kind === "loading" && (
          <div role="status">
            <span className="visually-hidden">Carregando página de links.</span>
            <div className="skeleton skeleton-avatar" aria-hidden="true" />
            <div className="skeleton skeleton-line" aria-hidden="true" />
            <div className="skeleton skeleton-button" aria-hidden="true" />
            <div className="skeleton skeleton-button" aria-hidden="true" />
          </div>
        )}
        {state.kind === "missing" && (
          <>
            <h1>Página indisponível</h1>
            <p>Confira o endereço e tente de novo.</p>
          </>
        )}
        {state.kind === "failed" && (
          <>
            <h1>Falha ao carregar a página</h1>
            <p role="alert">{state.message}</p>
            <button
              className="theme-button"
              type="button"
              onClick={() => setState({ kind: "loading" })}
            >
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function getSlug(pathname: string): string | null {
  const match = /^\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function App() {
  const path = window.location.pathname;
  const clientId = /^\/edit\/([a-f0-9-]{36})\/?$/u.exec(path)?.[1];
  if (path === "/admin" || path.startsWith("/admin/") || clientId) {
    return (
      <Suspense
        fallback={
          <main className="admin-shell startup" role="status">
            Carregando editor…
          </main>
        }
      >
        {clientId ? <ClientEditor id={clientId} /> : <AdminApp />}
      </Suspense>
    );
  }
  return <PublicPage slug={getSlug(path)} />;
}
