import test from "node:test";
import assert from "node:assert/strict";
import { parseTags, promptSchema } from "../src/lib/validation";
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
