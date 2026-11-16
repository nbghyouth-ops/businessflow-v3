import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDb)("RLS & hak akses tabel identitas/keanggotaan", () => {
  let pool: Pool;
  const wsA = randomUUID(), wsB = randomUUID();
  const uA = `u-${randomUUID()}`, uB = `u-${randomUUID()}`;

  async function asApp<T>(settings: Record<string, string>, fn: (q: (sql: string, p?: unknown[]) => Promise<{ rows: any[] }>) => Promise<T>) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      for (const [k, v] of Object.entries(settings)) await c.query("SELECT set_config($1,$2,true)", [k, v]);
      await c.query("SET LOCAL ROLE bf_app");
      const out = await fn((s, p) => c.query(s, p));
      await c.query("ROLLBACK");
      return out;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("INSERT INTO workspaces (id,name) VALUES ($1,'A'),($2,'B')", [wsA, wsB]);
    await pool.query(`INSERT INTO "user" (id,name,email,email_verified) VALUES ($1,'A',$3,true),($2,'B',$4,true)`, [uA, uB, `${uA}@x.test`, `${uB}@x.test`]);
    await pool.query("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$3,'owner'),($2,$4,'owner')", [wsA, wsB, uA, uB]);
    await pool.query("INSERT INTO auth_events (workspace_id,user_id,type) VALUES ($1,$3,'t'),($2,$4,'t')", [wsA, wsB, uA, uB]);
  });
  afterAll(async () => {
    await pool.query("DELETE FROM workspaces WHERE id = ANY($1)", [[wsA, wsB]]);
    await pool.query(`DELETE FROM "user" WHERE id = ANY($1)`, [[uA, uB]]);
    await pool.end();
  });

  it("role aplikasi bf_app TIDAK dapat membaca tabel auth (user, session, account, verification)", async () => {
    for (const t of ['"user"', "session", "account", "verification"]) {
      await expect(asApp({ "app.workspace_id": wsA }, (q) => q(`SELECT 1 FROM ${t} LIMIT 1`))).rejects.toMatchObject({ code: "42501" });
    }
  });

  it("workspace_members terisolasi per workspace", async () => {
    const rows = await asApp({ "app.workspace_id": wsA }, (q) => q("SELECT user_id FROM workspace_members"));
    expect(rows.rows.map((r) => r.user_id)).toEqual([uA]);
  });

  it("tanpa konteks tenant, bf_app tidak melihat keanggotaan apa pun (fail-closed)", async () => {
    const rows = await asApp({}, (q) => q("SELECT 1 FROM workspace_members"));
    expect(rows.rows.length).toBe(0);
  });

  it("app.user_id hanya membuka keanggotaan milik user itu sendiri", async () => {
    const rows = await asApp({ "app.user_id": uA }, (q) => q("SELECT user_id FROM workspace_members"));
    expect(rows.rows.map((r) => r.user_id)).toEqual([uA]);
  });

  it("bf_app tidak dapat menulis keanggotaan/undangan dan tidak dapat mengubah/menghapus auth_events", async () => {
    await expect(asApp({ "app.workspace_id": wsA }, (q) => q("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,'owner')", [wsA, uB]))).rejects.toMatchObject({ code: "42501" });
    await expect(asApp({ "app.workspace_id": wsA }, (q) => q("DELETE FROM auth_events"))).rejects.toMatchObject({ code: "42501" });
    const ev = await asApp({ "app.workspace_id": wsA }, (q) => q("SELECT user_id FROM auth_events"));
    expect(ev.rows.map((r) => r.user_id)).toEqual([uA]);
  });

  it("hanya satu owner aktif per workspace (unique parsial)", async () => {
    const u3 = `u-${randomUUID()}`;
    await pool.query(`INSERT INTO "user" (id,name,email,email_verified) VALUES ($1,'C',$2,true)`, [u3, `${u3}@x.test`]);
    await expect(pool.query("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,'owner')", [wsA, u3])).rejects.toMatchObject({ code: "23505" });
    await pool.query(`DELETE FROM "user" WHERE id=$1`, [u3]);
  });

  it("inventaris RLS: setiap tabel ber-workspace_id wajib ENABLE+FORCE dan memiliki kebijakan", async () => {
    const { rows } = await pool.query(`
      SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r'
        AND EXISTS (SELECT 1 FROM information_schema.columns k WHERE k.table_schema='public' AND k.table_name=c.relname AND k.column_name='workspace_id')
        AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
             OR NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid))`);
    expect(rows.map((r) => r.relname)).toEqual([]);
  });
});
