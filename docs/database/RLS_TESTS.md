# RLS & Cross-Tenant Isolation Tests

Dokumen ini menjelaskan pengujian isolasi tenant (F-09) pada `tests/integration/rls.test.ts`.

## Skenario yang Diuji
1. Role koneksi meniru Neon (`LOGIN`, `BYPASSRLS`, bukan superuser) menjalankan `withTenant(wsA)` → `SET LOCAL ROLE bf_app` + `set_config('app.workspace_id', wsA, true)`.
2. Workspace A tidak dapat melakukan `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `UPSERT`, `JOIN`, maupun subquery terhadap baris milik Workspace B.
3. Tanpa `app.workspace_id` (kosong/null) di bawah `ROLE bf_app`, `SELECT` mengembalikan **0 baris** dan `INSERT` ditolak (`42501`).
4. Pool koneksi yang dipakai ulang tidak membocorkan `app.workspace_id` atau `ROLE bf_app` antar transaksi karena keduanya bersifat transaction-local (`set_config(..., true)` dan `SET LOCAL ROLE`).
5. Tabel append-only (`journal_entries`, `journal_lines`, `stock_movements`, `audit_events`, `export_records`) menolak `UPDATE` dan `DELETE` dari `bf_app`.

## Status Eksekusi
- Di sandbox VM (tanpa PostgreSQL & tanpa internet): `BLOCKED` (belum dijalankan).
- Di lingkungan pemilik / CI dengan PostgreSQL / Neon: jalankan `npm run test:integration` dan `npm run db:check`.
