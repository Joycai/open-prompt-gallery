"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "./preferences";

export function CollectionBrowser({
  items,
}: {
  items: { id: string; name: string; description: string; card: ReactNode }[];
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const visible = items.filter((item) =>
    `${item.name} ${item.description}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <label className="collection-search">
        {t("Search collections")}
        <input
          type="search"
          placeholder={t("Search by name or description")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="card-grid">
        {visible.map((item) => (
          <div className="collection-card-wrap" key={item.id}>
            {item.card}
          </div>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state compact">
          <h2>{t("No matching collections")}</h2>
          <button className="button" onClick={() => setQuery("")}>
            {t("Clear search")}
          </button>
        </div>
      )}
    </>
  );
}
