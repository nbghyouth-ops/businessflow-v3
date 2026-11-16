# Panduan Deploy Pemilik — Business Flow

## ENV yang diizinkan (jangan tambah)
DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; opsional GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID; CAP_SERVER_URL (build Android).

## Langkah
1. Buat database PostgreSQL (Neon, region Singapore). Salin connection string pooled ke DATABASE_URL.
2. Jalankan migrasi: `npm run db:migrate` (atau gunakan migrasi otomatis saat runtime). Verifikasi: `npm run db:check`.
3. Buat OAuth Client Web di Google Cloud: redirect URI persis `https://<domain>/api/auth/callback/google`.
4. Isi ENV di Vercel (region sin1). Jangan commit .env.
5. Deploy. Buka `https://<domain>/api/health` → harus 200 OK.
6. Uji login Google nyata, lalu PIN perangkat.
7. Uji dari ponsel.

## Bila Google/DB bermasalah
- Aplikasi menampilkan layar status ramah (ServiceStatusScreen) dan tombol Coba lagi.
- Mode Perangkat tersedia bila Google belum dikonfigurasi dan instance belum punya workspace.
- Masuk Darurat tersedia bagi perangkat terdaftar bila kegagalan infrastruktur Google berulang atau diaktifkan pemilik.
- Status Sistem: /settings/system-status.

## Backup/restore & rollback
- Backup DB via Neon. Restore dengan connection string baru, lalu migrasi.
- Rollback: deploy commit sebelumnya; migrasi tidak destruktif.

## Catatan
- Vercel Hobby = nonkomersial. UU PDP/PSE dan transfer data lintas negara tanggung jawab pemilik.
