import { type FormEvent, type MouseEvent, useCallback, useEffect, useState } from "react";

import type { AdminPage } from "../shared/contracts";
import {
  ApiError,
  checkSession,
  createPage,
  getErrorMessage,
  listPages,
  loadPage,
  signIn,
  signOut,
} from "./api";
import { PageEditor, SlugField } from "./PageEditor";
import { formatHandle } from "./presentation";

type AdminErrorHandler = (error: unknown) => boolean;
type EditingState = { busy: boolean; dirty: boolean };

const portfolioNavigation = [
  { label: "Home", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "Services", path: "/services" },
];

function getPortfolioOrigin(): string | null {
  const configured = import.meta.env.VITE_LEVELUP_SITE_ORIGIN?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    return url.protocol === "https:" && url.href === `${url.origin}/` ? url.origin : null;
  } catch {
    return null;
  }
}

const portfolioOrigin = getPortfolioOrigin();

function AdminLoading({ label }: { label: string }) {
  return (
    <div className="admin-loading panel" role="status">
      <p>{label}</p>
      <div className="skeleton skeleton-line" aria-hidden="true" />
      <div className="skeleton skeleton-button" aria-hidden="true" />
    </div>
  );
}

function Login({ onAuthorized }: { onAuthorized: () => void }) {
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setProblem("");
    try {
      await signIn(password);
      onAuthorized();
    } catch (error) {
      setProblem(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="login-panel" aria-labelledby="login-title">
      <header className="login-heading">
        <p className="section-label">Serviços</p>
        <h1 id="login-title">Painel de páginas de links</h1>
      </header>
      <form className="panel" onSubmit={submit} aria-busy={pending}>
        <label className="field">
          <span>Senha do painel</span>
          <input
            autoComplete="current-password"
            disabled={pending}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {problem && (
          <p className="notice notice--error" role="alert">
            {problem}
          </p>
        )}
        <button className="button button--primary" disabled={pending} type="submit">
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}

function PageList({
  onOpen,
  onAdminError,
}: {
  onOpen: (page: AdminPage) => void;
  onAdminError: AdminErrorHandler;
}) {
  const [pages, setPages] = useState<AdminPage[] | null>(null);
  const [loadProblem, setLoadProblem] = useState("");
  const [createProblem, setCreateProblem] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pages || loadProblem) return;
    const controller = new AbortController();
    listPages(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setPages(data);
      },
      (error: unknown) => {
        if (controller.signal.aborted || onAdminError(error)) return;
        setLoadProblem(getErrorMessage(error));
      },
    );
    return () => controller.abort();
  }, [pages, loadProblem, onAdminError]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateProblem("");
    setPending(true);
    try {
      onOpen(await createPage(slug));
    } catch (error) {
      if (!onAdminError(error)) setCreateProblem(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="workspace-title">
        <h1>Minhas páginas</h1>
      </div>
      <div className="workspace-grid">
        <section className="panel" aria-labelledby="create-title">
          <h2 id="create-title">Nova página</h2>
          <form className="create-form" onSubmit={submit} aria-busy={pending}>
            <SlugField disabled={pending} onChange={setSlug} value={slug} />
            {createProblem && (
              <p className="notice notice--error" role="alert">
                {createProblem}
              </p>
            )}
            <button className="button button--primary" disabled={pending} type="submit">
              {pending ? "Criando…" : "Criar página"}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="list-title">
          <h2 id="list-title">Páginas salvas</h2>
          {loadProblem ? (
            <>
              <p className="notice notice--error" role="alert">
                {loadProblem}
              </p>
              <button className="button" type="button" onClick={() => setLoadProblem("")}>
                Tentar novamente
              </button>
            </>
          ) : !pages ? (
            <AdminLoading label="Carregando suas páginas…" />
          ) : pages.length === 0 ? (
            <p className="field-hint">Sua primeira página aparecerá aqui quando for criada.</p>
          ) : (
            <ul className="page-list">
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    className="page-list-item"
                    disabled={pending}
                    onClick={() => onOpen(page)}
                    type="button"
                  >
                    <span className="page-list-details">
                      <strong>
                        {page.draft.handle ? formatHandle(page.draft.handle) : page.slug}
                      </strong>
                      <small>/{page.slug}</small>
                    </span>
                    <span className={`status-pill${page.published ? " status-pill--public" : ""}`}>
                      {page.published ? "Publicada" : "Privada"}
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function PageWorkspace({
  onAdminError,
  onEditingChange,
}: {
  onAdminError: AdminErrorHandler;
  onEditingChange: (state: EditingState) => void;
}) {
  const [selection, setSelection] = useState<AdminPage | null>(null);
  const [current, setCurrent] = useState<AdminPage | null>(null);
  const [problem, setProblem] = useState("");
  const selectedId = selection?.id;

  useEffect(() => {
    if (!selectedId || current || problem) return;

    const controller = new AbortController();
    loadPage(selectedId, controller.signal).then(
      (page) => {
        if (!controller.signal.aborted) setCurrent(page);
      },
      (error: unknown) => {
        if (controller.signal.aborted || onAdminError(error)) return;
        setProblem(getErrorMessage(error));
      },
    );
    return () => controller.abort();
  }, [current, problem, onAdminError, selectedId]);

  function resetEditor() {
    setProblem("");
    setCurrent(null);
  }

  if (!selection) return <PageList onOpen={setSelection} onAdminError={onAdminError} />;

  function showList() {
    resetEditor();
    setSelection(null);
  }

  if (current) {
    return (
      <PageEditor
        key={current.id}
        initialPage={current}
        onAccessError={onAdminError}
        onBack={showList}
        onEditingChange={onEditingChange}
        onReload={resetEditor}
      />
    );
  }

  return (
    <>
      <button className="button" onClick={showList} type="button">
        ← Minhas páginas
      </button>
      {problem ? (
        <div className="panel admin-loading">
          <p className="notice notice--error" role="alert">
            {problem}
          </p>
          <button className="button" onClick={resetEditor} type="button">
            Tentar novamente
          </button>
        </div>
      ) : (
        <AdminLoading label="Carregando editor…" />
      )}
    </>
  );
}

export function AdminApp() {
  const [session, setSession] = useState<"loading" | "denied" | "active">("loading");
  const [problem, setProblem] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ busy: false, dirty: false });

  const onAdminError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      setSession("denied");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    document.title = "Painel de páginas de links | LevelUp User";
  }, []);

  useEffect(() => {
    if (session !== "loading" || problem) return;
    const controller = new AbortController();
    checkSession(controller.signal).then(
      () => {
        if (!controller.signal.aborted) setSession("active");
      },
      (error: unknown) => {
        if (controller.signal.aborted || onAdminError(error)) return;
        setProblem(getErrorMessage(error));
      },
    );
    return () => controller.abort();
  }, [session, problem, onAdminError]);

  async function exit() {
    setProblem("");
    setPending(true);
    try {
      await signOut();
      setSession("denied");
    } catch (error) {
      if (!onAdminError(error)) setProblem(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  function canLeaveEditor(): boolean {
    return !editing.busy && (!editing.dirty || window.confirm("Sair sem salvar as alterações?"));
  }

  function guardPortfolioNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (editing.busy) event.preventDefault();
  }

  const wordmark = (
    <>
      LevelUp <span>User</span>
    </>
  );

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-inner masthead">
          {portfolioOrigin ? (
            <a className="brand" href={portfolioOrigin} onClick={guardPortfolioNavigation}>
              {wordmark}
            </a>
          ) : (
            <strong className="brand">{wordmark}</strong>
          )}
          <div className="masthead-actions">
            {session === "active" && (
              <button
                className="button button--quiet"
                disabled={pending || editing.busy}
                onClick={() => {
                  if (canLeaveEditor()) void exit();
                }}
                type="button"
              >
                {pending ? "Saindo…" : "Sair"}
              </button>
            )}
            {portfolioOrigin && (
              <nav className="admin-nav" aria-label="Navegação do LevelUp User">
                {portfolioNavigation.map(({ label, path }) => (
                  <a
                    className={
                      path === "/services"
                        ? "admin-nav-link admin-nav-link--current"
                        : "admin-nav-link"
                    }
                    href={`${portfolioOrigin}${path}`}
                    key={path}
                    onClick={guardPortfolioNavigation}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>
      <main className="admin-inner admin-main">
        {problem && (
          <div className="panel">
            <p className="notice notice--error" role="alert">
              {problem}
            </p>
            {session === "loading" && (
              <button className="button" onClick={() => setProblem("")} type="button">
                Tentar novamente
              </button>
            )}
          </div>
        )}
        {session === "loading" && !problem && <AdminLoading label="Abrindo o painel…" />}
        {session === "denied" && <Login onAuthorized={() => setSession("active")} />}
        {session === "active" && (
          <PageWorkspace onAdminError={onAdminError} onEditingChange={setEditing} />
        )}
      </main>
    </div>
  );
}
