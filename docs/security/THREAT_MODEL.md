# Threat Model — Business Flow

1. **Identitas & Autentikasi Tanpa Login Akun**: Cookie `bf_device` (`HttpOnly`, `SameSite=Strict`, `Secure` di HTTPS) menyimpan token acak yang hanya hash SHA-256-nya disimpan di DB. Tidak ada email/password/OAuth.
2. **Kunci Layar PIN**: PIN di-hash Argon2id (`@node-rs/argon2`). Token sesi tab (`x-tab-session`) hanya hidup di memori JS modul, tidak pernah di storage. Rate limit SQL atomik (`api_rate_limits`) + lockout eksponensial setelah 5 kali gagal. Catatan: "Ubah PIN tanpa PIN lama" adalah keputusan desain pemilik (lihat `PIN_SECURITY.md`).
3. **Isolasi Tenant (RLS Fail-Closed)**: Semua rute terotorisasi dibungkus `withTenant(ctx, fn)` yang menyetel `app.workspace_id` (transaction-local) dan `SET LOCAL ROLE bf_app` (`NOBYPASSRLS`). Seluruh tabel bertenant memiliki `ENABLE + FORCE ROW LEVEL SECURITY` dan composite FK `(workspace_id, id)`.
4. **Integritas Keuangan**: Uang memakai integer satuan terkecil (`BigInt` di `src/lib/money.ts`). Jurnal dan ledger stok bersifat append-only (`REVOKE UPDATE, DELETE` dari `bf_app` + trigger SQL `001_integrity.sql`).
5. **Lampiran & Ekspor**: Unggahan dibatasi 3 MB, dicek magic bytes (menolak HTML/SVG/eksekutabel), dan diunduh lewat endpoint terotorisasi dengan `Content-Disposition: attachment` dan `X-Content-Type-Options: nosniff`. CSP memblokir skrip/font eksternal.


## Tambahan v3 — ancaman OAuth/identitas
| Ancaman | Mitigasi | Bukti |
|---|---|---|
| CSRF login / state palsu | `state` + PKCE S256 oleh library; state salah ditolak | VT auth-flow |
| Replay kode otorisasi | kode sekali pakai di IdP; callback tanpa state sah ditolak | VT auth-flow |
| ID token palsu (aud/iss/exp/nonce) | verifikasi JWKS oleh library | VT auth-flow (4 kasus) |
| Account takeover via email sama | tanpa auto-link; kunci = `sub`; unique email | VT auth-flow (`account_not_linked`) |
| Email belum terverifikasi | ditolak di hook pembuatan user | VT auth-flow |
| Open redirect `callbackURL` | allowlist `safeNext`; Better Auth `trustedOrigins` | kode `src/lib/safe-next.ts` (uji redirect: NOT TESTED) |
| Session fixation/stale | sesi di DB, dicabut ⇒ 401 seketika; user disabled ⇒ ditolak | SM |
| Cookie perangkat dicuri | wajib sesi Google + membership; PIN | SM (outsider 403) |
| Membership basi | diperiksa setiap request | SM |
| Penyalahgunaan undangan | token hash, 7 hari, sekali pakai, `FOR UPDATE`, role≠owner | SM (race, expired, token palsu) |
| Klaim workspace lama oleh orang lain | butuh grant owner + PIN terbuka + sesi Google | SM |
| Kebocoran token Google | tidak disimpan/ditampilkan; scope minimum; `account` tabel non-tenant, REVOKE dari bf_app | VT auth-rls |
| Brute force login | **OPEN**: rate limit login/callback lintas instance belum ada (hanya rate limit PIN/rute API) | NF-V3-08 |
