# Panduan Build Android (Capacitor) — Business Flow

Aplikasi Android Business Flow membungkus aplikasi web produksi yang sudah ter-deploy di Vercel agar berjalan mulus di perangkat Android (dengan Auto PIN Lock saat aplikasi masuk background).

## Prasyarat di Komputer Pemilik
1. Node.js 20.19+ dan `npm install` sudah selesai.
2. Android Studio (termasuk Android SDK & JDK 17+) sudah terpasang.
3. Aplikasi web sudah ter-deploy ke Vercel dengan HTTPS (mis. `https://business-flow-anda.vercel.app`).

## Langkah Build
1. Tambahkan platform Android (sekali saja):
   ```bash
   npx cap add android
   ```
2. Atur URL server produksi dengan **salah satu** cara:
   - Edit `PRODUCTION_URL` di `capacitor.config.ts`, **atau**
   - Jalankan perintah sync dengan ENV waktu build:
     ```bash
     CAP_SERVER_URL=https://business-flow-anda.vercel.app npx cap sync android
     ```
   *(Catatan: Jika `PRODUCTION_URL` dan `CAP_SERVER_URL` keduanya kosong, aplikasi menampilkan pesan jelas "URL server belum diatur" dari `public/index.html`.)*
3. Buka proyek di Android Studio:
   ```bash
   npx cap open android
   ```
4. Untuk rilis (APK / AAB bertanda tangan):
   - Di Android Studio: **Build → Generate Signed Bundle / APK** → pilih **Android App Bundle (AAB)** atau **APK**.
   - Buat/pilih keystore Anda, simpan kata sandi keystore di tempat aman (jangan di-commit ke Git).
   - Pilih varian `release`, lalu bangun.

## Status Verifikasi
- Di sandbox VM: build APK dan `npx cap add android` berstatus `BLOCKED` karena tidak ada Android SDK dan tidak ada akses internet untuk mengunduh paket Capacitor.
