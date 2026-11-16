# Troubleshooting

- DB tidak terjangkau → 503 service_unavailable + Retry-After; layar status ramah.
- Skema belum siap → SCHEMA_NOT_READY; jalankan `npm run db:migrate`.
- Google tidak dikonfigurasi → Mode Perangkat (bila instance kosong).
- Google bermasalah → Masuk Darurat (perangkat terdaftar + PIN + trigger).
- Rate limit → pesan 429 ramah dengan waktu tunggu.
- Host-header injection dicegah: baseURL hanya dari ENV/VERCEL_*.
