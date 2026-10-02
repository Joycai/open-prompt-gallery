import { test } from "node:test";
import assert from "node:assert/strict";
import { completeTag, suggestTags } from "../src/lib/tag-suggestions";

test("suggestions match normalized tags and exclude already selected tags", () => {
  assert.deepEqual(
    suggestTags("ＰＯＲＴＲＡＩＴ, li", 12, ["Portrait", "Lighting", "Linen"]),
    ["Lighting", "Linen"],
  );
  assert.deepEqual(suggestTags("Portrait, por", 13, ["Portrait"]), []);
  assert.deepEqual(suggestTags("Portrait, ", 10, ["Lighting"]), []);
});

test("completion preserves surrounding comma-separated tags and cursor position", () => {
  assert.deepEqual(completeTag("Portrait, li", 12, "Lighting"), {
    value: "Portrait, Lighting, ",
    caret: 20,
  });
  assert.deepEqual(completeTag("po, Lighting", 2, "Portrait"), {
    value: "Portrait, Lighting",
    caret: 8,
  });
  assert.deepEqual(completeTag("p", 0, "Portrait"), {
    value: "Portrait, ",
    caret: 10,
  });
});

test("suggestions replace the token under the caret and bound the list", () => {
  assert.deepEqual(suggestTags("po, Lighting", 1, ["Portrait", "Lighting"]), [
    "Portrait",
  ]);
  assert.equal(
    suggestTags(
      "tag",
      3,
      Array.from({ length: 20 }, (_, i) => `tag ${i}`),
    ).length,
    8,
  );
});
