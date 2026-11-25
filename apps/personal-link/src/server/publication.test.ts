import { describe, expect, it } from "vitest";
import {
  assertCurrentRevision,
  assertSlugCanChange,
  publicationTransition,
} from "./publication.js";

describe("publication state", () => {
  const initial = { draft: "new", publication: null, revision: 4, slugLocked: false };

  it("promotes the saved draft and locks the slug on first publication", () => {
    expect(publicationTransition(initial, 4, "publish")).toEqual({
      publication: "new",
      revision: 5,
      slugLocked: true,
    });
  });

  it("replaces the existing publication with the saved draft", () => {
    const published = { ...initial, publication: "old", slugLocked: true };
    expect(publicationTransition(published, 4, "publish")).toEqual({
      publication: "new",
      revision: 5,
      slugLocked: true,
    });
  });

  it("withdraws a publication and keeps the address locked", () => {
    const published = { ...initial, publication: "old", slugLocked: true };
    expect(publicationTransition(published, 4, "unpublish")).toEqual({
      publication: null,
      revision: 5,
      slugLocked: true,
    });
  });

  it("treats withdrawing an unpublished draft as idempotent", () => {
    expect(publicationTransition(initial, 4, "unpublish")).toEqual({
      publication: null,
      revision: 4,
      slugLocked: false,
    });
  });

  it("rejects stale writes and address changes on locked pages", () => {
    expect(() => assertCurrentRevision(4, 3)).toThrow("mudou em outra aba");
    expect(() => publicationTransition(initial, 3, "publish")).toThrow("mudou em outra aba");
    expect(() => assertSlugCanChange(false, "before", "after")).not.toThrow();
    expect(() => assertSlugCanChange(true, "before", "before")).not.toThrow();
    expect(() => assertSlugCanChange(true, "before", "after")).toThrow("endereço fica fixo");
  });
});
