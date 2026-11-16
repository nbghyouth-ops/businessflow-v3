import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDb)("Concurrency & Workflow Integrity Integration (BF-010, BF-017, BF-036, BF-041)", () => {
  let pool: Pool;
  const ws = randomUUID();
  const biz = randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, 'Concurrency WS')", [ws]);
    await pool.query("INSERT INTO businesses (id, workspace_id, name, template_key) VALUES ($1, $2, 'Concurrency Biz', 'retail')", [biz, ws]);
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query("DELETE FROM workspaces WHERE id = $1", [ws]).catch(() => {});
    await pool.end();
  });

  it("hanya mengizinkan 1 cashier_shift terbuka per workspace secara bersamaan (BF-017)", async () => {
    const dev1 = randomUUID();
    await pool.query("INSERT INTO devices (id, token_hash, name) VALUES ($1, $2, 'Dev1')", [dev1, `hash-${dev1}`]);
    const p1 = pool.query(
      "INSERT INTO cashier_shifts (workspace_id, device_id, operator, opening_cash, expected_cash, status) VALUES ($1, $2, 'Op1', 10000, 10000, 'open')",
      [ws, dev1],
    );
    const p2 = pool.query(
      "INSERT INTO cashier_shifts (workspace_id, device_id, operator, opening_cash, expected_cash, status) VALUES ($1, $2, 'Op2', 10000, 10000, 'open')",
      [ws, dev1],
    );
    const results = await Promise.allSettled([p1, p2]);
    const okCount = results.filter((r) => r.status === "fulfilled").length;
    expect(okCount).toBe(1);
    await pool.query("DELETE FROM devices WHERE id = $1", [dev1]);
  });

  it("mencegah double depreciation pada aset dan periode yang sama secara bersamaan (BF-010)", async () => {
    const assetId = randomUUID();
    await pool.query(
      `INSERT INTO fixed_assets (id, workspace_id, code, name, acquisition_date, acquisition_cost_cents, residual_value_cents, useful_life_months, method, book_value_cents)
       VALUES ($1, $2, 'AST-01', 'Laptop', '2026-01-01', 1200000, 0, 12, 'straight_line', 1200000)`,
      [assetId, ws],
    );
    const r1 = pool.query(
      "INSERT INTO asset_depreciation_logs (workspace_id, asset_id, period_month, amount_cents, book_value_after_cents) VALUES ($1, $2, '2026-11', 100000, 1100000)",
      [ws, assetId],
    );
    const r2 = pool.query(
      "INSERT INTO asset_depreciation_logs (workspace_id, asset_id, period_month, amount_cents, book_value_after_cents) VALUES ($1, $2, '2026-11', 100000, 1100000)",
      [ws, assetId],
    );
    const settled = await Promise.allSettled([r1, r2]);
    expect(settled.filter((r) => r.status === "fulfilled").length).toBe(1);
  });

  it("rateLimitDb atomik menghitung tepat di bawah request bersamaan (BF-041)", async () => {
    const key = `test:pin:${randomUUID()}`;
    const attempts = Array.from({ length: 10 }, () =>
      pool.query<{ count: number }>(
        `INSERT INTO api_rate_limits (key, count, reset_at)
         VALUES ($1, 1, now() + interval '1 minute')
         ON CONFLICT (key) DO UPDATE SET count = api_rate_limits.count + 1
         RETURNING count`,
        [key],
      ),
    );
    const res = await Promise.all(attempts);
    const counts = res.map((r) => Number(r.rows[0].count)).sort((a, b) => a - b);
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    await pool.query("DELETE FROM api_rate_limits WHERE key = $1", [key]);
  });
});
