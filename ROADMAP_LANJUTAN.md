# Roadmap lanjutan (tidak diberi tombol sampai selesai benar)

## P0/P1 belum selesai
1. **Verifikasi visual responsif** semua rute (Playwright siap di `tests/e2e/responsive-a11y.spec.ts`, belum pernah dijalankan).
2. **Redesain per modul** (lihat `docs/design/REDESIGN_MAP.md` bagian "BELUM"): POS mobile langkah-demi-langkah, booking mobile, DataTable mode kartu, sidebar ciut, workspace selector, onboarding + langkah profil/undangan/PIN, draft onboarding terikat user lintas perangkat.
3. **Login Android** (Credential Manager) — `ANDROID_GOOGLE_LOGIN.md`.
4. **Audit BF yang NOT TESTED** (`BUG_REGISTER.md`): BF-002/003/008/011/014–018/020/021/023/024/026–032/034/036–038/040.
5. **RLS**: matriks CRUD seluruh tabel dengan role peniru Neon (LOGIN, BYPASSRLS, bukan superuser).
6. **Valuasi persediaan historis (BF-031)**; kapitalisasi tenaga kerja/overhead produksi; lembur/shift/BPJS pada payroll; pembayaran gaji ke kas.
7. **Export**: antrean job & artefak server (BF-013/035 baru PARTIAL), adapter Neon Object Storage (F-12).
8. **Transfer owner**, re-auth eksplisit untuk hapus workspace/ekspor sensitif.
9. **F-09/F-10**: traceability 157 fitur & 16 template workflow end-to-end belum diaudit satu per satu.
10. Turbopack build belum diuji (build memakai `--webpack`).
## P2
View Transitions API, count-up KPI, indikator tab bergeser, animasi chart; Lighthouse; WebKit/Firefox.
