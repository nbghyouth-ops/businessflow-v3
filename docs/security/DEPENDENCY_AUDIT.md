# Dependency Security Audit — Business Flow

## Tindakan yang Dilakukan
1. `next` dan `eslint-config-next` dipin ke `16.4.6` (menggantikan `16.2.6` yang memiliki advisory critical).
2. `postcss` dipin via `overrides` ke `8.5.8`.
3. `vitest` dipindahkan ke `devDependencies`.
4. Pustaka ekspor: memakai `jspdf@2.5.2` dan `exceljs@4.4.0` (menghindari paket `xlsx` lama yang rentan).

## Status Verifikasi
- Di sandbox VM (tanpa internet & tanpa `node_modules`): `npm audit --omit=dev` berstatus `BLOCKED` dan wajib dijalankan oleh pemilik setelah `npm install`.
