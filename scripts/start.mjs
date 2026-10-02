import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
try {
  process.loadEnvFile(path.join(root, ".env"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
process.env.NODE_ENV = "production";
process.env.HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
process.env.UPLOAD_DIR = path.resolve(
  root,
  process.env.UPLOAD_DIR || "./data/uploads",
);
await import("../.next/standalone/server.js");
