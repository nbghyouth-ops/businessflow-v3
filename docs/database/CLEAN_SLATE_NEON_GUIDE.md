# Panduan Memulai dari Neon Branch / Database Kosong (Clean Slate)

Jika project Neon Anda mengalami ketidaksinkronan skema (*schema drift*, misalnya error `Failed query: insert into devices (...)` saat onboarding) dan **belum memiliki data produksi nyata yang perlu diselamatkan**, jalur paling bersih dan aman adalah membuat branch atau database baru yang kosong di Neon.

> **PERINGATAN PENTING:** Jangan pernah menghapus database atau branch lama sebelum Anda memastikan 100% tidak ada data transaksi nyata di dalamnya (atau Anda sudah mengekspor/backup data yang dibutuhkan).

## Langkah-langkah (Neon Console + Vercel)

1. **Periksa kondisi database lama terlebih dahulu (opsional, read-only):**
   - Buka **Neon Console → SQL Editor**.
   - Tempel dan jalankan seluruh isi `docs/database/DIAGNOSTIC_READONLY.sql`.
   - Jika `devices.id` tidak memiliki `DEFAULT gen_random_uuid()` atau `schema_migrations` tidak lengkap, berarti skema memang drift.

2. **Buat database atau branch baru yang kosong di Neon:**
   - Di Neon Console (region Singapura `aws-ap-southeast-1` agar sepadan dengan Vercel `sin1`), buat **Database baru** (misalnya `business_flow_clean`) atau **Branch baru** dari root kosong.
   - Salin **Pooled Connection String** (`-pooler` di hostname).

3. **Terapkan skema kanonis (pilih salah satu):**
   - **Jalur A (Neon SQL Editor — paling mudah):** Buka Neon SQL Editor pada database baru, tempel seluruh isi file `drizzle/ALL_IN_ONE.sql`, lalu klik **Run**.
   - **Jalur B (CLI lokal):** Set `DATABASE_URL` ke connection string database baru di `.env`, lalu jalankan:
     ```bash
     npm run db:migrate
     npm run db:check
     ```
   - Kedua jalur menggunakan daftar migrasi kanonis, ID (`0000_baseline`..`005_remediation_hardening`), dan checksum SHA-256 yang **identik**.

4. **Perbarui `DATABASE_URL` di Vercel:**
   - Buka **Vercel Project → Settings → Environment Variables**.
   - Ubah nilai `DATABASE_URL` menjadi connection string database baru yang sudah dimigrasi.
   - Lakukan **Redeploy** pada Vercel.

5. **Verifikasi:**
   - Buka `/api/health` di browser — harus mengembalikan `{"ok":true}`.
   - Buka halaman utama dan selesaikan onboarding draft + PIN.
