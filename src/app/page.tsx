import Link from "next/link";
import { redirect } from "next/navigation";
import { DbStatusScreen } from "@/components/db-status-screen";
import { Logo } from "@/components/ui";
import { headers } from "next/headers";
import { authConfigured, getUserSession } from "@/server/auth/session";
import { getSessionState } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function Welcome() {
  const session = await getSessionState();
  if (session.status === "db_error") {
    return <DbStatusScreen reason={session.reason} />;
  }
  if (session.grant) redirect(session.accountRequired ? "/sign-in?reason=session" : "/dashboard");
  const us = (await authConfigured()) ? await getUserSession(await headers()) : null;
  if (!us) redirect("/sign-in");
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-xl rounded-[24px] border border-line bg-white p-8 shadow-pop sm:p-10">
        <Logo size={44} />
        <h1 className="mt-8 text-[30px] font-bold leading-tight text-ink sm:text-[34px]">Selamat Datang di Business Flow</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Mari siapkan sistem pengelolaan bisnis yang sesuai kebutuhan usaha Anda. Kami akan membantu Anda memilih jenis usaha, melengkapi profil, dan menyiapkan sistem secara bertahap.
        </p>
        <div className="mt-8 grid gap-3">
          <Link href="/onboarding" className="flex min-h-[48px] items-center justify-center rounded-xl bg-primary-deep px-5 text-[15px] font-semibold text-white hover:bg-primary-dark">Mulai Siapkan Bisnis</Link>
          <Link href="/guide" className="flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-white px-5 text-[15px] font-semibold text-ink hover:bg-primary-bg">Pelajari Cara Menggunakan Business Flow</Link>
          <Link href="/pair" className="flex min-h-[48px] items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-primary-deep hover:bg-primary-bg">Sambungkan Perangkat ke Bisnis yang Sudah Ada</Link>
        </div>
        <p className="mt-8 text-xs text-ink-2">Anda masuk dengan Google. Perangkat ini juga dikunci dengan PIN sebagai lapisan keamanan kedua.</p>
      </div>
    </main>
  );
}
