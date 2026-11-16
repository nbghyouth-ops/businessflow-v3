# Design System — Business Flow

## 1. Tema Visual Utama
Mengacu pada desain referensi: **Dark Obsidian Sidebar + Inset Light Canvas + Cobalt Primary + 4 Pastel KPI Cards**.

### Palet Warna (`src/app/globals.css`)
- **Sidebar Gelap (`--color-sidebar`)**: `#141518` (hover `#22242A`)
- **Nav Pill Aktif**: `#FFFFFF` dengan teks `#141518` dan titik indikator `#3B4FF8`
- **Kanvas Terang Membulat (`--color-surface`)**: `#F4F6F9` (`rounded-[24px]` di desktop)
- **Kartu Putih**: `#FFFFFF`, border `#E5E7EB`, radius `20px`
- **Primary Cobalt**: `#3B4FF8` (grafik, fokus, badge), `#2A3BD4` (`primary-deep` untuk tombol dengan kontras WCAG AA >= 7:1)
- **4 Pastel KPI Cards**:
  - Lavender: `#E0E1FC` (badge `#434CE6`)
  - Mint: `#D1EEDC` (badge `#16A34A`)
  - Peach: `#FCE2D4` (badge `#EA580C`)
  - Butter: `#EFE9CC` (badge `#CA8A04`)

## 2. Komponen Inti (`src/components/ui.tsx`, `src/components/shell.tsx`, `src/components/charts.tsx`)
- **Shell**: Sidebar gelap kiri + kartu Mode Tampilan fungsional di bagian bawah (`Mode Sederhana` / `Mode Lanjutan`), Topbar dengan konteks Bisnis/Cabang/Perangkat (tanpa akun login), Pill Search Bar, Bell notifikasi, Bantuan `?`, dan tombol `Kunci`.
- **Tabs**: Pill tab bar (`rounded-2xl` container, tab aktif `bg-primary-deep text-white`).
- **Grafik**:
  - `DualBarChart`: Pill Vertical Bar Chart (`#3B4FF8` vs `#EAB308`) dengan batang *hatched gray* untuk periode bernilai nol.
  - `SplineAreaChart`: Kurva bezier halus dengan gradasi `#3B4FF8` dan garis `#16A34A`.
