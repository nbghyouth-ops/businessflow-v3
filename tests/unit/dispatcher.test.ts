import { describe, expect, it } from "vitest";
import { computeBackoffSeconds, HANDLERS, validateTriggerHeaders } from "../../functions/job-dispatcher/index";

describe("Neon Function job-dispatcher", () => {
  it("menghitung exponential backoff dengan jitter", () => {
    expect(computeBackoffSeconds(1, 0)).toBe(60);
    expect(computeBackoffSeconds(2, 0)).toBe(120);
    expect(computeBackoffSeconds(10, 0.5)).toBe(3607);
  });

  it("memvalidasi header trigger Neon", () => {
    const req1 = new Request("https://fn.local", { headers: { "x-neon-trigger": "sched-1" } });
    expect(validateTriggerHeaders(req1)).toEqual({ ok: true, source: "neon_trigger" });
    const req2 = new Request("https://fn.local");
    expect(validateTriggerHeaders(req2)).toEqual({ ok: false, source: "unverified" });
  });

  it("memiliki handler allowlist untuk reminder dan cleanup", () => {
    expect(typeof HANDLERS["invoice.due_reminder"]).toBe("function");
    expect(typeof HANDLERS["stock.low_alert"]).toBe("function");
    expect(typeof HANDLERS["system.cleanup"]).toBe("function");
  });
});
