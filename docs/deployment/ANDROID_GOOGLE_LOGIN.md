# Android — login Google

**Status: BLOCKED / belum dibangun.** `npx cap add android` + `npx cap sync android` sukses di lingkungan penyusun (`CAP_SERVER_URL=https://… npx cap sync android`), tetapi APK tidak dibangun (tanpa Android SDK) dan plugin login native belum dipasang.

## Mengapa web OAuth tidak cukup
Aplikasi Android ini memuat situs lewat WebView (`server.url`). Google menolak OAuth di WebView tertanam (`disallowed_useragent`). Maka Android WAJIB memakai Credential Manager (Sign in with Google native) dan mengirim **ID token** ke server.

## Rencana (belum diuji)
1. Google Cloud: buat OAuth client **Android** (package `id.businessflow.app`, SHA-1/SHA-256 debug+release). Pakai **Web client** yang sama sebagai `serverClientId` (audience token) — tidak perlu ENV baru; `GOOGLE_ANDROID_CLIENT_ID` hanya diperlukan bila plugin menuntut.
2. Pasang plugin Capacitor Credential Manager yang terpelihara (verifikasi repo/rilis/izin di web sebelum memilih; catat di `docs/development/TOOLING.md`).
3. Server: Better Auth mendukung `POST /api/auth/sign-in/social` dengan `idToken` untuk provider google (diverifikasi library terhadap audience Web client). Endpoint ini sudah terpasang oleh handler `/api/auth/[...all]`; **belum ada tes** karena butuh ID token Google asli.
4. Tidak ada client secret di APK. Cookie sesi diterima WebView dari respons server.
## Checklist uji (setelah SDK tersedia)
Debug build → login → sesi bertahan setelah kill app → logout → login akun non-anggota ditolak → PIN lock saat background.
