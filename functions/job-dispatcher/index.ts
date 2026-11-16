/**
 * Neon Function: central job dispatcher.
 * Aplikasi tetap berfungsi penuh tanpa scheduler ini (notifikasi & pengingat dihitung saat dibaca).
 * Trigger terjadwal dibuat pemilik di Neon (cron "*\/5 * * * *"), bukan di Vercel.
 * DATABASE_URL disuntikkan otomatis oleh runtime Neon Functions.
 */
import { Pool } from "pg";

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 12_000,
    });
  }
  return _pool;
}

const WORKER = `dispatcher-${Math.random().toString(36).slice(2, 8)}`;
const BATCH = 20;
const LEASE_SECONDS = 120;
const BUDGET_MS = 25_000;

export type Job = {
  id: string;
  workspace_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  checkpoint: Record<string, unknown>;
};
type Handler = (job: Job) => Promise<Record<string, unknown> | void>;

export function computeBackoffSeconds(attempts: number, rand = Math.random()): number {
  const base = Math.min(2 ** Math.max(1, attempts) * 30, 3600);
  const jitter = Math.floor(rand * 15);
  return base + jitter;
}

/**
 * Validasi header trigger Neon Functions (best-effort, tanpa ENV secret tambahan).
 * Dokumentasi header trigger Neon Functions dapat berubah; verifikasi saat deploy di Neon Console.
 */
export function validateTriggerHeaders(request: Request): { ok: boolean; source: string } {
  const triggerId = request.headers.get("x-neon-trigger") || request.headers.get("x-neon-event-id");
  const ua = request.headers.get("user-agent") || "";
  if (triggerId) return { ok: true, source: "neon_trigger" };
  if (ua.toLowerCase().includes("neon")) return { ok: true, source: "neon_ua" };
  return { ok: false, source: "unverified" };
}

export const HANDLERS: Record<string, Handler> = {
  async "invoice.due_reminder"(job) {
    if (!job.workspace_id) return;
    await getPool().query(
      `insert into notifications (workspace_id, business_id, kind, title, body)
       select i.workspace_id, i.business_id, 'invoice_due', 'Faktur ' || i.number || ' jatuh tempo', 'Sisa tagihan ' || (i.total - i.paid)::text
       from invoices i
       where i.workspace_id = $1 and i.status in ('unpaid','partial') and i.due_date <= current_date
       limit 20`,
      [job.workspace_id],
    );
  },
  async "stock.low_alert"(job) {
    if (!job.workspace_id) return;
    await getPool().query(
      `insert into notifications (workspace_id, business_id, kind, title, body)
       select p.workspace_id, p.business_id, 'low_stock', 'Stok menipis: ' || p.name, 'Stok saat ini: ' || coalesce(sum(m.quantity),0)::text
       from products p
       left join stock_movements m on m.product_id = p.id and m.workspace_id = p.workspace_id
       where p.workspace_id = $1 and p.track_stock = true and p.reorder_level > 0
       group by p.id, p.workspace_id, p.business_id, p.name, p.reorder_level
       having coalesce(sum(m.quantity),0) <= p.reorder_level
       limit 20`,
      [job.workspace_id],
    );
  },
  async "system.cleanup"() {
    await getPool().query(`delete from tab_sessions where expires_at < now() - interval '1 day'`);
    await getPool().query(`delete from idempotency_keys where created_at < now() - interval '30 days'`);
    await getPool().query(`delete from api_rate_limits where reset_at < now() - interval '1 day'`);
  },
};

export async function enqueueProducerJobs() {
  const pool = getPool();
  // Enqueue daily cleanup & due reminders idempotently
  await pool.query(`
    insert into jobs (workspace_id, type, payload, status, next_run_at)
    select null, 'system.cleanup', '{}'::jsonb, 'pending', now()
    where not exists (
      select 1 from jobs where type = 'system.cleanup' and status in ('pending', 'leased', 'retry_wait')
    )
  `);
}

async function maintenance() {
  const pool = getPool();
  await pool.query(`update jobs set status = 'retry_wait', lease_owner = null, lease_expires_at = null where status = 'leased' and lease_expires_at < now()`);
  await pool.query(`delete from tab_sessions where expires_at < now() - interval '1 day'`);
  await pool.query(`delete from idempotency_keys where created_at < now() - interval '30 days'`);
  await pool.query(`delete from api_rate_limits where reset_at < now() - interval '1 day'`);
}

async function claim(): Promise<Job[]> {
  const r = await getPool().query<Job>(
    `with due as (
       select id from jobs where status in ('pending','retry_wait') and next_run_at <= now()
       order by next_run_at limit $1 for update skip locked)
     update jobs j set status = 'leased', lease_owner = $2, lease_expires_at = now() + ($3 || ' seconds')::interval, attempts = attempts + 1
     from due where j.id = due.id
     returning j.id, j.workspace_id, j.type, j.payload, j.attempts, j.max_attempts, j.checkpoint`,
    [BATCH, WORKER, String(LEASE_SECONDS)],
  );
  return r.rows;
}

async function run(job: Job) {
  const h = HANDLERS[job.type];
  try {
    if (!h) throw new Error(`unknown job type: ${job.type}`);
    const checkpoint = (await h(job)) ?? job.checkpoint;
    await getPool().query(
      `update jobs set status = 'succeeded', lease_owner = null, lease_expires_at = null, checkpoint = $2, last_error = null where id = $1`,
      [job.id, checkpoint],
    );
  } catch (e) {
    const dead = job.attempts >= job.max_attempts || !h;
    const backoff = computeBackoffSeconds(job.attempts);
    await getPool().query(
      `update jobs set status = $2, lease_owner = null, lease_expires_at = null, last_error = $3, next_run_at = now() + ($4 || ' seconds')::interval where id = $1`,
      [job.id, dead ? "dead_letter" : "retry_wait", String((e as Error).message).slice(0, 500), String(backoff)],
    );
  }
}

const dispatcher = {
  async fetch(request: Request): Promise<Response> {
    const triggerCheck = validateTriggerHeaders(request);
    const started = Date.now();
    let processed = 0;
    try {
      await maintenance();
      await enqueueProducerJobs();
      while (Date.now() - started < BUDGET_MS) {
        const jobs = await claim();
        if (!jobs.length) break;
        for (const j of jobs) {
          if (Date.now() - started >= BUDGET_MS) {
            await getPool().query(
              `update jobs set status = 'retry_wait', lease_owner = null, lease_expires_at = null, attempts = attempts - 1 where id = $1`,
              [j.id],
            );
            continue;
          }
          await run(j);
          processed++;
        }
      }
      return Response.json({ ok: true, processed, triggerSource: triggerCheck.source });
    } catch {
      return Response.json({ ok: false }, { status: 500 });
    }
  },
};

export default dispatcher;
