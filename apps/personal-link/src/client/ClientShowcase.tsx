import { useEffect, useState } from "react";

import type { ShowcaseBatch, ShowcasePage } from "../shared/contracts";
import { getErrorMessage, getPublicUrl, loadShowcase } from "./api";
import "./client-showcase.css";
import { LinkPage } from "./LinkPage";
import { originalArtwork } from "./originalArtwork";
import { formatHandle } from "./presentation";
import { useLocalAppearance } from "./useLocalAppearance";

const reducedMotion = "(prefers-reduced-motion: reduce)";
const rotationDelay = 5_000;

function ClientCarousel({ pages }: { pages: ShowcasePage[] }) {
  const [index, setIndex] = useState(0);
  const [rotating, setRotating] = useState(() => !window.matchMedia(reducedMotion).matches);
  const [hovered, setHovered] = useState(false);
  const { theme } = useLocalAppearance();
  const hasMultiple = pages.length > 1;
  const moving = rotating && !hovered && hasMultiple;

  useEffect(() => {
    const preference = window.matchMedia(reducedMotion);
    function pauseIfReduced() {
      if (preference.matches) setRotating(false);
    }

    preference.addEventListener("change", pauseIfReduced);
    return () => preference.removeEventListener("change", pauseIfReduced);
  }, []);

  useEffect(() => {
    if (!moving) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % pages.length),
      rotationDelay,
    );
    return () => window.clearInterval(timer);
  }, [moving, pages.length]);

  function move(direction: 1 | -1) {
    setRotating(false);
    setIndex((current) => (current + direction + pages.length) % pages.length);
  }

  const page = pages[index];
  const handle = formatHandle(page.handle);
  return (
    <section
      aria-label="Destaques de clientes"
      aria-roledescription="carrossel"
      className="showcase-carousel"
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setRotating(false);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hasMultiple && (
        <div className="showcase-carousel-controls">
          <button
            className="button button--small"
            onClick={() => setRotating((current) => !current)}
            type="button"
          >
            {rotating ? "Pausar rotação" : "Iniciar rotação"}
          </button>
          <button
            aria-label="Cliente anterior"
            className="button button--small"
            onClick={() => move(-1)}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Próximo cliente"
            className="button button--small"
            onClick={() => move(1)}
            type="button"
          >
            →
          </button>
        </div>
      )}
      <div aria-atomic="true" aria-live={moving ? "off" : "polite"}>
        <a className="showcase-thumbnail" href={getPublicUrl(page.slug)}>
          <img
            alt=""
            className="showcase-thumbnail-background"
            loading="lazy"
            src={page.backgroundUrl ?? originalArtwork[theme].mobile}
            style={{ filter: `blur(${page.blur}px)` }}
          />
          <span className="showcase-thumbnail-profile">
            {page.avatarUrl && (
              <img alt="" height={44} loading="lazy" src={page.avatarUrl} width={44} />
            )}
            {handle}
          </span>
        </a>
        {hasMultiple && (
          <p className="field-hint showcase-position">
            {index + 1} de {pages.length}
          </p>
        )}
      </div>
    </section>
  );
}

export function ClientShowcase() {
  const [showcase, setShowcase] = useState<ShowcaseBatch | null>(null);
  const [pending, setPending] = useState<{ after?: string } | null>({});
  const [problem, setProblem] = useState("");

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    loadShowcase(pending.after, controller.signal).then(
      (batch) => {
        if (controller.signal.aborted) return;
        setShowcase((current) => ({
          pages: [...(current?.pages ?? []), ...batch.pages],
          nextCursor: batch.nextCursor,
        }));
        setPending(null);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setProblem(getErrorMessage(error));
        setPending(null);
      },
    );
    return () => controller.abort();
  }, [pending]);

  function loadMore() {
    setProblem("");
    setPending({ after: showcase?.nextCursor ?? undefined });
  }

  return (
    <section aria-labelledby="showcase-title" className="client-showcase">
      <h2 id="showcase-title">Páginas de clientes</h2>
      {!showcase && pending && (
        <div className="showcase-placeholder skeleton" role="status">
          <span className="visually-hidden">Carregando vitrine…</span>
        </div>
      )}
      {showcase?.pages.length === 0 && <p className="field-hint">Nenhuma página publicada.</p>}
      {showcase && showcase.pages.length > 0 && (
        <>
          <ClientCarousel pages={showcase.pages} />
          <ul aria-label="Clientes publicados" className="showcase-grid">
            {showcase.pages.map((page) => {
              const handle = formatHandle(page.handle);
              return (
                <li className="showcase-card" key={page.slug}>
                  <LinkPage
                    deferImages
                    presentation={page}
                    preview
                    previewLabel={`Prévia de ${handle}`}
                  />
                  <a
                    aria-label={`Abrir página de ${handle}`}
                    className="button"
                    href={getPublicUrl(page.slug)}
                  >
                    Abrir página
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {problem && (
        <p className="notice notice--error" role="status">
          {problem}
        </p>
      )}
      {(problem || showcase?.nextCursor) && (
        <button className="button" disabled={Boolean(pending)} onClick={loadMore} type="button">
          {pending ? "Carregando páginas…" : problem ? "Tentar carregar vitrine" : "Carregar mais"}
        </button>
      )}
    </section>
  );
}
