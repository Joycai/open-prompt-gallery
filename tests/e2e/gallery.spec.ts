import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
const suffix = Date.now().toString();
const model = "Test model " + suffix,
  prompt = "Warm studio " + suffix,
  group = "Portrait studies " + suffix;
async function checkGalleryMotion(page: Page) {
  const hero = page.getByRole("button", { name: "Open full preview" });
  const dialog = page.locator("dialog.lightbox");
  await hero.click();
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog).toHaveAttribute("data-phase", "open");
  expect(
    await dialog.evaluate((element) => ({
      duration: getComputedStyle(element).transitionDuration,
      easing: getComputedStyle(element).transitionTimingFunction,
      backdrop: getComputedStyle(element, "::backdrop").transitionDuration,
    })),
  ).toEqual({
    duration: "0.2s, 0.2s",
    easing: "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1)",
    backdrop: "0.2s",
  });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Close preview" }).click();
  await expect(dialog).not.toHaveAttribute("open");
  await expect(hero).toBeFocused();
  await hero.press("Enter");
  await expect(dialog).toHaveAttribute("data-motion", "instant");
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open");

  // Cancel before either entry frame, then reopen before the queued native close event.
  expect(
    await hero.evaluate((element) => {
      const modal = document.querySelector(
        "dialog.lightbox",
      ) as HTMLDialogElement;
      element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      modal.dispatchEvent(new Event("cancel", { cancelable: true }));
      const closedImmediately = !modal.open;
      element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      return closedImmediately;
    }),
  ).toBe(true);
  await expect(dialog).toHaveAttribute("data-phase", "open");
  // Reverse an exit without restarting the entrance or allowing a stale timeout to close it.
  await dialog.evaluate((element) => {
    element
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    document
      .querySelector(".hero-image")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
  await page.waitForTimeout(250); // Deliberately outlast the cancelled exit timeout.
  await expect(dialog).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");

  const toggle = page.locator(".gallery-actions .text-button");
  const panel = page.locator(".image-manager");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveAttribute("data-phase", "open");
  await panel.evaluate((element) =>
    (
      element.querySelector("button:not(:disabled)") as HTMLButtonElement
    ).focus(),
  );
  await toggle.dispatchEvent("click", { detail: 1 });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  // Inspect exit before it finishes; inactive controls must be inert immediately.
  if (await panel.count()) {
    await expect(panel).toHaveAttribute("inert", "");
    await expect(panel).toHaveAttribute("aria-hidden", "true");
  }
  await toggle.dispatchEvent("click", { detail: 1 });
  await page.waitForTimeout(200); // Outlast the old removal callback.
  await expect(panel).toHaveAttribute("data-phase", "open");
  await expect(panel).not.toHaveAttribute("inert");
  await toggle.press("Enter");
  await expect(panel).toHaveCount(0);
  await toggle.press("Space");
  await expect(panel).toHaveAttribute("data-motion", "instant");
  expect(
    await panel.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  await toggle.press("Enter");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await hero.click();
  await expect(dialog).toHaveAttribute("data-phase", "open");
  expect(
    await dialog.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      duration: getComputedStyle(element).transitionDuration,
    })),
  ).toEqual({ transform: "none", duration: "0.1s" });
  await page.keyboard.press("Escape");
  await toggle.click();
  await expect(panel).toHaveAttribute("data-phase", "open");
  expect(
    await panel.evaluate((element) => ({
      transform: getComputedStyle(element).transform,
      duration: getComputedStyle(element).transitionDuration,
    })),
  ).toEqual({ transform: "none", duration: "0.1s" });
  await toggle.dispatchEvent("click", { detail: 1 });
  await expect(panel).toHaveCount(0);
  await hero.press("Enter");
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function checkDeleteCancellation(page: Page, name: string, kind: string) {
  const trigger = page.getByRole("button", {
    name: "Delete " + name,
    exact: true,
  });
  const dialog = page.getByRole("dialog");
  await trigger.click();
  await expect(dialog).toHaveAttribute("data-phase", "open");
  await dialog
    .getByRole("button", { name: "Keep " + kind, exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.press("Space");
  await expect(dialog).toHaveAttribute("data-motion", "instant");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await trigger.evaluate((element) => {
      element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      const modal = document.querySelector("dialog[open]") as HTMLDialogElement;
      modal.dispatchEvent(new Event("cancel", { cancelable: true }));
      return !modal.open;
    }),
  ).toBe(true);
  await expect(trigger).toBeFocused();
}

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
  await checkGalleryMotion(page);
  await checkDeleteCancellation(page, prompt, "prompt");
  const secondImage = await page
    .getByRole("button", { name: "Preview image 2", exact: true })
    .locator("img")
    .getAttribute("src");
  await page.getByRole("button", { name: "Manage images" }).click();
  await page.getByRole("button", { name: "Make image 2 the cover" }).click();
  await expect(
    page.locator(".thumbnail").first().locator("img"),
  ).toHaveAttribute("src", secondImage!);
  await expect(page.locator(".image-manager")).toHaveAttribute(
    "data-phase",
    "open",
  );
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
  await checkGalleryMotion(page);
  await checkDeleteCancellation(page, group, "group");
  await page.goto("/settings");
  await checkDeleteCancellation(page, model, "model");
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
