import { expect, test } from "@playwright/test";

test("shows the same calm error for malformed links", async ({ page }) => {
  await page.goto("/invalid");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /no está disponible|not available|não está disponível/i,
  );
  await expect(page).toHaveTitle(/Tranka/);
});
