# Peta redesain (JUJUR: yang dikerjakan vs belum)

Tema dikunci: obsidian sidebar, kanvas inset terang, cobalt, KPI pastel (tanpa teal).

## Dikerjakan pada sesi ini
| Bagian | Sebelum | Sesudah |
|---|---|---|
| Masuk | tidak ada (PIN per perangkat) | `/sign-in` terbelah (panel obsidian + kartu), tombol Google resmi inline SVG, state: normal, redirect/loading (cegah double-submit), dibatalkan, error, belum dikonfigurasi, sesi berakhir; `aria-live` |
| Topbar | chip perangkat + Kunci | + menu akun (avatar Google/inisial, email terverifikasi, workspace, keamanan, keluar); target sentuh 44 px; bayangan saat scroll |
| Akun & Keamanan | tidak ada | `/settings/security`: akun, sesi (cabut), anggota (peran/hapus), undangan (tautan sekali pakai), klaim workspace lama |
| Undangan | tidak ada | `/invite` (token di fragmen URL, tidak disimpan) |
| Payroll | form isian gaji manual | hitung otomatis dari karyawan+absensi; posting; balik; |
| Retur supplier | isian total manual | pilih PO+produk+jumlah; nilai dihitung server |
| Waste | isian "nilai biaya" | nilai otomatis |
| Token warna | 6 pasangan gagal WCAG | diperbaiki (CONTRAST.md) |
| Animasi | 5 baris | sistem token + pola (MOTION_SPEC.md) |
## BELUM didesain ulang (tidak diklaim)
Dashboard, Keuangan, POS/Sales, Produk/Inventori, Purchasing, CRM, HR (selain payroll), Tugas, Booking, Operasi, Marketing, Proyek, Aset, Laporan, Template, onboarding 17 langkah (tanpa langkah "tinjau profil/terima undangan/PIN"), workspace selector. Semuanya masih tata letak lama (fungsional, tema sama).
