import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { uuid } from "@/lib/validation";
import {
  getModels,
  getGroups,
  getTags,
  getPrompt,
  getMemberships,
} from "@/lib/data";
import { PromptForm } from "@/components/forms";
export default async function NewPrompt({
  searchParams,
}: {
  searchParams: Promise<{ model?: string; copy?: string }>;
}) {
  const t = await getTranslations();
  const [models, groups, tags, params] = await Promise.all([
    getModels(),
    getGroups(),
    getTags(),
    searchParams,
  ]);
  if (params.copy !== undefined && !uuid.safeParse(params.copy).success)
    notFound();
  const source = params.copy ? await getPrompt(params.copy) : undefined;
  if (params.copy && !source) notFound();
  const memberships = source ? await getMemberships(source.id) : [];
  return (
    <>
      <Link className="back-link" href="/">
        {t("← All prompts")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("New prompt")}</h1>
          <p>
            {source
              ? t(
                  "Create a new prompt from this copy. Preview images can be added after saving.",
                )
              : t("Save a complete vision or a detail worth reusing.")}
          </p>
        </div>
      </header>
      {models.length ? (
        <PromptForm
          models={models}
          groups={groups}
          defaultModel={params.model}
          initialValues={
            source
              ? {
                  ...source,
                  title: t("{title} (copy)", { title: source.title }).slice(
                    0,
                    160,
                  ),
                }
              : undefined
          }
          selectedGroups={memberships.map((group) => group.id)}
          existingTags={tags.map((tag) => tag.name)}
        />
      ) : (
        <div className="empty-state">
          <h2>{t("Start with a model.")}</h2>
          <p>{t("Models keep your prompts organized.")}</p>
          <Link className="button primary" href="/settings">
            {t("Add a model")}
          </Link>
        </div>
      )}
    </>
  );
}
