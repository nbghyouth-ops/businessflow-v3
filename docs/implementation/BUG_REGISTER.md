# BUG REGISTER (v3 — jujur, makna mengikuti PRD v3)

Status: `FIXED(bukti)` = direproduksi lalu diperbaiki dan diuji; `NOT REPRODUCED`; `PARTIAL`; `NOT TESTED` = belum diperiksa pada sesi ini (BUKAN berarti benar). Register lama dipindah ke `BUG_REGISTER_LEGACY_UNRELIABLE.md` (nomor BF dipetakan ulang ke makna lain dan semuanya "FIXED" tanpa bukti).
Bukti = nama pemeriksaan di `scripts/smoke-api.mjs` (SM), tes vitest (VT), atau berkas.

| ID | PRD v3 | Status | Bukti / catatan |
|---|---|---|---|
| BF-001 | Migrasi CLI melewatkan 004 | NOT REPRODUCED | `migrate.mjs` menerapkan 0000…009 berurutan dari DB kosong; idempoten 2× (dijalankan). |
| BF-002 | Baseline = satu tabel sentinel | NOT TESTED | verifier memeriksa daftar tabel + checksum (VT migration-and-schema); keputusan sentinel belum diaudit. |
| BF-003 | Migrasi dari jalur request/health | NOT TESTED | `ensureSchemaMigrated` masih diimpor `core.ts`; belum diaudit/dipisah. |
| BF-004 | Transfer stok tidak memindahkan stok | FIXED | Rute memakai kolom `cost_price` yang TIDAK ADA ⇒ 500. Diperbaiki + jalur tunggal + BigInt + kunci produk. SM: transfer 4 pcs, paralel 201/409, GL tak berubah. |
| BF-005 | Opname tanpa selisih/jurnal | FIXED | Juga `cost_price` ⇒ 500 dan dua jalur posting. Kini satu jalur, biaya rata-rata, jurnal selisih. SM opname (7 cek). |
| BF-006 | Waste tidak mengurangi ledger | FIXED | Ditulis ulang: stok dicek+dikunci, biaya dari server (cost klien diabaikan), jurnal. SM waste. |
| BF-007 | Work order tanpa konsumsi/output | FIXED (inti) | Bahan dikonsumsi pada biaya rata-rata, cek stok, hasil jadi bernilai, kerugian waste dijurnal. SM produksi (8). **Belum:** tenaga kerja/overhead tidak dikapitalisasi; versi resep/UOM. |
| BF-008 | Booking lunas tanpa pembayaran | NOT TESTED | |
| BF-009 | Payroll tidak dari absensi | FIXED (inti) | Server menghitung dari gaji pokok karyawan + absensi `alpa`; vektor VT payroll (6) + SM (15). **Belum:** shift, lembur, BPJS/pajak (tidak dikarang), pembayaran gaji ke kas. |
| BF-010 | Depresiasi tanpa jurnal/race | FIXED | SM depresiasi (13): vektor, jurnal seimbang, paralel 201/409, reversal, periode akhir menutup sisa. |
| BF-011 | Struk memakai pembayaran lama setelah reversal | NOT TESTED | |
| BF-012 | File = bytea, bukan Object Storage | NOT FIXED (keputusan) | `pg-bytea` tetap default sesuai aturan terkunci; adapter S3 (F-12) tidak dibangun. |
| BF-013 | Tidak ada durable export job | PARTIAL | Status kini `pending→completed/failed` dikonfirmasi klien, pratinjau tak masuk riwayat, pending>10 menit tampil gagal (SM ekspor, 10). Render tetap di klien; tidak ada antrean/artefak server. |
| BF-014 | Migrasi menelan error (EXCEPTION WHEN OTHERS) | NOT TESTED | 006–009 tidak memakainya kecuali unique-index payroll (NOTICE, disengaja). Migrasi lama belum diaudit. |
| BF-015 | Preflight role runtime | NOT TESTED | preflight memeriksa NOLOGIN/NOBYPASSRLS bf_app. |
| BF-016 | Gudang default tak sadar cabang | NOT TESTED | |
| BF-017 | Shift kasir bukan satu sumber | NOT TESTED | |
| BF-018 | formatMoney kehilangan presisi | NOT TESTED | |
| BF-019 | Kuantitas float | PARTIAL | Dibersihkan di transfer/opname/waste/WO/retur. Rute lain tidak diaudit. |
| BF-020 | Jalur uang lain memakai Number | NOT TESTED | |
| BF-021 | Jasa meminta gudang | NOT TESTED | |
| BF-022 | Retur supplier tanpa stok/hutang | FIXED | Juga unit_cost cents dimasukkan ke kolom desimal (100×). SM retur (11): stok, tagihan, GL, selisih harga. |
| BF-023 | State machine PR | NOT TESTED | |
| BF-024 | Import commit | NOT TESTED | |
| BF-025 | Payroll validasi relasi/jurnal | FIXED | employeeIds/adjustments divalidasi per workspace; jurnal; SM. |
| BF-026…BF-032 | Aset paralel, useful life default, komisi, cost of service, tiket operasional, valuasi historis, snapshot struk | NOT TESTED | BF-027: default 36 bulan masih ada di skema Zod aset. BF-031 (valuasi historis) tidak dikerjakan. |
| BF-033 | Struk A4/A5 selalu A5 | FIXED | VT receipt-page: A4 210×297, A5 148×210, `a4_a5` lama = A5. (Render gambar/PDF end-to-end di browser: NOT TESTED.) |
| BF-034 | Ringkasan aktivitas lengkap | NOT TESTED | |
| BF-035 | Export completed sebelum artefak | PARTIAL | lihat BF-013. |
| BF-036 | Resource POST abaikan Idempotency-Key | NOT TESTED | |
| BF-037 | Dua pola sumber kas | NOT TESTED | |
| BF-038 | Opsi ewallet di onboarding | NOT TESTED | |
| BF-039 | Tanpa lockfile | NOT REPRODUCED | `package-lock.json` ada; `npm ci --ignore-scripts` bersih. |
| BF-040 | `db` global di dalam transaksi tenant | NOT TESTED | Rute auth baru memakai `withAuthContext` terpisah (disengaja, bukan jalan pintas tenant). |
| BF-041 | Rate limit PIN paralel | PASS (lama) | SM brute-force PIN terkunci setelah 5 gagal; paralel penuh belum. |
| BF-042 | Tes RLS hanya SELECT | PARTIAL | VT auth-rls (7): SELECT/INSERT/DELETE ditolak sesuai grant, fail-closed tanpa konteks, inventaris RLS. Matriks CRUD seluruh tabel + role peniru Neon BELUM. |

## Temuan baru v3
| ID | Temuan | Status |
|---|---|---|
| NF-V3-01 | Checksum migrasi dihitung dari teks LF, berkas ZIP CRLF ⇒ `SCHEMA_DRIFT` palsu pada DB bersih | FIXED (hash dinormalisasi LF + `.gitattributes`; VT drift) |
| NF-V3-02 | Kolom `products.cost_price` tidak ada: transfer, opname, waste selalu 500 | FIXED |
| NF-V3-03 | Tes "drift" lama tidak menguji drift; 3 tes konkurensi tak pernah jalan (`template` vs `template_key`) | FIXED |
| NF-V3-04 | Opname punya dua jalur posting berbeda | FIXED (satu fungsi) |
| NF-V3-05 | 6 pasangan warna gagal WCAG (ink-2, muted, success, border input, KPI) | FIXED (`docs/design/CONTRAST.md`) |
| NF-V3-06 | Tombol tutup modal 36 px (<44 px) | FIXED |
| NF-V3-07 | Tanpa autentikasi akun | FIXED (Better Auth + guard; Google asli = BLOCKED) |
| NF-V3-08 | Rate limit login/callback lintas instance belum ada | OPEN (P1) |
| NF-V3-09 | Android: login Google tidak bisa lewat WebView; plugin Credential Manager belum dipasang | OPEN (BLOCKED, lihat ANDROID_GOOGLE_LOGIN.md) |
