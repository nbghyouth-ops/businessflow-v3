# UAT manual (dijalankan pemilik; semua butir awal berstatus NOT TESTED)

Perangkat: Chrome & Edge & Firefox desktop; Safari iOS; Chrome Android. Catat hasil: PASS/FAIL + tangkapan layar.

## A. Login Google (butuh domain produksi + OAuth client)
| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| A1 | Buka `/api/health` | `{"ok":true}` |
| A2 | Buka `/` tanpa login | diarahkan ke `/sign-in` |
| A3 | Klik "Masuk dengan Google" | layar persetujuan Google (nama aplikasi, scope email+profil) → kembali ke aplikasi |
| A4 | Tolak/batalkan di layar Google | kembali ke `/sign-in` dengan pesan "dibatalkan atau ditolak" |
| A5 | Login pertama | wizard onboarding; setelah selesai Anda owner |
| A6 | Refresh, tutup-buka tab | sesi bertahan; PIN diminta saat buka/refresh |
| A7 | Menu avatar → Keluar | kembali ke `/sign-in`; tombol Back tidak membuka data |
| A8 | Login akun Google lain (bukan anggota) | tidak dapat melihat data workspace Anda |
## B. Anggota & undangan
B1 Owner: Akun & keamanan → Undang anggota (Staf) → salin tautan. B2 Buka tautan di browser/profil lain, login akun Google berbeda → terima → muncul di daftar. B3 Pakai tautan yang sama lagi → ditolak. B4 Ubah peran jadi Viewer → akses berkurang. B5 "Hapus akses" → akun itu tidak bisa membuka data walau perangkatnya sama.
## C. Sesi
C1 Daftar sesi menampilkan browser ini "(ini)". C2 Cabut sesi lain → di browser itu halaman berikutnya meminta login. C3 "Cabut semua" tanpa login ulang → pesan perlu masuk ulang.
## D. Workspace lama
D1 Buka workspace lama (tanpa Google) → tetap berjalan dengan PIN. D2 Akun & keamanan → Masuk dengan Google → "Klaim sebagai owner". D3 Setelah klaim, akses tanpa Google ditolak.
## E. Perhitungan
E1 HR → Payroll → Hitung (periode ada karyawan bergaji + absensi "alpa") → angka sesuai hitungan manual → Posting → Keuangan → Jurnal seimbang. E2 Aset → penyusutan bulanan → jurnal; ulangi periode sama → ditolak. E3 Inventori: opname dengan selisih → stok & jurnal berubah. E4 Struk A4 vs A5 → ukuran PDF berbeda (210 vs 148 mm). E5 Ekspor → riwayat berstatus "completed"; matikan jaringan saat unduh → "failed".
## F. Responsif (wajib manual; belum pernah diuji otomatis)
Tiap halaman utama di lebar 320/360/390/768/1280: tanpa scroll horizontal halaman, tombol ≥44 px, modal tidak terpotong, drawer bisa ditutup dengan Esc/ketuk luar, keyboard numerik tidak menutup tombol simpan, zoom 200% terbaca.
## G. Aksesibilitas & animasi
Tab melalui `/sign-in` dan dialog; fokus terlihat; pembaca layar mengumumkan error login. Aktifkan "Kurangi gerakan" di OS → animasi mati.
