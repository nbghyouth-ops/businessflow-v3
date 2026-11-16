# ACCEPTANCE MATRIX — Business Flow

| ID | Fitur / Perbaikan | Implementasi Kode/SQL | Status Verifikasi di Sandbox |
|---|---|---|---|
| F-01 | Lazy DB init & friendly status screen | Selesai (`src/db/index.ts`, `DbStatusScreen`) | `BLOCKED` (perlu `npm run build` di mesin ber-`node_modules`) |
| F-02 | Patch Next 16.4.6 & devDependencies | Selesai (`package.json`) | `BLOCKED` (perlu `npm install && npm audit --omit=dev`) |
| F-03 | Perbaikan 8 lint `set-state-in-effect` | Selesai (`settings`, `quick-tx`, `shell`, `client.ts`) | `BLOCKED` (perlu `npm run lint`) |
| F-04 | Kelengkapan repo (`.gitignore`, `README`, `public/*`) | Selesai | `PASS` (berkas ada & tervalidasi) |
| F-05 | `migrate.mjs`, `bundle-sql.mjs`, `preflight.mjs` | Selesai (`ALL_IN_ONE.sql` terbit) | `PASS` (bundle) / `BLOCKED` (eksekusi DB) |
| F-06 | Pool resilience, single-query auth, `sin1`, `maxDuration=30` | Selesai | `BLOCKED` (perlu tes konkurensi DB) |
| F-07 | Capacitor config & `ANDROID_BUILD.md` | Selesai | `BLOCKED` (tidak ada Android SDK) |
| F-08 | `ConfirmDialog`, debounced `blur`, `draft-store.ts` | Selesai (0 `confirm()` native tersisa) | `PASS` (statis) / `NOT TESTED` (Playwright) |
| F-09 | RLS `bf_app` (`NOBYPASSRLS`), composite FK, `withTenant` | Selesai (`002_rls_and_tenant_fk.sql`) | `BLOCKED` (perlu PostgreSQL / Neon) |
| F-10 | `rateLimitDb` SQL atomik lintas instance | Selesai (`api_rate_limits`) | `BLOCKED` (perlu PostgreSQL) |
| F-11 | `StorageAdapter` `pg-bytea` + Dokumen Klien | Selesai (`storage.ts`, `files.ts`, `attachments.tsx`) | `BLOCKED` (perlu uji integrasi DB) |
| F-12 | Lazy notifications + upgraded `job-dispatcher` | Selesai | `BLOCKED` (perlu Vitest & DB) |
| F-13 | Modul P2 (Quotation, SO, Transfer/Opname, HR, DSR, CSV Import/Rollback) | Selesai (`p2.ts`, `import-center.tsx`; FIFO/BOM ditunda) | `BLOCKED` (perlu uji integrasi) |
| F-14 | 16 template bisnis & workflow | Selesai (`templates.ts`) | `PASS` (konfigurasi lengkap) |
| F-15 | OpenAPI & seluruh dokumen arsitektur/keamanan/deploy | Selesai | `PASS` |
| F-16 | Playwright & `@axe-core/playwright` suite | Selesai (`tests/e2e/app.spec.ts`) | `NOT TESTED` (tidak ada browser di sandbox) |
| F-17 | Receipt & Activity Export Center (PDF/JPG/PNG/XLSX/CSV) | Selesai (`exports.ts`, `export-render.ts`, `/reports/export`) | `BLOCKED` (perlu unit/E2E di mesin ber-`node_modules`) |
