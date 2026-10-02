import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { sql } from "./db";
export const uploadDir = path.resolve(
  /* turbopackIgnore: true */ process.env.UPLOAD_DIR || "./data/uploads",
);
export function filePath(key: string) {
  if (!/^[a-f0-9-]{36}\.webp$/.test(key))
    throw new Error("Invalid storage key");
  return path.join(/* turbopackIgnore: true */ uploadDir, key);
}
export async function cleanupFiles() {
  const rows = await sql`SELECT storage_key FROM file_cleanup LIMIT 100`;
  for (const row of rows) {
    try {
      await unlink(filePath(row.storage_key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") continue;
    }
    await sql`DELETE FROM file_cleanup WHERE storage_key=${row.storage_key}`;
  }
}
export async function storeImage(
  file: File,
  owner: "prompt" | "group",
  id: string,
) {
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new Error("Each image must be between 1 byte and 10 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { limitInputPixels: 40_000_000, animated: false });
  const meta = await image.metadata();
  if (!["jpeg", "png", "webp", "avif"].includes(meta.format || ""))
    throw new Error("Use JPEG, PNG, WebP, or AVIF images.");
  const { data, info } = await image
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true });
  const key = randomUUID() + ".webp";
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath(key), data, { flag: "wx" });
  try {
    await sql.begin(async (tx) => {
      const parent =
        await tx`SELECT id FROM ${sql(owner === "prompt" ? "prompts" : "groups")} WHERE id=${id} FOR UPDATE`;
      if (!parent.length) throw new Error("This item no longer exists.");
      const [count] =
        await tx`SELECT count(*)::int n,COALESCE(max(position),-1)::int last FROM images WHERE ${sql(owner + "_id")}=${id}`;
      if (count.n >= 30) throw new Error("Each item can have up to 30 images.");
      await tx`INSERT INTO images(storage_key,${sql(owner + "_id")},alt,mime,width,height,bytes,position) VALUES(${key},${id},${file.name.slice(0, 200)},'image/webp',${info.width},${info.height},${data.length},${count.last + 1})`;
    });
  } catch (error) {
    await unlink(filePath(key));
    throw error;
  }
}
