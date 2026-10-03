import { uuid } from "./validation";

export function promptReturnPath(value: unknown): string {
  if (typeof value !== "string" || /[\\\u0000-\u001f]/.test(value)) return "/";
  if (value === "/" || value.startsWith("/?")) return value;
  const match = /^\/groups\/([^/?#]+)(?:\?[^#]*)?$/.exec(value);
  return match && uuid.safeParse(match[1]).success ? value : "/";
}

export function promptDetailPath(id: string, back: unknown): string {
  const path = promptReturnPath(back);
  return (
    "/prompts/" + id + (path === "/" ? "" : "?back=" + encodeURIComponent(path))
  );
}

export function promptReturnLabel(
  back: string,
  models: { id: string; name: string }[],
  groups: { id: string; name: string }[],
  fallback: string,
): string {
  const url = new URL(promptReturnPath(back), "http://gallery.local");
  if (url.pathname.startsWith("/groups/")) {
    return (
      groups.find((group) => group.id === url.pathname.split("/")[2])?.name ??
      fallback
    );
  }
  return (
    models.find((model) => model.id === url.searchParams.get("model"))?.name ??
    fallback
  );
}
