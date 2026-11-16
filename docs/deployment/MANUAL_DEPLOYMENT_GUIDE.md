# Panduan Deploy Manual (Pemilik Proyek) — Business Flow

Ikuti langkah berurutan di bawah ini untuk menjalankan Business Flow di Neon PostgreSQL dan Vercel.

## 1. Siapkan Database di Neon
1. Buat akun / masuk ke Neon Console, lalu klik **New Project**.
2. Pilih region **Singapore (`aws-ap-southeast-1`)** agar latensi rendah dari Indonesia.
3. Di menu **Connect**, aktifkan **Connection pooling** (hostname berakhiran `-pooler`), lalu salin connection string `postgresql://...`.
   - *Cara cek:* URL harus memuat `-pooler` dan `sslmode=require`.

## 2. Jalankan Migrasi Skema & RLS
Pilih **salah satu** cara berikut:
- **Cara A (Terminal lokal):**
  1. Jalankan `npm install` lalu salin `.env.example` menjadi `.env` dan isi `DATABASE_URL`.
  2. Jalankan `npm run db:migrate`.
  3. Jalankan `npm run db:check` — pastikan muncul `[PASS] Preflight database OK.` (role `bf_app` dan RLS aktif).
- **Cara B (Neon SQL Editor tanpa terminal):**
  1. Buka **SQL Editor** di Neon Console.
  2. Salin seluruh isi file `drizzle/ALL_IN_ONE.sql` lalu klik **Run**.

## 3. Deploy ke Vercel
1. Import repository GitHub Anda ke Vercel.
2. Di **Environment Variables**, isi **HANYA SATU** variabel:
   - `DATABASE_URL` = connection string **pooled** Neon untuk **Production**, **Preview**, dan **Development** (disarankan Preview/Development memakai branch Neon terpisah).
3. Pastikan **tidak ada** Cron Job di `vercel.json` (region fungsi sudah disetel ke `sin1` Singapura).
4. Klik **Deploy**.

## 4. Verifikasi Pasca-Deploy
1. Buka `https://<domain-anda>/api/v1/health` → harus mengembalikan `{"ok":true}` (HTTP 200).
2. Buka halaman utama → jalankan alur **Onboarding** sampai masuk Dashboard.
3. Uji **PIN**: buka tab kedua atau refresh → layar PIN harus muncul.
4. Uji **Kasir & Struk**: buat 1 transaksi penjualan → klik **Unduh Struk** (PDF/PNG/JPG) → buka berkas dan pastikan angka cocok.
5. (Opsional, di branch non-production): jalankan `BASE_URL=https://<preview-url> npm run smoke`.

## 5. Opsional: Neon Function Scheduler (`*/5 * * * *`)
Aplikasi **berfungsi penuh tanpa scheduler** (notifikasi dihitung saat dibaca). Jika ingin mengaktifkan dispatcher di branch production, deploy `functions/job-dispatcher/index.ts` di Neon Functions dan pasang trigger cron `*/5 * * * *` (UTC).

## 6. Android (Opsional)
Lihat langkah lengkap di `docs/deployment/ANDROID_BUILD.md`.

## 7. Catatan Lisensi & Kepatuhan
- **Vercel Hobby** hanya untuk penggunaan uji/non-komersial. Untuk data klien nyata/komersial, gunakan plan atau hosting yang mengizinkan penggunaan komersial.
- Kajian kepatuhan UU PDP, pendaftaran PSE, dan transfer data lintas negara menjadi tanggung jawab pemilik bisnis.

## 8. Troubleshooting Cepat
| Gejala | Penyebab | Solusi |
|---|---|---|
| Health 503 `DATABASE_URL_MISSING` | ENV `DATABASE_URL` belum diisi | Isi `DATABASE_URL` di `.env` atau Vercel Environment Variables, lalu redeploy. |
| Health 503 `SCHEMA_NOT_MIGRATED` | Database masih kosong | Jalankan `npm run db:migrate` atau tempel `drizzle/ALL_IN_ONE.sql` di Neon SQL Editor. |
| Health 503 `CONNECTION_ERROR` | Project Neon terhapus/salah URL | Cek URL `-pooler` di Neon Console. |
| `PIN terkunci sementara` | 5× salah memasukkan PIN | Tunggu hitungan mundur selesai, atau gunakan tombol **Ubah PIN** jika diperlukan. |
| Build gagal di Vercel | Node versi lama / lockfile tidak sinkron | Pastikan Node >= 20.19 di Vercel Settings dan jalankan `npm install` untuk membuat `package-lock.json`. |
