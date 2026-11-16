import { describe, expect, it } from "vitest";
import { activityFilename, fmtCentsDisplay, receiptFilename, safeFileSlug } from "@/lib/export-render";

describe("Export Center helpers (F-17)", () => {
  it("memformat nominal Rupiah dan mata uang asing tanpa pecahan untuk IDR", () => {
    expect(fmtCentsDisplay("1500000", "IDR")).toBe("Rp 15.000");
    expect(fmtCentsDisplay("-250000", "IDR")).toBe("-Rp 2.500");
    expect(fmtCentsDisplay("12345", "USD")).toBe("USD 123,45");
  });

  it("menghasilkan nama file aman untuk struk dan aktivitas", () => {
    expect(safeFileSlug("Toko Maju Jaya!")).toBe("toko-maju-jaya");
    expect(receiptFilename("INV-00012", "80mm", "pdf")).toBe("struk-inv-00012-80mm.pdf");
    expect(activityFilename("Kopi Nusantara", "2026-10-01", "2026-10-31", "executive", "xlsx")).toBe(
      "aktivitas-kopi-nusantara-2026-10-01_2026-10-31-executive.xlsx",
    );
  });
});
