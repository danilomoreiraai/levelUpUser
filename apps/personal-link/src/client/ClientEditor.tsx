import { useCallback, useEffect, useState } from "react";
import type { AdminPage } from "../shared/contracts";
import { ApiError, getErrorMessage, loadPage, openClientSession } from "./api";
import { PageEditor } from "./PageEditor";

type EditorState =
  | { kind: "loading" | "unavailable" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; page: AdminPage };

function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 404);
}

export function ClientEditor({ id }: { id: string }) {
  const [state, setState] = useState<EditorState>({ kind: "loading" });

  useEffect(() => {
    if (state.kind !== "loading") return;
    const controller = new AbortController();
    const { signal } = controller;
    document.title = "Editar página de links | LevelUp User";

    async function open() {
      try {
        const hash = window.location.hash;
        if (hash && hash !== "#page-preview") {
          await openClientSession(id, hash.slice(1), signal);
          if (signal.aborted) return;
          window.history.replaceState(null, "", window.location.pathname);
        }
        const page = await loadPage(id, signal, "client");
        if (!signal.aborted) setState({ kind: "loaded", page });
      } catch (error) {
        if (signal.aborted) return;
        setState(
          isUnavailable(error)
            ? { kind: "unavailable" }
            : { kind: "error", message: getErrorMessage(error) },
        );
      }
    }

    void open();
    return () => controller.abort();
  }, [id, state.kind]);

  function reload() {
    setState({ kind: "loading" });
  }

  const onAccessError = useCallback((error: unknown) => {
    if (!isUnavailable(error)) return false;
    setState({ kind: "unavailable" });
    return true;
  }, []);

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-inner masthead">
          <strong className="brand">
            LevelUp <span>User</span>
          </strong>
        </div>
      </header>
      <main className="admin-inner admin-main">
        {state.kind === "loaded" && (
          <PageEditor
            initialPage={state.page}
            onAccessError={onAccessError}
            onReload={reload}
            scope="client"
          />
        )}
        {state.kind === "loading" && (
          <div className="admin-loading panel" role="status">
            <p>Carregando editor…</p>
            <div className="skeleton skeleton-line" aria-hidden="true" />
            <div className="skeleton skeleton-button" aria-hidden="true" />
          </div>
        )}
        {state.kind === "unavailable" && (
          <section className="admin-loading panel" aria-labelledby="client-unavailable">
            <h1 id="client-unavailable">Link de edição indisponível</h1>
            <p>
              Abra o endereço completo recebido ou peça um novo link ao responsável pela página.
            </p>
          </section>
        )}
        {state.kind === "error" && (
          <div className="admin-loading panel">
            <p className="notice notice--error" role="alert">
              {state.message}
            </p>
            <button className="button" onClick={reload} type="button">
              Tentar novamente
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
