import { access, mkdir, constants } from "node:fs/promises";

// Container Manager users can set DB_URL; existing Compose deployments keep working.
const databaseUrl = process.env.DB_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "Set DB_URL (or DATABASE_URL) to your PostgreSQL connection URL.",
  );
}
process.env.DATABASE_URL = databaseUrl;
const uploads = process.env.UPLOAD_DIR || "/app/data/uploads";
process.env.UPLOAD_DIR = uploads;
await mkdir(uploads, { recursive: true });
await access(uploads, constants.W_OK);

// Failed migrations prevent the HTTP server from starting. The migration runner
// locks the database and only applies scripts that have not already succeeded.
if (process.env.RUN_MIGRATIONS !== "false") {
  await import("./migrate.mjs");
}
await import("../server.js");
