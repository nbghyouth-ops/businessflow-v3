# UAT Manual

## Desktop (Chrome/Edge/Firefox/Safari)
1. Buka /api/health → 200 OK.
2. Login Google → PIN → Dashboard.
3. Buat penjualan, cek stok, lihat laporan.
4. Matikan DB → layar status ramah + Coba lagi; nyalakan → pulih.

## Mobile (Chrome Android / Safari iOS)
1. Login dari ponsel.
2. POS langkah demi langkah.
3. Cek tidak ada overflow horizontal pada 320 px.

## Fallback
- Google dimatikan: Mode Perangkat (bila instance kosong) / Masuk Darurat (perangkat terdaftar).
- DB tidak terjangkau: ServiceStatusScreen.
