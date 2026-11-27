import { useState } from "react";
import { getErrorMessage, issueClientLink, revokeClientLink } from "./api";

export function ClientLinkControls({
  active,
  disabled,
  id,
  onAccessChange,
  onError,
  onPendingChange,
  pending,
}: {
  active: boolean;
  disabled: boolean;
  id: string;
  onAccessChange: (active: boolean) => void;
  onError: (error: unknown) => boolean;
  onPendingChange: (pending: boolean) => void;
  pending: boolean;
}) {
  const [address, setAddress] = useState("");
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  async function updateAccess(action: "issue" | "revoke") {
    if (active) {
      const question =
        action === "issue"
          ? "Gerar um novo link e cancelar o acesso pelo link anterior?"
          : "Revogar o link e encerrar o acesso do cliente?";
      if (!window.confirm(question)) return;
    }

    onPendingChange(true);
    setProblem("");
    setNotice("");
    try {
      if (action === "issue") {
        setAddress(await issueClientLink(id));
        onAccessChange(true);
        setNotice("Link de edição criado. Copie o endereço para enviar ao cliente.");
      } else {
        await revokeClientLink(id);
        setAddress("");
        onAccessChange(false);
        setNotice("Link de edição revogado.");
      }
    } catch (error) {
      if (!onError(error)) setProblem(getErrorMessage(error));
    } finally {
      onPendingChange(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setNotice("Link de edição copiado.");
    } catch {
      setNotice("Selecione e copie o endereço de edição.");
    }
  }

  return (
    <section
      className="panel editor-section"
      aria-labelledby="client-link-title"
      aria-busy={pending}
    >
      <h2 id="client-link-title">Acesso do cliente</h2>
      <p className="field-hint">
        Quem receber o link poderá editar e publicar esta página sem senha. Compartilhe o endereço
        apenas com o cliente.
      </p>
      {active && !address && (
        <p className="field-hint">Há um link ativo. Gere outro se precisar de um novo endereço.</p>
      )}
      {active && address && (
        <label className="field">
          <span>Endereço de edição do cliente</span>
          <input autoComplete="off" readOnly spellCheck={false} value={address} />
        </label>
      )}
      <div className="publication-actions">
        {active && address && (
          <button className="button" disabled={pending} onClick={() => void copy()} type="button">
            Copiar link de edição
          </button>
        )}
        <button
          className="button"
          disabled={disabled}
          onClick={() => void updateAccess("issue")}
          type="button"
        >
          {active ? "Gerar novo link de edição" : "Gerar link de edição"}
        </button>
        {active && (
          <button
            className="button button--danger"
            disabled={disabled}
            onClick={() => void updateAccess("revoke")}
            type="button"
          >
            Revogar link de edição
          </button>
        )}
      </div>
      {problem && (
        <p className="notice notice--error" role="alert">
          {problem}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
