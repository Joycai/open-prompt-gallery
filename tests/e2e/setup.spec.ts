import { test, expect } from "@playwright/test";
test("first-run admin setup closes permanently and protects the library", async ({
  page,
  browser,
  request,
}) => {
  test.skip(
    process.env.TEST_FIRST_RUN !== "1",
    "Requires a dedicated freshly migrated database and no APP_PASSWORD.",
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  expect(
    (
      await request.get("/api/images/00000000-0000-0000-0000-000000000000")
    ).status(),
  ).toBe(401);
  expect((await request.post("/api/upload")).status()).toBe(401);
  const other = await browser.newContext();
  const stale = await other.newPage();
  await stale.goto(page.url());
  const password = "setup-test-password-123";
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("mismatched-password");
  await page.getByRole("button", { name: "Create admin account" }).click();
  await expect(page.locator("form [role=alert]")).toContainText(
    "Passwords do not match",
  );
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create admin account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await stale
    .getByLabel("Password", { exact: true })
    .fill("replacement-password");
  await stale.getByLabel("Confirm password").fill("replacement-password");
  await stale.getByRole("button", { name: "Create admin account" }).click();
  await expect(stale.locator("form [role=alert]")).toContainText(
    "Setup is already complete",
  );
  await stale.goto(new URL("/setup", page.url()).href);
  await expect(stale).toHaveURL(/\/login$/);
  await stale.getByLabel("Admin password").fill(password);
  await stale.getByRole("button", { name: "Open your library" }).click();
  await expect(stale).toHaveURL(/\/$/);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await other.close();
});
