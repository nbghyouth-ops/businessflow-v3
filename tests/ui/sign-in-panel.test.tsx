// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { SignInPanel } from "@/components/sign-in-panel";

beforeEach(() => vi.restoreAllMocks());

describe("SignInPanel", () => {
  it("belum dikonfigurasi: tampil Mode Perangkat + tautan penyiapan + alasan tanpa nama secret", () => {
    render(<SignInPanel configured={false} />);
    const link = screen.getByRole("link", { name: /mulai penyiapan di perangkat ini/i });
    expect(link.getAttribute("href")).toBe("/onboarding?mode=device");
    const note = screen.getByText(/belum dikonfigurasi/i);
    expect(note.textContent).not.toMatch(/GOOGLE_CLIENT|BETTER_AUTH/);
  });

  it("klik: memanggil endpoint auth dengan provider google dan callbackURL internal, mencegah double-submit", async () => {
    let calls = 0;
    const fetchMock = vi.fn(async (u: RequestInfo | URL, init?: RequestInit) => {
      const url = String(u);
      if (url.includes("/auth/emergency/status")) {
        return new Response(JSON.stringify({ available: false, reason: "trigger_not_met" }), { status: 200 });
      }
      calls++;
      const body = JSON.parse(String(init?.body));
      expect(body.provider).toBe("google");
      expect(body.callbackURL).toBe("/invite");
      return new Response(JSON.stringify({ url: "about:blank#google" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", { value: { assign: vi.fn() }, writable: true });
    render(<SignInPanel configured next="/invite" />);
    const btn = screen.getByRole("button", { name: /masuk dengan google/i });
    await userEvent.dblClick(btn);
    await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith("about:blank#google"));
    expect(calls).toBe(1);
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("gagal: pesan error diumumkan (role=alert) dan tombol aktif kembali", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    render(<SignInPanel configured />);
    await userEvent.click(screen.getByRole("button", { name: /masuk dengan google/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/tidak dapat memulai/i);
    expect((screen.getByRole("button", { name: /masuk dengan google/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("dibatalkan/ditolak (error=1) dan sesi berakhir menampilkan pesan", () => {
    const { unmount } = render(<SignInPanel configured error="1" />);
    expect(screen.getByRole("alert").textContent).toMatch(/dibatalkan|ditolak/i);
    unmount();
    render(<SignInPanel configured reason="session" />);
    expect(screen.getByRole("alert").textContent).toMatch(/sesi anda berakhir/i);
  });

  it("tanpa pelanggaran aksesibilitas (axe) pada state normal dan error", async () => {
    const { container } = render(<SignInPanel configured error="1" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
