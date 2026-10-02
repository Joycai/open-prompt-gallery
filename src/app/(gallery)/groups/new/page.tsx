import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { GroupEditor } from "@/components/group-editor";
export default async function NewGroup() {
  const t = await getTranslations();
  return (
    <>
      <Link className="back-link" href="/groups">
        {t("← Groups")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("New group")}</h1>
          <p>{t("Make a collection of connected ideas.")}</p>
        </div>
      </header>
      <GroupEditor />
    </>
  );
}
