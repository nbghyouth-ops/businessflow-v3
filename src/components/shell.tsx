"use client";
 
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api, fmtDateTime, useApi } from "@/lib/client";
import { can, type Permission } from "@/lib/permissions";
import { useLock } from "./lock-provider";
import { AccountMenu } from "./account-menu";
import { useScrolled } from "./motion";
import { Button, ErrorBox, Loading, Logo, Modal, Toaster } from "./ui";
import { FallbackBanner } from "./fallback/boundaries";

export type BizCtx = {
  business: any;
  branches: any[];
  warehouses: any[];
  template: any;
  role: string;
  currency: string;
  reload: () => void;
  mode: "simple" | "advanced";
  setMode: (m: "simple" | "advanced") => void;
  can: (p: Permission) => boolean;
};
const Ctx = createContext<BizCtx | null>(null);
export const useBiz = () => useContext(Ctx)!;

type Item = { href: string; label: string; perm?: Permission; key: string; advanced?: boolean };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [{ href: "/dashboard", label: "Dashboard", key: "dashboard" }] },
  {
    title: "Business Operations",
    items: [
      { href: "/finance", label: "Keuangan", perm: "finance:read", key: "finance" },
      { href: "/sales", label: "Penjualan & POS", perm: "sales:read", key: "sales" },
      { href: "/bookings", label: "Pesanan & Booking", perm: "booking:read", key: "bookings" },
      { href: "/products", label: "Produk & Stok", perm: "inventory:read", key: "products" },
      { href: "/purchasing", label: "Pembelian & Supplier", perm: "purchasing:read", key: "purchasing" },
      { href: "/crm", label: "CRM / Klien", perm: "crm:read", key: "crm" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/hr", label: "Karyawan & HR", perm: "hr:read", key: "hr", advanced: true },
      { href: "/tasks", label: "Tugas & Tim", perm: "tasks:read", key: "tasks" },
      { href: "/operations", label: "Operasional & Kas", perm: "ops:read", key: "operations", advanced: true },
      { href: "/marketing", label: "Pemasaran", perm: "marketing:read", key: "marketing", advanced: true },
      { href: "/projects", label: "Proyek", perm: "projects:read", key: "projects", advanced: true },
      { href: "/assets", label: "Aset & Dokumen", perm: "assets:read", key: "assets", advanced: true },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/reports", label: "Laporan & Analitik", perm: "reports:read", key: "reports" },
      { href: "/reports/export", label: "Export & Activity Center", perm: "reports:read", key: "export" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/settings", label: "Pengaturan & Data Master", perm: "settings:write", key: "settings" },
      { href: "/templates", label: "Template Bisnis", key: "templates", advanced: true },
      { href: "/devices", label: "Perangkat & Keamanan", perm: "devices:read", key: "devices" },
      { href: "/legal", label: "Syarat & Privasi", key: "legal" },
      { href: "/help", label: "Pusat Bantuan", key: "help" },
    ],
  },
];

const TOUR = [
  { sel: "[data-tour=sidebar]", title: "Sidebar", text: "Semua modul ada di sini, dikelompokkan sesuai alur kerja. Titik biru menandai modul prioritas untuk template bisnis Anda." },
  { sel: "[data-tour=topbar]", title: "Topbar", text: "Cari klien/produk/faktur, lihat notifikasi, bantuan, status perangkat, dan tombol Kunci." },
  { sel: "[data-tour=biz]", title: "Bisnis & cabang", text: "Menampilkan bisnis dan cakupan cabang perangkat ini. Kelola cabang di Pengaturan." },
  { sel: "[data-tour=page-header]", title: "Ringkasan", text: "Setiap halaman diawali judul dan rentang tanggal/aksi utama." },
  { sel: "[data-tour=quick]", title: "Aksi cepat", text: "Catat pemasukan, pengeluaran, atau transfer dengan keypad angka dari sini." },
  { sel: "[data-tour=nav-finance]", title: "Keuangan", text: "Akun kas & bank, transaksi, jurnal, piutang/utang, anggaran, dan penutupan periode." },
  { sel: "[data-tour=nav-crm]", title: "CRM / Klien", text: "Pusat data klien: kontak, aktivitas, faktur, dan riwayat." },
  { sel: "[data-tour=nav-products]", title: "Produk & Stok", text: "Katalog, ledger stok, dan penyesuaian stok." },
  { sel: "[data-tour=nav-reports]", title: "Laporan", text: "Neraca saldo, laba rugi, neraca, arus kas, buku besar. Ekspor CSV/PDF/XLSX tersedia." },
  { sel: "[data-tour=nav-devices]", title: "Perangkat & Keamanan", text: "Tambah perangkat dengan kode pairing, atur peran, cabut akses, dan lihat audit." },
  { sel: "[data-tour=nav-help]", title: "Pusat Bantuan", text: "Panduan, FAQ, glosarium, dan mulai ulang tur ini kapan saja." },
];

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("bf-mode", cb);
  window.addEventListener("bf-tour", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("bf-mode", cb);
    window.removeEventListener("bf-tour", cb);
  };
}

export function Shell({
  children,
  authMode = "google",
  emergencyExpiresAt = null,
}: {
  children: ReactNode;
  authMode?: "google" | "device";
  emergencyExpiresAt?: string | null;
}) {
  const { data, error, reload } = useApi<any>("/business");
  const savedMode = useSyncExternalStore(
    subscribeStorage,
    () => (typeof window !== "undefined" ? (localStorage.getItem("bf_mode") as "simple" | "advanced" | null) : null),
    () => null,
  );
  const mode: "simple" | "advanced" = savedMode ?? data?.business?.settings?.mode ?? "simple";
  const setMode = (m: "simple" | "advanced") => {
    localStorage.setItem("bf_mode", m);
    window.dispatchEvent(new Event("bf-mode"));
  };

  const value = useMemo<BizCtx | null>(
    () =>
      data
        ? {
            ...data,
            currency: data.business.currency,
            reload,
            mode,
            setMode,
            can: (p: Permission) => can(data.role, p),
          }
        : null,
    [data, mode, reload],
  );
  if (error) return <div className="p-8"><ErrorBox message={error} onRetry={reload} /></div>;
  if (!value) return <Loading text="Menyiapkan dashboard…" />;
  return (
    <Ctx.Provider value={value}>
      <Frame authMode={authMode} emergencyExpiresAt={emergencyExpiresAt}>{children}</Frame>
      <Toaster />
    </Ctx.Provider>
  );
}

function Frame({
  children,
  authMode = "google",
  emergencyExpiresAt = null,
}: {
  children: ReactNode;
  authMode?: "google" | "device";
  emergencyExpiresAt?: string | null;
}) {
  const biz = useBiz();
  const scrolled = useScrolled();
  const path = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === path;
  const setOpen = (v: boolean) => setOpenForPath(v ? path : null);
  const { lock } = useLock();
  const recommended = new Set<string>(biz.template.modules);
  const visible = (i: Item) =>
    (!i.perm || biz.can(i.perm)) && (biz.mode === "advanced" || !i.advanced || recommended.has(i.key));
  const mainBranch = biz.branches.find((b: any) => b.isMain)?.name ?? "Pusat";

  return (
    <div className="min-h-dvh bg-[#141518] lg:grid lg:grid-cols-[264px_1fr]">
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>
      {open && (
        <div className="fixed inset-0 z-30 bg-[rgba(17,24,39,0.55)] lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside
        data-tour="sidebar"
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col justify-between overflow-y-auto bg-[#141518] px-4 py-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <div className="mb-6 flex items-center justify-between px-2">
            <Logo dark />
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#22242A] hover:text-white lg:hidden"
            >
              ×
            </button>
          </div>
          <nav>
            {GROUPS.map((g) => {
              const items = g.items.filter(visible);
              if (!items.length) return null;
              return (
                <div key={g.title} className="mb-5">
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{g.title}</p>
                  <ul className="space-y-0.5">
                    {items.map((i) => {
                      const active = path === i.href || (i.href !== "/reports" && path.startsWith(i.href + "/"));
                      return (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            onClick={() => setOpen(false)}
                            data-tour={`nav-${i.key}`}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-[40px] items-center justify-between rounded-full px-3.5 text-[13.5px] font-medium transition-colors ${
                              active
                                ? "bg-white font-semibold text-[#141518] shadow-sm"
                                : "text-[#9CA3AF] hover:bg-[#22242A] hover:text-white"
                            }`}
                          >
                            <span className="truncate">{i.label}</span>
                            {recommended.has(i.key) && (
                              <span
                                title="Prioritas untuk template bisnis Anda"
                                aria-label="Prioritas template"
                                className={`h-2 w-2 shrink-0 rounded-full ${active ? "bg-primary" : "bg-primary-light"}`}
                              />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Kartu Mode & Keamanan Fungsional (menggantikan promo palsu) */}
        <div
          className="mt-4 rounded-[20px] p-4 text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #2A3BD4 0%, #4F63FF 100%)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Mode Tampilan</p>
          <p className="mt-1 text-sm font-bold">{biz.mode === "simple" ? "Mode Sederhana" : "Mode Lanjutan"}</p>
          <p className="mt-0.5 text-xs text-white/80">
            {biz.mode === "simple" ? "Menampilkan modul inti usaha Anda." : "Semua modul operasional & HR aktif."}
          </p>
          <button
            type="button"
            onClick={() => biz.setMode(biz.mode === "simple" ? "advanced" : "simple")}
            className="mt-3 w-full rounded-full bg-white px-3 py-2 text-xs font-bold text-[#141518] transition-colors hover:bg-[#EEF1FF]"
          >
            {biz.mode === "simple" ? "Aktifkan Mode Lanjutan" : "Kembali ke Mode Sederhana"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 bg-surface lg:my-2.5 lg:mr-2.5 lg:overflow-hidden lg:rounded-[24px]">
        <header
          data-tour="topbar"
          className={`topbar sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line/80 bg-surface/95 px-4 py-3 backdrop-blur lg:px-8 ${scrolled ? "topbar-scrolled" : ""}`}
        >
          <button
            aria-label="Buka menu"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-lg text-ink lg:hidden"
          >
            ☰
          </button>

          <div data-tour="biz" className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-deep text-sm font-bold text-white">
              {biz.business.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">{biz.business.name}</p>
              <DeviceSubline mainBranch={mainBranch} branchCount={biz.branches.length} />
            </div>
          </div>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-2">
            <Bell />
            <Link
              href="/help"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-sm font-bold text-ink hover:bg-primary-bg hover:text-primary-deep"
              aria-label="Bantuan"
            >
              ?
            </Link>
            <button
              type="button"
              onClick={lock}
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-xs font-semibold text-ink hover:bg-primary-bg hover:text-primary-deep"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              Kunci
            </button>
            <AccountMenu currentWorkspaceName={biz.business.name} />
          </div>
        </header>
        {emergencyExpiresAt ? (
          <FallbackBanner kind="emergency" expiresAt={emergencyExpiresAt} />
        ) : authMode === "device" ? (
          <FallbackBanner kind="device_mode" />
        ) : null}
        <main id="konten" className="safe-pb px-4 py-5 sm:py-6 lg:px-8">
          <div key={path} className="anim-page-enter mx-auto max-w-[1280px]">{children}</div>
        </main>
      </div>
      <Tour />
    </div>
  );
}

function DeviceSubline({ mainBranch, branchCount }: { mainBranch: string; branchCount: number }) {
  const { data } = useApi<any>("/device/me");
  return (
    <p className="text-xs text-ink-2" title="Perangkat terdaftar (lapisan keamanan kedua setelah akun Google)">
      {mainBranch}{branchCount > 1 ? ` (+${branchCount - 1})` : ""} · {data?.deviceName ?? "Perangkat"} ({data?.role ?? "aktif"})
    </p>
  );
}

function Bell() {
  const [open, setOpen] = useState(false);
  const { data, reload } = useApi<any>(open ? "/notifications" : null);
  const items: any[] = data?.items ?? [];
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="relative">
      <button
        aria-label="Notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink hover:bg-primary-bg hover:text-primary-deep"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary-deep px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-[20px] border border-line bg-white p-4 shadow-pop">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifikasi</p>
            {unread > 0 && (
              <button
                className="text-xs font-semibold text-primary-deep"
                onClick={async () => {
                  await api("/notifications/read", { body: {} });
                  reload();
                }}
              >
                Tandai dibaca
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-2">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-t border-divider py-2 text-sm">
                  <p className={n.readAt ? "text-ink-2" : "font-semibold"}>{n.title}</p>
                  {n.body && <p className="text-xs text-ink-2">{n.body}</p>}
                  <p className="text-[11px] text-ink-2">{fmtDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const t = setTimeout(() => {
      api<any>(`/search?q=${encodeURIComponent(trimmed)}`)
        .then((d) => setRes(d.items))
        .catch(() => setRes([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const visibleRes = q.trim().length >= 2 ? res : [];
  return (
    <div className="relative min-w-[180px] flex-1 md:ml-4 md:max-w-sm">
      <label className="sr-only" htmlFor="gsearch">
        Cari klien, produk, atau faktur
      </label>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </span>
      <input
        id="gsearch"
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (v.trim().length < 2) setRes([]);
        }}
        placeholder="Cari klien, produk, faktur…"
        className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-ink placeholder:text-ink-2 focus:border-primary focus:outline-none"
        autoComplete="off"
      />
      {q.trim().length >= 2 && (
        <ul className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          {visibleRes.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-2">Tidak ada hasil.</li>
          ) : (
            visibleRes.map((r) => (
              <li key={r.type + r.id}>
                <button
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface"
                  onClick={() => {
                    setQ("");
                    setRes([]);
                    router.push(r.href);
                  }}
                >
                  <span className="truncate font-medium">{r.label}</span>
                  <span className="shrink-0 text-xs text-ink-2">{r.type}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ───────── Guided tour (dapat dihentikan & dilanjutkan) ───────── */
export function startTour() {
  localStorage.setItem("bf_tour", "running");
  localStorage.setItem("bf_tour_step", "0");
  window.dispatchEvent(new Event("bf-tour"));
}

function Tour() {
  const tourSnapshot = useSyncExternalStore(
    subscribeStorage,
    () =>
      typeof window !== "undefined"
        ? `${localStorage.getItem("bf_tour") ?? ""}|${localStorage.getItem("bf_tour_step") ?? "0"}`
        : "|0",
    () => "|0",
  );
  const [rawState, rawStep] = tourSnapshot.split("|");
  const state = rawState || null;
  const step = Number(rawStep || 0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (state !== "running") return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(TOUR[step]?.sel);
      el?.scrollIntoView({ block: "nearest" });
      setRect(el ? el.getBoundingClientRect() : null);
    });
    return () => cancelAnimationFrame(raf);
  }, [state, step]);

  const set = (s: string | null, n = step) => {
    if (s) localStorage.setItem("bf_tour", s);
    localStorage.setItem("bf_tour_step", String(n));
    window.dispatchEvent(new Event("bf-tour"));
  };

  if (state === "pending") {
    return (
      <Modal open onClose={() => set("dismissed")} title="Ingin tur singkat Business Flow?">
        <p className="mb-4 text-sm text-ink-2">
          Tur ini mengenalkan sidebar, topbar, aksi cepat, dan modul utama. Anda dapat menghentikannya kapan saja dan melanjutkannya dari Pusat Bantuan.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => set("dismissed")}>
            Nanti saja
          </Button>
          <Button onClick={() => set("running", 0)}>Mulai tur</Button>
        </div>
      </Modal>
    );
  }
  if (state !== "running") return null;
  const s = TOUR[step];
  return (
    <>
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[55] rounded-xl ring-4 ring-gold"
          style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }}
        />
      )}
      <div
        role="dialog"
        aria-label={`Tur: ${s.title}`}
        className="fixed bottom-4 left-1/2 z-[56] w-[min(94vw,420px)] -translate-x-1/2 rounded-2xl border border-line bg-white p-4 shadow-pop"
      >
        <p className="text-xs font-semibold text-primary-deep">
          Langkah {step + 1} dari {TOUR.length}
        </p>
        <h2 className="text-base font-bold">{s.title}</h2>
        <p className="mt-1 text-sm text-ink-2">{s.text}</p>
        <div className="mt-3 flex justify-between gap-2">
          <Button variant="ghost" onClick={() => set("paused")}>
            Hentikan
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => set("running", step - 1)}>
                Kembali
              </Button>
            )}
            {step < TOUR.length - 1 ? (
              <Button onClick={() => set("running", step + 1)}>Lanjut</Button>
            ) : (
              <Button onClick={() => set("done", 0)}>Selesai</Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
