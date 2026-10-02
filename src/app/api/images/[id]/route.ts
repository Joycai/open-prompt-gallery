import { authenticated } from "@/lib/auth";
import { sql } from "@/lib/db";
import { filePath } from "@/lib/storage";
import { readFile } from "node:fs/promises";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authenticated()))
    return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [image] =
    await sql`SELECT storage_key,mime FROM images WHERE id::text=${id}`;
  if (!image) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(filePath(image.storage_key)), {
      headers: {
        "Content-Type": image.mime,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
