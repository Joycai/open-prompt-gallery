import { z } from "zod";
export const uuid = z.string().uuid();
export const promptSchema = z.object({
  id: z.union([uuid, z.literal("")]),
  title: z.string().trim().min(1, "Give your prompt a title.").max(160),
  model_id: uuid,
  body: z.string().trim().min(1, "Add some prompt text.").max(50000),
  kind: z.enum(["full", "piece"]),
  tags: z.string().max(2000),
  groups: z.array(uuid).max(100),
});
export const modelSchema = z.object({
  id: z.union([uuid, z.literal("")]),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000),
});
export const groupSchema = z.object({
  id: z.union([uuid, z.literal("")]),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000),
  category: z.string().trim().max(80).default(""),
  prompts: z.array(uuid).max(1000),
});
export function parseTags(input: string) {
  const unique = new Map<string, string>();
  for (const raw of input.split(",")) {
    const name = raw.trim().normalize("NFKC");
    if (name) {
      if (name.length > 40)
        throw new Error("Tags must be 40 characters or fewer.");
      unique.set(name.toLocaleLowerCase("en-US"), name);
    }
  }
  if (unique.size > 30) throw new Error("Use at most 30 tags per prompt.");
  return [...unique].map(([normalized, name]) => ({ normalized, name }));
}
