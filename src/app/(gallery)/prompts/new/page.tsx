import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { getModels, getGroups } from "@/lib/data";
import { PromptForm } from "@/components/forms";
export default async function NewPrompt({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const t = await getTranslations();
  const [models, groups, params] = await Promise.all([
    getModels(),
    getGroups(),
    searchParams,
  ]);
  return (
    <>
      <Link className="back-link" href="/">
        {t("← All prompts")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("New prompt")}</h1>
          <p>{t("Save a complete vision or a detail worth reusing.")}</p>
        </div>
      </header>
      {models.length ? (
        <PromptForm
          models={models}
          groups={groups}
          defaultModel={params.model}
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
