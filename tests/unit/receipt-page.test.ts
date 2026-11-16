import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { receiptPdfPage } from "@/lib/export-render";

const size = (preset: string) => {
  const p = receiptPdfPage(preset);
  const d = new jsPDF({ orientation: "portrait", unit: "mm", format: p.format });
  return { w: Math.round(d.internal.pageSize.getWidth()), h: Math.round(d.internal.pageSize.getHeight()) };
};

describe("Ukuran halaman struk PDF", () => {
  it("A4 = 210×297 mm", () => expect(size("a4")).toEqual({ w: 210, h: 297 }));
  it("A5 = 148×210 mm", () => expect(size("a5")).toEqual({ w: 148, h: 210 }));
  it("preset lama a4_a5 tetap A5 (kompatibel riwayat)", () => expect(size("a4_a5")).toEqual({ w: 148, h: 210 }));
  it("58 mm dan 80 mm lebar benar", () => {
    expect(size("58mm").w).toBe(58);
    expect(size("80mm").w).toBe(80);
  });
  it("A4 dan A5 benar-benar berbeda", () => expect(size("a4")).not.toEqual(size("a5")));
});
