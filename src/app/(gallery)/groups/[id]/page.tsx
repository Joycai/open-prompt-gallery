import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getGroups, getImages, getPrompts } from "@/lib/data";
import { ImageGallery } from "@/components/image-gallery";
import { DeleteButton } from "@/components/detail-controls";
import { PromptCard } from "@/components/cards";
import { PromptCollection } from "@/components/prompt-collection";
export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number((await searchParams).page)) || 1),
  );
  const [groups, images, prompts] = await Promise.all([
    getGroups(),
    getImages("group", id),
    getPrompts({ group: id, page }),
  ]);
  const g = groups.find((g) => g.id === id);
  if (!g) notFound();
  return (
    <>
      <div className="detail-toolbar glass">
        <Link href="/groups" className="back-link">
          <ArrowLeft size={17} />
          {t("Groups")}
        </Link>
        <div className="toolbar-actions">
          <Link className="button" href={"/groups/" + id + "/edit"}>
            <Pencil size={16} />
            {t("Edit group")}
          </Link>
          <DeleteButton kind="group" id={id} name={g.name} />
        </div>
      </div>
      <header className="detail-heading">
        <div className="eyebrow">
          {t("COLLECTION · {count} PROMPTS", { count: g.count })}
        </div>
        <h1>{g.name}</h1>
        <p>{g.description}</p>
      </header>
      <div className="group-gallery">
        <ImageGallery owner="group" id={id} images={images} title={g.name} />
      </div>
      <div className="section-heading">
        <h2>{t("In this group")}</h2>
        <Link className="text-button" href={"/groups/" + id + "/edit"}>
          {t("Manage prompts")}
        </Link>
      </div>
      {prompts.length ? (
        <PromptCollection>
          {prompts.slice(0, 24).map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              back={"/groups/" + id + (page > 1 ? "?page=" + page : "")}
            />
          ))}
        </PromptCollection>
      ) : (
        <div className="empty-state compact">
          <h2>{t("Your collection is ready.")}</h2>
          <p>{t("Edit the group to add prompts from your library.")}</p>
        </div>
      )}
      <nav className="pagination" aria-label={t("Pagination")}>
        {page > 1 && (
          <Link
            className="button"
            href={"/groups/" + id + "?page=" + (page - 1)}
          >
            {t("Previous")}
          </Link>
        )}
        {prompts.length > 24 && (
          <Link
            className="button"
            href={"/groups/" + id + "?page=" + (page + 1)}
          >
            {t("Next")}
          </Link>
        )}
      </nav>
    </>
  );
}
