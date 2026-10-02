import { sql } from "@/lib/db";
import { getGroups } from "@/lib/data";
import { GroupForm } from "./forms";
import { notFound } from "next/navigation";
export async function GroupEditor({ id }: { id?: string }) {
  const [groups, prompts, selected] = await Promise.all([
    getGroups(),
    sql<
      { id: string; title: string; model_name: string }[]
    >`SELECT p.id,p.title,m.name model_name FROM prompts p JOIN models m ON m.id=p.model_id ORDER BY lower(p.title)`,
    id
      ? sql<
          { prompt_id: string }[]
        >`SELECT prompt_id FROM group_prompts WHERE group_id::text=${id}`
      : Promise.resolve([]),
  ]);
  const group = groups.find((g) => g.id === id);
  if (id && !group) notFound();
  return (
    <GroupForm
      group={group}
      prompts={prompts}
      selected={selected.map((p) => p.prompt_id)}
    />
  );
}
