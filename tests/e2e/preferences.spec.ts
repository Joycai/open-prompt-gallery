import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Admin password").fill(process.env.TEST_AUTH_PASSWORD!);
  await page.getByRole("button", { name: "Open your library" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.beforeEach(() => {
  test.skip(
    !process.env.TEST_AUTH_PASSWORD,
    "Requires an initialized test database and TEST_AUTH_PASSWORD.",
  );
});

test("Chinese login feedback, server-rendered language and fallback", async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: /Language/ }).selectOption("zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByLabel("管理员密码").fill("incorrect-password");
  await page.getByRole("button", { name: "打开提示词库" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("密码不正确。");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "灵感正等着你。" }),
  ).toBeVisible();
  const response = await context.request.get("/login");
  expect(await response.text()).toContain('lang="zh-CN"');
  await context.addCookies([
    { name: "gallery-locale", value: "invalid", url: baseURL! },
  ]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("every palette supports explicit and live system modes and survives navigation", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.goto("/settings");
  const background = () =>
    page.locator("body").evaluate((e) => getComputedStyle(e).backgroundColor);
  for (const theme of ["Ocean", "Forest", "Violet"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await page.getByRole("button", { name: "Light", exact: true }).click();
    const light = await background();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    const dark = await background();
    expect(dark).not.toBe(light);
    await page.emulateMedia({ colorScheme: "light" });
    expect(await background()).toBe(dark);
    await page.getByRole("button", { name: "System", exact: true }).click();
    expect(await background()).toBe(light);
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await background()).toBe(dark);
  }
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("combobox", { name: /Language/ }).selectOption("zh-CN");
  await expect(
    page.getByRole("heading", { name: "设置", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "紫罗兰" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("link", { name: "所有提示词", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "所有提示词", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "violet");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  const response = await context.request.get("/settings");
  expect(await response.text()).toContain('data-mode="dark"');
  await page.goto("/settings");
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("chinese-dark-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("chinese-dark.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "浅色", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("chinese-light.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("Chinese editing preserves prompt content and translates counts and dialogs", async ({
  page,
}) => {
  await login(page);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: /Language/ }).selectOption("zh-CN");
  const suffix = Date.now();
  const model = `i18n model ${suffix}`,
    title = `Original title 灵感 ${suffix}`;
  const add = page.locator("section").filter({
    has: page.getByRole("heading", { name: "添加模型", exact: true }),
  });
  await add.getByLabel("模型名称").fill(model);
  await add.getByRole("button", { name: "添加模型", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: model, exact: true }),
  ).toBeVisible();
  await page.goto("/prompts/new");
  await page.getByLabel("标题", { exact: true }).fill(title);
  await page
    .getByRole("combobox", { name: "模型", exact: true })
    .selectOption({ label: model });
  await page
    .getByLabel("提示词", { exact: true })
    .fill("Keep my original prompt 原文 unchanged.");
  await page.getByRole("button", { name: "保存提示词" }).click();
  await expect(page.locator(".prompt-body")).toHaveText(
    "Keep my original prompt 原文 unchanged.",
  );
  await expect(page.locator(".panel-heading")).toContainText("个字符");
  await page
    .getByRole("button", { name: `删除 ${title}`, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "删除提示词？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "保留提示词" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: `删除 ${title}`, exact: true })
    .click();
  await page.getByRole("button", { name: "删除 提示词", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/settings");
  await page
    .getByRole("button", { name: `删除 ${model}`, exact: true })
    .click();
  await page.getByRole("button", { name: "删除 模型", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: model, exact: true }),
  ).not.toBeVisible();
});
