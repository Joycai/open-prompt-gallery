import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { getGroups } from "@/lib/data";
import { CollectionBrowser } from "@/components/collection-browser";
import { GroupCard } from "@/components/cards";
export default async function GroupsPage() {
  const t = await getTranslations();
  const groups = await getGroups();
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">{t("IDEAS THAT BELONG TOGETHER")}</div>
          <h1>{t("Collections")}</h1>
          <p>{t("Organize prompts by character, background, or project.")}</p>
        </div>
        <Link className="button primary" href="/groups/new">
          <Plus size={18} />
          {t("New collection")}
        </Link>
      </header>
      {groups.length ? (
        <CollectionBrowser
          items={groups.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
            card: <GroupCard group={g} />,
          }))}
        />
      ) : (
        <div className="empty-state">
          <Layers size={38} />
          <h2>{t("Bring your ideas together.")}</h2>
          <p>
            {t(
              "Keep one character’s variations together, collect backgrounds, or organize a whole project.",
            )}
          </p>
          <Link className="button primary" href="/groups/new">
            {t("Create your first collection")}
          </Link>
        </div>
      )}
    </>
  );
}
