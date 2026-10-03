"use client";
import { useTranslations } from "@/components/preferences";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Library, Layers, Settings, Box, ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { Model } from "@/lib/data";
export function Sidebar({ models }: { models: Model[] }) {
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
      <Link
        className={"nav-link " + (path.startsWith("/groups") ? "selected" : "")}
        href="/groups"
      >
        <Layers size={19} />
        {t("Groups")}
      </Link>
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
