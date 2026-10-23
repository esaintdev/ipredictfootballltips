import { Pool, type QueryResultRow } from "pg";
import { SCHEMA_SQL } from "./schema";
import { DEFAULT_COMPETITIONS } from "./competitions";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

function pool(): Pool {
  if (!global.__pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add your Postgres / Supabase connection string to the environment.");
    const local = /localhost|127\.0\.0\.1|\/var\/run/.test(url);
    global.__pgPool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      ssl: local || process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false },
    });
  }
  return global.__pgPool;
}

/** Creates tables on first use (idempotent), so a fresh database just works. */
export function ensureSchema(): Promise<void> {
  if (!global.__schemaReady) {
    global.__schemaReady = pool()
      .query(SCHEMA_SQL)
      .then(() => seedCompetitions(pool()))
      .catch((e) => {
        global.__schemaReady = undefined;
        throw e;
      });
  }
  return global.__schemaReady;
}

export async function q<T extends QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query<T>(sql, params);
  return res.rows;
}

export async function q1<T extends QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

export function dbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/** Default catalogue; existing rows (and admin edits to them) are left alone. */
async function seedCompetitions(p: Pool) {
  const c = DEFAULT_COMPETITIONS;
  await p.query(
    `INSERT INTO competitions(id, slug, name, country, category, type, is_national, neutral, priority)
     SELECT * FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::bool[], $8::bool[], $9::int[])
     ON CONFLICT DO NOTHING`,
    [c.map((x) => x.id), c.map((x) => x.slug), c.map((x) => x.name), c.map((x) => x.country), c.map((x) => x.category),
      c.map((x) => x.type), c.map((x) => Boolean(x.isNational)), c.map((x) => Boolean(x.neutral)), c.map((x) => x.priority)],
  );
}
