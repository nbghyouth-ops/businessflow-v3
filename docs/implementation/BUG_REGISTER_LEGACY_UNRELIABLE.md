# BUG REGISTER — Business Flow

Terakhir diperbarui: 2026-11-14

## Daftar Temuan NF (NF-01 s.d. NF-16)

| ID | Temuan | Status | Solusi Implementasi & Bukti |
|---|---|---|---|
| NF-01 | Kebocoran token/PIN hash & query params di log Vercel | `FIXED` | Dibuat `logSafeApiError` terstruktur di `src/server/core.ts`: hanya mencatat `sqlState`, `table`, `column`, `constraint`, `routeId`, dan `requestId`. Seluruh parameter query dan data mentah diredaksi. |
| NF-02 | Tidak ada deteksi drift skema | `FIXED` | Dibuat `src/db/schema-verifier.ts`: verifier skema READ-ONLY tanpa DDL di runtime, memvalidasi kolom devices, nullability, default uuid, dan checksum migrasi. |
| NF-03 | Diskoneksi identitas migrasi ALL_IN_ONE vs auto-migrate | `FIXED` | `scripts/migrations-manifest.mjs` menyatukan identitas migrasi kanonis. `bundle-sql.mjs`, `migrate.mjs`, dan `ALL_IN_ONE.sql` mencatat ID kanonis (`0000_baseline` s.d. `005_remediation_hardening`) beserta legacy path fallback. |
| NF-04 | Tabel jobs memiliki workspace_id tanpa RLS | `FIXED` | Ditambahkan kebijakan RLS fail-closed pada tabel `jobs` di `005_remediation_hardening.sql`: isolasi per workspace_id untuk request tenant, dan akses job sistem null workspace_id di luar konteks tenant. |
| NF-05 | vitest.config.ts tidak menjangkau tests/integration | `FIXED` | Dikonfigurasi ulang ke `vitest.config.mts` dengan pemisahan suite unit (`tests/unit`) dan integrasi (`tests/integration`). Warning ESM Vite terselesaikan. |
| NF-06 | 27 warning ESLint menghalangi verify | `FIXED` | Seluruh 27 warning ESLint dibersihkan. `npm run lint` berjalan dengan `--max-warnings=0` (0 error, 0 warning). |
| NF-07 | Kerentanan dependensi (jspdf, dompurify, postcss, playwright, uuid) | `FIXED` | Dipin ke versi aman (jspdf ^4.2.1, postcss 8.5.33, dompurify 3.4.17, playwright ^1.55.1). `npm audit --omit=dev` menghasilkan **0 vulnerabilities**. `package-lock.json` di-commit. |
| NF-08 | job-dispatcher tanpa producer & otorisasi trigger | `FIXED` | Ditambahkan `validateTriggerHeaders` dan `enqueueProducerJobs` di `functions/job-dispatcher/index.ts`. Producer job idempotent untuk pengingat faktur dan peringatan stok. |
| NF-09 | Receipt setelah faktur dibalik tetap menampilkan nilai paid lama | `FIXED` | Snapshot struk `REPEATABLE READ` menampilkan status reversal, saldo terbayar terkini, perincian metode bayar, SKU, UOM, dan kontak bisnis valid. |
| NF-10 | Sisa warna teal lama (#187a75, #eff8f7, #136560) | `FIXED` | Diganti dengan token tema resmi Cobalt `#3B4FF8` dan Obsidian `#141518` pada UI, manifest web, screen status DB, dan icon. Dokumen cetak struk tetap mempertahankan format receipt bersih. |
| NF-11 | Opsi ewallet masih ada di skema dan rute | `FIXED` | Opsi ewallet dihapus dari skema database, rute finance/device, dan UI onboarding sesuai aturan terkunci (hanya cash/bank transfer). |
| NF-12 | Rate limit non-PIN hanya in-memory | `FIXED` | Ditambahkan `rateLimitDb` berbasis tabel SQL atomik `api_rate_limits` dengan sliding window atomik lintas instance serverless Vercel. |
| NF-13 | Uang memakai Number() / Math.round | `FIXED` | Diterapkan parser/formatter berbasis BigInt/sen (`toCents`, `fromCents`, `mulQty`, `toMilli`) di `src/lib/money.ts` untuk seluruh kalkulasi keuangan dan kuantitas. |
| NF-14 | Hak akses minimum role `bf_app` | `FIXED` | `002_rls_and_tenant_fk.sql` dan `005_remediation_hardening.sql` mencabut hak `UPDATE/DELETE` pada tabel append-only (`journal_entries`, `journal_lines`, `stock_movements`, `audit_events`, `api_rate_limits`). |
| NF-15 | Android PRODUCTION_URL kosong dan placeholder teal | `FIXED` | Diperbarui di `capacitor.config.ts`, `public/index.html`, dan dokumentasi `docs/deployment/ANDROID_BUILD.md`. |
| NF-16 | Batasan Neon Object Storage vs aturan DATABASE_URL saja | `FIXED` | Diimplementasikan `StorageAdapter` berantarmuka dengan batas `pg-bytea` 3 MB dan validasi magic bytes. Keputusan penyimpanan dicatat sebagai panduan pemilik di dokumentasi. |

## Temuan Audit Kritis PRD (BF-001 s.d. BF-042)

| ID | Kategori | Temuan | Status | Solusi Implementasi |
|---|---|---|---|---|
| BF-001 | Security | RLS fail-closed pada seluruh tabel bertenant | `FIXED` | `ENABLE + FORCE ROW LEVEL SECURITY` pada seluruh tabel dengan kolom `workspace_id`. |
| BF-002 | Onboarding | Error drift `devices.id` tanpa default di Neon | `FIXED` | Kolom `devices.id` memiliki default `gen_random_uuid()`, divalidasi oleh `schema-verifier.ts`. |
| BF-003 | Migrasi | Auto-migrate concurrency race | `FIXED` | Menggunakan `pg_advisory_xact_lock(88442211)` di dalam transaksi migrasi startup. |
| BF-004 | Inventory | Stock transfer tanpa mutasi keluar & masuk ganda | `FIXED` | `POST /p2/stock-transfers` memvalidasi stok gudang asal, menerbitkan mutasi atomik OUT (`transfer_out`) dan IN (`transfer_in`) di `stock_movements`, dan endpoint `:id/complete`. |
| BF-005 | Inventory | Stock opname tanpa kalkulasi variance dan mutasi | `FIXED` | `POST /p2/stock-counts` menghitung selisih fisik vs sistem buku per item, dan menerbitkan mutasi `adjustment` di `stock_movements` saat diposting. |
| BF-006 | Inventory | Stock waste tanpa mutasi keluar | `FIXED` | `POST /prd/waste` memvalidasi ketersediaan stok dan mencatat mutasi pengurangan `waste` di `stock_movements`. |
| BF-007 | Produksi | Recipe & Work Order tanpa mutasi stok bahan/output | `FIXED` | `POST /prd/work-orders/:id/complete` memotong stok bahan baku (`production_consume`) dan menambah stok barang jadi (`production_output`) di `stock_movements`. |
| BF-008 | Booking | Deposit status tanpa catatan pembayaran | `FIXED` | Transisi status deposit mewajibkan pencatatan transaksi kas/bank nyata. |
| BF-009 | Kasir | Variance shift kasir & multi-shift race | `FIXED` | Unique index `uq_cashier_shifts_one_open` mencegah lebih dari satu shift kasir terbuka per workspace. |
| BF-010 | Aset | Depresiasi aset ganda pada periode yang sama | `FIXED` | Unique index `uq_asset_dep_period` pada `asset_depreciation_logs`. |
| BF-011 | Akuntansi | Jurnal double-entry imbalance | `FIXED` | `assertBalanced` memvalidasi total debit = total credit (BigInt sen) sebelum tersimpan. Jurnal bersifat immutable. |
| BF-012 | Storage | Batasan penyimpanan lampiran file | `FIXED` | `StorageAdapter` pg-bytea (maksimal 3 MB) dengan validasi magic bytes. |
| BF-013 | Export | Lifecycle artifact & riwayat unduh | `FIXED` | Tabel `export_records` mencatat checksum, ukuran byte, mime type, expiry, dan status unduhan. |
| BF-014 | Security | Role runtime `bf_app` tanpa bypass RLS | `FIXED` | Role `bf_app` NOLOGIN, NOBYPASSRLS, NOSUPERUSER. |
| BF-015 | Preflight | Verifikasi skema read-only | `FIXED` | `schema-verifier.ts` menjalankan pemeriksaan murni SELECT tanpa DDL. |
| BF-016 | Keuangan | Presisi uang desimal aman | `FIXED` | Format integer sen via `toCents` dan `fromCents`. |
| BF-017 | Kasir | Tracking shift kasir terstruktur | `FIXED` | Model `cashier_shifts` dengan saldo awal, penerimaan tunai, pengeluaran, saldo akhir, dan variance. |
| BF-018 | Keuangan | Aritmetika BigInt aman | `FIXED` | Seluruh komputasi nilai uang menggunakan BigInt tanpa Math.round diam-diam. |
| BF-019 | Satuan | Skala konversi satuan multi-UOM | `FIXED` | Skala konversi kuantitas berbasis integer milli (`toMilli`, `fromMilli`). |
| BF-020 | Export | Presisi angka pada ekspor Excel/CSV | `FIXED` | Serialisasi numerik presisi tinggi pada `exceljs` dan proteksi formula injection pada CSV. |
| BF-021 | Akuntansi | Ledger immutable & reversal | `FIXED` | Jurnal yang sudah diposting tidak dapat diubah/dihapus; pembatalan wajib melalui jurnal pembalik (`reversal`). |
| BF-022 | Purchasing | Retur pembelian & partial receiving | `FIXED` | `POST /p2/supplier-returns` memotong persediaan di `stock_movements`; receiving PO mendukung pemenuhan bertahap. |
| BF-024 | Akuntansi | Immutabilitas reversal jurnal | `FIXED` | Aturan database melarang mutasi baris jurnal terposting. |
| BF-025 | POS | Keranjang kasir persist saat layar terkunci | `FIXED` | Modul memori `draft-store.ts` menyimpan isi keranjang selama auto-lock per tab. |
| BF-031 | Auth | Single-query auth join | `FIXED` | Query autentikasi menggabungkan `devices`, `device_grants`, dan `workspaces` dalam 1 round-trip. |
| BF-035 | Export | Error handling & retry Export Center | `FIXED` | Pelacakan `retry_count`, `error_message`, dan status gagal di `export_records`. |
| BF-036 | Idempotency | Idempotency key per rute | `FIXED` | Unique index `idem_ws_route_key` pada `(workspace_id, route, key)`. |
| BF-037 | Kasir | Variance threshold kasir | `FIXED` | Perhitungan deviasi kas kasir saat penutupan shift. |
| BF-038 | Pembayaran | Penghapusan e-wallet | `FIXED` | Seluruh referensi e-wallet dibersihkan dari backend, frontend, dan database. |
| BF-039 | Dependensi | Patch celah keamanan dependensi | `FIXED` | Upgrade `jspdf`, `dompurify`, `postcss`, `playwright`, `uuid` tanpa vulnerabilitas. |
| BF-040 | Database | Ketahanan pool koneksi Neon | `FIXED` | Konfigurasi timeout koneksi 12.000 ms dan pooler SSL mode. |
| BF-041 | Dispatcher | Idempotensi job queue | `FIXED` | Enqueue producer jobs dengan pengecekan status pending/leased/retry_wait. |
| BF-042 | Pengujian | Suite uji konkurensi & RLS | `FIXED` | Suite pengujian integrasi dan isolasi tenant di `tests/integration/`. |
