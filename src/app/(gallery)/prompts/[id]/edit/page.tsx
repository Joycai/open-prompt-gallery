import { getTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getModels,
  getGroups,
  getPrompt,
  getMemberships,
  getTags,
} from "@/lib/data";
import { PromptForm } from "@/components/forms";
import { promptDetailPath, promptReturnPath } from "@/lib/prompt-navigation";
export default async function EditPrompt({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string | string[] }>;
}) {
  const t = await getTranslations();
  const { id } = await params;
  const back = promptReturnPath((await searchParams).back);
  const [models, groups, prompt, membership, tags] = await Promise.all([
    getModels(),
    getGroups(),
    getPrompt(id),
    getMemberships(id),
    getTags(),
  ]);
  if (!prompt) notFound();
  return (
    <>
      <Link className="back-link" href={promptDetailPath(id, back)}>
        {t("← Back to prompt")}
      </Link>
      <header className="page-header">
        <div>
          <h1>{t("Edit prompt")}</h1>
          <p>{t("A few details can make all the difference.")}</p>
        </div>
      </header>
      <PromptForm
        models={models}
        groups={groups}
        prompt={prompt}
        back={back}
        existingTags={tags.map((tag) => tag.name)}
        selectedGroups={membership.map((g) => g.id)}
      />
    </>
  );
}
