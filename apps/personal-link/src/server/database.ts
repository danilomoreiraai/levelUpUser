import { Pool, type PoolClient } from "pg";
import type { AdminPage, PageContent, Presentation } from "../shared/contracts.js";
import { digest, sessionDurationSeconds } from "./auth.js";
import { RequestError } from "./errors.js";
import {
  assertCurrentRevision,
  assertSlugCanChange,
  publicationTransition,
} from "./publication.js";

type Snapshot = PageContent & { avatarId: string | null; backgroundId: string | null };

type PageRow = {
  id: string;
  slug: string;
  revision: number;
  slug_locked: boolean;
  draft: Snapshot;
  publication: Snapshot | null;
};

function presentation(snapshot: Snapshot, mediaBase: string): Presentation {
  const { avatarId, backgroundId, ...content } = snapshot;
  return {
    ...content,
    avatarUrl: avatarId ? `${mediaBase}/${avatarId}` : null,
    backgroundUrl: backgroundId ? `${mediaBase}/${backgroundId}` : null,
  };
}

function adminPage(row: PageRow): AdminPage {
  return {
    id: row.id,
    slug: row.slug,
    revision: row.revision,
    published: row.publication !== null,
    slugLocked: row.slug_locked,
    draft: presentation(row.draft, `/api/admin/pages/${row.id}/media`),
  };
}

async function updateMedia(
  client: PoolClient,
  pageId: string,
  originalId: string | null,
  next: Buffer | null | undefined,
): Promise<string | null> {
  if (next === undefined) return originalId;
  if (next === null) return null;
  const result = await client.query<{ id: string }>(
    "INSERT INTO personal_link_media (page_id, content) VALUES ($1, $2) RETURNING id",
    [pageId, next],
  );
  return result.rows[0].id;
}

async function pruneMedia(client: PoolClient, page: PageRow): Promise<void> {
  const active = [
    page.draft.avatarId,
    page.draft.backgroundId,
    page.publication?.avatarId,
    page.publication?.backgroundId,
  ].filter((id): id is string => typeof id === "string");

  await client.query(
    "DELETE FROM personal_link_media WHERE page_id = $1 AND id <> ALL($2::uuid[])",
    [page.id, active],
  );
}

const migration1 = `
  CREATE TABLE personal_link_page (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
    slug_locked boolean NOT NULL DEFAULT false,
    draft jsonb NOT NULL,
    publication jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE personal_link_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES personal_link_page(id) ON DELETE CASCADE,
    content bytea NOT NULL
  );

  CREATE INDEX personal_link_media_page_idx ON personal_link_media (page_id);

  CREATE TABLE personal_link_session (
    token bytea PRIMARY KEY,
    credential_tag bytea NOT NULL,
    expires_at timestamptz NOT NULL
  );

  CREATE INDEX personal_link_session_expiry_idx ON personal_link_session (expires_at);
`;

export class Database {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      application_name: "personal-link",
      connectionTimeoutMillis: 4_000,
      query_timeout: 8_000,
      statement_timeout: 7_000,
      max: 8,
    });
    this.pool.on("error", () => {
      // pg discards and replaces a broken idle connection.
      console.error("A conexão ociosa com o PostgreSQL foi perdida.");
    });
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  private async updatePage(
    id: string,
    update: (client: PoolClient, row: PageRow) => Promise<PageRow>,
  ): Promise<AdminPage> {
    return this.transaction(async (client) => {
      const result = await client.query<PageRow>(
        "SELECT * FROM personal_link_page WHERE id = $1 FOR UPDATE",
        [id],
      );
      const page = result.rows[0];
      if (!page) throw new RequestError(404, "Página não encontrada.");
      const next = await update(client, page);
      await pruneMedia(client, next);
      return adminPage(next);
    });
  }

  async migrate(): Promise<void> {
    await this.transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(1336271438, 1)");
      await client.query(
        "CREATE TABLE IF NOT EXISTS personal_link_schema (version integer PRIMARY KEY)",
      );
      const result = await client.query("SELECT 1 FROM personal_link_schema WHERE version = 1");
      if (result.rowCount === 0) {
        await client.query(migration1);
        await client.query("INSERT INTO personal_link_schema (version) VALUES (1)");
      }
    });
  }

  async ready(): Promise<void> {
    await this.pool.query("SELECT version FROM personal_link_schema LIMIT 1");
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async createSession(token: string, tag: Buffer): Promise<void> {
    await this.transaction(async (client) => {
      await client.query(
        "DELETE FROM personal_link_session WHERE expires_at <= now() OR credential_tag <> $1",
        [tag],
      );
      await client.query(
        "INSERT INTO personal_link_session VALUES ($1, $2, now() + make_interval(secs => $3))",
        [digest(token), tag, sessionDurationSeconds],
      );
    });
  }

  async hasSession(token: string, tag: Buffer): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT 1 FROM personal_link_session WHERE token = $1 AND credential_tag = $2 AND expires_at > now()",
      [digest(token), tag],
    );
    return result.rowCount === 1;
  }

  async revokeSession(token: string): Promise<void> {
    await this.pool.query("DELETE FROM personal_link_session WHERE token = $1", [digest(token)]);
  }

  async listPages(): Promise<AdminPage[]> {
    const result = await this.pool.query<PageRow>(
      "SELECT * FROM personal_link_page ORDER BY updated_at DESC, id",
    );
    return result.rows.map(adminPage);
  }

  async createPage(slug: string): Promise<AdminPage> {
    const draft: Snapshot = {
      handle: slug,
      preset: "original",
      blur: 0,
      links: [],
      socials: [],
      avatarId: null,
      backgroundId: null,
    };
    const result = await this.pool.query<PageRow>(
      "INSERT INTO personal_link_page (slug, draft) VALUES ($1, $2) RETURNING *",
      [slug, draft],
    );
    return adminPage(result.rows[0]);
  }

  async getAdminPage(id: string): Promise<AdminPage | null> {
    const result = await this.pool.query<PageRow>(
      "SELECT * FROM personal_link_page WHERE id = $1",
      [id],
    );
    return result.rows[0] ? adminPage(result.rows[0]) : null;
  }

  async saveDraft(
    id: string,
    revision: number,
    slug: string,
    content: PageContent,
    avatar: Buffer | null | undefined,
    background: Buffer | null | undefined,
  ): Promise<AdminPage> {
    return this.updatePage(id, async (client, page) => {
      assertCurrentRevision(page.revision, revision);
      assertSlugCanChange(page.slug_locked, page.slug, slug);
      const draft: Snapshot = {
        ...content,
        avatarId: await updateMedia(client, id, page.draft.avatarId, avatar),
        backgroundId: await updateMedia(client, id, page.draft.backgroundId, background),
      };
      const result = await client.query<PageRow>(
        `UPDATE personal_link_page SET slug = $2, draft = $3, revision = revision + 1,
           updated_at = now() WHERE id = $1 RETURNING *`,
        [id, slug, draft],
      );
      return result.rows[0];
    });
  }

  async changePublication(
    id: string,
    revision: number,
    action: "publish" | "unpublish",
  ): Promise<AdminPage> {
    return this.updatePage(id, async (client, page) => {
      const next = publicationTransition(
        { ...page, slugLocked: page.slug_locked },
        revision,
        action,
      );
      const result = await client.query<PageRow>(
        `UPDATE personal_link_page SET publication = $2, revision = $3, slug_locked = $4,
           updated_at = now() WHERE id = $1 RETURNING *`,
        [id, next.publication, next.revision, next.slugLocked],
      );
      return result.rows[0];
    });
  }

  async getPublicPage(slug: string): Promise<Presentation | null> {
    const result = await this.pool.query<{ publication: Snapshot }>(
      "SELECT publication FROM personal_link_page WHERE slug = $1 AND publication IS NOT NULL",
      [slug],
    );
    const publication = result.rows[0]?.publication;
    return publication ? presentation(publication, `/api/public/pages/${slug}/media`) : null;
  }

  async getAdminMedia(pageId: string, mediaId: string): Promise<Buffer | null> {
    const result = await this.pool.query<{ content: Buffer }>(
      "SELECT content FROM personal_link_media WHERE page_id = $1 AND id = $2",
      [pageId, mediaId],
    );
    return result.rows[0]?.content ?? null;
  }

  async getPublicMedia(slug: string, mediaId: string): Promise<Buffer | null> {
    const result = await this.pool.query<{ content: Buffer }>(
      `SELECT media.content FROM personal_link_media media
       JOIN personal_link_page page ON page.id = media.page_id
       WHERE page.slug = $1 AND media.id = $2
       AND media.id::text IN (page.publication->>'avatarId', page.publication->>'backgroundId')`,
      [slug, mediaId],
    );
    return result.rows[0]?.content ?? null;
  }
}
