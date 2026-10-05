import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Layers, CopyPlus } from "lucide-react";
import {
  getPrompt,
  getImages,
  getMemberships,
  getModels,
  getGroups,
} from "@/lib/data";
import { promptReturnPath, promptReturnLabel } from "@/lib/prompt-navigation";
import { CopyButton, DeleteButton } from "@/components/detail-controls";
import { PromptMarkdown } from "@/components/prompt-markdown";
import { ImageGallery } from "@/components/image-gallery";
export default async function PromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string | string[] }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  const [p, images, groups, search] = await Promise.all([
    getPrompt(id),
    getImages("prompt", id),
    getMemberships(id),
    searchParams,
  ]);
  if (!p) notFound();
  const back = promptReturnPath(search.back);
  const [models, allGroups] = await Promise.all([getModels(), getGroups()]);
  const backLabel = promptReturnLabel(
    back,
    models,
    allGroups,
    t("All prompts"),
  );
  return (
    <>
      <div className="detail-toolbar glass">
        <Link className="back-link" href={back}>
          <ArrowLeft size={17} />
          {backLabel}
        </Link>
        <div className="toolbar-actions">
          <Link className="button" href={"/prompts/new?copy=" + id}>
            <CopyPlus size={16} />
            {t("Create a copy")}
          </Link>
          <Link
            className="button"
            href={
              "/prompts/" +
              id +
              "/edit" +
              (back === "/" ? "" : "?back=" + encodeURIComponent(back))
            }
          >
            <Pencil size={16} />
            {t("Edit prompt")}
          </Link>
          <DeleteButton kind="prompt" id={id} name={p.title} />
        </div>
      </div>
      <header className="detail-heading">
        <div className="eyebrow">{p.model_name}</div>
        <h1>{p.title}</h1>
        <span className={"badge " + (p.kind === "piece" ? "purple" : "")}>
          {p.kind === "piece" ? t("Reusable piece") : t("Full prompt")}
        </span>
      </header>
      <div className="detail-grid">
        <ImageGallery images={images} owner="prompt" id={id} title={p.title} />
        <div className="prompt-panel">
          <div className="panel-heading">
            <h2>{t("Prompt")}</h2>
            <span className="muted">
              {t("{count} characters", { count: p.body.length })}
            </span>
          </div>
          <PromptMarkdown body={p.body} />
          <CopyButton body={p.body} />
          <div className="detail-section">
            <h3>{t("Tags")}</h3>
            <div className="tag-list">
              {p.tags.length ? (
                p.tags.map((t) => (
                  <Link
                    key={t}
                    className="tag"
                    href={
                      "/?tag=" +
                      encodeURIComponent(
                        t.normalize("NFKC").toLocaleLowerCase("en-US"),
                      )
                    }
                  >
                    {t}
                  </Link>
                ))
              ) : (
                <span className="muted">{t("No tags yet.")}</span>
              )}
            </div>
          </div>
          <div className="detail-section">
            <h3>{t("Collections")}</h3>
            {groups.length ? (
              groups.map((g) => (
                <Link
                  className="group-link"
                  key={g.id}
                  href={"/groups/" + g.id}
                >
                  <Layers size={18} />
                  {g.name}
                </Link>
              ))
            ) : (
              <p className="muted">
                {t("Edit this prompt to add it to a collection.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
