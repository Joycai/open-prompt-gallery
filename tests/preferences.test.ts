import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLocale,
  translator,
  translateFeedback,
  type Message,
} from "../src/lib/i18n";
import { zhCN } from "../src/lib/i18n/zh-CN";
import { normalizeMode, normalizeTheme } from "../src/lib/preferences";

test("untrusted preference values fall back to supported defaults", () => {
  assert.equal(normalizeTheme("forest"), "forest");
  assert.equal(normalizeTheme('" onload="alert(1)'), "ocean");
  assert.equal(normalizeMode("dark"), "dark");
  assert.equal(normalizeMode("invalid"), "system");
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeLocale("unsupported"), "en");
});
test("Chinese messages preserve every interpolation placeholder", () => {
  const placeholders = (s: string) =>
    [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
  for (const [key, value] of Object.entries(zhCN)) {
    assert.ok(value.trim(), key);
    assert.deepEqual(placeholders(value), placeholders(key), key);
    assert.equal(translator("en")(key as Message), key);
  }
});
test("translations format counts and interpolate user content literally", () => {
  const t = translator("zh-CN");
  assert.equal(t("{count} characters", { count: 12345 }), "12,345 个字符");
  assert.equal(
    t("Delete {name}", { name: "<b>{count}</b>" }),
    "删除 <b>{count}</b>",
  );
  assert.equal(
    translateFeedback("zh-CN", "That password is incorrect."),
    "密码不正确。",
  );
  assert.equal(
    translateFeedback("zh-CN", "Unknown server response"),
    "Unknown server response",
  );
});
