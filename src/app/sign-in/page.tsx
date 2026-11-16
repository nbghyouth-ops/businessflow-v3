import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Logo } from "@/components/ui";
import { SignInPanel } from "@/components/sign-in-panel";
import { getUserSession } from "@/server/auth/session";
import { resolveAuthConfig } from "@/server/fallback/config";
import { safeNext } from "@/lib/safe-next";


export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk — Business Flow" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const cfg = await resolveAuthConfig();
  const configured = cfg.mode !== "unconfigured";
  if (configured) {
    const us = await getUserSession(await headers());
    if (us) redirect(safeNext(sp.next));
  }
  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-[#141518] p-12 text-white lg:flex">
        <Logo size={44} />
        <div>
          <h2 className="text-[32px] font-bold leading-tight">Satu tempat untuk seluruh alur bisnis Anda.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            Penjualan, stok, keuangan, tim, dan laporan tersimpan aman di database Business Flow dan dapat Anda buka dari perangkat mana pun.
          </p>
        </div>
        <p className="text-xs text-white/50">Google hanya memverifikasi identitas Anda.</p>
      </aside>
      <section className="flex items-center justify-center px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-md rounded-[24px] border border-line bg-white p-8 shadow-pop">
          <div className="lg:hidden"><Logo size={40} /></div>
          <h1 className="mt-6 text-[26px] font-bold text-ink lg:mt-0">Masuk ke Business Flow</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Gunakan akun Google Anda. Data bisnis Anda disimpan di database Business Flow, bukan di Google.
          </p>
          <SignInPanel configured={configured} reason={sp.reason} error={sp.error} next={safeNext(sp.next)} />
        </div>
      </section>
    </main>
  );
}
