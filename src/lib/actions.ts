"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "./db";
import {
  promptSchema,
  modelSchema,
  groupSchema,
  parseTags,
  uuid,
} from "./validation";
import {
  requireAuth,
  authEnabled,
  equal,
  createSession,
  clearSession,
} from "./auth";
import { cleanupFiles } from "./storage";
export type ActionState = { error?: string };
function message(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "23505") return "That name is already in use.";
  if (code === "23503")
    return "This item is still in use, or a selected item was removed. Reassign its prompts before deleting a model.";
  if (error instanceof Error && error.name === "ZodError")
    return "Please check the required fields and their lengths.";
  console.error(error);
  return "Could not save your changes. Please try again.";
}
export async function savePrompt(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAuth();
  let id = "";
  try {
    const p = promptSchema.parse({
      ...Object.fromEntries(form),
      groups: form.getAll("groups"),
    });
    const tags = parseTags(p.tags);
    id = await sql.begin(async (tx) => {
      let result;
      if (p.id)
        [result] =
          await tx`UPDATE prompts SET title=${p.title},body=${p.body},model_id=${p.model_id},kind=${p.kind},updated_at=now() WHERE id=${p.id} RETURNING id`;
      else
        [result] =
          await tx`INSERT INTO prompts(title,body,model_id,kind) VALUES(${p.title},${p.body},${p.model_id},${p.kind}) RETURNING id`;
      if (!result) throw new Error("Prompt not found");
      await tx`DELETE FROM prompt_tags WHERE prompt_id=${result.id}`;
      for (const tag of tags) {
        const [t] =
          await tx`INSERT INTO tags(name,normalized) VALUES(${tag.name},${tag.normalized}) ON CONFLICT(normalized) DO UPDATE SET normalized=excluded.normalized RETURNING id`;
        await tx`INSERT INTO prompt_tags VALUES(${result.id},${t.id})`;
      }
      await tx`DELETE FROM group_prompts WHERE prompt_id=${result.id}`;
      for (const group of new Set(p.groups))
        await tx`INSERT INTO group_prompts VALUES(${group},${result.id})`;
      return result.id as string;
    });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/", "layout");
  redirect("/prompts/" + id);
}
export async function saveModel(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAuth();
  try {
    const m = modelSchema.parse(Object.fromEntries(form));
    if (m.id)
      await sql`UPDATE models SET name=${m.name},description=${m.description} WHERE id=${m.id}`;
    else
      await sql`INSERT INTO models(name,description) VALUES(${m.name},${m.description})`;
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/", "layout");
  return {};
}
export async function saveGroup(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAuth();
  let id = "";
  try {
    const g = groupSchema.parse({
      ...Object.fromEntries(form),
      prompts: form.getAll("prompts"),
    });
    id = await sql.begin(async (tx) => {
      let row;
      if (g.id)
        [row] =
          await tx`UPDATE groups SET name=${g.name},description=${g.description} WHERE id=${g.id} RETURNING id`;
      else
        [row] =
          await tx`INSERT INTO groups(name,description) VALUES(${g.name},${g.description}) RETURNING id`;
      if (!row) throw new Error("Group not found");
      await tx`DELETE FROM group_prompts WHERE group_id=${row.id}`;
      for (const p of new Set(g.prompts))
        await tx`INSERT INTO group_prompts VALUES(${row.id},${p})`;
      return row.id as string;
    });
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/", "layout");
  redirect("/groups/" + id);
}
export async function deleteItem(
  kind: "prompt" | "group" | "model",
  id: string,
): Promise<ActionState> {
  await requireAuth();
  try {
    uuid.parse(id);
    const table = { prompt: "prompts", group: "groups", model: "models" }[kind];
    if (!table) throw new Error("Invalid item");
    await sql`DELETE FROM ${sql(table)} WHERE id=${id}`;
    await cleanupFiles();
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/", "layout");
  return {};
}
export async function changeImage(
  id: string,
  operation: "remove" | "cover" | "earlier" | "later",
): Promise<ActionState> {
  await requireAuth();
  try {
    uuid.parse(id);
    await sql.begin(async (tx) => {
      const [img] = await tx`SELECT * FROM images WHERE id=${id}`;
      if (!img) throw new Error("Image not found");
      const column = img.prompt_id ? "prompt_id" : "group_id",
        parent = img.prompt_id || img.group_id;
      await tx`SELECT id FROM ${sql(img.prompt_id ? "prompts" : "groups")} WHERE id=${parent} FOR UPDATE`;
      const rows =
        await tx`SELECT id FROM images WHERE ${sql(column)}=${parent} ORDER BY position,created_at,id`;
      if (operation === "remove") {
        await tx`DELETE FROM images WHERE id=${id}`;
        return;
      }
      const ids = rows.map((r) => r.id as string),
        index = ids.indexOf(id);
      if (index < 0) return;
      const target =
        operation === "cover"
          ? 0
          : operation === "earlier"
            ? Math.max(0, index - 1)
            : Math.min(ids.length - 1, index + 1);
      ids.splice(index, 1);
      ids.splice(target, 0, id);
      for (let n = 0; n < ids.length; n++)
        await tx`UPDATE images SET position=${n} WHERE id=${ids[n]}`;
    });
    await cleanupFiles();
  } catch (error) {
    return { error: message(error) };
  }
  revalidatePath("/", "layout");
  return {};
}
export async function login(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!authEnabled())
    return {
      error:
        "Login is not configured. Set APP_PASSWORD and SESSION_SECRET, or explicitly enable private network mode.",
    };
  const accepted = await sql.begin(async (tx) => {
    const [attempt] =
      await tx`SELECT failures, window_start FROM login_attempts WHERE id=1 FOR UPDATE`;
    const expired =
      Date.now() - new Date(attempt.window_start).getTime() > 15 * 60 * 1000;
    if (!expired && attempt.failures >= 15) return "limited";
    if (!equal(String(form.get("password") || ""), process.env.APP_PASSWORD!)) {
      await tx`UPDATE login_attempts SET failures=${expired ? 1 : attempt.failures + 1},window_start=${expired ? new Date() : attempt.window_start} WHERE id=1`;
      return "incorrect";
    }
    await tx`UPDATE login_attempts SET failures=0,window_start=now() WHERE id=1`;
    return "ok";
  });
  if (accepted === "limited")
    return { error: "Too many attempts. Please try again in 15 minutes." };
  if (accepted === "incorrect") return { error: "That password is incorrect." };
  await createSession();
  redirect("/");
}
export async function logout() {
  await clearSession();
  redirect("/login");
}
