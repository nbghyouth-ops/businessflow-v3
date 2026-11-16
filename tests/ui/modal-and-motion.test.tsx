// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { useState } from "react";
import { Modal } from "@/components/ui";
import { Reveal } from "@/components/motion";

function Host({ onClose }: { onClose: () => void }) {
  const [open] = useState(true);
  return (<><button>di luar</button><Modal open={open} onClose={onClose} title="Uji"><input aria-label="isi" /><button>Simpan</button></Modal></>);
}

describe("Modal", () => {
  it("Esc menutup, fokus awal ke dalam dialog, focus trap Tab/Shift+Tab", async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const dlg = screen.getByRole("dialog", { name: "Uji" });
    expect(dlg.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 6; i++) { await userEvent.tab(); expect(dlg.contains(document.activeElement)).toBe(true); }
    await userEvent.tab({ shift: true });
    expect(dlg.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
  it("tombol tutup memenuhi target sentuh 44px (kelas h-11 w-11) dan dialog lolos axe", async () => {
    const { baseElement } = render(<Host onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "Tutup" }).className).toMatch(/h-11/);
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

describe("Reveal & prefers-reduced-motion", () => {
  it("reduced-motion: konten langsung terlihat tanpa menunggu IntersectionObserver", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {}, media: q }));
    const io = vi.fn();
    vi.stubGlobal("IntersectionObserver", io);
    render(<Reveal><p>isi</p></Reveal>);
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByText("isi").parentElement?.className).toMatch(/reveal-in/);
    expect(io).not.toHaveBeenCalled();
  });
  it("normal: observer dipasang dan elemen ditampilkan SEKALI saat terlihat", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, addEventListener() {}, removeEventListener() {}, media: q }));
    let cb: (e: { isIntersecting: boolean }[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class { constructor(c: typeof cb) { cb = c; } observe() {} disconnect = disconnect; });
    render(<Reveal><p>kartu</p></Reveal>);
    const wrap = screen.getByText("kartu").parentElement!;
    expect(wrap.className).not.toMatch(/reveal-in/);
    const { act } = await import("@testing-library/react");
    act(() => cb([{ isIntersecting: true }]));
    expect(wrap.className).toMatch(/reveal-in/);
    expect(disconnect).toHaveBeenCalled();
  });
});
