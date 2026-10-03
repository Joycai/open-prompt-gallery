import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

// All browser assets derive from the same editable vector used by the site.
const root = new URL("../", import.meta.url);
const source = await readFile(new URL("public/brand/logo.svg", root));
await mkdir(new URL("public/icons/", root), { recursive: true });
await writeFile(new URL("src/app/icon.svg", root), source);

for (const [path, size, opaque] of [
  ["src/app/apple-icon.png", 180, true],
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
]) {
  let image = sharp(source).resize(size, size);
  if (opaque) image = image.flatten({ background: "#176DDD" });
  await image.png().toFile(new URL(path, root).pathname);
}

// ICO directory with PNG payloads for small browser tabs and Windows shortcuts.
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(
  new URL("src/app/favicon.ico", root),
  Buffer.concat([header, ...images]),
);
