import { cp, readdir, rm } from "node:fs/promises";
const target = new URL("../.next/standalone/", import.meta.url);
await cp(new URL("../public/", import.meta.url), new URL("public/", target), {
  recursive: true,
});
await cp(
  new URL("../.next/static/", import.meta.url),
  new URL(".next/static/", target),
  { recursive: true },
);
// Runtime secrets belong to the host, not the distributable build.
for (const name of await readdir(target))
  if (name === ".env" || name.startsWith(".env."))
    await rm(new URL(name, target));
