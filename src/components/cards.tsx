import { getTranslations } from "@/lib/i18n/server";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ImageIcon, TextQuote, ArrowUpRight, Layers } from "lucide-react";
import type { Prompt, Group } from "@/lib/data";
export async function PromptCard({
  prompt: p,
  back = "",
}: {
  prompt: Prompt;
  back?: string;
}) {
  const t = await getTranslations();
  return (
    <Link
      href={
        "/prompts/" + p.id + (back ? "?back=" + encodeURIComponent(back) : "")
      }
      className="prompt-card"
    >
      <div className={"card-preview " + (!p.cover ? "text-preview" : "")}>
        {p.cover ? (
          <img src={"/api/images/" + p.cover} alt={p.title} loading="lazy" />
        ) : (
          <>
            <TextQuote size={28} />
            <p>{p.body}</p>
            <span>{t("Words with possibility.")}</span>
          </>
        )}
      </div>
      <div className="card-content">
        <div className="card-title">
          <h2>{p.title}</h2>
          <ArrowUpRight size={15} className="card-arrow" />
        </div>
        <div className="card-meta">
          <span>{p.model_name}</span>
          <span className={"badge " + (p.kind === "piece" ? "purple" : "")}>
            {p.kind === "piece" ? t("Piece") : t("Full prompt")}
          </span>
        </div>
        <div className="card-bottom">
          <div className="tag-list">
            {p.tags.slice(0, 2).map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
            {p.tags.length > 2 && (
              <span className="muted">+{p.tags.length - 2}</span>
            )}
          </div>
          <span className="image-count">
            <ImageIcon size={14} />
            {p.image_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
export async function GroupCard({ group: g }: { group: Group }) {
  const t = await getTranslations();
  return (
    <Link href={"/groups/" + g.id} className="prompt-card">
      <div className={"card-preview " + (!g.cover ? "group-preview" : "")}>
        {g.cover ? (
          <img src={"/api/images/" + g.cover} alt={g.name} loading="lazy" />
        ) : (
          <Layers size={44} />
        )}
      </div>
      <div className="card-content">
        <div className="card-title">
          <h2>{g.name}</h2>
          <ArrowUpRight size={16} />
        </div>
        <p className="muted clamp-two">
          {g.description || t("A collection of ideas that belong together.")}
        </p>
        <span className="badge">
          {t(g.count === 1 ? "{count} prompt" : "{count} prompts", {
            count: g.count,
          })}
        </span>
      </div>
    </Link>
  );
}
