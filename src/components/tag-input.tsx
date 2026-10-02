"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "@/components/preferences";
import { completeTag, suggestTags } from "@/lib/tag-suggestions";

export function TagInput({
  defaultValue = "",
  tags,
}: {
  defaultValue?: string;
  tags: string[];
}) {
  const t = useTranslations();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [caret, setCaret] = useState(defaultValue.length);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = open ? suggestTags(value, caret, tags) : [];
  const expanded = suggestions.length > 0;

  function choose(tag: string) {
    const completed = completeTag(value, caret, tag);
    if (completed.value.length > 2000) return;
    setValue(completed.value);
    setCaret(completed.caret);
    setActive(-1);
    setOpen(false);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(completed.caret, completed.caret);
    });
  }

  return (
    <span className="tag-input-wrapper">
      <input
        ref={input}
        name="tags"
        aria-label={t("Tags")}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        aria-activedescendant={
          expanded && active >= 0 && active < suggestions.length
            ? `${id}-${active}`
            : undefined
        }
        autoComplete="off"
        maxLength={2000}
        value={value}
        placeholder={t("Portrait, warm light, editorial")}
        onChange={(event) => {
          setValue(event.target.value);
          setCaret(event.target.selectionStart ?? event.target.value.length);
          setActive(-1);
          setOpen(true);
        }}
        onSelect={(event) => {
          const position = event.currentTarget.selectionStart ?? value.length;
          if (position !== caret) {
            setCaret(position);
            setActive(-1);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            suggestions.length
          ) {
            event.preventDefault();
            setActive((previous) => {
              if (previous < 0)
                return event.key === "ArrowDown" ? 0 : suggestions.length - 1;
              return (
                (previous +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  suggestions.length) %
                suggestions.length
              );
            });
          } else if (event.key === "Enter" && expanded) {
            event.preventDefault();
            choose(suggestions[active >= 0 ? active : 0]);
          }
        }}
      />
      {expanded && (
        <span
          id={id}
          className="tag-suggestions"
          role="listbox"
          aria-label={t("Existing tags")}
        >
          {suggestions.map((tag, index) => (
            <span
              id={`${id}-${index}`}
              key={tag}
              role="option"
              aria-selected={active === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(tag)}
            >
              {tag}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
