import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { type AdminPage, type Presentation, platforms, presets } from "../shared/contracts";
import { normalizeLinkUrl } from "../shared/normalizeLinkUrl";
import {
  ApiError,
  changePublication,
  type EditorScope,
  getErrorMessage,
  getPublicUrl,
  importInstagramAvatar,
  saveDraft,
} from "./api";
import { ClientLinkControls } from "./ClientLinkControls";
import { LinkPage } from "./LinkPage";
import { socialNames } from "./presentation";

type LinkValues = Presentation["links"][number];
type SocialValues = Presentation["socials"][number];
type Upload = "avatar" | "backgroundImage";
type UploadState = { busy: boolean; problem: string };
type Row<T> = T & { id: number };
type Draft = Omit<Presentation, "links" | "socials"> & {
  slug: string;
  links: Row<LinkValues>[];
  socials: Row<SocialValues>[];
  avatar?: string | null;
  backgroundImage?: string | null;
};

const maxLinks = 20;
const maxSocials = 10;
const maxImageSize = 5 * 1024 * 1024;
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const emptyUpload: UploadState = { busy: false, problem: "" };
const presetNames: Record<Presentation["preset"], string> = {
  original: "Original",
  neutral: "Neutro",
  sage: "Sálvia",
  dusk: "Crepúsculo",
};

function toDraft({ slug, draft }: AdminPage): Draft {
  return {
    ...draft,
    slug,
    links: draft.links.map((link, index) => ({ ...link, id: index })),
    socials: draft.socials.map((social, index) => ({ ...social, id: index })),
  };
}

function moveRow<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const reordered = [...items];
  const target = index + direction;
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}

function readImage(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), { once: true });
    reader.addEventListener("error", reject, { once: true });
    reader.readAsDataURL(file);
  });
}

export function SlugField({
  disabled,
  locked = false,
  onChange,
  value,
}: {
  disabled: boolean;
  locked?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const hint = useId();
  return (
    <div className="form-field">
      <label className="field">
        <span>Endereço da página</span>
        <input
          aria-describedby={hint}
          autoCapitalize="none"
          autoComplete="off"
          disabled={disabled}
          maxLength={48}
          minLength={3}
          onChange={(event) => onChange(event.currentTarget.value.toLowerCase().trim())}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="minha-pagina"
          readOnly={locked}
          required
          spellCheck={false}
          type="text"
          value={value}
        />
      </label>
      <p className="field-hint" id={hint}>
        {locked
          ? "O endereço está reservado após a primeira publicação."
          : "Use de 3 a 48 letras sem acento, números ou hífens."}
      </p>
    </div>
  );
}

function ImageField({
  label,
  onRemove,
  onSelect,
  portrait = false,
  state,
  url,
}: {
  label: string;
  onRemove: () => void;
  onSelect: (file: File) => void;
  portrait?: boolean;
  state: UploadState;
  url: string | null;
}) {
  const hint = useId();
  const errorId = useId();
  return (
    <div className="form-field">
      <label className="field">
        <span>{label}</span>
        <input
          accept={imageTypes.join(",")}
          aria-describedby={state.problem ? `${hint} ${errorId}` : hint}
          aria-invalid={Boolean(state.problem)}
          disabled={state.busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) onSelect(file);
          }}
          type="file"
        />
      </label>
      <p className="field-hint" id={hint}>
        JPEG, PNG ou WebP. Até 5 MB.
      </p>
      <div aria-live="polite" className="field-status">
        {state.busy && <p className="field-hint">Carregando imagem…</p>}
      </div>
      {state.problem && (
        <p className="notice notice--error" id={errorId} role="alert">
          {state.problem}
        </p>
      )}
      {url && (
        <div className={portrait ? "image-selection image-selection--portrait" : "image-selection"}>
          <img src={url} alt="" width={portrait ? 48 : 52} height={48} />
          <button
            className="button button--small"
            disabled={state.busy}
            onClick={onRemove}
            type="button"
          >
            Remover {label.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

function RowActions({
  index,
  label,
  last,
  onMove,
  onRemove,
}: {
  index: number;
  label: string;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="row-actions">
      <button
        aria-label={`Subir ${label} ${index + 1}`}
        className="button button--small icon-button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        type="button"
      >
        <span aria-hidden="true">↑</span>
      </button>
      <button
        aria-label={`Descer ${label} ${index + 1}`}
        className="button button--small icon-button"
        disabled={last}
        onClick={() => onMove(1)}
        type="button"
      >
        <span aria-hidden="true">↓</span>
      </button>
      <button
        aria-label={`Remover ${label} ${index + 1}`}
        className="button button--small"
        onClick={onRemove}
        type="button"
      >
        Remover
      </button>
    </div>
  );
}

function UrlField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (url: string) => void;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        autoCapitalize="none"
        inputMode="url"
        maxLength={2048}
        onBlur={(event) => {
          const normalized = normalizeLinkUrl(event.currentTarget.value);
          if (normalized && normalized !== value) onChange(normalized);
        }}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="exemplo.com"
        required
        spellCheck={false}
        type="text"
        value={value}
      />
    </label>
  );
}

export function PageEditor({
  initialPage,
  onAccessError,
  onBack,
  onEditingChange,
  onReload,
  scope = "admin",
}: {
  initialPage: AdminPage;
  onAccessError: (error: unknown) => boolean;
  onBack?: () => void;
  onEditingChange?: (state: { busy: boolean; dirty: boolean }) => void;
  onReload: () => void;
  scope?: EditorScope;
}) {
  const [page, setPage] = useState(initialPage);
  const [draft, setDraft] = useState(() => toDraft(initialPage));
  const [dirty, setDirty] = useState(false);
  const [uploads, setUploads] = useState<Record<Upload, UploadState>>({
    avatar: emptyUpload,
    backgroundImage: emptyUpload,
  });
  const [pending, setPending] = useState<"save" | "publish" | "unpublish" | null>(null);
  const [accessPending, setAccessPending] = useState(false);
  const [problem, setProblem] = useState("");
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const instagramHintId = useId();
  const nextId = useRef(maxLinks + maxSocials);
  const rowToFocus = useRef<number | null>(null);
  const busy =
    uploads.avatar.busy || uploads.backgroundImage.busy || pending !== null || accessPending;

  useEffect(() => {
    heading.current?.focus();
    return () => onEditingChange?.({ busy: false, dirty: false });
  }, [onEditingChange]);
  useEffect(() => onEditingChange?.({ busy, dirty }), [onEditingChange, busy, dirty]);
  useEffect(() => {
    if (!dirty && !busy) return;
    function preventExit(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, [busy, dirty]);

  function update(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setDirty(true);
    setNotice("");
  }

  function focusNewRow(element: HTMLInputElement | HTMLSelectElement | null, id: number) {
    if (!element || rowToFocus.current !== id) return;
    rowToFocus.current = null;
    element.focus();
  }

  function updateLink(index: number, changes: Partial<LinkValues>) {
    update({
      links: draft.links.map((link, i) => (index === i ? { ...link, ...changes } : link)),
    });
  }

  function updateSocial(index: number, changes: Partial<SocialValues>) {
    update({
      socials: draft.socials.map((social, i) => (index === i ? { ...social, ...changes } : social)),
    });
  }

  function setImage(kind: Upload, data: string | null) {
    if (kind === "avatar") {
      update({ avatar: data, avatarUrl: data });
    } else {
      update({ backgroundImage: data, backgroundUrl: data });
    }
    setUploadState(kind, emptyUpload);
  }

  function setUploadState(kind: Upload, state: UploadState) {
    setUploads((current) => ({ ...current, [kind]: state }));
  }

  async function upload(kind: Upload, file: File) {
    if (!imageTypes.includes(file.type) || file.size === 0 || file.size > maxImageSize) {
      setUploadState(kind, {
        busy: false,
        problem: "Selecione uma imagem JPEG, PNG ou WebP válida de até 5 MB.",
      });
      return;
    }
    setUploadState(kind, { busy: true, problem: "" });
    try {
      setImage(kind, await readImage(file));
    } catch {
      setUploadState(kind, {
        busy: false,
        problem: "Não foi possível abrir a imagem selecionada.",
      });
    }
  }

  async function selectInstagramPortrait() {
    setUploadState("avatar", { busy: true, problem: "" });
    try {
      const image = await importInstagramAvatar(page.id, draft.handle, scope);
      setImage("avatar", image);
    } catch (error) {
      if (onAccessError(error)) return;
      setUploadState("avatar", { busy: false, problem: getErrorMessage(error) });
    }
  }

  async function persist() {
    const { slug, handle, preset, blur, links, socials, avatar, backgroundImage } = draft;
    const saved = await saveDraft(
      page.id,
      {
        slug,
        handle,
        preset,
        blur,
        avatar,
        backgroundImage,
        revision: page.revision,
        links: links.map(({ label, url }) => ({ label, url })),
        socials: socials.map(({ platform, url }) => ({ platform, url })),
      },
      scope,
    );
    setPage(saved);
    setDraft(toDraft(saved));
    setDirty(false);
    return saved;
  }

  async function execute(action: "save" | "publish" | "unpublish") {
    setPending(action);
    setProblem("");
    setNotice("");
    setCopyNotice("");
    setConflict(false);

    try {
      if (action === "save") {
        await persist();
        setNotice("Rascunho salvo.");
        return;
      }

      const current = action === "publish" && dirty ? await persist() : page;
      const updated = await changePublication(current.id, action, current.revision, scope);
      setPage(updated);
      if (action === "publish") {
        setDraft(toDraft(updated));
        setDirty(false);
      }
      setNotice(action === "publish" ? "Página publicada." : "Página despublicada.");
    } catch (error) {
      if (onAccessError(error)) return;
      setProblem(getErrorMessage(error));
      setConflict(error instanceof ApiError && error.status === 409);
    } finally {
      setPending(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const button = (event.nativeEvent as SubmitEvent).submitter;
    void execute(
      button instanceof HTMLButtonElement && button.value === "publish" ? "publish" : "save",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getPublicUrl(page.slug));
      setCopyNotice("Link copiado.");
    } catch {
      setCopyNotice("Selecione e copie o endereço público.");
    }
  }

  const preview: Presentation = {
    ...draft,
    links: draft.links.filter((link) => link.label.trim()),
    socials: draft.socials.filter((social) => social.url.trim()),
  };

  return (
    <>
      {onBack && (
        <button
          className="button button--quiet workspace-back"
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm("Voltar sem salvar as alterações?")) onBack();
          }}
          type="button"
        >
          ← Minhas páginas
        </button>
      )}

      <div className="workspace-title editor-title">
        <h1 ref={heading} tabIndex={-1}>
          Editar página
        </h1>
        <span className={`status-pill${page.published ? " status-pill--public" : ""}`}>
          {page.published ? "Publicada" : "Privada"}
        </span>
        <a className="button button--quiet mobile-preview-link" href="#page-preview">
          Ver prévia
        </a>
      </div>

      <div className="editor-grid">
        <form className="editor-form" onSubmit={submit} aria-busy={busy}>
          <fieldset className="editor-fields" disabled={pending !== null || accessPending}>
            <section className="panel editor-section" aria-labelledby="profile-title">
              <h2 id="profile-title">Perfil</h2>
              <label className="field">
                <span>Nome de usuário (@)</span>
                <input
                  autoCapitalize="none"
                  disabled={uploads.avatar.busy}
                  maxLength={65}
                  onChange={(event) => update({ handle: event.currentTarget.value })}
                  placeholder="@seunome"
                  required
                  spellCheck={false}
                  type="text"
                  value={draft.handle}
                />
              </label>
              <SlugField
                disabled={busy}
                locked={page.slugLocked}
                onChange={(slug) => update({ slug })}
                value={draft.slug}
              />
              <ImageField
                label="Foto de perfil"
                onRemove={() => setImage("avatar", null)}
                onSelect={(file) => void upload("avatar", file)}
                portrait
                state={uploads.avatar}
                url={draft.avatarUrl}
              />
              <button
                aria-describedby={
                  initialPage.instagramLookupAvailable ? undefined : instagramHintId
                }
                className="button"
                disabled={
                  !initialPage.instagramLookupAvailable ||
                  uploads.avatar.busy ||
                  !draft.handle.trim()
                }
                type="button"
                onClick={() => void selectInstagramPortrait()}
              >
                {uploads.avatar.busy ? "Carregando foto…" : "Buscar foto do Instagram"}
              </button>
              {!initialPage.instagramLookupAvailable && (
                <p className="field-hint" id={instagramHintId}>
                  {scope === "admin"
                    ? "Ative a integração da Meta no Coolify para buscar fotos do Instagram."
                    : "A busca do Instagram ainda precisa ser ativada pelo responsável pela página."}
                </p>
              )}
            </section>

            <section className="panel editor-section" aria-labelledby="links-title">
              <h2 id="links-title">Links</h2>
              {draft.links.length === 0 && <p className="field-hint">Nenhum link adicionado.</p>}
              {draft.links.length > 0 && (
                <ol className="editor-rows">
                  {draft.links.map((link, index) => (
                    <li className="editor-row" key={link.id}>
                      <label className="field">
                        <span>Título do link {index + 1}</span>
                        <input
                          maxLength={80}
                          onChange={(event) =>
                            updateLink(index, { label: event.currentTarget.value })
                          }
                          placeholder="Meu site"
                          ref={(element) => focusNewRow(element, link.id)}
                          required
                          type="text"
                          value={link.label}
                        />
                      </label>
                      <UrlField
                        label={`URL do link ${index + 1}`}
                        onChange={(url) => updateLink(index, { url })}
                        value={link.url}
                      />
                      <RowActions
                        index={index}
                        label="link"
                        last={index === draft.links.length - 1}
                        onMove={(direction) =>
                          update({ links: moveRow(draft.links, index, direction) })
                        }
                        onRemove={() =>
                          update({ links: draft.links.filter((row) => row.id !== link.id) })
                        }
                      />
                    </li>
                  ))}
                </ol>
              )}
              <button
                className="button"
                disabled={draft.links.length >= maxLinks}
                onClick={() => {
                  const id = nextId.current++;
                  rowToFocus.current = id;
                  update({ links: [...draft.links, { id, label: "", url: "" }] });
                }}
                type="button"
              >
                Adicionar link
              </button>
            </section>

            <section className="panel editor-section" aria-labelledby="socials-title">
              <h2 id="socials-title">Redes sociais</h2>
              {draft.socials.length === 0 && (
                <p className="field-hint">Nenhuma rede social adicionada.</p>
              )}
              {draft.socials.length > 0 && (
                <ol className="editor-rows">
                  {draft.socials.map((social, index) => (
                    <li className="editor-row" key={social.id}>
                      <div className="field">
                        <label htmlFor={`social-platform-${social.id}`}>
                          Rede social {index + 1}
                        </label>
                        <select
                          id={`social-platform-${social.id}`}
                          onChange={(event) =>
                            updateSocial(index, {
                              platform: event.currentTarget.value as SocialValues["platform"],
                            })
                          }
                          ref={(element) => focusNewRow(element, social.id)}
                          value={social.platform}
                        >
                          {platforms.map((platform) => (
                            <option key={platform} value={platform}>
                              {socialNames[platform]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <UrlField
                        label={`URL da rede social ${index + 1}`}
                        onChange={(url) => updateSocial(index, { url })}
                        value={social.url}
                      />
                      <RowActions
                        index={index}
                        label="rede social"
                        last={index === draft.socials.length - 1}
                        onMove={(direction) =>
                          update({ socials: moveRow(draft.socials, index, direction) })
                        }
                        onRemove={() =>
                          update({ socials: draft.socials.filter((row) => row.id !== social.id) })
                        }
                      />
                    </li>
                  ))}
                </ol>
              )}
              <button
                className="button"
                disabled={draft.socials.length >= maxSocials}
                onClick={() => {
                  const id = nextId.current++;
                  rowToFocus.current = id;
                  update({
                    socials: [...draft.socials, { id, platform: "instagram", url: "" }],
                  });
                }}
                type="button"
              >
                Adicionar rede social
              </button>
            </section>

            <section className="panel editor-section" aria-labelledby="background-title">
              <h2 id="background-title">Plano de fundo</h2>
              <fieldset className="presets">
                <legend>Paleta de cores</legend>
                <div className="preset-options">
                  {presets.map((preset) => (
                    <label key={preset} className="preset-option">
                      <input
                        checked={draft.preset === preset}
                        name="preset"
                        onChange={() => update({ preset })}
                        type="radio"
                        value={preset}
                      />
                      <span className="preset-swatch" data-preset={preset} aria-hidden="true" />
                      {presetNames[preset]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <ImageField
                label="Imagem de fundo"
                onRemove={() => setImage("backgroundImage", null)}
                onSelect={(file) => void upload("backgroundImage", file)}
                state={uploads.backgroundImage}
                url={draft.backgroundUrl}
              />
              <div className="form-field">
                <label className="field">
                  <span className="range-label">
                    Desfoque do fundo <span aria-hidden="true">{draft.blur} px</span>
                  </span>
                  <input
                    max={24}
                    min={0}
                    onChange={(event) => update({ blur: event.currentTarget.valueAsNumber })}
                    type="range"
                    value={draft.blur}
                  />
                </label>
              </div>
            </section>
          </fieldset>

          <section
            className="panel editor-section editor-publication"
            aria-labelledby="publication-title"
          >
            <h2 id="publication-title">Publicação</h2>
            <div className="publication-actions">
              <button className="button" disabled={busy} type="submit" value="save">
                {pending === "save" ? "Salvando…" : "Salvar rascunho"}
              </button>
              <button
                className="button button--primary"
                disabled={busy}
                type="submit"
                value="publish"
              >
                {pending === "publish"
                  ? "Publicando…"
                  : page.published
                    ? "Publicar alterações"
                    : "Publicar página"}
              </button>
              {page.published && (
                <button
                  className="button button--danger"
                  disabled={busy}
                  onClick={() => void execute("unpublish")}
                  type="button"
                >
                  {pending === "unpublish" ? "Despublicando…" : "Despublicar página"}
                </button>
              )}
            </div>

            {dirty && <p className="field-hint">Alterações ainda não salvas.</p>}
            {page.published && (
              <div className="published-address">
                <a href={getPublicUrl(page.slug)} rel="noreferrer" target="_blank">
                  {getPublicUrl(page.slug)}
                </a>
                <button
                  className="button button--small"
                  onClick={() => void copyLink()}
                  type="button"
                >
                  Copiar link
                </button>
              </div>
            )}
          </section>
          {scope === "admin" && (
            <ClientLinkControls
              active={Boolean(page.hasClientLink)}
              disabled={busy}
              id={page.id}
              onAccessChange={(hasClientLink) =>
                setPage((current) => ({ ...current, hasClientLink }))
              }
              onError={onAccessError}
              onPendingChange={setAccessPending}
              pending={accessPending}
            />
          )}
          <div className="editor-notices" aria-live="polite" aria-atomic="true">
            {notice && <p className="notice notice--success">{notice}</p>}
            {copyNotice && <p className="notice">{copyNotice}</p>}
          </div>
          {problem && (
            <div className="notice notice--error" role="alert">
              <p>{problem}</p>
              {conflict && (
                <button
                  className="button button--small"
                  type="button"
                  onClick={() => {
                    if (!dirty || window.confirm("Recarregar sem salvar as alterações?"))
                      onReload();
                  }}
                >
                  Recarregar rascunho
                </button>
              )}
            </div>
          )}
        </form>

        <aside className="preview-column" id="page-preview">
          <h2>Prévia ao vivo</h2>
          <LinkPage presentation={preview} preview />
        </aside>
      </div>
    </>
  );
}
