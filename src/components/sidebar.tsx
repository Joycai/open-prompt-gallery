"use client";
import { useTranslations } from "@/components/preferences";
import Link from "next/link";
import { useId, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Library, Layers, Settings, Box, ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { Model, Group } from "@/lib/data";
function CollectionNav({ groups }: { groups: Group[] }) {
  const t = useTranslations();
  const path = usePathname();
  const [expanded, setExpanded] = useState(true);
  const listId = useId();
  return (
    <div className="collection-nav">
      <div className="collection-nav-heading">
        <Link
          className={"nav-link " + (path === "/groups" ? "selected" : "")}
          href="/groups"
          aria-current={path === "/groups" ? "page" : undefined}
        >
          <Layers size={19} />
          <span>{t("Collections")}</span>
          <small>{groups.length}</small>
        </Link>
        <button
          type="button"
          className="collection-toggle"
          aria-label={t(
            expanded ? "Collapse collections" : "Expand collections",
          )}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      <div id={listId} className="collection-nav-list" hidden={!expanded}>
        {groups.map((g) => {
          const selected =
            path === "/groups/" + g.id || path === "/groups/" + g.id + "/edit";
          return (
            <Link
              key={g.id}
              href={"/groups/" + g.id}
              className={"nav-link " + (selected ? "selected" : "")}
              aria-current={selected ? "page" : undefined}
              title={g.category ? g.name + " · " + g.category : g.name}
            >
              <span className="collection-nav-name">
                <span>{g.name}</span>
                {g.category && (
                  <span className="collection-nav-category">{g.category}</span>
                )}
              </span>
              <small>{g.count}</small>
            </Link>
          );
        })}
        {!groups.length && (
          <p className="nav-hint">{t("No collections yet.")}</p>
        )}
      </div>
    </div>
  );
}
export function Sidebar({
  models,
  groups,
}: {
  models: Model[];
  groups: Group[];
}) {
  const t = useTranslations();
  const path = usePathname(),
    params = useSearchParams(),
    model = params.get("model");
  const nav = (
    <>
      <Link
        className={"nav-link " + (path === "/" && !model ? "selected" : "")}
        href="/"
      >
        <Library size={19} />
        {t("All prompts")}
      </Link>
      <CollectionNav groups={groups} />
      <div className="nav-label">
        {t("Models")}
        <span>{models.length}</span>
      </div>
      <div className="model-nav">
        {models.map((m) => (
          <Link
            key={m.id}
            className={"nav-link " + (model === m.id ? "selected" : "")}
            href={"/?model=" + m.id}
          >
            <Box size={18} />
            <span>{m.name}</span>
            <small>{m.count}</small>
          </Link>
        ))}
        {!models.length && (
          <p className="nav-hint">{t("Add your first model in Settings.")}</p>
        )}
      </div>
      <Link
        className={
          "nav-link settings-link " + (path === "/settings" ? "selected" : "")
        }
        href="/settings"
      >
        <Settings size={19} />
        {t("Settings")}
      </Link>
    </>
  );
  return (
    <aside className="sidebar glass">
      <Link href="/" className="brand">
        <BrandMark />
        <span>
          Open Prompt<span className="brand-sub">Gallery</span>
        </span>
      </Link>
      <p className="brand-caption">{t("Your ideas, ready to reuse.")}</p>
      <nav className="desktop-nav" aria-label={t("Main navigation")}>
        {nav}
      </nav>
      <details className="mobile-nav">
        <summary>
          {t("Browse library")}
          <ChevronDown size={16} />
        </summary>
        <nav aria-label={t("Mobile navigation")}>{nav}</nav>
      </details>
      <div className="sidebar-footer">
        <span className="status-dot" />
        {t("Your personal creative library")}
      </div>
    </aside>
  );
}
