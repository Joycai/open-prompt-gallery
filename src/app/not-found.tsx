import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="empty-state">
      <h1>{t("This page wandered off.")}</h1>
      <p>{t("The item may have been removed.")}</p>
      <Link href="/" className="button primary">
        {t("Back to your library")}
      </Link>
    </main>
  );
}
