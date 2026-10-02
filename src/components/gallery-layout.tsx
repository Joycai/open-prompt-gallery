"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Grid2X2, List } from "lucide-react";
import { useTranslations } from "@/components/preferences";

function persist(name: string, value: string) {
  document.cookie = `gallery-${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function GalleryLayout({
  children,
  initialView,
  initialColumns,
}: {
  children: ReactNode;
  initialView: "grid" | "list";
  initialColumns: number;
}) {
  const t = useTranslations();
  const [view, setView] = useState(initialView);
  const [columns, setColumns] = useState(initialColumns);
  const galleryId = useId();
  const [motion, setMotion] = useState("instant");
  return (
    <div className="prompt-collection">
      <div className="gallery-view-controls">
        <div
          className="segments motion-segments"
          data-motion={motion}
          role="group"
          aria-label={t("Gallery view")}
        >
          {(["grid", "list"] as const).map((value) => (
            <button
              type="button"
              key={value}
              className={view === value ? "active" : ""}
              aria-pressed={view === value}
              aria-controls={galleryId}
              onClick={(event) => {
                setMotion(event.detail > 0 ? "animated" : "instant");
                setView(value);
                persist("view", value);
              }}
            >
              {value === "grid" ? (
                <Grid2X2 size={16} aria-hidden="true" />
              ) : (
                <List size={16} aria-hidden="true" />
              )}
              {t(value === "grid" ? "Grid view" : "List view")}
            </button>
          ))}
        </div>
        {view === "grid" && (
          <label className="gallery-column-control">
            {t("Items per row")}
            <select
              value={columns}
              aria-controls={galleryId}
              onChange={(event) => {
                setColumns(Number(event.target.value));
                persist("columns", event.target.value);
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div
        id={galleryId}
        className={`card-grid gallery-cards gallery-${view}`}
        style={{ "--gallery-columns": columns } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
