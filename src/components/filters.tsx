"use client";
import { useTranslations } from "@/components/preferences";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
export function Filters({
  tags,
}: {
  tags: { name: string; normalized: string }[];
}) {
  const t = useTranslations();
  const router = useRouter(),
    params = useSearchParams(),
    [pending, start] = useTransition();
  const committedQuery = params.toString();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(committedQuery);
  const working = new URLSearchParams(optimisticQuery);
  // Event handlers may run before the optimistic render. Preserve their latest intent.
  const latestQuery = useRef(committedQuery);
  useLayoutEffect(() => {
    if (!pending) latestQuery.current = committedQuery;
  }, [committedQuery, pending]);
  const [motion, setMotion] = useState({
    query: committedQuery,
    mode: "instant",
  });
  // URL commits (including Back/Forward) settle before painting, without a fade.
  if (motion.query !== committedQuery) {
    setMotion({ query: committedQuery, mode: "instant" });
  }
  function submit(edit: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(latestQuery.current);
    next.delete("page");
    edit(next);
    const query = next.toString();
    latestQuery.current = query;
    start(() => {
      setOptimisticQuery(query);
      router.push("/?" + query);
    });
  }
  function update(key: string, value: string) {
    submit((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
  }
  const selected = working.getAll("tag");
  function tag(name: string) {
    submit((next) => {
      const current = next.getAll("tag");
      next.delete("tag");
      (current.includes(name)
        ? current.filter((t) => t !== name)
        : [...current, name]
      ).forEach((t) => next.append("tag", t));
    });
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
        <div
          className="segments motion-segments"
          data-motion={motion.mode}
          aria-label={t("Prompt type")}
        >
          {[
            ["", t("All")],
            ["full", t("Full prompts")],
            ["piece", t("Pieces")],
          ].map(([v, label]) => (
            <button
              key={v}
              className={(working.get("kind") || "") === v ? "active" : ""}
              aria-pressed={(working.get("kind") || "") === v}
              onClick={(event) => {
                setMotion({
                  query: committedQuery,
                  mode: event.detail > 0 ? "animated" : "instant",
                });
                update("kind", v);
              }}
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
              submit((next) => next.delete("tag"));
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
