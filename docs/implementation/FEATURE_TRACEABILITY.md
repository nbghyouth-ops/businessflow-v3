# FEATURE TRACEABILITY MATRIX — 157 FITUR PRD v2.0 (BASELINE FASE 0)

Tanggal audit baseline: 2026-11-14
Sumber: Inspeksi langsung terhadap `business-flow-completed (7).zip` (143 route API, schema, komponen UI, unit/integration/E2E tests).

## Ringkasan Baseline
- Total fitur: 157
- Ada penuh: 0
- Sebagian: 74
- Belum: 64
- Tidak sesuai: 19

## Tabel Traceability (157 Fitur)

| # | ID | Nama Fitur | Status | File Kode Aktual | Bukti Test |
|---|---|---|---|---|---|
| 1 | POS-01 | Cashier Shift Management | Sebagian | `src/server/routes/prd.ts, src/server/routes/misc.ts, src/components/prd-panels.tsx` | NOT TESTED (2 model: cash_sessions & cashier_shifts; BF-017/037) |
| 2 | POS-02 | Cash Drawer Control | Sebagian | `src/server/routes/misc.ts, src/server/routes/prd.ts` | NOT TESTED (cash sales/refunds POS belum mengisi shift) |
| 3 | POS-03 | Cash Variance | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (variance dihitung saat close tanpa threshold approval) |
| 4 | POS-04 | Multi-Order Management | Sebagian | `src/server/routes/p2.ts (/p2/sales-orders), src/app/(app)/sales/page.tsx` | NOT TESTED (draft/multi-order POS & concurrency lock belum lengkap) |
| 5 | POS-05 | Split Bill | Belum | `src/server/routes/sales.ts` | NOT TESTED (belum ada endpoint/UI split item/qty ke subtagihan) |
| 6 | POS-06 | Split Payment | Sebagian | `src/server/routes/sales.ts (/sales/invoices/:id/payments)` | NOT TESTED (cicilan/payment bertahap ada, multi-metode satu checkout belum) |
| 7 | POS-07 | Table & Room Management | Sebagian | `src/server/routes/prd.ts (/prd/tables), src/components/prd-panels.tsx` | NOT TESTED (CRUD status meja ada; pindah/gabung/pisah order belum) |
| 8 | POS-08 | Special Pricing | Belum | `src/db/schema.ts (products.tierPrices)` | NOT TESTED (pricing engine cabang/customer/channel/masa berlaku belum) |
| 9 | POS-09 | Negotiated Pricing | Belum | `src/server/routes/sales.ts` | NOT TESTED (floor price & approval negosiasi harga belum) |
| 10 | POS-10 | Void & Refund Approval | Sebagian | `src/server/routes/sales.ts (/sales/invoices/:id/reverse)` | NOT TESTED (reversal ada, approval terpisah & void pre-post belum) |
| 11 | POS-11 | Cashier Performance | Sebagian | `src/server/routes/misc.ts (/reports/:name), src/server/routes/prd.ts` | NOT TESTED (laporan performa per device/branch/shift belum lengkap) |
| 12 | INV-01 | Product Variant Management | Sebagian | `src/db/schema.ts (products), src/server/routes/resources.ts` | NOT TESTED (atribut/SKU varian terstruktur belum end-to-end) |
| 13 | INV-02 | Add-on & Modifier Management | Belum | `src/server/routes/sales.ts` | NOT TESTED (modifier di order & receipt snapshot belum) |
| 14 | INV-03 | SKU & Barcode Management | Sebagian | `src/db/schema.ts (products.sku), src/server/routes/resources.ts` | NOT TESTED (uniqueness scope cabang & scanner lookup belum) |
| 15 | INV-04 | Multi-Unit Management | Sebagian | `src/db/schema.ts (products.unit), src/lib/money.ts` | NOT TESTED (satuan beli/simpan/jual terpisah belum) |
| 16 | INV-05 | Unit Conversion Engine | Belum | `src/lib/money.ts (toMilli)` | NOT TESTED (konversi berbasis faktor & effective date belum; BF-019) |
| 17 | INV-06 | Tiered Pricing | Sebagian | `src/db/schema.ts (products.tierPrices)` | NOT TESTED (evaluasi rentang qty di checkout belum terintegrasi) |
| 18 | INV-07 | Outlet-Specific Product Pricing | Belum | `src/db/schema.ts` | NOT TESTED (harga & status aktif per cabang belum) |
| 19 | INV-08 | Minimum & Maximum Stock | Sebagian | `src/db/schema.ts (products.minStock)` | NOT TESTED (max stock & per gudang/cabang belum) |
| 20 | INV-09 | Automatic Reorder Recommendation | Sebagian | `src/server/routes/misc.ts, functions/job-dispatcher/index.ts` | NOT TESTED (producer stock.low_alert & PO draft dari demand/lead time belum; NF-08) |
| 21 | INV-10 | Advanced Stock Opname | Tidak sesuai | `src/server/routes/p2.ts (/p2/stock-counts)` | FAIL static audit (BF-005: tidak hitung variance & tidak post stock_movements) |
| 22 | INV-11 | Stock Waste & Damage | Tidak sesuai | `src/server/routes/prd.ts (/prd/waste)` | FAIL static audit (BF-006: tidak mengurangi stock_movements) |
| 23 | INV-12 | Inter-Warehouse Transfer | Tidak sesuai | `src/server/routes/p2.ts (/p2/stock-transfers)` | FAIL static audit (BF-004: status completed tanpa OUT/IN stock_movements) |
| 24 | INV-13 | Batch & Lot Tracking | Sebagian | `src/server/routes/prd.ts (/prd/batches), src/components/prd-panels.tsx` | NOT TESTED (saldo batch belum terhubung ke stock_movements) |
| 25 | INV-14 | Serial Number Tracking | Belum | `src/server/routes/prd.ts` | NOT TESTED (serial unik per unit & riwayat pergerakan belum) |
| 26 | INV-15 | Expiry Management | Sebagian | `src/server/routes/prd.ts (/prd/batches)` | NOT TESTED (FEFO & quarantine/disposal otomatis belum) |
| 27 | INV-16 | Inventory Valuation | Tidak sesuai | `src/server/routes/misc.ts (/reports/:name)` | FAIL static audit (BF-031: valuation historis pakai avg_cost saat ini) |
| 28 | INV-17 | Inventory Costing | Sebagian | `src/server/routes/sales.ts, tests/unit/domain.test.ts` | PASS unit helper saja (weighted average helper ada, cost layer historis belum) |
| 29 | INV-18 | Stock Movement History | Sebagian | `src/server/routes/sales.ts (/inventory/movements)` | NOT TESTED (hanya sales/purchasing/adjust; transfer/opname/waste/produksi belum) |
| 30 | PRD-01 | Master Recipe | Sebagian | `src/server/routes/prd.ts (/prd/recipes)` | FAIL static audit (BF-007: ingredients JSON bebas, bukan relasi item+UOM) |
| 31 | PRD-02 | Bill of Materials (BOM) | Sebagian | `src/server/routes/prd.ts (/prd/recipes)` | NOT TESTED (komponen BOM terstruktur belum) |
| 32 | PRD-03 | Recipe by Variant | Belum | `src/server/routes/prd.ts` | NOT TESTED (belum ada varian di resep) |
| 33 | PRD-04 | Raw Material Conversion | Belum | `src/server/routes/prd.ts` | NOT TESTED (konversi satuan bahan belum) |
| 34 | PRD-05 | Standard Material Usage | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (belum terhubung ke work order) |
| 35 | PRD-06 | Expected Yield | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (target yield belum dihitung terhadap actual) |
| 36 | PRD-07 | Work Order | Tidak sesuai | `src/server/routes/prd.ts (/prd/work-orders)` | FAIL static audit (BF-007: complete tidak konsumsi bahan/terima barang jadi) |
| 37 | PRD-08 | Material Requirement Planning | Belum | `src/server/routes/prd.ts` | NOT TESTED (MRP vs available/reserved stock belum) |
| 38 | PRD-09 | Actual Material Consumption | Belum | `src/server/routes/prd.ts` | NOT TESTED (pemakaian aktual & batch bahan belum) |
| 39 | PRD-10 | Semi-finished & Finished Goods | Belum | `src/server/routes/prd.ts` | NOT TESTED (output barang jadi ke stock_movements belum) |
| 40 | PRD-11 | Production Batch | Belum | `src/server/routes/prd.ts` | NOT TESTED (nomor batch produksi & traceability belum) |
| 41 | PRD-12 | Actual Production Result | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (hanya simpan angka tanpa posting stok) |
| 42 | PRD-13 | Production Waste | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (waste_qty tersimpan tanpa mutasi/biaya) |
| 43 | PRD-14 | Material Variance Analysis | Belum | `src/server/routes/prd.ts` | NOT TESTED (perbandingan standar vs aktual belum) |
| 44 | PRD-15 | Production Costing | Belum | `src/server/routes/prd.ts` | NOT TESTED (HPP produksi & jurnal belum) |
| 45 | PRD-16 | Recipe Versioning | Belum | `src/server/routes/prd.ts` | NOT TESTED (versi & effective date resep belum) |
| 46 | PRD-17 | Recipe Change History | Belum | `src/server/routes/prd.ts` | NOT TESTED (riwayat perubahan resep belum) |
| 47 | PUR-01 | Reorder-driven Purchasing | Sebagian | `src/server/routes/p2.ts (/p2/purchase-requests)` | NOT TESTED (PR manual ada; dari reorder otomatis belum) |
| 48 | PUR-02 | PO to Receiving Match | Sebagian | `src/server/routes/sales.ts (/purchasing/orders/:id/receive)` | NOT TESTED (partial receiving berbasis accepted qty belum lengkap) |
| 49 | PUR-03 | Quantity Discrepancy | Belum | `src/server/routes/sales.ts` | NOT TESTED (short/over/partial receipt variance belum) |
| 50 | PUR-04 | Rejected/Damaged Receiving | Belum | `src/server/routes/sales.ts, src/server/routes/p2.ts` | FAIL static audit (BF-022: supplier return tidak kurangi stok/AP) |
| 51 | PUR-05 | Supplier Price History | Belum | `src/server/routes/sales.ts` | NOT TESTED (histori harga per supplier/effective date belum) |
| 52 | PUR-06 | Supplier Lead Time | Belum | `src/server/routes/sales.ts` | NOT TESTED (pengukuran lead time PO->receipt belum) |
| 53 | PUR-07 | Purchase Price Analysis | Belum | `src/server/routes/misc.ts` | NOT TESTED (analisis tren/landed cost belum) |
| 54 | PUR-08 | Supplier Performance | Belum | `src/server/routes/misc.ts` | NOT TESTED (fill rate & on-time belum) |
| 55 | PUR-09 | Supplier Bill Matching | Sebagian | `src/server/routes/sales.ts (/purchasing/bills)` | NOT TESTED (3-way match PO/receipt/bill belum ketat) |
| 56 | PUR-10 | Asset Acquisition Link | Belum | `src/server/routes/sales.ts, src/server/routes/prd.ts` | NOT TESTED (link pembelian ke asset register belum) |
| 57 | BKG-01 | Facility Master | Sebagian | `src/server/routes/resources.ts, src/app/(app)/bookings/page.tsx` | NOT TESTED (master resource dasar ada) |
| 58 | BKG-02 | Resource Master | Sebagian | `src/db/schema.ts (resources), src/server/routes/resources.ts` | NOT TESTED (kapasitas & atribut lengkap belum) |
| 59 | BKG-03 | Duration Pricing | Belum | `src/server/routes/misc.ts (/bookings)` | NOT TESTED (tarif per menit/jam/hari & rounding belum) |
| 60 | BKG-04 | Time Slot Management | Sebagian | `src/server/routes/misc.ts` | NOT TESTED (slot interval & buffer belum) |
| 61 | BKG-05 | Operating Hours | Belum | `src/server/routes/misc.ts` | NOT TESTED (jam operasional per resource/cabang belum) |
| 62 | BKG-06 | Resource Availability | Sebagian | `src/server/routes/misc.ts (/bookings)` | NOT TESTED (cek overlap dasar ada; maintenance/buffer/capacity belum) |
| 63 | BKG-07 | Capacity Management | Belum | `src/server/routes/misc.ts` | NOT TESTED (kapasitas > 1 per resource belum) |
| 64 | BKG-08 | Double-Booking Prevention | Sebagian | `src/server/routes/misc.ts (/bookings)` | NOT TESTED (cek overlap ada, concurrency race belum diuji) |
| 65 | BKG-09 | Multi-Service Reservation | Belum | `src/server/routes/misc.ts` | NOT TESTED (multi-service satu booking belum) |
| 66 | BKG-10 | Staff Assignment | Sebagian | `src/server/routes/misc.ts` | NOT TESTED (validasi skill/shift praktisi belum) |
| 67 | BKG-11 | Maintenance Blocking | Belum | `src/server/routes/misc.ts` | NOT TESTED (blokir maintenance belum) |
| 68 | BKG-12 | Waiting List | Belum | `src/server/routes/misc.ts` | NOT TESTED (antrean slot penuh belum) |
| 69 | BKG-13 | Customer Check-in | Sebagian | `src/server/routes/misc.ts (/bookings/:id/status)` | NOT TESTED (status checked_in ada) |
| 70 | BKG-14 | Service Processing | Sebagian | `src/server/routes/misc.ts (/bookings/:id/status)` | NOT TESTED (transisi status ada) |
| 71 | BKG-15 | Reschedule Management | Sebagian | `src/server/routes/misc.ts (/bookings/:id/reschedule)` | NOT TESTED (reschedule ada, snapshot & policy belum) |
| 72 | BKG-16 | No-Show Management | Sebagian | `src/server/routes/misc.ts` | NOT TESTED (grace period & kebijakan no-show belum) |
| 73 | BKG-17 | Deposit Management | Tidak sesuai | `src/server/routes/misc.ts (/bookings/:id/status)` | FAIL static audit (BF-008: paymentStatus bisa diset lunas tanpa payment record) |
| 74 | BKG-18 | Cancellation Policy | Belum | `src/server/routes/misc.ts` | NOT TESTED (versi kebijakan pembatalan belum) |
| 75 | BKG-19 | Refund Calculation | Belum | `src/server/routes/misc.ts` | NOT TESTED (hitung refund sesuai policy version belum) |
| 76 | BKG-20 | Facility Utilization | Belum | `src/server/routes/misc.ts` | NOT TESTED (laporan utilisasi belum) |
| 77 | BKG-21 | Booking History | Sebagian | `src/server/routes/misc.ts` | NOT TESTED (audit log ada, histori terstruktur belum) |
| 78 | COS-01 | Labor Cost | Tidak sesuai | `src/server/routes/prd.ts (/prd/service-costs)` | FAIL static audit (BF-029: input manual, bukan dari attendance/tarif) |
| 79 | COS-02 | Consumable Material Cost | Tidak sesuai | `src/server/routes/prd.ts (/prd/service-costs)` | FAIL static audit (BF-029: input manual, bukan dari stock issue) |
| 80 | COS-03 | Equipment Cost | Tidak sesuai | `src/server/routes/prd.ts (/prd/service-costs)` | FAIL static audit (BF-029: input manual) |
| 81 | COS-04 | Facility Cost | Tidak sesuai | `src/server/routes/prd.ts (/prd/service-costs)` | FAIL static audit (BF-029: input manual) |
| 82 | COS-05 | Related Operating Cost | Tidak sesuai | `src/server/routes/prd.ts (/prd/service-costs)` | FAIL static audit (BF-029: input manual) |
| 83 | COS-06 | Work Duration | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (validasi timestamp & durasi dari event belum) |
| 84 | COS-07 | Waiting Time | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (input manual) |
| 85 | COS-08 | Processing Time | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (input manual) |
| 86 | COS-09 | Actual vs Standard Cost | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (perbandingan ada di tabel, sumber aktual belum) |
| 87 | COS-10 | Service Margin | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (revenue basis diakui belum diverifikasi) |
| 88 | COS-11 | Service Cost Analysis | Belum | `src/server/routes/prd.ts` | NOT TESTED (agregasi antar cabang/periode belum) |
| 89 | COS-12 | Service Workforce Productivity | Belum | `src/server/routes/prd.ts` | NOT TESTED (belum ada metrik produktivitas) |
| 90 | AST-01 | Fixed Asset Register | Sebagian | `src/db/schema.ts (assets), scripts/sql/004_prd_157_modules.sql (fixed_assets)` | FAIL static audit (BF-026: dua tabel paralel assets vs fixed_assets) |
| 91 | AST-02 | Asset Code & Category | Sebagian | `src/server/routes/prd.ts (/prd/assets)` | NOT TESTED (kode unik & capitalization policy belum) |
| 92 | AST-03 | Acquisition Value | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (kapitalisasi biaya belum) |
| 93 | AST-04 | Acquisition Date | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (start convention belum) |
| 94 | AST-05 | Asset Location | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (histori perpindahan belum) |
| 95 | AST-06 | Asset Responsible Party | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (custody belum) |
| 96 | AST-07 | Useful Life | Tidak sesuai | `src/server/routes/prd.ts (/prd/assets)` | FAIL static audit (BF-027: default 36 bulan diam-diam) |
| 97 | AST-08 | Residual Value | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (batas residual belum dijaga ketat di semua jalur) |
| 98 | AST-09 | Straight-line Depreciation | Sebagian | `src/server/routes/prd.ts (/prd/assets/:id/depreciate)` | FAIL static audit (BF-010: tidak post jurnal & rawan race) |
| 99 | AST-10 | Declining-balance Depreciation | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (rate & jurnal belum) |
| 100 | AST-11 | Depreciation Schedule | Belum | `src/server/routes/prd.ts` | NOT TESTED (preview/approve/post terpisah belum) |
| 101 | AST-12 | Accumulated Depreciation | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (belum cocok dengan GL) |
| 102 | AST-13 | Book Value | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (belum cocok dengan GL) |
| 103 | AST-14 | Asset Disposal | Belum | `src/server/routes/prd.ts` | NOT TESTED (disposal & gain/loss journal belum) |
| 104 | AST-15 | Asset Sale | Belum | `src/server/routes/prd.ts` | NOT TESTED (penjualan aset & proceeds journal belum) |
| 105 | AST-16 | Asset Location Transfer | Belum | `src/server/routes/prd.ts` | NOT TESTED (mutasi lokasi & audit belum) |
| 106 | AST-17 | Asset Maintenance History | Belum | `src/server/routes/prd.ts` | NOT TESTED (riwayat perawatan & biaya belum) |
| 107 | AST-18 | Depreciation Journal | Tidak sesuai | `src/server/routes/prd.ts` | FAIL static audit (BF-010: tidak memanggil postJournal) |
| 108 | AST-19 | Asset & Depreciation Reports | Belum | `src/server/routes/misc.ts` | NOT TESTED (laporan khusus aset & penyusutan belum) |
| 109 | HR-01 | Shift Planner | Sebagian | `src/server/routes/p2.ts (/p2/shifts)` | NOT TESTED (CRUD shift ada, konflik belum) |
| 110 | HR-02 | Employee Schedule Calendar | Sebagian | `src/components/p2-panels.tsx` | NOT TESTED (tampilan daftar ada, kalender penuh belum) |
| 111 | HR-03 | Shift Rotation | Belum | `src/server/routes/p2.ts` | NOT TESTED (pola rotasi & validasi istirahat belum) |
| 112 | HR-04 | Attendance Ledger | Sebagian | `src/server/routes/resources.ts (attendance)` | NOT TESTED (koreksi dengan approval & append-only belum) |
| 113 | HR-05 | Working Hours Calculation | Belum | `src/server/routes/p2.ts` | NOT TESTED (hitung jam kerja dari attendance belum) |
| 114 | HR-06 | Late Arrival Calculation | Belum | `src/server/routes/p2.ts` | NOT TESTED (hitung keterlambatan belum) |
| 115 | HR-07 | Overtime Calculation | Belum | `src/server/routes/p2.ts` | NOT TESTED (hitung lembur berdasar konfigurasi belum) |
| 116 | HR-08 | Leave Management | Sebagian | `src/server/routes/p2.ts (/p2/leave-requests)` | NOT TESTED (saldo cuti belum) |
| 117 | HR-09 | Holiday Calendar | Belum | `src/server/routes/p2.ts` | NOT TESTED (kalender hari libur belum) |
| 118 | HR-10 | Leave Approval | Sebagian | `src/server/routes/p2.ts (/p2/leave-requests/:id/decide)` | NOT TESTED (state transition & scope cabang belum) |
| 119 | HR-11 | Payroll Components | Belum | `src/server/routes/p2.ts` | NOT TESTED (komponen gaji terkonfigurasi belum) |
| 120 | HR-12 | Salary & Allowance Calculation | Tidak sesuai | `src/server/routes/p2.ts (/p2/payroll-runs)` | FAIL static audit (BF-009/025: gross/deductions dari client, tanpa jurnal) |
| 121 | HR-13 | Incentive | Belum | `src/server/routes/p2.ts` | NOT TESTED (insentif berbasis aturan belum) |
| 122 | HR-14 | Product Commission | Tidak sesuai | `src/server/routes/prd.ts (/prd/commissions)` | FAIL static audit (BF-028: hanya CRUD rule, belum hitung komisi) |
| 123 | HR-15 | Service Commission | Tidak sesuai | `src/server/routes/prd.ts (/prd/commissions)` | FAIL static audit (BF-028) |
| 124 | HR-16 | Package Commission | Tidak sesuai | `src/server/routes/prd.ts (/prd/commissions)` | FAIL static audit (BF-028) |
| 125 | HR-17 | Target-based Commission | Tidak sesuai | `src/server/routes/prd.ts (/prd/commissions)` | FAIL static audit (BF-028) |
| 126 | HR-18 | Commission Calculation | Tidak sesuai | `src/server/routes/prd.ts (/prd/commissions)` | FAIL static audit (BF-028: reversal saat refund belum) |
| 127 | HR-19 | Payroll Reconciliation | Belum | `src/server/routes/p2.ts` | NOT TESTED (rekonsiliasi draft/approval/jurnal/bayar belum) |
| 128 | HR-20 | Digital Payslip | Belum | `src/server/routes/p2.ts` | NOT TESTED (dokumen slip gaji privat belum) |
| 129 | HR-21 | Employee Cost Report | Belum | `src/server/routes/misc.ts` | NOT TESTED (laporan biaya karyawan belum) |
| 130 | HR-22 | Workforce Productivity Analysis | Belum | `src/server/routes/misc.ts` | NOT TESTED (analisis produktivitas belum) |
| 131 | DSP-01 | Kitchen Display System | Sebagian | `src/server/routes/prd.ts (/prd/displays), src/components/prd-panels.tsx` | FAIL static audit (BF-030: belum ada tiket otomatis dari POS) |
| 132 | DSP-02 | Production Display | Sebagian | `src/server/routes/prd.ts (/prd/displays)` | FAIL static audit (BF-030: belum terhubung ke work order) |
| 133 | DSP-03 | Customer Order Display | Sebagian | `src/server/routes/prd.ts (/prd/displays)` | NOT TESTED (filter privasi field minimal belum diuji) |
| 134 | DSP-04 | Pickup Display | Sebagian | `src/server/routes/prd.ts (/prd/displays)` | NOT TESTED (sinkronisasi status dua arah belum) |
| 135 | DSP-05 | Warehouse Fulfillment Display | Sebagian | `src/server/routes/prd.ts (/prd/displays)` | NOT TESTED (antrean picking/packing/dispatch belum) |
| 136 | DSP-06 | Picking Management | Belum | `src/server/routes/prd.ts` | NOT TESTED (qty picked & short pick belum) |
| 137 | DSP-07 | Packing Management | Belum | `src/server/routes/prd.ts` | NOT TESTED (validasi pengepakan belum) |
| 138 | DSP-08 | Dispatch Management | Belum | `src/server/routes/prd.ts` | NOT TESTED (manifest & handover belum) |
| 139 | DSP-09 | Order Priority | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (aturan SLA/prioritas belum) |
| 140 | DSP-10 | Processing Time Tracking | Belum | `src/server/routes/prd.ts` | NOT TESTED (elapsed/wait/active timestamp belum) |
| 141 | DSP-11 | Operational Status Board | Sebagian | `src/components/prd-panels.tsx` | NOT TESTED (ringkasan bottleneck belum) |
| 142 | DSP-12 | Queue Management | Sebagian | `src/server/routes/prd.ts` | NOT TESTED (nomor antrean & pemanggilan terintegrasi belum) |
| 143 | EDU-01 | Module User Guides | Sebagian | `src/components/guide.tsx, src/app/guide/page.tsx, src/app/(app)/help/page.tsx` | NOT TESTED (panduan dasar ada, belum mencakup semua 157 fitur) |
| 144 | EDU-02 | Transaction Tutorials | Sebagian | `src/components/guide.tsx` | NOT TESTED (skenario khusus belum lengkap) |
| 145 | EDU-03 | Cashier Guides | Sebagian | `src/components/guide.tsx` | NOT TESTED |
| 146 | EDU-04 | Purchasing & Inventory Guides | Sebagian | `src/components/guide.tsx` | NOT TESTED |
| 147 | EDU-05 | Finance Guides | Sebagian | `src/components/guide.tsx` | NOT TESTED |
| 148 | EDU-06 | Employee Guides | Belum | `src/components/guide.tsx` | NOT TESTED |
| 149 | EDU-07 | Booking Guides | Sebagian | `src/components/guide.tsx` | NOT TESTED |
| 150 | EDU-08 | Industry-specific Tutorials | Belum | `src/components/guide.tsx, src/lib/templates.ts` | NOT TESTED |
| 151 | EDU-09 | Operational Checklists | Belum | `src/components/guide.tsx` | NOT TESTED |
| 152 | EDU-10 | Configurable Workflow Examples | Belum | `src/components/guide.tsx` | NOT TESTED |
| 153 | EDU-11 | Contextual FAQ | Sebagian | `src/app/(app)/help/page.tsx` | NOT TESTED |
| 154 | EDU-12 | Business & Accounting Glossary | Belum | `src/app/(app)/help/page.tsx` | NOT TESTED |
| 155 | EDU-13 | Error Explanation & Resolution | Belum | `src/app/(app)/help/page.tsx` | NOT TESTED |
| 156 | EDU-14 | Reporting Guides | Belum | `src/app/(app)/help/page.tsx` | NOT TESTED |
| 157 | EDU-15 | Reconciliation Guides | Belum | `src/app/(app)/help/page.tsx` | NOT TESTED |
