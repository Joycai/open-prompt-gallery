import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
const suffix = Date.now().toString();
const model = "Test model " + suffix,
  prompt = "Warm studio " + suffix,
  group = "Portrait studies " + suffix;
async function checkGalleryLayout(page: Page) {
  const cards = page.locator(".gallery-cards");
  const columns = page.getByRole("combobox", { name: "Items per row" });
  await page.setViewportSize({ width: 1800, height: 1000 });
  await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".card-preview img").first()).toHaveCSS(
    "object-fit",
    "contain",
  );
  for (const count of [1, 2, 6]) {
    await columns.selectOption(String(count));
    expect(
      await cards.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
    ).toBe(count);
  }
  await page.getByRole("button", { name: "List view" }).click();
  await expect(cards).toHaveClass(/gallery-list/);
  await expect(columns).toHaveCount(0);
  const card = cards.locator(".prompt-card").first();
  const previewBox = await card.locator(".card-preview").boundingBox();
  const contentBox = await card.locator(".card-content").boundingBox();
  expect(previewBox!.x + previewBox!.width).toBeLessThanOrEqual(contentBox!.x);
  await page.reload();
  await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/gallery-list-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(columns).toHaveValue("6");
  expect(
    await cards.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.screenshot({
    path: "test-results/gallery-grid-six.png",
    fullPage: true,
  });
  await columns.selectOption("2");
  await page.reload();
  await expect(columns).toHaveValue("2");
  await page.setViewportSize({ width: 1440, height: 1000 });
}
async function checkSegmentFeedback(page: Page) {
  const returnUrl = page.url();
  const modelHref = await page
    .locator(".model-nav a")
    .filter({ hasText: model })
    .first()
    .getAttribute("href");
  const modelId = new URL(modelHref!, returnUrl).searchParams.get("model")!;
  const original = returnUrl + "&model=" + modelId + "&page=2";
  await page.goto(original);
  const type = page.locator('.motion-segments[aria-label="Prompt type"]');
  const full = type.getByRole("button", { name: "Full prompts", exact: true });
  const pieces = type.getByRole("button", { name: "Pieces", exact: true });
  const all = type.getByRole("button", { name: "All", exact: true });
  const layerDuration = () =>
    full.evaluate((el) => getComputedStyle(el, "::before").transitionDuration);
  await expect(type).toHaveAttribute("data-motion", "instant");
  expect(await layerDuration()).toBe("0s");
  const initialQuery = new URL(original).searchParams.get("q")!;
  await page
    .getByRole("textbox", { name: "Search prompts" })
    .fill(initialQuery + " draft");

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  const handler = async (route: import("@playwright/test").Route) => {
    if (route.request().headers()["rsc"] === "1") {
      requests.push(route.request().url());
      await held;
    }
    await route.continue();
  };
  await page.route("**/*", handler);
  try {
    await full.click();
    await expect(full).toHaveAttribute("aria-pressed", "true");
    await expect(type).toHaveAttribute("data-motion", "animated");
    expect(await layerDuration()).toBe("0.12s");
    expect(page.url()).toBe(original);
    await expect(page.locator(".filter-area")).toHaveClass(/pending/);
    await expect(
      page.getByRole("textbox", { name: "Search prompts" }),
    ).toHaveValue(initialQuery + " draft");
    await pieces.click();
    await expect(pieces).toHaveAttribute("aria-pressed", "true");
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await full.click();
    await page.getByRole("button", { name: "Portrait", exact: true }).click();
    await page.getByRole("button", { name: "Lighting", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Search prompts" })
      .fill(initialQuery);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect
      .poll(() =>
        requests.some((request) => {
          const q = new URL(request).searchParams;
          return (
            q.get("kind") === "full" &&
            q.getAll("tag").length === 2 &&
            q.get("q") === initialQuery
          );
        }),
      )
      .toBe(true);
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  await expect(page).toHaveURL(/kind=full/);
  await expect(page.locator(".filter-area")).not.toHaveClass(/pending/);
  const query = new URL(page.url()).searchParams;
  expect(query.getAll("tag").sort()).toEqual(["lighting", "portrait"]);
  expect(query.get("q")).toBe(initialQuery);
  expect(query.has("page")).toBe(false);
  expect(query.get("model")).toBe(modelId);
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await expect(type).toHaveAttribute("data-motion", "instant");
  await pieces.press("Enter");
  await expect(pieces).toHaveAttribute("aria-pressed", "true");
  expect(await layerDuration()).toBe("0s");
  await expect(
    page.getByRole("heading", { name: "No prompts found" }),
  ).toBeVisible();
  await page.goBack();
  await expect(full).toHaveAttribute("aria-pressed", "true");
  expect(await layerDuration()).toBe("0s");
  await page.goForward();
  await expect(pieces).toHaveAttribute("aria-pressed", "true");
  expect(await layerDuration()).toBe("0s");
  await page.goto(returnUrl);

  // A local selection lets us inspect the fade without route completion settling it.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const view = page.locator('.motion-segments[aria-label="Gallery view"]');
  const list = view.getByRole("button", { name: "List view" });
  await list.click();
  expect(
    await list.evaluate((el) => ({
      duration: getComputedStyle(el, "::before").transitionDuration,
      transform: getComputedStyle(el).transform,
    })),
  ).toEqual({ duration: "0.1s", transform: "none" });
  await view.getByRole("button", { name: "Grid view" }).press("Space");
  expect(
    await list.evaluate(
      (el) => getComputedStyle(el, "::before").transitionDuration,
    ),
  ).toBe("0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function checkCardFeedback(page: Page) {
  const card = page.locator(".prompt-card").first();
  const box = (await card.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + 25;
  const style = () =>
    card.evaluate((el) => ({
      transform: getComputedStyle(el).transform,
      duration: getComputedStyle(el).transitionDuration,
      property: getComputedStyle(el).transitionProperty,
      opacity: getComputedStyle(el).opacity,
    }));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(card).toHaveAttribute("data-pressed", "true");
  await expect
    .poll(async () => (await style()).transform)
    .toBe("matrix(0.98, 0, 0, 0.98, 0, 0)");
  expect((await style()).duration).toBe("0.1s");
  await page.mouse.move(1, 1);
  await expect(card).toHaveAttribute("data-pressed", "false");
  expect((await style()).duration).toBe("0.16s");
  await page.mouse.up();
  await card.dispatchEvent("pointerdown", {
    isPrimary: true,
    button: 0,
    pointerType: "touch",
  });
  await card.dispatchEvent("pointercancel", {
    isPrimary: true,
    pointerType: "touch",
  });
  await expect(card).toHaveAttribute("data-pressed", "false");
  await card.dispatchEvent("pointerdown", { isPrimary: false, button: 0 });
  await card.dispatchEvent("pointerdown", { isPrimary: true, button: 2 });
  await expect(card).toHaveAttribute("data-pressed", "false");
  await card.focus();
  await page.keyboard.press("Shift");
  expect((await style()).duration).toBe("0s");
  await expect(card).toHaveAttribute("data-press-motion", "instant");
  const href = (await card.getAttribute("href"))!;
  const original = page.url();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new URL(href, original).href);
  await page.goto(original);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.dispatchEvent("pointerdown", { isPrimary: true, button: 0 });
  await expect.poll(async () => (await style()).opacity).toBe("0.9");
  expect(await style()).toMatchObject({
    transform: "none",
    duration: "0.1s",
    property: "opacity",
  });
  await card.dispatchEvent("pointerup", { isPrimary: true, button: 0 });
  await expect.poll(async () => (await style()).opacity).toBe("1");
  await card.focus();
  await page.keyboard.press("Shift");
  expect((await style()).duration).toBe("0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const touch = await page
    .context()
    .browser()!
    .newContext({
      baseURL: new URL(original).origin,
      isMobile: true,
      hasTouch: true,
      viewport: { width: 390, height: 844 },
    });
  await touch.addCookies(await page.context().cookies());
  const mobile = await touch.newPage();
  await mobile.goto(original);
  const mobileCard = mobile.locator(".prompt-card").first();
  await mobileCard.dispatchEvent("pointerenter", {
    isPrimary: true,
    pointerType: "touch",
  });
  expect(
    await mobile.evaluate(
      () => matchMedia("(hover: hover) and (pointer: fine)").matches,
    ),
  ).toBe(false);
  await expect(mobileCard).toHaveCSS("transform", "none");
  const mobileHref = (await mobileCard.getAttribute("href"))!;
  await mobileCard.tap();
  await expect(mobile).toHaveURL(new URL(mobileHref, original).href);
  await mobile.goto(original);
  await expect(mobileCard).toHaveCSS("transform", "none");
  await touch.close();
}

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
  await page
    .getByRole("combobox", { name: /^Tags/ })
    .fill("Portrait, Lighting");
  await page.getByRole("button", { name: "Save prompt" }).click();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  const promptUrl = page.url();
  const red = await sharp({
    create: { width: 400, height: 900, channels: 3, background: "#bd9470" },
  })
    .png()
    .toBuffer();
  const blue = await sharp({
    create: { width: 1200, height: 300, channels: 3, background: "#87a8c2" },
  })
    .png()
    .toBuffer();
  const droppedFiles = await page.evaluateHandle(
    (files) => {
      const transfer = new DataTransfer();
      for (const file of files) {
        const bytes = Uint8Array.from(atob(file.base64), (c) =>
          c.charCodeAt(0),
        );
        transfer.items.add(new File([bytes], file.name, { type: "image/png" }));
      }
      return transfer;
    },
    [
      { name: "warm.png", base64: red.toString("base64") },
      { name: "cool.png", base64: blue.toString("base64") },
    ],
  );
  const gallery = page.getByRole("region", { name: "Preview images" });
  await gallery.dispatchEvent("dragenter", { dataTransfer: droppedFiles });
  await expect(page.locator(".gallery-drop-overlay")).toBeVisible();
  await gallery.dispatchEvent("dragleave", { dataTransfer: droppedFiles });
  await expect(page.locator(".gallery-drop-overlay")).toHaveCount(0);
  await gallery.dispatchEvent("dragenter", { dataTransfer: droppedFiles });
  await gallery.dispatchEvent("drop", { dataTransfer: droppedFiles });
  await expect(page.locator(".gallery-drop-overlay")).toHaveCount(0);
  await droppedFiles.dispose();
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
  await checkGalleryLayout(page);
  await checkSegmentFeedback(page);
  await checkCardFeedback(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({
    path: "test-results/gallery-feedback-dark-grid.png",
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("button", { name: "List view" }).click();
  for (const [name, opacity] of [
    ["List view", "1"],
    ["Grid view", "0"],
  ]) {
    await expect
      .poll(() =>
        page
          .getByRole("button", { name })
          .evaluate((el) => getComputedStyle(el, "::before").opacity),
      )
      .toBe(opacity);
  }
  await page.screenshot({
    path: "test-results/gallery-feedback-light-list.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Grid view" }).click();
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
  await page
    .getByRole("button", {
      name: "Character One character, many expressions and outfits.",
    })
    .click();
  await expect(page.getByLabel("Collection name")).toHaveValue(
    "Luna the explorer",
  );
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue(
    "Character",
  );
  await page.getByLabel("Collection name").fill(group);
  await page.getByLabel("Description").fill("A collection for testing");
  await page.getByRole("checkbox", { name: prompt + " " + model }).check();
  // Filtering must never drop selected memberships from the submitted form.
  await page
    .getByRole("searchbox", { name: "Search prompts" })
    .fill("no-such-prompt-" + suffix);
  await expect(
    page.getByText("No matching items. Try another search."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save collection" }).click();
  await expect(
    page.getByRole("heading", { name: group, exact: true }),
  ).toBeVisible();
  const groupUrl = page.url();
  await expect(page.locator(".detail-heading .collection-category")).toHaveText(
    "Character",
  );
  const collectionNav = page.locator(".desktop-nav .collection-nav");
  await expect(
    collectionNav.getByRole("link").filter({ hasText: group }),
  ).toHaveAttribute("aria-current", "page");
  await collectionNav
    .getByRole("button", { name: "Collapse collections" })
    .click();
  await expect(collectionNav.locator(".collection-nav-list")).toBeHidden();
  await collectionNav
    .getByRole("button", { name: "Expand collections" })
    .click();
  await expect(collectionNav.locator(".collection-nav-list")).toBeVisible();
  await page.goto(groupUrl + "/edit");
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue(
    "Character",
  );
  await page.getByLabel("Category", { exact: true }).fill("Costume studies");
  await page.getByRole("button", { name: "Save collection" }).click();
  await expect(page.locator(".detail-heading .collection-category")).toHaveText(
    "Costume studies",
  );
  await page.reload();
  await expect(page.locator(".detail-heading .collection-category")).toHaveText(
    "Costume studies",
  );

  // Preserve the collection origin through editing, cancellation, and saving.
  const modelHref = await page
    .locator(".model-nav a")
    .filter({ hasText: model })
    .first()
    .getAttribute("href");
  for (const origin of [
    new URL(groupUrl).pathname,
    modelHref! + "&q=" + encodeURIComponent(prompt),
  ]) {
    await page.goto(origin);
    await page.getByRole("heading", { name: prompt, exact: true }).click();
    const backLink = page.locator(".detail-toolbar .back-link");
    await expect(backLink).toHaveAttribute("href", origin);
    await expect(backLink).toHaveText(
      origin.startsWith("/groups/") ? group : model,
    );
    await page.getByRole("link", { name: "Edit prompt", exact: true }).click();
    await page.getByRole("link", { name: "Cancel", exact: true }).click();
    await expect(backLink).toHaveAttribute("href", origin);
    await page.getByRole("link", { name: "Edit prompt", exact: true }).click();
    await page
      .getByRole("button", { name: "Save prompt", exact: true })
      .click();
    await expect(backLink).toHaveAttribute("href", origin);
    await backLink.click();
    await expect(page).toHaveURL(new URL(origin, groupUrl).href);
  }
  await page.goto("/groups");
  await page.getByRole("searchbox", { name: "Search collections" }).fill(group);
  await expect(
    page.getByRole("heading", { name: group, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".card-preview img").first()).toBeVisible();
  await checkCardFeedback(page);
  await page.goto(groupUrl);
  await expect(
    page.getByRole("combobox", { name: "Items per row" }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.locator(".gallery-cards")).toHaveClass(/gallery-list/);
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(
    page.getByRole("heading", { name: prompt, exact: true }),
  ).toBeVisible();
  await page.getByText("Custom cover & reference images").click();
  await page
    .locator("input[type=file]")
    .setInputFiles({ name: "group.png", mimeType: "image/png", buffer: blue });
  await expect(page.getByRole("status")).toContainText("1 image added");
  await checkGalleryMotion(page);
  await checkDeleteCancellation(page, group, "collection");
  // Create a new item from the original, including group membership, but no images.
  await page.goto(promptUrl);
  await page.getByRole("link", { name: "Create a copy", exact: true }).click();
  await expect(page.locator('input[name="id"]')).toHaveValue("");
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    prompt + " (copy)",
  );
  await expect(page.getByLabel("Prompt", { exact: true })).toHaveValue(
    "A warm portrait with soft light and a linen outfit.",
  );
  await expect(
    page
      .getByRole("combobox", { name: "Model", exact: true })
      .locator("option:checked"),
  ).toHaveText(model);
  await expect(
    page.getByRole("checkbox", { name: group, exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "Prompt type", exact: true }),
  ).toHaveValue("full");
  const tags = page.getByRole("combobox", { name: /^Tags/ });
  await expect(tags).toHaveValue("Lighting, Portrait");
  await tags.fill("New tag, po");
  await expect(
    page.getByRole("option", { name: "Portrait", exact: true }),
  ).toBeVisible();
  await tags.press("ArrowDown");
  await tags.press("Enter");
  await expect(tags).toHaveValue("New tag, Portrait, ");
  await tags.fill("New tag, Portrait, li");
  await page.getByRole("option", { name: "Lighting", exact: true }).click();
  await expect(tags).toHaveValue("New tag, Portrait, Lighting, ");
  await tags.fill("Portrait, por");
  await expect(
    page.getByRole("option", { name: "Portrait", exact: true }),
  ).toHaveCount(0);
  await tags.fill("Portrait, li");
  await tags.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await tags.fill("Portrait, Lighting");
  const markdown =
    "# Copy vision\n\nA **warm** portrait.\n\n- Soft light\n\n```text\nraw prompt\n```\n\n| Mood | Light |\n| --- | --- |\n| Calm | Soft |";
  await page.getByLabel("Prompt", { exact: true }).fill(markdown);
  await page.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: prompt + " (copy)", exact: true }),
  ).toBeVisible();
  const copyUrl = page.url();
  expect(copyUrl).not.toBe(promptUrl);
  await expect(
    page.getByRole("heading", { name: "Copy vision", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".prompt-body strong")).toHaveText("warm");
  await expect(page.locator(".prompt-body table")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/markdown-copy-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("button", { name: "Preview image 1", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: group, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  // Native form submission and clipboard APIs can use CRLF line endings.
  expect(
    (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      "\n",
    ),
  ).toBe(markdown);
  await page.getByRole("link", { name: "Edit prompt", exact: true }).click();
  await expect(page.getByLabel("Prompt", { exact: true })).toHaveValue(
    markdown,
  );
  await page.getByRole("combobox", { name: /^Tags/ }).fill("po");
  await expect(
    page.getByRole("option", { name: "Portrait", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete " + prompt + " (copy)", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete prompt", exact: true })
    .click();
  await page.goto(promptUrl);
  await expect(page.locator(".prompt-body")).toHaveText(
    "A warm portrait with soft light and a linen outfit.",
  );
  await expect(
    page.getByRole("button", { name: "Preview image 2", exact: true }),
  ).toBeVisible();
  await page.goto("/prompts/new?copy=00000000-0000-4000-8000-000000000000");
  await expect(
    page.getByRole("heading", { name: "This page wandered off." }),
  ).toBeVisible();
  await page.goto("/prompts/new?copy=invalid");
  await expect(
    page.getByRole("heading", { name: "This page wandered off." }),
  ).toBeVisible();
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
    .getByRole("button", { name: "Delete collection", exact: true })
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
