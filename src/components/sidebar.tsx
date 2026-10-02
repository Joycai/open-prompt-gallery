"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Library,
  Layers,
  Settings,
  Box,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import type { Model } from "@/lib/data";
export function Sidebar({ models }: { models: Model[] }) {
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
        All prompts
      </Link>
      <Link
        className={"nav-link " + (path.startsWith("/groups") ? "selected" : "")}
        href="/groups"
      >
        <Layers size={19} />
        Groups
      </Link>
      <div className="nav-label">
        Models <span>{models.length}</span>
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
          <p className="nav-hint">Add your first model in Settings.</p>
        )}
      </div>
      <Link
        className={
          "nav-link settings-link " + (path === "/settings" ? "selected" : "")
        }
        href="/settings"
      >
        <Settings size={19} />
        Settings
      </Link>
    </>
  );
  return (
    <aside className="sidebar glass">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <Sparkles size={22} />
        </span>
        <span>
          Open Prompt<span className="brand-sub">Gallery</span>
        </span>
      </Link>
      <p className="brand-caption">Your ideas, ready to reuse.</p>
      <nav className="desktop-nav" aria-label="Main navigation">
        {nav}
      </nav>
      <details className="mobile-nav">
        <summary>
          Browse library <ChevronDown size={16} />
        </summary>
        <nav aria-label="Mobile navigation">{nav}</nav>
      </details>
      <div className="sidebar-footer">
        <span className="status-dot" /> Your personal creative library
      </div>
    </aside>
  );
}
