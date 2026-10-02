import postgres from "postgres";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
const databaseUrl = process.env.DB_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DB_URL or DATABASE_URL is required");
const sql = postgres(databaseUrl, { max: 1 });
const dir = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
function location(key) {
  if (!/^[a-f0-9-]{36}\.webp$/.test(key))
    throw new Error("Invalid storage key");
  return path.join(dir, key);
}
try {
  for (const row of await sql`SELECT storage_key FROM file_cleanup`) {
    try {
      await unlink(location(row.storage_key));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await sql`DELETE FROM file_cleanup WHERE storage_key=${row.storage_key}`;
  }
  if (process.argv.includes("--orphans")) {
    const known = new Set(
      (await sql`SELECT storage_key FROM images`).map((r) => r.storage_key),
    );
    for (const key of await readdir(dir)) {
      if (!/^[a-f0-9-]{36}\.webp$/.test(key) || known.has(key)) continue;
      if (Date.now() - (await stat(location(key))).mtimeMs > 86400000)
        await unlink(location(key));
    }
  }
  console.log("Image cleanup complete.");
} finally {
  await sql.end();
}
