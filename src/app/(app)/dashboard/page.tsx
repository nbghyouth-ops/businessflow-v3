"use client";
 
import Link from "next/link";
import { useState } from "react";
import { DualBarChart, SplineAreaChart } from "@/components/charts";
import { Reveal } from "@/components/motion";
import { downloadFinanceTemplateExcel } from "@/lib/excel-export";
import { QuickTx } from "@/components/quick-tx";
import { useBiz } from "@/components/shell";
import { Badge, Button, Card, DataTable, Empty, ErrorBox, Kpi, Loading, PageHeader, Tabs, TextField } from "@/components/ui";
import { downloadCsv, fmtDateTime, toInputDate, useApi } from "@/lib/client";
import { formatMoney } from "@/lib/money";

const ACTION_LABEL: Record<string, string> = {
  "transaction.posted": "Transaksi diposting",
  "transaction.draft": "Draf transaksi",
  "transaction.pending_approval": "Menunggu persetujuan",
  "transaction.reversed": "Transaksi dibalik",
  "sale.checkout": "Penjualan",
  create: "Data dibuat",
  update: "Data diubah",
  "invoice.payment": "Pembayaran faktur",
  "po.receive": "Penerimaan barang",
  "stock.adjust": "Penyesuaian stok",
  "workspace.create": "Bisnis dibuat",
};

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden>
      <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v2H17a3 3 0 000 6h4v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      <circle cx="17" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function TrendUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden>
      <path d="M12 3v18M5 21h14M4 8l3 6a3 3 0 01-6 0l3-6zm16 0l3 6a3 3 0 01-6 0l3-6zM4 8h16" />
    </svg>
  );
}

export default function Dashboard() {
  const biz = useBiz();
  const d0 = new Date();
  const f0 = new Date();
  f0.setDate(f0.getDate() - 29);
  const [from, setFrom] = useState(toInputDate(f0));
  const [to, setTo] = useState(toInputDate(d0));
  const [tab, setTab] = useState("overview");
  const { data, error, loading, reload } = useApi<any>(`/dashboard?from=${from}&to=${to}`);
  const accountsApi = useApi<any>(tab === "finance" && biz.can("finance:read") ? "/finance/cash-accounts" : null);
  const txApi = useApi<any>(tab === "finance" && biz.can("finance:read") ? "/finance/transactions?limit=8" : null);
  const [qt, setQt] = useState(false);

  const cur = biz.currency;
  const fin = data?.finance;
  const series: any[] = fin?.series ?? [];
  const m = (v: string | number) => formatMoney(v, cur);

  const exportCsv = () => {
    if (!fin) return;
    downloadCsv(
      `ringkasan-${from}_${to}.csv`,
      [
        { key: "day", label: "Tanggal" },
        { key: "income", label: "Pendapatan" },
        { key: "expense", label: "Beban" },
      ],
      series,
    );
  };

  const alerts: { tone: "critical" | "warn" | "info"; title: string; sub: string; badge: string; href: string }[] = [];
  if (fin?.pendingApprovals > 0) {
    alerts.push({
      tone: "critical",
      title: `${fin.pendingApprovals} pengeluaran menunggu persetujuan`,
      sub: "Perlu tinjauan pengelola",
      badge: "Perlu Aksi",
      href: "/finance",
    });
  }
  if (data?.tasks?.overdue > 0) {
    alerts.push({
      tone: "critical",
      title: `${data.tasks.overdue} tugas melewati tenggat`,
      sub: "Periksa jadwal tim",
      badge: "Tenggat",
      href: "/tasks",
    });
  }
  if (data?.lowStock?.length > 0) {
    alerts.push({
      tone: "warn",
      title: `${data.lowStock.length} produk stok menipis`,
      sub: data.lowStock
        .slice(0, 2)
        .map((p: any) => p.name)
        .join(", "),
      badge: "Stok",
      href: "/products",
    });
  }
  if (fin && Number(fin.budget?.budget) > 0) {
    const pct = Math.round((Number(fin.budget.actual) / Number(fin.budget.budget)) * 100);
    alerts.push({
      tone: pct >= 90 ? "warn" : "info",
      title: `Pemakaian anggaran ${pct}%`,
      sub: `${m(fin.budget.actual)} dari ${m(fin.budget.budget)}`,
      badge: "Anggaran",
      href: "/finance",
    });
  }

  return (
    <>
      <PageHeader
        label="Overview"
        title="Dashboard Bisnis"
        desc={`${biz.business.name} — angka dihitung dari jurnal & transaksi nyata untuk rentang tanggal terpilih.`}
        actions={
          <>
            <TextField label="Dari" type="date" value={from} onChange={setFrom} max={to} />
            <TextField label="Sampai" type="date" value={to} onChange={setTo} min={from} />
            {fin && (
              <>
                <Button variant="secondary" onClick={exportCsv} disabled={!series.length}>
                  Ekspor CSV
                </Button>
                <Button variant="secondary" onClick={() => void downloadFinanceTemplateExcel(biz.business.name, cur)}>
                  Template Excel Keuangan
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "overview", label: "Ringkasan" },
            ...(biz.can("finance:read") ? [{ key: "finance", label: "Dashboard Keuangan" }] : []),
          ]}
          value={tab}
          onChange={setTab}
        />
        <div data-tour="quick" className="flex flex-wrap gap-2">
          {biz.can("finance:write") && <Button onClick={() => setQt(true)}>+ Transaksi Cepat</Button>}
          {biz.can("sales:write") && (
            <Link
              href="/sales"
              className="inline-flex min-h-[42px] items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-primary-bg"
            >
              Penjualan baru (POS)
            </Link>
          )}
          {biz.can("reports:read") && (
            <Link
              href="/reports/export"
              className="inline-flex min-h-[42px] items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-primary-bg"
            >
              Export Center
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : (
        data &&
        tab === "overview" && (
          <div className="grid gap-6">
            {fin && (
              <Reveal><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                  pastel="lavender"
                  icon={<WalletIcon />}
                  label="Saldo Kas & Bank"
                  value={m(fin.cashTotal)}
                  hint="Semua akun kas/bank (posted)"
                />
                <Kpi
                  pastel="mint"
                  icon={<TrendUpIcon />}
                  label="Pendapatan"
                  value={m(fin.income)}
                  hint="Periode terpilih"
                />
                <Kpi
                  pastel="peach"
                  icon={<ReceiptIcon />}
                  label="Beban"
                  value={m(fin.expense)}
                  hint="Termasuk HPP periode ini"
                />
                <Kpi
                  pastel="butter"
                  icon={<ScaleIcon />}
                  label="Arus Kas Bersih"
                  value={m(fin.netCashflow)}
                  tone={Number(fin.netCashflow) < 0 ? "bad" : undefined}
                  hint="Perubahan saldo kas/bank"
                />
              </div></Reveal>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              {fin ? (
                <Card title="Pendapatan vs Beban" desc={`Per hari, ${from} s.d. ${to}. Sumber data: jurnal akuntansi.`}>
                  {series.length === 0 ? (
                    <Empty
                      title="Belum ada transaksi pada periode ini"
                      hint="Catat pemasukan atau penjualan pertama Anda agar grafik muncul."
                      action={biz.can("finance:write") ? <Button onClick={() => setQt(true)}>+ Transaksi Cepat</Button> : undefined}
                    />
                  ) : (
                    <DualBarChart
                      currency={cur}
                      aLabel="Pendapatan"
                      bLabel="Beban"
                      data={series.map((s) => ({ label: s.day, a: Number(s.income), b: Number(s.expense) }))}
                      summary={`Grafik batang pendapatan dan beban harian. Total pendapatan ${m(fin.income)}, total beban ${m(fin.expense)}.`}
                    />
                  )}
                </Card>
              ) : (
                <Card title="Ringkasan Operasional">
                  <p className="text-sm text-ink-2">Gunakan menu di sidebar untuk mengelola operasional sesuai peran perangkat ini.</p>
                </Card>
              )}

              <Card title="Peringatan Sistem" desc="Pemantauan otomatis dari data aktual">
                {alerts.length === 0 ? (
                  <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-ink-2">
                    Semua metrik aman. Tidak ada peringatan aktif.
                  </p>
                ) : (
                  <ul className="grid gap-2.5">
                    {alerts.map((a, idx) => (
                      <li key={idx}>
                        <Link
                          href={a.href}
                          className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 transition-transform hover:scale-[1.01] ${
                            a.tone === "critical"
                              ? "bg-[#0F1115] text-white"
                              : a.tone === "warn"
                                ? "bg-[#FEF9E7] text-ink"
                                : "bg-[#FFF5F2] text-ink"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold">{a.title}</p>
                            <p className={`truncate text-xs ${a.tone === "critical" ? "text-white/70" : "text-ink-2"}`}>{a.sub}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              a.tone === "critical"
                                ? "bg-[#3B4FF8] text-white"
                                : a.tone === "warn"
                                  ? "bg-[#FDE68A] text-[#854D0E]"
                                  : "bg-[#FED7AA] text-[#9A3412]"
                            }`}
                          >
                            {a.badge}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {fin && <Kpi label="Piutang Usaha" value={m(fin.receivables.v)} hint={`${fin.receivables.n} faktur belum lunas`} />}
              {fin && <Kpi label="Utang Usaha" value={m(fin.payables.v)} hint={`${fin.payables.n} tagihan supplier`} />}
              {data.sales && <Kpi label="Penjualan (periode)" value={m(data.sales.v)} hint={`${data.sales.n} faktur`} />}
              {data.tasks && (
                <Kpi
                  label="Tugas terbuka"
                  value={String(data.tasks.open)}
                  hint={`${data.tasks.overdue} lewat tenggat`}
                  tone={data.tasks.overdue > 0 ? "bad" : undefined}
                />
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card title="Aktivitas Terbaru" desc="Catatan kejadian sistem & transaksi terakhir">
                {!data.recent?.length ? (
                  <Empty title="Belum ada aktivitas" hint="Aktivitas penjualan, kas, dan stok akan muncul di sini." />
                ) : (
                  <DataTable
                    rows={data.recent}
                    columns={[
                      {
                        key: "action",
                        label: "Aktivitas",
                        render: (a: any) => <span className="font-semibold text-ink">{ACTION_LABEL[a.action] ?? a.action}</span>,
                      },
                      {
                        key: "operator",
                        label: "Operator / Perangkat",
                        render: (a: any) => <span className="text-ink-2">{a.operator ?? a.deviceName ?? "Perangkat"}</span>,
                      },
                      {
                        key: "createdAt",
                        label: "Waktu",
                        right: true,
                        render: (a: any) => <span className="text-xs text-ink-2">{fmtDateTime(a.createdAt)}</span>,
                      },
                    ]}
                  />
                )}
              </Card>

              <Card title="Tren Arus Kas" desc="Perbandingan harian pendapatan & beban">
                {series.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-2">Belum ada data grafik pada periode ini.</p>
                ) : (
                  <SplineAreaChart
                    currency={cur}
                    aLabel="Pendapatan"
                    bLabel="Beban"
                    data={series.map((s) => ({ label: s.day, a: Number(s.income), b: Number(s.expense) }))}
                    summary="Grafik tren pendapatan dan beban periode terpilih"
                  />
                )}
              </Card>
            </div>

            {fin && series.length === 0 && Number(data.sales?.n ?? 0) === 0 && (
              <Card title={`Langkah awal untuk ${biz.template.name}`} desc="Dari konfigurasi template bisnis Anda.">
                <ol className="grid gap-2 sm:grid-cols-2">
                  {biz.template.workflow.map((w: any, i: number) => (
                    <li key={i}>
                      <Link
                        href={w.href}
                        className="flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-medium hover:bg-primary-bg"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-bg text-xs font-bold text-primary-deep">
                          {i + 1}
                        </span>
                        {w.text}
                      </Link>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        )
      )}

      {data && tab === "finance" && fin && (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi pastel="lavender" icon={<WalletIcon />} label="Total Kas & Bank" value={m(fin.cashTotal)} hint="Saldo konsolidasi" />
            <Kpi pastel="mint" icon={<TrendUpIcon />} label="Piutang Usaha" value={m(fin.receivables.v)} hint={`${fin.receivables.n} faktur terbuka`} />
            <Kpi pastel="peach" icon={<ReceiptIcon />} label="Utang Usaha" value={m(fin.payables.v)} hint={`${fin.payables.n} tagihan belum lunas`} />
            <Kpi pastel="butter" icon={<ScaleIcon />} label="Menunggu Persetujuan" value={String(fin.pendingApprovals ?? 0)} hint="Pengeluaran perlu approval" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card
              title="Saldo Per Akun Kas & Bank"
              desc="Daftar rekening & laci kas aktif"
              actions={
                <Link href="/finance" className="text-xs font-semibold text-primary-deep hover:underline">
                  Kelola Akun →
                </Link>
              }
            >
              {accountsApi.loading ? (
                <Loading />
              ) : !(accountsApi.data?.items?.length) ? (
                <Empty title="Belum ada akun kas" hint="Tambahkan akun kas atau bank di modul Keuangan." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {accountsApi.data.items.map((acc: any) => (
                    <div key={acc.id} className="rounded-2xl border border-line bg-surface/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-ink">{acc.name}</p>
                        <Badge tone="info">{acc.type ?? "cash"}</Badge>
                      </div>
                      <p className="kpi-value mt-2 text-xl font-bold text-ink">{m(acc.balance ?? 0)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Aksi Cepat Keuangan" desc="Catat atau tinjau transaksi langsung">
              <div className="grid gap-2.5">
                {biz.can("finance:write") && (
                  <Button onClick={() => setQt(true)} className="w-full justify-start">
                    + Catat Pemasukan / Pengeluaran / Transfer
                  </Button>
                )}
                <Link
                  href="/finance"
                  className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface"
                >
                  <span>Buka Buku Besar & Persetujuan</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/reports"
                  className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface"
                >
                  <span>Laporan Laba Rugi & Neraca</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/reports/export"
                  className="inline-flex min-h-[42px] items-center justify-between rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface"
                >
                  <span>Unduh Laporan Keuangan (PDF / Excel)</span>
                  <span>→</span>
                </Link>
              </div>
              {Number(fin.budget?.budget) > 0 && (
                <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink">
                    <span>Penggunaan Anggaran</span>
                    <span>{Math.round((Number(fin.budget.actual) / Number(fin.budget.budget)) * 100)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-2">
                    {m(fin.budget.actual)} dari {m(fin.budget.budget)}
                  </p>
                  <div className="mt-2 h-2.5 rounded-full bg-line">
                    <div
                      className={`h-2.5 rounded-full ${Number(fin.budget.actual) > Number(fin.budget.budget) ? "bg-coral" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (Number(fin.budget.actual) / Number(fin.budget.budget)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card title="Transaksi Keuangan Terbaru" desc="8 entri transaksi kas/bank terakhir">
            {txApi.loading ? (
              <Loading />
            ) : (
              <DataTable
                rows={txApi.data?.items ?? []}
                columns={[
                  {
                    key: "txDate",
                    label: "Tanggal",
                    render: (r: any) => <span className="text-xs text-ink-2">{fmtDateTime(r.txDate ?? r.createdAt)}</span>,
                  },
                  { key: "type", label: "Jenis", render: (r: any) => <Badge status={r.type} /> },
                  { key: "description", label: "Keterangan", render: (r: any) => r.description || "—" },
                  { key: "status", label: "Status", render: (r: any) => <Badge status={r.status} /> },
                  { key: "amount", label: "Nominal", right: true, render: (r: any) => <span className="font-semibold">{m(r.amount)}</span> },
                ]}
              />
            )}
          </Card>
        </div>
      )}

      <QuickTx
        open={qt}
        onClose={() => setQt(false)}
        onDone={() => {
          reload();
          accountsApi.reload();
          txApi.reload();
        }}
      />
    </>
  );
}
