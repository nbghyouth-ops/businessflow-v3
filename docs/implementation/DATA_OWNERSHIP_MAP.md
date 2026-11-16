# Kepemilikan data
Non-tenant (hanya service auth, REVOKE dari bf_app): `user`, `session`, `account`, `verification`, `auth_rate_limits`.
Bertenant (FORCE RLS): `workspace_members` (+ policy `member_self_read`), `workspace_invitations`, `auth_events`, seluruh tabel bisnis/CRM/stok/HR/jurnal/file/ekspor. Data dimiliki workspace, bukan perangkat; client CRM bukan akun login.
Google menyimpan nol data bisnis; kami menyimpan `sub`, email terverifikasi, nama, foto (URL), tanpa token.
