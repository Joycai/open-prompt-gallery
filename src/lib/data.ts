import "server-only";
import { sql } from "./db";
export type Model = {
  id: string;
  name: string;
  description: string;
  count: number;
};
export type Group = {
  category: string;
  id: string;
  name: string;
  description: string;
  count: number;
  cover: string | null;
};
export type GalleryImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
  position: number;
};
export type Prompt = {
  id: string;
  title: string;
  body: string;
  model_id: string;
  model_name: string;
  kind: "full" | "piece";
  tags: string[];
  cover: string | null;
  image_count: number;
};
export async function getModels() {
  return sql<
    Model[]
  >`SELECT m.*, count(p.id)::int AS count FROM models m LEFT JOIN prompts p ON p.model_id=m.id GROUP BY m.id ORDER BY lower(m.name)`;
}
export async function getGroups() {
  return sql<
    Group[]
  >`SELECT g.*, (SELECT count(*)::int FROM group_prompts gp WHERE gp.group_id=g.id) AS count, COALESCE((SELECT id FROM images WHERE group_id=g.id ORDER BY position,created_at,id LIMIT 1), (SELECT i.id FROM images i JOIN group_prompts gp ON gp.prompt_id=i.prompt_id WHERE gp.group_id=g.id ORDER BY i.position,i.created_at,i.id LIMIT 1)) AS cover FROM groups g ORDER BY lower(name)`;
}
export async function getTags() {
  return sql<
    { name: string; normalized: string }[]
  >`SELECT t.name,t.normalized FROM tags t WHERE EXISTS(SELECT 1 FROM prompt_tags pt WHERE pt.tag_id=t.id) ORDER BY t.normalized`;
}
export type Filters = {
  q?: string;
  model?: string;
  kind?: string;
  tags?: string[];
  group?: string;
  page?: number;
};
export async function getPrompts(f: Filters = {}) {
  const tags = f.tags ?? [];
  return sql<Prompt[]>`SELECT p.*, m.name AS model_name,
 COALESCE((SELECT array_agg(t.name ORDER BY t.normalized) FROM prompt_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.prompt_id=p.id),'{}') AS tags,
 (SELECT id FROM images WHERE prompt_id=p.id ORDER BY position,created_at,id LIMIT 1) AS cover,
 (SELECT count(*)::int FROM images WHERE prompt_id=p.id) AS image_count
 FROM prompts p JOIN models m ON m.id=p.model_id
 WHERE (${f.model || ""}='' OR p.model_id::text=${f.model || ""})
 AND (${f.kind || ""}='' OR p.kind=${f.kind || ""})
 AND (${f.group || ""}='' OR EXISTS(SELECT 1 FROM group_prompts gp WHERE gp.prompt_id=p.id AND gp.group_id::text=${f.group || ""}))
 AND (${f.q || ""}='' OR p.title ILIKE ${"%" + (f.q || "") + "%"} OR p.body ILIKE ${"%" + (f.q || "") + "%"} OR EXISTS(SELECT 1 FROM prompt_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.prompt_id=p.id AND t.name ILIKE ${"%" + (f.q || "") + "%"}))
 AND NOT EXISTS(SELECT 1 FROM unnest(${sql.array(tags)}::text[]) selected(name) WHERE NOT EXISTS(SELECT 1 FROM prompt_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.prompt_id=p.id AND t.normalized=selected.name))
 ORDER BY p.updated_at DESC,p.id LIMIT 25 OFFSET ${((f.page || 1) - 1) * 24}`;
}
export async function getPrompt(id: string) {
  const [p] = await sql<
    Prompt[]
  >`SELECT p.*,m.name model_name,COALESCE((SELECT array_agg(t.name ORDER BY t.normalized) FROM prompt_tags pt JOIN tags t ON t.id=pt.tag_id WHERE pt.prompt_id=p.id),'{}') tags FROM prompts p JOIN models m ON m.id=p.model_id WHERE p.id::text=${id}`;
  return p;
}
export async function getImages(owner: "prompt" | "group", id: string) {
  return sql<
    GalleryImage[]
  >`SELECT id,alt,width,height,position FROM images WHERE ${sql(owner + "_id")}::text=${id} ORDER BY position,created_at,id`;
}
export async function getMemberships(id: string) {
  return sql<
    { id: string; name: string }[]
  >`SELECT g.id,g.name FROM groups g JOIN group_prompts gp ON gp.group_id=g.id WHERE gp.prompt_id::text=${id} ORDER BY g.name`;
}
