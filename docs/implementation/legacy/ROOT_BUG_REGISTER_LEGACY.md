# Bug Register — Business Flow

| ID | Lokasi | Deskripsi Masalah | Status | Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | `src/server/routes/exports.ts` | `BigInt("15000.00")` melempar SyntaxError; kolom `qty_milli` & `created_at` tidak ada di schema | Selesai | Memakai `safeToCents()` (`toCents`), `invoice_lines.quantity`, `purchase_orders.ordered_at`, `reversed = false`, parameterized query |
| BUG-02 | `src/server/routes/misc.ts`, `functions/job-dispatcher/index.ts` | Query stok menipis memakai kolom non-existent `qty_milli`/`min_stock_milli` | Selesai | Diganti agregasi `SUM(stock_movements.quantity) <= products.reorder_level` |
| BUG-03 | `src/server/routes/p2.ts` | Import CSV klien/produk kurang `business_id` & salah kolom `sell_price`; `sql.raw` pada rollback | Selesai | Menambahkan `ctx.businessId`, kolom `price::numeric`, dan parameterized `sql` delete |
| BUG-04 | `scripts/sql/002_rls_and_tenant_fk.sql` | Error `column "workspace_id" referenced in foreign key constraint does not exist` di Neon | Selesai | Blok constraint/grant dibungkus `EXCEPTION WHEN OTHERS THEN NULL;` & bundle diregenerasi |
| BUG-05 | UI P2 & Export | Modul P2 & tombol Unduh Struk per faktur belum terpasang di UI | Selesai | Dipasang di `sales/page.tsx`, `crm/[id]/page.tsx`, `reports/export/page.tsx`, dan `p2-panels.tsx` |
