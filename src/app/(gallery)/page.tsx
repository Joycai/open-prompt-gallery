import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { Plus, Library, SearchX } from "lucide-react";
import { getModels, getPrompts, getTags } from "@/lib/data";
import { PromptCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { PromptCollection } from "@/components/prompt-collection";
type Params = Record<string, string | string[] | undefined>;
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const t = await getTranslations();
  const p = await searchParams;
  const one = (key: string) =>
    typeof p[key] === "string" ? (p[key] as string) : "";
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(one("page"))) || 1),
  );
  const [models, prompts, tags] = await Promise.all([
    getModels(),
    getPrompts({
      q: one("q"),
      model: one("model"),
      kind: one("kind"),
      tags: typeof p.tag === "string" ? [p.tag] : p.tag || [],
      page,
    }),
    getTags(),
  ]);
  const model = models.find((m) => m.id === one("model"));
  const filtered = Boolean(one("q") || one("kind") || p.tag);
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((s) => params.append(k, s));
    else if (v) params.set(k, v);
  });
  const back = "/?" + params;
  function pageUrl(n: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(n));
    return "/?" + next;
  }
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">{t("YOUR CREATIVE LIBRARY")}</div>
          <h1>{model?.name || t("All prompts")}</h1>
          <p>
            {model?.description ||
              t("A little inspiration. Always within reach.")}
          </p>
        </div>
        <Link
          className="button primary"
          href={
            models.length
              ? "/prompts/new" + (model ? "?model=" + model.id : "")
              : "/settings"
          }
        >
          <Plus size={18} />
          {t("New prompt")}
        </Link>
      </header>
      <Filters tags={tags} />
      {prompts.length ? (
        <>
          <div className="results-caption">
            {filtered
              ? t("Your matching prompts")
              : t("Saved for your next idea")}
            <span>
              {model
                ? t("{count} prompts in this model", { count: model.count })
                : t("Full prompts & reusable pieces")}
            </span>
          </div>
          <PromptCollection>
            {prompts.slice(0, 24).map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} back={back} />
            ))}
          </PromptCollection>
          <nav className="pagination" aria-label={t("Pagination")}>
            {page > 1 && (
              <Link className="button" href={pageUrl(page - 1)}>
                {t("Previous")}
              </Link>
            )}
            {(page > 1 || prompts.length > 24) && (
              <span>{t("Page {page}", { page })}</span>
            )}
            {prompts.length > 24 && (
              <Link className="button" href={pageUrl(page + 1)}>
                {t("Next")}
              </Link>
            )}
          </nav>
        </>
      ) : (
        <div className="empty-state">
          {filtered ? <SearchX size={38} /> : <Library size={38} />}
          <h2>
            {filtered
              ? t("No prompts found")
              : t("Make room for your next idea.")}
          </h2>
          <p>
            {filtered
              ? t("Try another search or a different combination of tags.")
              : t(
                  "Save the prompts you love, collect the details that inspire you, and find them when you need them.",
                )}
          </p>
          <Link
            className="button primary"
            href={
              filtered
                ? "/?" + (model ? "model=" + model.id : "")
                : models.length
                  ? "/prompts/new"
                  : "/settings"
            }
          >
            {filtered
              ? t("Clear filters")
              : models.length
                ? t("Create your first prompt")
                : t("Add your first model")}
          </Link>
        </div>
      )}
    </>
  );
}
