import { RequestError } from "./errors.js";

export function assertCurrentRevision(current: number, submitted: number): void {
  if (current !== submitted) {
    throw new RequestError(409, "A página mudou em outra aba. Reabra a página e tente novamente.");
  }
}

export function assertSlugCanChange(locked: boolean, current: string, submitted: string): void {
  if (locked && current !== submitted) {
    throw new RequestError(409, "O endereço fica fixo após a primeira publicação.");
  }
}

export function publicationTransition<T>(
  page: { draft: T; publication: T | null; revision: number; slugLocked: boolean },
  revision: number,
  action: "publish" | "unpublish",
) {
  assertCurrentRevision(page.revision, revision);
  if (action === "publish") {
    return { publication: page.draft, revision: revision + 1, slugLocked: true };
  }
  return {
    publication: null,
    revision: page.publication === null ? revision : revision + 1,
    slugLocked: page.slugLocked,
  };
}
