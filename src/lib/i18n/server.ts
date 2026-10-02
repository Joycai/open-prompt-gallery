import "server-only";
import { cookies } from "next/headers";
import { normalizeLocale, translator } from ".";
export async function getTranslations() {
  return translator(
    normalizeLocale((await cookies()).get("gallery-locale")?.value),
  );
}
