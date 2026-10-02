import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { getGroups } from "@/lib/data";
import { GroupCard } from "@/components/cards";
export default async function GroupsPage() {
  const t = await getTranslations();
  const groups = await getGroups();
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">{t("IDEAS THAT BELONG TOGETHER")}</div>
          <h1>{t("Groups")}</h1>
          <p>{t("A home for every mood, project, and possibility.")}</p>
        </div>
        <Link className="button primary" href="/groups/new">
          <Plus size={18} />
          {t("New group")}
        </Link>
      </header>
      {groups.length ? (
        <div className="card-grid">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Layers size={38} />
          <h2>{t("Bring your ideas together.")}</h2>
          <p>
            {t(
              "Collect related prompts across models, and give each collection a visual identity.",
            )}
          </p>
          <Link className="button primary" href="/groups/new">
            {t("Create your first group")}
          </Link>
        </div>
      )}
    </>
  );
}
