# Acceptance Matrix — Business Flow

| Area | Kriteria | Status | Catatan |
| :--- | :--- | :--- | :--- |
| ENV & Deployment | Hanya `DATABASE_URL` wajib di Vercel | Terpenuhi (Statis) | Tidak ada `AUTH_SECRET`, `CRON_SECRET`, `DIRECT_URL`, atau S3 key |
| Auto-Migration | `ensureSchemaMigrated()` otomatis saat boot pertama | Terpenuhi (Statis) | Advisory lock `88442211`, RLS `bf_app` (`NOBYPASSRLS`) |
| Onboarding & PIN | Bisnis → Device Cookie → PIN 4–6 digit + Ubah PIN + Auto-Lock | Terpenuhi (Statis) | Tanpa login email/OAuth/OTP; draf POS tersimpan di `draft-store.ts` |
| UI Tema Baru | Dark Sidebar `#141518`, Inset `#F4F6F9`, Cobalt `#3B4FF8`, 4 Pastel KPI | Terpenuhi (Statis) | `globals.css`, `ui.tsx`, `shell.tsx`, `charts.tsx`, `dashboard/page.tsx` |
| Dashboard Keuangan | Tab Ringkasan & Dashboard Keuangan (per akun + aksi cepat + anggaran) | Terpenuhi (Statis) | Terhubung ke `/dashboard`, `/finance/cash-accounts`, `/finance/transactions` |
| Export & Activity Center | Struk (PDF/JPG/PNG) & Activity Summary (PDF/JPG/PNG/XLSX/CSV) | Terpenuhi (Statis) | Tanpa Print, tanpa JSON, tanpa ZIP; tombol Unduh Struk di Faktur & POS |
| Modul P2 UI | Quotation, SO, Transfer Gudang, Opname, PR, Retur, Cuti, Shift, Payroll, Komentar Tugas, Rekonsiliasi, Credit Note, DSR | Terpenuhi (Statis) | Terhubung ke `/api/v1/p2/*` via `sales/page.tsx` & `p2-panels.tsx` |
| Runtime Build & E2E | `npm run build`, `tsc`, `eslint`, Playwright, Postgres live | Belum Dijalankan (Offline VM) | Sandbox VM tidak memiliki akses internet / PostgreSQL / `node_modules` terpasang |
