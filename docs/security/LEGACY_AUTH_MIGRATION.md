# Migrasi workspace lama (device-only) ke akun Google

Workspace yang dibuat sebelum v3 tidak punya baris di `workspace_members`. Selama belum diklaim, workspace tetap berjalan device-only (PIN) agar data tidak terkunci. Workspace baru selalu berbasis akun.

## Klaim (`POST /api/v1/workspace/claim`)
Syarat bukti kepemilikan, semuanya wajib (diuji di `scripts/smoke-api.mjs`):
1. sesi Google valid (user aktif, email terverifikasi);
2. perangkat memiliki grant **owner** aktif ke workspace;
3. PIN perangkat sedang terbuka (tab session);
4. workspace belum punya anggota aktif (dikunci `FOR UPDATE`; unique index satu-owner sebagai pagar kedua).
Hasil: user menjadi owner dalam satu transaksi, perangkat ditautkan ke user, peristiwa `workspace.claim` dicatat. Klaim ganda ditolak (409). Setelah diklaim, semua akses wajib sesi Google + membership.

## Tidak ada
Klaim massal, klaim otomatis, klaim via kecocokan email.

## Risiko yang diketahui
Selama belum diklaim, workspace lama hanya terlindungi PIN perangkat (kondisi sama seperti sebelum v3). Pemilik disarankan segera mengklaim. UI klaim (tombol di `/settings/security`) belum dibangun — API sudah siap dan teruji.
