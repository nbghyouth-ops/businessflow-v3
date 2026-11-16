# Panduan Deploy Pemilik

Lihat `PANDUAN_DEPLOY.md` untuk langkah ringkas. Dokumen ini adalah versi lengkap untuk pemilik proyek.

## 1. Neon (database)
- Buat project di region Singapore (sin1).
- Salin connection string **pooled** ke `DATABASE_URL`.
- Role aplikasi tidak perlu superuser; migrasi memakai role pemilik.

## 2. Migrasi
- Otomatis: saat request pertama ke `/api/health` pada DB kosong, aplikasi menjalankan migrasi (±0,4 dtk). Cocok untuk deploy pertama.
- Manual: `npm run db:migrate` lalu `npm run db:check` (harus PASS: 91 tabel, 75 RLS).
- Migrasi idempoten dan tidak destruktif; aman dijalankan dua kali.

## 3. Google Cloud OAuth
- Buat OAuth consent screen (External, production).
- Buat Web client; Authorized redirect URI persis: `https://<domain>/api/auth/callback/google`.
- Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di Vercel.
- Catatan: preview Vercel (`*.vercel.app`) tidak bisa login Google kecuali ditambahkan redirect URI-nya.

## 4. ENV di Vercel (region sin1)
Hanya: DATABASE_URL, BETTER_AUTH_SECRET (≥32 karakter), BETTER_AUTH_URL (https domain), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Opsional: GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, CAP_SERVER_URL (build Android).

## 5. Deploy
- Push ke Git → Vercel build. Build tanpa ENV harus lulus (sudah diuji).
- Buka `https://<domain>/api/health` → 200 OK dengan checks database ok, schema ok.

## 6. Uji nyata
- Login Google → PIN perangkat → Dashboard.
- Uji dari ponsel (Chrome Android / Safari iOS).

## 7. Fallback bila Google/DB bermasalah
- Layar status ramah + tombol Coba lagi (backoff).
- Mode Perangkat (Google belum dikonfigurasi + instance kosong).
- Masuk Darurat (perangkat terdaftar + PIN + trigger).
- Status Sistem: `/settings/system-status`.

## 8. Android (opsional)
- `npx cap sync android`, build APK di mesin dengan Android SDK (BLOCKED bila SDK tidak ada).

## 9. Backup / restore / rollback
- Backup DB via Neon (otomatis harian). Restore: buat DB baru, set DATABASE_URL, jalankan migrasi, impor data.
- Rollback: deploy commit sebelumnya; migrasi tidak destruktif.

## 10. Catatan hukum
- Vercel Hobby = nonkomersial. Kepatuhan UU PDP/PSE dan transfer data lintas negara tanggung jawab pemilik.
