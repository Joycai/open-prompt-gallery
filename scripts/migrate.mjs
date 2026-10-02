import postgres from "postgres";
import { readdir, readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(731684102)`;
    await tx`CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())`;
    const applied = await tx`SELECT name FROM schema_migrations`;
    for (const name of (
      await readdir(new URL("../migrations/", import.meta.url))
    )
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      if (applied.some((x) => x.name === name)) continue;
      await tx.unsafe(
        await readFile(
          new URL("../migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
      await tx`INSERT INTO schema_migrations(name) VALUES(${name})`;
      console.log("Applied", name);
    }
  });
  console.log("Database is up to date.");
} finally {
  await sql.end();
}
