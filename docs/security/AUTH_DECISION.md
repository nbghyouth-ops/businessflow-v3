# Keputusan Auth — Google Login

**Dipilih:** Better Auth 1.7.23 (dipin) + adapter Drizzle. Satu-satunya framework auth.

**Verifikasi kompatibilitas (dari `npm view better-auth@1.7.23 peerDependencies` dan uji nyata):** next ^16, react ^19, pg ^8, drizzle-orm ^0.45.2, drizzle-kit >=0.31.4 — semuanya cocok dengan next 16.4.6 / drizzle-orm 0.45.2 / pg 8 yang terpasang. Alur penuh lulus di `tests/integration/auth-flow.test.ts`.

**Alasan:** protokol OAuth/OIDC (state, PKCE S256, nonce, verifikasi id_token terhadap JWKS/aud/iss/exp) ditangani library, bukan kode kami; sesi berbasis database di Neon; tanpa password.

**Ditolak:** menulis OAuth/JWT sendiri; memasang Auth.js bersamaan (dua framework).

## Konfigurasi terkunci (`src/server/auth/factory.ts`)
- `emailAndPassword` nonaktif; hanya provider Google (produksi). Harness OIDC hanya di `tests/helpers` dan tidak ada di `.next/server|static` (diverifikasi dengan grep).
- `account.accountLinking.enabled=false`: email sama + `sub` berbeda ⇒ `account_not_linked` (diuji).
- Hook: user baru dengan `email_verified=false` ditolak; sesi tidak dibuat untuk user `disabled`.
- Cookie sesi HttpOnly, SameSite=Lax, `Secure` + prefix `__Secure-` bila `BETTER_AUTH_URL` https. Sesi 14 hari, disimpan di tabel `session`.
- Scope hanya `openid email profile`; tanpa `access_type=offline` (diverifikasi dari URL otorisasi).
- Callback: `${BETTER_AUTH_URL}/api/auth/callback/google`.

## Model otorisasi request (di `dispatch`, `src/server/core.ts`)
perangkat dikenal → (workspace berbasis akun?) sesi Google valid di DB → user `active` & email terverifikasi → membership aktif di workspace grant perangkat → role dari membership → PIN/tab unlock → izin rute. Server tidak pernah memercayai `userId/workspaceId/role` dari klien.

Workspace lama (belum ada membership) tetap berjalan device-only sampai diklaim (lihat `LEGACY_AUTH_MIGRATION.md`, CP3). Workspace baru hanya dapat dibuat oleh user yang login.

## Batasan yang diketahui (jujur)
- Rate limit login/callback lintas instance belum diterapkan di lapisan Better Auth (CP3).
- 4 advisory *moderate* `esbuild` datang dari peer `drizzle-kit` (alat dev); tidak ada high/critical.
