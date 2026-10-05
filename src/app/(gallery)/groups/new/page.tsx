import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { GroupEditor } from "@/components/group-editor";
export default async function NewGroup() {
  const t = await getTranslations();
  return (
    <>
      <Link className="back-link" href="/groups">
        {t("← Collections")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("New collection")}</h1>
          <p>
            {t(
              "Give related prompts a home. A prompt can belong to more than one collection.",
            )}
          </p>
        </div>
      </header>
      <GroupEditor />
    </>
  );
}
