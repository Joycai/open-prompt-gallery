import { test, expect } from "@playwright/test";
test("production login protects pages and image endpoints", async ({
  page,
  request,
  baseURL,
}) => {
  test.skip(
    !process.env.TEST_AUTH_PASSWORD,
    "Run against a production test server with TEST_AUTH_PASSWORD.",
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (
      await request.get("/api/images/00000000-0000-0000-0000-000000000000")
    ).status(),
  ).toBe(401);
  await page.getByLabel("Library password").fill("incorrect-test-password");
  await page.getByRole("button", { name: "Open your library" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "incorrect" }),
  ).toBeVisible();
  await page
    .getByLabel("Library password")
    .fill(process.env.TEST_AUTH_PASSWORD!);
  await page.getByRole("button", { name: "Open your library" }).click();
  await expect(
    page.getByRole("heading", { name: "All prompts", exact: true }),
  ).toBeVisible();
  expect(
    (await page.context().cookies(baseURL)).find(
      (c) => c.name === "gallery_session",
    )?.httpOnly,
  ).toBe(true);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
