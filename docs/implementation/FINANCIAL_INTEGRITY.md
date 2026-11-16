# Financial Integrity Specification — Business Flow

1. **Representasi Uang**: Seluruh nominal disimpan sebagai `BIGINT` satuan terkecil (sen/rupiah×100) di PostgreSQL dan dihitung memakai `BigInt` di `src/lib/money.ts` tanpa floating point. IDR tidak menerima pecahan desimal.
2. **Double-Entry Seimbang**: Setiap transaksi keuangan, penjualan POS, pembayaran piutang/utang, dan retur menghasilkan entri jurnal seimbang (`SUM(debit) = SUM(credit)`). Trigger SQL `001_integrity.sql` memblokir `UPDATE`/`DELETE` pada `journal_entries`, `journal_lines`, dan `stock_movements`.
3. **Periode Terkunci**: `accounting_periods` dengan status `closed` menolak posting jurnal baru di rentang tanggal tersebut.
4. **HPP & Persediaan**: Memakai biaya rata-rata bergerak (`weightedAvg` di `sales.ts`). Retur membalik stok dan jurnal.
5. **Snapshot Ekspor (F-17)**: Struk penjualan dan Business Activity Summary dihitung dalam transaksi `REPEATABLE READ` langsung dari tabel `invoices`, `invoice_lines`, `payments`, dan `finance_transactions`, lalu dibekukan di `export_records`.
