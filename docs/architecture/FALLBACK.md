# Fallback — Arsitektur

Lihat `src/server/fallback/registry.ts` (registri tunggal) dan kontrak 4.1. Saklar global `system_flags.fallbacks_enabled` (default true). Fallback hanya menyala setelah jalur utama gagal; tidak menambah query pada jalur sehat. Fail-closed untuk keamanan, fail-soft untuk ketersediaan. Tanpa ENV baru.
