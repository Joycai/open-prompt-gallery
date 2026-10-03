import test from "node:test";
import assert from "node:assert/strict";
import { pickImageFiles } from "../src/lib/image-picker";

test("successive image selections use the same remembered-directory ID and return all files", async () => {
  const files = [
    new File(["first"], "first.png", { type: "image/png" }),
    new File(["second"], "second.webp", { type: "image/webp" }),
  ];
  const ids: string[] = [];
  const browser = {
    async showOpenFilePicker(options: {
      id: string;
      multiple: boolean;
      types: { accept: Record<string, string[]> }[];
    }) {
      ids.push(options.id);
      assert.equal(options.multiple, true);
      assert.deepEqual(Object.keys(options.types[0].accept), [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ]);
      return files.map((file) => ({ getFile: async () => file }));
    },
  };
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(
      await pickImageFiles(browser, () => assert.fail("Unexpected fallback")),
      files,
    );
  }
  assert.ok(ids[0]);
  assert.equal(ids[0], ids[1]);
});

test("unsupported browsers keep the existing file input", async () => {
  let opened = 0;
  assert.equal(await pickImageFiles({}, () => opened++), null);
  assert.equal(opened, 1);
});

test("cancelling the picker does not open another dialog", async () => {
  assert.equal(
    await pickImageFiles(
      {
        async showOpenFilePicker() {
          throw new DOMException("Cancelled", "AbortError");
        },
      },
      () => assert.fail("Unexpected fallback"),
    ),
    null,
  );
});

test("blocked picker access falls back to the existing file input", async () => {
  for (const name of ["SecurityError", "NotAllowedError"]) {
    let opened = 0;
    assert.equal(
      await pickImageFiles(
        {
          async showOpenFilePicker() {
            throw new DOMException("Blocked", name);
          },
        },
        () => opened++,
      ),
      null,
    );
    assert.equal(opened, 1);
  }
});

test("file read errors surface instead of reopening the picker", async () => {
  await assert.rejects(
    pickImageFiles(
      {
        async showOpenFilePicker() {
          return [
            {
              async getFile(): Promise<File> {
                throw new DOMException("File unavailable", "NotReadableError");
              },
            },
          ];
        },
      },
      () => assert.fail("Unexpected fallback"),
    ),
    { name: "NotReadableError" },
  );
});
