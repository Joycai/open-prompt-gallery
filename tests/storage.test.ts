import test from "node:test";
import assert from "node:assert/strict";
import { filePath } from "../src/lib/storage";
test("storage paths reject traversal and unsupported keys", () => {
  for (const key of ["../secret", "/etc/passwd", "test.svg", "x.webp"])
    assert.throws(() => filePath(key));
  assert.match(
    filePath("12345678-1234-1234-1234-123456789012.webp"),
    /123456789012.webp$/,
  );
});
