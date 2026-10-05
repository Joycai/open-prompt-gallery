"use client";

import { useState } from "react";
import { useTranslations } from "./preferences";

export function MembershipPicker({
  name,
  items,
  selected = [],
  limit,
}: {
  name: "prompts" | "groups";
  items: { id: string; title: string; detail?: string; searchText?: string }[];
  selected?: string[];
  limit: number;
}) {
  const t = useTranslations();
  const [selection, setSelection] = useState(() => new Set(selected));
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const visible = items.filter(
    (item) =>
      (!selectedOnly || selection.has(item.id)) &&
      `${item.title} ${item.detail ?? ""} ${item.searchText ?? ""}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="membership-picker">
      {/* Submit the complete selection, including items hidden by search. */}
      {[...selection].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <label>
        {t(name === "prompts" ? "Search prompts" : "Search collections")}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            name === "prompts"
              ? "Search by title or model"
              : "Search by name or description",
          )}
        />
      </label>
      <div className="membership-toolbar">
        <span className="muted" role="status">
          {t("{count} selected", { count: selection.size })} / {limit}
        </span>
        <label className="membership-toggle">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(e) => setSelectedOnly(e.target.checked)}
          />
          {t("Selected only")}
        </label>
      </div>
      <div className="membership-list">
        {visible.map((item) => (
          <label className="check-label" key={item.id}>
            <input
              type="checkbox"
              checked={selection.has(item.id)}
              disabled={!selection.has(item.id) && selection.size >= limit}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelection((previous) => {
                  const next = new Set(previous);
                  if (checked) next.add(item.id);
                  else next.delete(item.id);
                  return next;
                });
              }}
            />
            <span>
              {item.title}
              {item.detail && <small>{item.detail}</small>}
            </span>
          </label>
        ))}
        {!visible.length && (
          <p className="muted">
            {t(
              query
                ? "No matching items. Try another search."
                : selectedOnly
                  ? "No selected items yet."
                  : "No prompts yet. You can add them later.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
