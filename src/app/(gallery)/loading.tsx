import { getTranslations } from "@/lib/i18n/server";
export default async function Loading() {
  const t = await getTranslations();
  return (
    <div className="loading-state" role="status">
      {t("Opening your library…")}
    </div>
  );
}
