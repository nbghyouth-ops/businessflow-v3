# Matriks responsif

**Status verifikasi visual: NOT TESTED** (tidak ada browser di lingkungan penyusun). Yang ada: tinjauan kode + uji jsdom untuk komponen baru. Jangan dianggap "responsif terverifikasi".

| Area | 320–479 | 480–767 | 768–1023 | ≥1024 | Dasar | Status |
|---|---|---|---|---|---|---|
| `/sign-in` | satu kolom, kartu `max-w-md`, safe-area atas | sama | sama | dua kolom (panel obsidian + kartu) | kode + axe jsdom | NOT TESTED visual |
| `/invite` | satu kolom | sama | sama | sama | kode | NOT TESTED |
| Shell | drawer (☰ 44 px), topbar membungkus | sama | drawer | sidebar tetap | kode shell.tsx | NOT TESTED |
| Menu akun | dropdown `min(20rem, 100vw-2rem)` | sama | sama | sama | kode | NOT TESTED |
| Modal | sheet bawah, `max-h-[90dvh]`, safe-area, tutup 44 px | sama | tengah | tengah | kode + jsdom | jsdom PASS (fokus/Esc/axe) |
| Tabel (`.table-wrap`) | scroll horizontal terkandung | sama | sama | penuh | CSS | NOT TESTED |
| `/settings/security` | kartu satu kolom, tabel scroll | sama | sama | sama | kode | NOT TESTED |
## Belum dikerjakan
Tata letak khusus mobile untuk POS (langkah demi langkah), booking (tanggal→sumber daya→slot), mode kartu pada DataTable, sidebar ciut 1024–1279. Lihat ROADMAP_LANJUTAN.
## Cara memverifikasi
`npx playwright install && BASE_URL=... npx playwright test` (cek overflow horizontal, axe serious/critical, reduced-motion, screenshot 10 viewport) + `docs/UAT_MANUAL.md`.
