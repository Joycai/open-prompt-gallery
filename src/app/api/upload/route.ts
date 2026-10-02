import { NextResponse } from "next/server";
import { authenticated } from "@/lib/auth";
import { storeImage } from "@/lib/storage";
import { uuid } from "@/lib/validation";
import { hasValidRequestOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await authenticated()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!hasValidRequestOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024)
    return NextResponse.json({ error: "Image is too large." }, { status: 413 });
  try {
    // Bound the body even when content-length is absent or forged.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("No image was received.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 11 * 1024 * 1024) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Image is too large." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type") || "" },
    }).formData();
    const owner = form.get("owner");
    if (owner !== "prompt" && owner !== "group")
      throw new Error("Invalid image owner.");
    const id = uuid.parse(form.get("id"));
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image.");
    await storeImage(file, owner, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /Each |Use JPEG|no longer|up to 30|Choose/.test(error.message)
            ? error.message
            : "Could not upload this image. Check its format and try again.",
      },
      { status: 400 },
    );
  }
}
