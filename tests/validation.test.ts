import test from "node:test";
import assert from "node:assert/strict";
import { parseTags, promptSchema, groupSchema } from "../src/lib/validation";
test("tags normalize case, whitespace and Unicode without duplicates", () => {
  assert.deepEqual(parseTags(" Portrait, portrait, Ｌｉｇｈｔ ,"), [
    { normalized: "portrait", name: "portrait" },
    { normalized: "light", name: "Light" },
  ]);
});
test("tags and prompt inputs reject invalid values", () => {
  assert.throws(() => parseTags("x".repeat(41)));
  assert.throws(() =>
    promptSchema.parse({
      id: "",
      title: " ",
      body: "test",
      model_id: "wrong",
      kind: "full",
      groups: [],
      tags: "",
    }),
  );
});

test("collection categories support legacy forms, blank values, and custom categories", () => {
  const collection = { id: "", name: "Study", description: "", prompts: [] };
  assert.equal(groupSchema.parse(collection).category, "");
  assert.equal(
    groupSchema.parse({ ...collection, category: "   " }).category,
    "",
  );
  assert.equal(
    groupSchema.parse({ ...collection, category: " Costume studies " })
      .category,
    "Costume studies",
  );
  assert.throws(() =>
    groupSchema.parse({ ...collection, category: "x".repeat(81) }),
  );
});
