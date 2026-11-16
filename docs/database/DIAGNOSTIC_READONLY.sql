-- DIAGNOSTIC_READONLY.sql
-- Jalankan query baca-saja ini di Neon SQL Editor untuk mendiagnosis error onboarding
-- atau ketidaksinkronan skema (drift) tanpa mengubah data maupun skema apa pun.

-- 1. Cek daftar migrasi yang tercatat
SELECT id, checksum, applied_at
FROM schema_migrations
ORDER BY applied_at ASC;

-- 2. Cek struktur lengkap tabel devices (penyebab umum error INSERT INTO devices)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'devices'
ORDER BY ordinal_position;

-- 3. Cek seluruh constraint pada tabel devices
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.devices'::regclass;

-- 4. Cek role koneksi saat ini, role bf_app, dan keanggotaan
SELECT
  current_user AS active_connection_role,
  r.rolname,
  r.rolsuper,
  r.rolbypassrls,
  r.rolcanlogin,
  pg_has_role(current_user, 'bf_app', 'MEMBER') AS current_user_is_member_of_bf_app
FROM pg_roles r
WHERE r.rolname = 'bf_app';

-- 5. Cek hak akses bf_app pada tabel sensitif non-tenant
SELECT
  has_table_privilege('bf_app', 'public.tab_sessions', 'SELECT') AS bf_app_can_select_tab_sessions,
  has_table_privilege('bf_app', 'public.devices', 'INSERT') AS bf_app_can_insert_devices,
  has_column_privilege('bf_app', 'public.devices', 'token_hash', 'SELECT') AS bf_app_can_read_token_hash,
  has_column_privilege('bf_app', 'public.devices', 'pin_hash', 'SELECT') AS bf_app_can_read_pin_hash;

-- 6. Cek seluruh tabel bertenant (memiliki workspace_id) yang belum ENABLE + FORCE RLS atau belum punya policy
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns col
    WHERE col.table_schema = 'public'
      AND col.table_name = c.relname
      AND col.column_name = 'workspace_id'
  )
ORDER BY c.relrowsecurity ASC, c.relforcerowsecurity ASC, c.relname ASC;
