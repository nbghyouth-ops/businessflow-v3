# RLS Inventory — Business Flow

Setiap tabel di skema `public` wajib terdaftar di sini dengan status RLS yang eksplisit.

## 1. Tabel Bertenant (`ENABLE + FORCE ROW LEVEL SECURITY`, policy `workspace_id = NULLIF(current_setting('app.workspace_id', true), '')::uuid`)

Seluruh tabel berikut wajib diakses melalui `withTenant(ctx, tx => ...)` yang menyetel `app.workspace_id` dan `SET LOCAL ROLE bf_app` (`NOBYPASSRLS`):

- Inti tenant & konfigurasi: `businesses`, `branches`, `warehouses`, `device_grants`, `pairing_codes`, `legal_acceptances`, `audit_events`, `idempotency_keys`, `doc_counters`, `notifications`, `files`.
- Keuangan & akuntansi: `coa_accounts`, `cash_accounts`, `finance_categories`, `accounting_periods`, `journal_entries` (append-only), `journal_lines` (append-only), `finance_transactions`, `budgets`, `bank_reconciliations`, `credit_notes`.
- Penjualan, pembelian, stok & CRM: `clients`, `client_contacts`, `client_activities`, `products`, `stock_movements` (append-only), `invoices`, `invoice_lines`, `payments`, `suppliers`, `purchase_orders`, `purchase_order_lines`, `supplier_bills`, `quotations`, `sales_orders`, `stock_transfers`, `stock_counts`, `purchase_requests`, `supplier_returns`.
- Operasional, HR & proyek: `employees`, `attendance`, `leave_requests`, `shifts`, `payroll_runs`, `tasks`, `task_comments`, `projects`, `assets`, `campaigns`, `ops_logs`, `cash_sessions`, `booking_resources`, `bookings`.
- Ekspor, migrasi & privasi: `receipt_templates`, `receipt_template_versions`, `report_templates`, `report_template_versions`, `export_records` (append-only), `import_batches`, `data_subject_requests`.

## 2. Tabel Non-Tenant (beserta alasan teknis)

| Tabel | Alasan tidak memakai RLS `app.workspace_id` | Kontrol akses |
|---|---|---|
| `workspaces` | Root tenant itu sendiri (`id` = `workspace_id`). | Hanya dibuat saat onboarding atomik. |
| `devices` | Identitas perangkat global berbasis hash token cookie HttpOnly (`bf_device`). | Hanya diakses endpoint auth/perangkat terotorisasi. |
| `tab_sessions` | Sesi tab per-perangkat sebelum atau saat validasi PIN. | Terikat `device_id` dan token hash SHA-256. |
| `onboarding_drafts` | Draft sebelum workspace terbentuk (`workspace_id` belum ada). | Terikat `device_id` dari cookie HttpOnly. |
| `legal_documents` | Dokumen Syarat & Kebijakan Privasi versi global. | Read-only untuk perangkat. |
| `jobs` | Antrean background dispatcher lintas/tanpa tenant (`workspace_id` nullable). | Hanya diakses Neon Function dispatcher / backend. |
| `api_rate_limits` | Penghitung rate limit lintas-instance berbasis kunci IP/endpoint/device. | Hanya diakses `rateLimitDb()` di `core.ts`. |
| `schema_migrations` | Catatan migrasi SQL internal. | Hanya diakses `scripts/migrate.mjs`. |
