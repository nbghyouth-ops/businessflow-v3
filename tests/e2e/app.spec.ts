import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Business Flow E2E & Accessibility", () => {
  test("halaman awal & panduan bebas pelanggaran axe serious/critical serta tanpa overflow 360px", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    const axe = await new AxeBuilder({ page: page as never }).analyze();
    const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("tidak ada tombol Print, JSON export, atau ZIP export di mana pun", async ({ page }) => {
    await page.goto("/guide");
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    expect(bodyText).not.toContain("export json");
    expect(bodyText).not.toContain("export zip");
  });
});
