import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { GroupEditor } from "@/components/group-editor";
export default async function EditGroup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  return (
    <>
      <Link className="back-link" href={"/groups/" + id}>
        {t("← Back to collection")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("Edit collection")}</h1>
          <p>{t("Refine your collection.")}</p>
        </div>
      </header>
      <GroupEditor id={id} />
    </>
  );
}
