# PROGRESS — Business Flow (Perombakan Fase 0–10)

Terakhir diperbarui: 2026-11-13 (sesi perombakan).

## Ringkasan Penyelesaian per Fase
- **Fase 0 (Baseline & Git):** `git init` + commit baseline `8e4854c`. Verifikasi lingkungan sandbox VM: Node `v18.20.4`, tanpa akses internet, tanpa `node_modules`, tanpa PostgreSQL lokal, tanpa Android SDK.
- **Fase 1 (F-01..F-05):** `src/db/index.ts` diubah menjadi lazy initialization + normalisasi SSL Neon + `checkDatabaseHealth()`; `/api/health` dan `DbStatusScreen` menangani `DATABASE_URL_MISSING` dan `SCHEMA_NOT_MIGRATED`; `package.json` dipin ke `next@16.4.6` & `eslint-config-next@16.4.6`; 8 error `set-state-in-effect` diperbaiki; `.gitignore`, `README.md`, `public/*` dibuat; `scripts/migrate.mjs`, `scripts/bundle-sql.mjs`, `scripts/preflight.mjs`, dan `drizzle/ALL_IN_ONE.sql` selesai.
- **Fase 2 & 3 (F-06, F-09, F-10, F-12 lazy):** `core.ts` & `session.ts` memakai single-query auth, `rateLimitDb` (SQL atomik), pembersihan oportunistik, notifikasi live di `/notifications`, `vercel.json` `regions: ["sin1"]`, `maxDuration = 30`, `scripts/sql/002_rls_and_tenant_fk.sql` (`bf_app` `NOBYPASSRLS`, `ENABLE + FORCE RLS`, composite FK), serta `withTenant(ctx, tx)` di seluruh route terotorisasi.
- **Fase 4 (F-08):** `ConfirmDialog` menggantikan seluruh 7 `confirm()` native; `LockProvider` memakai debounce `blur` 300ms + `beginExternalPicker()`; `src/lib/draft-store.ts` menyimpan keranjang POS di memori modul.
- **Fase 5 (F-17):** Receipt & Activity Export Center penuh (`src/server/routes/exports.ts`, `src/lib/export-render.ts`, `src/components/export-modal.tsx`, `src/app/(app)/reports/export/page.tsx`) dengan snapshot `REPEATABLE READ`, template editor berversi, PDF/JPG/PNG/XLSX/CSV, riwayat & unduh ulang, serta cek kode verifikasi. Tanpa Print/JSON/ZIP.
- **Fase 6 (F-11):** `StorageAdapter` `pg-bytea` (`src/server/storage.ts`, `src/server/routes/files.ts`, `src/components/attachments.tsx`) dengan batas 3 MB, validasi magic bytes, dan UI Dokumen Klien.
- **Fase 7 (F-13, F-14):** Modul P2 (`src/server/routes/p2.ts` + `src/components/import-center.tsx`): Quotation, Sales Order, Stock Transfer/Opname, PR/Supplier Return, HR Leave/Shift/Payroll, Task Comments, Bank Reconciliation, Credit Notes, CSV Import/Rollback, Privacy DSR. FIFO & BOM didokumentasikan ditunda.
- **Fase 8 (F-12 dispatcher, F-07 Android):** `functions/job-dispatcher/index.ts` diperbarui dengan validasi header trigger, producer job, dan unit test; `capacitor.config.ts` & `docs/deployment/ANDROID_BUILD.md` selesai.
- **Fase 9 (F-15, F-16):** `openapi.yaml`, `THREAT_MODEL.md`, `DEPENDENCY_AUDIT.md`, `FINANCIAL_INTEGRITY.md`, `DESIGN_SYSTEM.md`, `MANUAL_DEPLOYMENT_GUIDE.md`, dan suite Playwright + `@axe-core/playwright` (`tests/e2e/app.spec.ts`) selesai.
- **Fase 10 (Laporan Akhir & Paket):** `FINAL_REPORT.md`, `ACCEPTANCE_MATRIX.md`, `BUG_REGISTER.md` diperbarui jujur.

## NEXT STEP (Untuk Pemilik Proyek)
1. Ekstrak ZIP hasil akhir, buka terminal di folder proyek, lalu jalankan `npm install` (dengan Node `>=20.19`).
2. Jalankan `npm run verify` untuk memverifikasi `typecheck`, `lint`, unit test, `build` tanpa DB, dan `npm audit --omit=dev`.
3. Isi `DATABASE_URL` (Neon Singapore `aws-ap-southeast-1` pooled), jalankan `npm run db:migrate && npm run db:check`, lalu jalankan `npm run test:integration`, `npm run smoke`, dan `npm run test:e2e`.
