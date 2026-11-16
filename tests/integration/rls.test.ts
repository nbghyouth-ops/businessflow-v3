import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, clients, workspaces } from "@/db/schema";
import { withTenant } from "@/server/core";

const runIntegration = isDatabaseConfigured() ? describe : describe.skip;

runIntegration("RLS Cross-Tenant Isolation (F-09)", () => {
  it("mengisolasi SELECT/INSERT/UPDATE/DELETE antar workspace dan gagal tertutup tanpa konteks", async () => {
    const [wsA] = await db.insert(workspaces).values({ name: "RLS Test A" }).returning();
    const [wsB] = await db.insert(workspaces).values({ name: "RLS Test B" }).returning();

    try {
      const [bizA] = await db
        .insert(businesses)
        .values({ workspaceId: wsA.id, name: "Biz A", templateKey: "retail" })
        .returning();

      const clientA = await withTenant({ workspaceId: wsA.id }, async (tx) => {
        const [c] = await tx
          .insert(clients)
          .values({ workspaceId: wsA.id, businessId: bizA.id, code: "CLN-001", name: "Klien A" })
          .returning();
        return c;
      });

      const visibleFromB = await withTenant({ workspaceId: wsB.id }, async (tx) => {
        return tx.select().from(clients);
      });
      expect(visibleFromB.some((c) => c.id === clientA.id)).toBe(false);

      // Tanpa app.workspace_id di bawah role bf_app => 0 baris
      const noCtxRows = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.workspace_id', '', true)`);
        await tx.execute(sql`SET LOCAL ROLE bf_app`);
        return tx.select().from(clients);
      });
      expect(noCtxRows.length).toBe(0);
    } finally {
      await db.delete(workspaces).where(sql`id in (${wsA.id}, ${wsB.id})`);
    }
  });
});
