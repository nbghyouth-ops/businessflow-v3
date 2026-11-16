import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CANONICAL_MIGRATIONS } from "../../scripts/migrations-manifest.mjs";
import { verifyDatabaseSchemaReadOnly } from "@/db/schema-verifier";

const url = process.env.DATABASE_URL?.trim();
const hasDb = Boolean(url);

function withDb(u: string, db: string) {
  const x = new URL(u);
  x.pathname = `/${db}`;
  return x.toString();
}

describe.skipIf(!hasDb)("Migrasi, deteksi drift, dan skema bersih", () => {
  it("skema hasil migrasi lolos verifyDatabaseSchemaReadOnly()", async () => {
    const pool = new Pool({ connectionString: url });
    try {
      const res = await verifyDatabaseSchemaReadOnly(pool);
      expect(res).toMatchObject({ ok: true, reason: "OK" });
    } finally {
      await pool.end();
    }
  });

  it("seluruh migrasi kanonis tercatat di schema_migrations", async () => {
    const pool = new Pool({ connectionString: url });
    try {
      const { rows } = await pool.query<{ id: string }>("SELECT id FROM schema_migrations");
      const ids = new Set(rows.map((r) => r.id));
      for (const m of CANONICAL_MIGRATIONS) expect(ids.has(m.id), m.id).toBe(true);
    } finally {
      await pool.end();
    }
  });

  it("mendeteksi drift nyata pada salinan database (default devices.id dihapus, lalu checksum diubah)", async () => {
    const admin = new Pool({ connectionString: url });
    const name = `bf_drift_${randomUUID().slice(0, 8)}`;
    let clone: Pool | undefined;
    try {
      await admin.query(`CREATE DATABASE ${name} TEMPLATE ${new URL(url!).pathname.slice(1)}`);
      clone = new Pool({ connectionString: withDb(url!, name) });
      expect((await verifyDatabaseSchemaReadOnly(clone)).ok).toBe(true);

      await clone.query("ALTER TABLE devices ALTER COLUMN id DROP DEFAULT");
      const drift1 = await verifyDatabaseSchemaReadOnly(clone);
      expect(drift1.ok).toBe(false);
      expect(drift1.reason).toBe("SCHEMA_DRIFT");

      await clone.query("ALTER TABLE devices ALTER COLUMN id SET DEFAULT gen_random_uuid()");
      await clone.query("UPDATE schema_migrations SET checksum='x' WHERE id='001_integrity'");
      const drift2 = await verifyDatabaseSchemaReadOnly(clone);
      expect(drift2.reason).toBe("SCHEMA_DRIFT");
      expect(drift2.detail).toContain("001_integrity");
    } finally {
      await clone?.end();
      await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end();
    }
  }, 30000);
});
