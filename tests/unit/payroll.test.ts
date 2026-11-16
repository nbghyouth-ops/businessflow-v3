import { describe, expect, it } from "vitest";
import { calcPayroll, PayrollError } from "@/server/payroll";

const base = { allowances: [], manualDeductions: [], absentDays: 0, policy: { mode: "none" as const } };

describe("calcPayroll (vektor angka)", () => {
  it("tanpa kebijakan absensi: bersih = pokok + tunjangan − potongan manual", () => {
    const r = calcPayroll({ ...base, salaryCents: 500_000_000n, allowances: [{ label: "Transport", amountCents: 50_000_000n }], manualDeductions: [{ label: "Kasbon", amountCents: 10_000_000n }] });
    expect(r.grossCents).toBe(550_000_000n);
    expect(r.deductionsCents).toBe(10_000_000n);
    expect(r.netCents).toBe(540_000_000n);
  });
  it("potongan absensi per hari kerja dibulatkan ke bawah: 5.000.000 × 2 / 22", () => {
    const r = calcPayroll({ ...base, salaryCents: 500_000_000n, absentDays: 2, policy: { mode: "per_working_day", workingDays: 22 } });
    expect(r.absenceDeductionCents).toBe(45_454_545n); // floor(1_000_000_000 / 22)
    expect(r.netCents).toBe(500_000_000n - 45_454_545n);
  });
  it("kombinasi tunjangan + absensi + potongan manual", () => {
    const r = calcPayroll({
      salaryCents: 500_000_000n, absentDays: 2, policy: { mode: "per_working_day", workingDays: 22 },
      allowances: [{ label: "Makan", amountCents: 50_000_000n }], manualDeductions: [{ label: "Kasbon", amountCents: 10_000_000n }],
    });
    expect(r.grossCents).toBe(550_000_000n);
    expect(r.deductionsCents).toBe(55_454_545n);
    expect(r.netCents).toBe(494_545_455n);
    expect(r.grossCents - r.deductionsCents).toBe(r.netCents);
  });
  it("hari absen melebihi hari kerja dibatasi (maksimum potong = gaji pokok)", () => {
    const r = calcPayroll({ ...base, salaryCents: 100n, absentDays: 40, policy: { mode: "per_working_day", workingDays: 20 } });
    expect(r.absenceDeductionCents).toBe(100n);
    expect(r.netCents).toBe(0n);
  });
  it("potongan melebihi gaji kotor ditolak (tidak dipotong diam-diam jadi 0)", () => {
    expect(() => calcPayroll({ ...base, salaryCents: 100n, manualDeductions: [{ label: "x", amountCents: 101n }] })).toThrow(PayrollError);
  });
  it("jejak perhitungan dapat direproduksi", () => {
    const a = calcPayroll({ ...base, salaryCents: 123_456n });
    const b = calcPayroll({ ...base, salaryCents: 123_456n });
    expect(a.trace).toEqual(b.trace);
    expect(a.trace.at(-1)).toContain("gaji bersih");
  });
});
