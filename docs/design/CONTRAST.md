# Tabel kontras WCAG 2.2 AA (dihitung, bukan perkiraan)

Dihasilkan dengan rumus luminans relatif WCAG dari token di `src/app/globals.css`. Sebelum perubahan:

| Pasangan | Rasio | Target | Hasil |
|---|---|---|---|
| Teks utama ink di atas surface (#111827 / #F4F6F9) | 16.39:1 | 4.5:1 teks | PASS |
| Teks utama ink di atas kartu putih (#111827 / #FFFFFF) | 17.74:1 | 4.5:1 teks | PASS |
| Teks sekunder ink-2 di atas putih (#6B7280 / #FFFFFF) | 4.83:1 | 4.5:1 teks | PASS |
| Teks sekunder ink-2 di atas surface (#6B7280 / #F4F6F9) | 4.47:1 | 4.5:1 teks | FAIL |
| Teks muted #9CA3AF di atas putih (#9CA3AF / #FFFFFF) | 2.54:1 | 4.5:1 teks | FAIL |
| Putih di atas cobalt primary (#FFFFFF / #3B4FF8) | 5.74:1 | 4.5:1 teks | PASS |
| Putih di atas primary-deep (#FFFFFF / #2A3BD4) | 7.85:1 | 4.5:1 teks | PASS |
| Primary-deep di atas primary-bg (#2A3BD4 / #EEF1FF) | 6.98:1 | 4.5:1 teks | PASS |
| Putih di atas sidebar obsidian (#FFFFFF / #141518) | 18.26:1 | 4.5:1 teks | PASS |
| Teks nav aktif #141518 di atas putih (#141518 / #FFFFFF) | 18.26:1 | 4.5:1 teks | PASS |
| Fokus ring primary-deep vs putih (#2A3BD4 / #FFFFFF) | 7.85:1 | 3:1 non-teks | PASS |
| Fokus ring primary-deep vs surface (#2A3BD4 / #F4F6F9) | 7.25:1 | 3:1 non-teks | PASS |
| Border input line #E5E7EB vs putih (#E5E7EB / #FFFFFF) | 1.24:1 | 3:1 non-teks (UI) | FAIL |
| Teks danger #DC2626 di atas putih (#DC2626 / #FFFFFF) | 4.83:1 | 4.5:1 teks | PASS |
| Teks success #16A34A di atas putih (#16A34A / #FFFFFF) | 3.30:1 | 4.5:1 teks | FAIL |
| Pesan error #991B1B di atas #FEF2F2 (#991B1B / #FEF2F2) | 7.60:1 | 4.5:1 teks | PASS |
| Pesan sukses #05603A di atas #ECFDF3 (#05603A / #ECFDF3) | 7.26:1 | 4.5:1 teks | PASS |
| Teks gelap di atas KPI lavender #E0E1FC (#111827 / #E0E1FC) | 13.81:1 | 4.5:1 teks | PASS |
| Teks gelap di atas KPI mint #D1EEDC (#111827 / #D1EEDC) | 14.34:1 | 4.5:1 teks | PASS |
| Teks gelap di atas KPI peach #FCE2D4 (#111827 / #FCE2D4) | 14.33:1 | 4.5:1 teks | PASS |
| Teks gelap di atas KPI butter #EFE9CC (#111827 / #EFE9CC) | 14.53:1 | 4.5:1 teks | PASS |
| ink-2 di atas KPI mint (#6B7280 / #D1EEDC) | 3.91:1 | 4.5:1 teks | FAIL |
| ink-2 di atas KPI peach (#6B7280 / #FCE2D4) | 3.91:1 | 4.5:1 teks | FAIL |
| Teks tombol Google #1f1f1f di atas putih (#1F1F1F / #FFFFFF) | 16.48:1 | 4.5:1 teks | PASS |
| Border tombol Google #747775 vs putih (#747775 / #FFFFFF) | 4.53:1 | 3:1 non-teks | PASS |


## Perbaikan (turunan semantik terukur)
| Token | Sebelum | Sesudah | Rasio sesudah |
|---|---|---|---|
| `--color-ink-2` | #6B7280 (4,47:1 di surface; 3,91:1 di KPI mint/peach) | #5B6472 | 5,53:1 surface; ≥4,66:1 di semua KPI pastel |
| `--color-muted` | #9CA3AF (2,54:1) | #6B7280 | 4,83:1 putih |
| `--color-success-text` (baru) | #16A34A sebagai teks (3,30:1) | #157A3A | 5,42:1 putih; 5,00:1 surface |
| `--color-input-border` (baru) | #E5E7EB (1,24:1) | #7A8394 | 3,82:1 putih |

Border kartu (#E5E7EB) bersifat dekoratif dan tidak membawa informasi; tidak dipersyaratkan 3:1. Warna #16A34A tetap dipakai untuk ikon/latar bukan teks.
Catatan: konflik dokumen lama `#187a75` (teal) diselesaikan: otoritas = `DESIGN_SYSTEM.md` + `globals.css` (cobalt).
