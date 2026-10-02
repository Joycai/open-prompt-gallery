"use client";
import { useTranslations } from "@/components/preferences";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTransition } from "react";
export function Filters({
  tags,
}: {
  tags: { name: string; normalized: string }[];
}) {
  const t = useTranslations();
  const router = useRouter(),
    params = useSearchParams(),
    [pending, start] = useTransition();
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.push("/?" + next));
  }
  const selected = params.getAll("tag");
  function tag(name: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    next.delete("tag");
    (selected.includes(name)
      ? selected.filter((t) => t !== name)
      : [...selected, name]
    ).forEach((t) => next.append("tag", t));
    start(() => router.push("/?" + next));
  }
  return (
    <div className={"filter-area " + (pending ? "pending" : "")}>
      <div className="search-row">
        <form
          className="search-field"
          onSubmit={(e) => {
            e.preventDefault();
            update("q", new FormData(e.currentTarget).get("q") as string);
          }}
        >
          <Search size={18} />
          <input
            aria-label={t("Search prompts")}
            name="q"
            placeholder={t("Search titles, prompts, tags…")}
            defaultValue={params.get("q") || ""}
            key={params.get("q")}
          />
          {params.get("q") && (
            <button
              type="button"
              className="icon-button"
              aria-label={t("Clear search")}
              onClick={() => update("q", "")}
            >
              <X size={15} />
            </button>
          )}
          <button type="submit" className="search-submit">
            {t("Search")}
          </button>
        </form>
        <div className="segments" aria-label={t("Prompt type")}>
          {[
            ["", t("All")],
            ["full", t("Full prompts")],
            ["piece", t("Pieces")],
          ].map(([v, label]) => (
            <button
              key={v}
              className={(params.get("kind") || "") === v ? "active" : ""}
              aria-pressed={(params.get("kind") || "") === v}
              onClick={() => update("kind", v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tags.length > 0 && (
        <div className="filter-tags">
          <span className="filter-label">{t("Tags")}</span>
          <button
            className={"tag filter-tag " + (!selected.length ? "active" : "")}
            onClick={() => {
              const n = new URLSearchParams(params);
              n.delete("tag");
              n.delete("page");
              start(() => router.push("/?" + n));
            }}
          >
            {t("All tags")}
          </button>
          {tags.map((t) => (
            <button
              key={t.normalized}
              className={
                "tag filter-tag " +
                (selected.includes(t.normalized) ? "active" : "")
              }
              aria-pressed={selected.includes(t.normalized)}
              onClick={() => tag(t.normalized)}
            >
              {t.name}
            </button>
          ))}
          {selected.length > 1 && (
            <small className="muted">{t("Matching all selected tags")}</small>
          )}
        </div>
      )}
    </div>
  );
}
