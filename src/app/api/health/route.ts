import { sql } from "@/lib/db";
export async function GET() {
  try {
    await sql`SELECT id FROM models LIMIT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
