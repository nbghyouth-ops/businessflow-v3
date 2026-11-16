# Matriks keterlacakan (ringkas; BUKAN klaim 157 fitur selesai)

| Area | Requirement | Implementasi | Bukti | Status |
|---|---|---|---|---|
| Auth | Google OAuth/OIDC nyata | `src/server/auth/*`, `/api/auth/[...all]` | VT auth-flow (13) | PASS (harness lokal); Google asli BLOCKED |
| Auth | Sesi DB, cabut seketika | tabel `session`, `getUserSession` | VT + SM | PASS |
| Auth | Workspace + membership + guard | `dispatch` (core.ts) | SM (guard, outsider, revoke) | PASS |
| Auth | Undangan, klaim workspace lama | `routes/account.ts` | SM (15) | PASS |
| Auth | Rate limit login terdistribusi | `factory.ts` consume atomik | VT | PASS |
| Auth | Android | — | — | BLOCKED |
| DB | RLS tabel baru + hak akses | 006–010 | VT auth-rls (7), preflight | PASS |
| DB | Migrasi idempoten + checksum | `migrate.mjs`, bundle | VT drift (3) | PASS |
| Keuangan | Depresiasi → jurnal | `prd.ts` | SM (13) | PASS |
| Keuangan | Payroll server-side | `p2.ts`, `payroll.ts` | VT (6) + SM (15) | PASS (inti) |
| Inventori | Opname/transfer/waste/retur/produksi | `p2.ts`, `prd.ts` | SM (≈40) | PASS (inti) |
| Export | Struk A4/A5; siklus hidup | `export-render.ts`, `exports.ts` | VT (5) + SM (10) | PASS (render browser NOT TESTED) |
| UI | Sign-in, menu akun, keamanan, undangan | komponen baru | VT UI (9) | PASS jsdom; visual NOT TESTED |
| UI | Responsif semua rute | — | spec Playwright | NOT TESTED |
| UI | Redesain 17 modul | — | — | NOT DONE (lihat REDESIGN_MAP) |
| Fitur | 157 fitur / 17 modul / 16 template | kode lama | `FEATURE_TRACEABILITY.md` lama | NOT AUDITED |
