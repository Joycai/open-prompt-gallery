import Link from "next/link";
import { notFound } from "next/navigation";
import { getModels, getGroups, getPrompt, getMemberships } from "@/lib/data";
import { PromptForm } from "@/components/forms";
export default async function EditPrompt({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [models, groups, prompt, membership] = await Promise.all([
    getModels(),
    getGroups(),
    getPrompt(id),
    getMemberships(id),
  ]);
  if (!prompt) notFound();
  return (
    <>
      <Link className="back-link" href={"/prompts/" + id}>
        ← Back to prompt
      </Link>
      <header className="page-header">
        <div>
          <h1>Edit prompt</h1>
          <p>A few details can make all the difference.</p>
        </div>
      </header>
      <PromptForm
        models={models}
        groups={groups}
        prompt={prompt}
        selectedGroups={membership.map((g) => g.id)}
      />
    </>
  );
}
