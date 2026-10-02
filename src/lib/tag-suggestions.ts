export function normalizeTag(tag: string) {
  return tag.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

export function tagToken(value: string, caret: number) {
  const start = value.lastIndexOf(",", caret - 1) + 1;
  const next = value.indexOf(",", caret);
  return { start, end: next === -1 ? value.length : next };
}

export function suggestTags(value: string, caret: number, tags: string[]) {
  const { start, end } = tagToken(value, caret);
  const query = normalizeTag(value.slice(start, end));
  if (!query) return [];
  const selected = new Set(
    (value.slice(0, start) + value.slice(end)).split(",").map(normalizeTag),
  );
  return tags
    .filter((tag) => {
      const normalized = normalizeTag(tag);
      return normalized.includes(query) && !selected.has(normalized);
    })
    .slice(0, 8);
}

export function completeTag(value: string, caret: number, tag: string) {
  const { start, end } = tagToken(value, caret);
  const replacement = (start ? " " : "") + tag;
  const suffix = end === value.length ? ", " : value.slice(end);
  return {
    value: value.slice(0, start) + replacement + suffix,
    caret: start + replacement.length + (end === value.length ? 2 : 0),
  };
}
