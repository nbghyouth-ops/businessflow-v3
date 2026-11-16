# Spesifikasi animasi (sumber kebenaran: `src/app/globals.css` + `src/components/motion.tsx`)

## Token
| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--dur-press` | 110 ms | umpan balik tekan (tombol, chip, tab, kartu klik) |
| `--dur-hover` | 150 ms | hover/fokus, warna, bayangan |
| `--dur-content` | 220 ms | transisi halaman/konten |
| `--dur-modal` | 220 ms | modal, sheet |
| `--ease-out` | cubic-bezier(.22,1,.36,1) | semua transisi masuk |

## Pola
- **Tekan**: semua `button:not(:disabled)`, `[role=button]`, `.pressable` → `scale(.97)` (transform saja, tidak menggeser layout).
- **Kartu klik**: `.card-hover` (bayangan + border, hanya perangkat dengan hover).
- **Halaman**: `.anim-page-enter` (opasitas + translateY 8 px, 240 ms) per rute.
- **Scroll reveal**: `<Reveal/>` (IntersectionObserver, SEKALI per elemen, `disconnect` setelah tampil); hanya untuk pengantar section/kartu, bukan baris tabel besar. Tanpa IO/reduced-motion → langsung tampil.
- **Topbar**: `useScrolled()` menambah bayangan halus setelah scroll (satu listener pasif dibatasi rAF). `<ScrollProgress/>` tersedia untuk halaman panjang (transform saja).
- **Modal/sheet/dropdown**: `.anim-modal-in`, `.anim-sheet-up`, `.anim-drop-in`; fokus terkelola, trap Tab, Esc menutup (diuji).
- **Skeleton**: `.skeleton` shimmer; hilang saat data tiba. Tidak ada loop dekoratif lain.
## Dilarang (tidak ada di kode)
parallax, confetti, glow/blur besar, animasi yang menunda operasi kritis, status hanya lewat gerak/warna.
## prefers-reduced-motion
Aturan global memendekkan semua durasi, mematikan skala-tekan, shimmer, dan reveal. Diuji: `tests/ui/modal-and-motion.test.tsx` (Reveal) ; Playwright `responsive-a11y.spec.ts` (NOT TESTED).
## Belum dikerjakan (jujur)
Transisi rute memakai View Transitions API, count-up KPI, indikator tab bergeser, animasi chart terukur — belum diimplementasikan.
