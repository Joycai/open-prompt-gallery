import test from "node:test";
import assert from "node:assert/strict";
import {
  promptDetailPath,
  promptReturnLabel,
  promptReturnPath,
} from "../src/lib/prompt-navigation";

const id = "00000000-0000-4000-8000-000000000001";
const models = [{ id, name: "Image model" }];
const groups = [{ id, name: "Portrait studies" }];

test("group navigation retains the group and pagination through editing", () => {
  const back = `/groups/${id}?page=2`;
  assert.equal(promptReturnPath(back), back);
  assert.equal(
    promptReturnLabel(back, models, groups, "All prompts"),
    "Portrait studies",
  );
  const detail = new URL(promptDetailPath(id, back), "http://gallery.local");
  assert.equal(detail.pathname, `/prompts/${id}`);
  assert.equal(detail.searchParams.get("back"), back);
  assert.equal(
    promptDetailPath(id, detail.searchParams.get("back")),
    detail.pathname + detail.search,
  );
});

test("model navigation retains filters, repeated tags, and pagination", () => {
  const back = `/?model=${id}&q=warm+light&tag=portrait&tag=studio&page=3`;
  assert.equal(
    promptReturnLabel(back, models, groups, "All prompts"),
    "Image model",
  );
  const detail = new URL(promptDetailPath(id, back), "http://gallery.local");
  assert.equal(detail.searchParams.get("back"), back);
});

test("direct prompt visits and missing origins use the library fallback", () => {
  for (const back of [undefined, "/", "/?q=portrait", `/?model=${id}2`]) {
    assert.equal(
      promptReturnLabel(promptReturnPath(back), models, groups, "All prompts"),
      "All prompts",
    );
  }
  assert.equal(promptDetailPath(id, undefined), `/prompts/${id}`);
});

test("return paths reject external URLs, other routes, and malformed input", () => {
  for (const back of [
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/settings",
    "/groups/invalid",
    `/groups/${id}/edit`,
    ["/"],
    null,
    "/?q=test\n",
    new File([], "back.txt"),
  ]) {
    assert.equal(promptReturnPath(back), "/");
    assert.equal(promptDetailPath(id, back), `/prompts/${id}`);
  }
});
