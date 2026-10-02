import Link from "next/link";
import { getModels, getGroups } from "@/lib/data";
import { PromptForm } from "@/components/forms";
export default async function NewPrompt({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const [models, groups, params] = await Promise.all([
    getModels(),
    getGroups(),
    searchParams,
  ]);
  return (
    <>
      <Link className="back-link" href="/">
        ← All prompts
      </Link>
      <header className="page-header">
        <div>
          <h1>New prompt</h1>
          <p>Save a complete vision or a detail worth reusing.</p>
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
          <h2>Start with a model.</h2>
          <p>Models keep your prompts organized.</p>
          <Link className="button primary" href="/settings">
            Add a model
          </Link>
        </div>
      )}
    </>
  );
}
