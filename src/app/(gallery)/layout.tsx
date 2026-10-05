import { getTranslations } from "@/lib/i18n/server";
import { requireAuth } from "@/lib/auth";
import { getModels, getGroups } from "@/lib/data";
import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  await requireAuth();
  const [models, groups] = await Promise.all([getModels(), getGroups()]);
  return (
    <div className="workspace">
      <a className="skip" href="#main">
        {t("Skip to content")}
      </a>
      <Sidebar models={models} groups={groups} />
      <main id="main">{children}</main>
    </div>
  );
}
