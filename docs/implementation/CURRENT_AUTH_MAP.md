# Peta auth saat ini (v3)
Request → `dispatch` (core.ts): rate limit (rute tanpa auth) → cookie perangkat `bf_device` → grant aktif → **jika workspace berbasis akun**: sesi Google (DB) → user aktif+email terverifikasi → membership aktif → role dari membership → tab/PIN → izin rute → `withTenant` (RLS, SET LOCAL ROLE bf_app). Workspace tanpa membership = mode lama (device-only) sampai diklaim.
Rute akun/identitas memakai `withAuthContext` (owner connection, konteks `app.workspace_id`/`app.user_id`), tidak pernah memberi jalan pintas ke data tenant.
