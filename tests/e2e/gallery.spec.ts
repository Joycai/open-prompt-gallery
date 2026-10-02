import { test, expect } from "@playwright/test";
import sharp from "sharp";
const suffix = Date.now().toString();
const model = "Test model " + suffix,
  prompt = "Warm studio " + suffix,
  group = "Portrait studies " + suffix;
test("complete persistent library workflow", async ({ page }) => {
  if (process.env.TEST_AUTH_PASSWORD) {
    await page.goto("/login");
    await page
      .getByLabel("Admin password")
      .fill(process.env.TEST_AUTH_PASSWORD);
    await page.getByRole("button", { name: "Open your library" }).click();
    await expect(page).toHaveURL(/\/$/);
  }
  await page.goto("/settings");
  const add = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Add a model", exact: true }),
  });
  await add.getByLabel("Model name").fill(model);
  await add.getByLabel("Description").fill("Browser verification");
  await add.getByRole("button", { name: "Add model", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: model, exact: true }),
  ).toBeVisible();
  await page.goto("/prompts/new");
  await page.getByLabel("Title", { exact: true }).fill(prompt);
  await page
    .getByRole("combobox", { name: "Model", exact: true })
    .selectOption({ label: model });
  await page
    .getByLabel("Prompt", { exact: true })
    .fill("A warm portrait with soft light and a linen outfit.");
  await page.getByRole("textbox", { name: /^Tags/ }).fill("Portrait, Lighting");
  await page.getByRole("button", { name: "Save prompt" }).click();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  const promptUrl = page.url();
  const red = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#bd9470" },
  })
    .png()
    .toBuffer();
  const blue = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#87a8c2" },
  })
    .png()
    .toBuffer();
  await page.locator("input[type=file]").setInputFiles([
    { name: "warm.png", mimeType: "image/png", buffer: red },
    { name: "cool.png", mimeType: "image/png", buffer: blue },
  ]);
  await expect(page.getByRole("status")).toContainText("2 images added");
  await expect(
    page.getByRole("button", { name: "Preview image 2", exact: true }),
  ).toBeVisible();
  const secondImage = await page
    .getByRole("button", { name: "Preview image 2", exact: true })
    .locator("img")
    .getAttribute("src");
  await page.getByRole("button", { name: "Manage images" }).click();
  await page.getByRole("button", { name: "Make image 2 the cover" }).click();
  await expect(
    page.locator(".thumbnail").first().locator("img"),
  ).toHaveAttribute("src", secondImage!);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Preview image 2", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hero-image img")).toHaveAttribute(
    "src",
    secondImage!,
  );
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Copied to clipboard");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "A warm portrait with soft light and a linen outfit.",
  );
  const rejected = await page.request.post("/api/upload", {
    headers: { Origin: new URL(promptUrl).origin },
    multipart: {
      owner: "prompt",
      id: new URL(promptUrl).pathname.split("/").pop()!,
      file: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not an image"),
      },
    },
  });
  expect(rejected.status()).toBe(400);
  await page.goto("/?q=" + encodeURIComponent(prompt));
  await page.getByRole("button", { name: "Portrait", exact: true }).click();
  await page.getByRole("button", { name: "Lighting", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pieces", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No prompts found" }),
  ).toBeVisible();
  await page.goto("/groups/new");
  await page.getByLabel("Group name").fill(group);
  await page.getByLabel("Description").fill("A collection for testing");
  await page.getByRole("checkbox", { name: prompt + " " + model }).check();
  await page.getByRole("button", { name: "Save group" }).click();
  await expect(
    page.getByRole("heading", { name: group, exact: true }),
  ).toBeVisible();
  const groupUrl = page.url();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles({ name: "group.png", mimeType: "image/png", buffer: blue });
  await expect(page.getByRole("status")).toContainText("1 image added");
  await page.goto("/settings");
  const modelRow = page
    .locator(".model-item")
    .filter({ has: page.getByRole("heading", { name: model, exact: true }) });
  await modelRow
    .getByRole("button", { name: "Delete " + model, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete model", exact: true })
    .click();
  await expect(page.locator(".error-message")).toContainText("still in use");
  await page.getByRole("button", { name: "Keep model" }).click();
  await page.goto(promptUrl);
  await page.getByRole("link", { name: "Edit prompt", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Prompt type", exact: true })
    .selectOption("piece");
  await page.getByRole("button", { name: "Save prompt" }).click();
  await expect(page.getByText("Reusable piece", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: group, exact: true }),
  ).toBeVisible();
  await page.goto("/?q=" + encodeURIComponent(prompt));
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/library-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/library-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.goto(promptUrl);
  await page.screenshot({
    path: "test-results/prompt-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/prompt-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Manage images" }).click();
  const removedImage = await page
    .getByRole("button", { name: "Preview image 2", exact: true })
    .locator("img")
    .getAttribute("src");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Remove image 2", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Preview image 2", exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get(removedImage!)).status()).toBe(404);
  await page
    .getByRole("button", { name: "Delete " + prompt, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete prompt", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(groupUrl);
  await expect(
    page.getByRole("heading", { name: "Your collection is ready." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete " + group, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete group", exact: true })
    .click();
  await expect(page).toHaveURL(/\/groups$/);
  await page.goto("/settings");
  await page
    .locator(".model-item")
    .filter({ has: page.getByRole("heading", { name: model, exact: true }) })
    .getByRole("button", { name: "Delete " + model, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete model", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: model, exact: true }),
  ).toHaveCount(0);
});
