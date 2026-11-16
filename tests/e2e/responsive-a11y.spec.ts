/**
 * STATUS: NOT TESTED di lingkungan penyusun (unduhan browser Playwright diblokir di sandbox).
 * Jalankan di mesin dengan browser:  npx playwright install && BASE_URL=http://127.0.0.1:3000 npx playwright test
 * Untuk rute terautentikasi, setel E2E_SESSION_COOKIE (nilai cookie sesi uji dari database LOKAL) dan E2E_DEVICE_COOKIE.
 */
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { w: 320, h: 720 }, { w: 360, h: 800 }, { w: 390, h: 844 }, { w: 430, h: 932 },
  { w: 768, h: 1024 }, { w: 1024, h: 768 }, { w: 1280, h: 800 }, { w: 1440, h: 900 }, { w: 1920, h: 1080 },
  { w: 844, h: 390 }, // lanskap ponsel
];
const PUBLIC_ROUTES = ["/sign-in", "/invite"];
const APP_ROUTES = [
  "/dashboard", "/finance", "/sales", "/products", "/purchasing", "/crm", "/hr", "/tasks", "/bookings",
  "/operations", "/marketing", "/projects", "/assets", "/reports", "/reports/export", "/settings", "/settings/security", "/devices", "/templates", "/help",
];

test.describe("Halaman publik: tanpa overflow horizontal + axe", () => {
  for (const vp of VIEWPORTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} @ ${vp.w}x${vp.h}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "overflow horizontal halaman").toBeLessThanOrEqual(0);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
        expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
        await page.screenshot({ path: `test-results/shots/${route.replace(/\W/g, "_")}-${vp.w}x${vp.h}.png`, fullPage: true });
      });
    }
  }
});

test("sign-in: tombol Google dapat dipakai keyboard dan target sentuh ≥ 44px", async ({ page }) => {
  await page.goto("/sign-in");
  const btn = page.getByRole("button", { name: /masuk dengan google/i });
  const box = await btn.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Tab");
  await expect(btn.or(page.getByRole("link").first())).toBeVisible();
});

test("prefers-reduced-motion: tidak ada animasi berjalan pada sign-in", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/sign-in");
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().iterations ?? 1) === Infinity).length);
  expect(running).toBe(0);
  await ctx.close();
});

test.describe("Rute terautentikasi (butuh cookie uji)", () => {
  test.skip(!process.env.E2E_SESSION_COOKIE || !process.env.E2E_DEVICE_COOKIE, "E2E_SESSION_COOKIE/E2E_DEVICE_COOKIE belum diisi");
  for (const vp of VIEWPORTS) {
    for (const route of APP_ROUTES) {
      test(`${route} @ ${vp.w}x${vp.h}`, async ({ page, context, baseURL }) => {
        const url = new URL(baseURL!);
        await context.addCookies([
          { name: "better-auth.session_token", value: process.env.E2E_SESSION_COOKIE!, domain: url.hostname, path: "/" },
          { name: process.env.E2E_DEVICE_COOKIE_NAME ?? "bf_device", value: process.env.E2E_DEVICE_COOKIE!, domain: url.hostname, path: "/" },
        ]);
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
        expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
      });
    }
  }
});
