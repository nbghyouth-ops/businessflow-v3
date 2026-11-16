# Bukti uji (dijalankan di clone bersih dari `git archive`, commit `3b7668f`, Node 22.23.4, npm 10.9.9, PostgreSQL 16 lokal)

| Gate | Perintah | Hasil |
|---|---|---|
| Install | `npm ci --ignore-scripts` | PASS |
| Tipe | `npx tsc --noEmit` | PASS |
| Lint | `npx eslint . --max-warnings=0` | PASS (0 warning) |
| Unit + UI (tanpa DB) | `vitest run tests/unit tests/ui` | PASS — 44 tes |
| Seluruh vitest (DB lokal) | `vitest run tests` | PASS — 12 berkas, 72 tes (integrasi: auth-flow 14, auth-rls 7, migrasi/drift 3, konkurensi 3, rls 1) |
| Build tanpa ENV | `env -i … npm run build` | PASS |
| Migrasi | `node scripts/migrate.mjs` ×2 pada DB kosong | PASS, idempoten (0000…010) |
| Preflight | `node scripts/preflight.mjs` | PASS — 75 tabel bertenant ENABLE+FORCE RLS; bf_app NOLOGIN/NOBYPASSRLS |
| Server + smoke | `next start` + `scripts/smoke-api.mjs` | PASS — 172/172 (68 lama + 104 baru) |
| Health | `GET /api/health` | `{"ok":true}` dengan 5 ENV uji; `DATABASE_URL_MISSING` / `AUTH_NOT_CONFIGURED` tanpa ENV (diuji) |
| Audit | `npm audit --omit=dev` | 0 high/critical; 4 moderate (esbuild via peer `drizzle-kit`, alat dev) |
| Secret/harness | grep `.next/server|static` untuk `GOCSPX`, `mock-oidc` | bersih |
| Vercel Cron | grep `vercel.json` | tidak ada |
| `NEXT_PUBLIC_*` | grep `src` | tidak ada |
| Capacitor | `CAP_SERVER_URL=… npx cap sync android` | PASS (APK tidak dibangun) |

## Tidak dapat/tidak dijalankan
| Item | Status | Alasan |
|---|---|---|
| Login Google asli | BLOCKED | butuh Google Cloud & domain milik pemilik |
| Neon, Vercel asli | BLOCKED | |
| Playwright (overflow, axe, screenshot, reduced-motion), Lighthouse, WebKit/Firefox | NOT TESTED | unduhan browser diblokir; spec tertulis di `tests/e2e/responsive-a11y.spec.ts` |
| Build Android/APK, login Android | BLOCKED | tanpa SDK; plugin belum dipasang |
| Build Turbopack | NOT TESTED | build memakai `--webpack` |
| RLS dengan role peniru Neon (BYPASSRLS non-superuser) | NOT TESTED | pengujian memakai superuser lokal + `SET ROLE bf_app` |
| Render PDF/PNG struk di browser | NOT TESTED | dimensi halaman diuji lewat jsPDF di node |
