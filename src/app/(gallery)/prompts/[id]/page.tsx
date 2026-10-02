import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Layers } from "lucide-react";
import { getPrompt, getImages, getMemberships } from "@/lib/data";
import { CopyButton, DeleteButton } from "@/components/detail-controls";
import { ImageGallery } from "@/components/image-gallery";
export default async function PromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const [p, images, groups, search] = await Promise.all([
    getPrompt(id),
    getImages("prompt", id),
    getMemberships(id),
    searchParams,
  ]);
  if (!p) notFound();
  const back = search.back?.startsWith("/?") ? search.back : "/";
  return (
    <>
      <div className="detail-toolbar glass">
        <Link className="back-link" href={back}>
          <ArrowLeft size={17} />
          All prompts
        </Link>
        <div className="toolbar-actions">
          <Link className="button" href={"/prompts/" + id + "/edit"}>
            <Pencil size={16} />
            Edit prompt
          </Link>
          <DeleteButton kind="prompt" id={id} name={p.title} />
        </div>
      </div>
      <header className="detail-heading">
        <div className="eyebrow">{p.model_name}</div>
        <h1>{p.title}</h1>
        <span className={"badge " + (p.kind === "piece" ? "purple" : "")}>
          {p.kind === "piece" ? "Reusable piece" : "Full prompt"}
        </span>
      </header>
      <div className="detail-grid">
        <ImageGallery images={images} owner="prompt" id={id} title={p.title} />
        <div className="prompt-panel">
          <div className="panel-heading">
            <h2>Prompt</h2>
            <span className="muted">
              {p.body.length.toLocaleString()} characters
            </span>
          </div>
          <div className="prompt-body">{p.body}</div>
          <CopyButton body={p.body} />
          <div className="detail-section">
            <h3>Tags</h3>
            <div className="tag-list">
              {p.tags.length ? (
                p.tags.map((t) => (
                  <Link
                    key={t}
                    className="tag"
                    href={
                      "/?tag=" +
                      encodeURIComponent(
                        t.normalize("NFKC").toLocaleLowerCase("en-US"),
                      )
                    }
                  >
                    {t}
                  </Link>
                ))
              ) : (
                <span className="muted">No tags yet.</span>
              )}
            </div>
          </div>
          <div className="detail-section">
            <h3>In these groups</h3>
            {groups.length ? (
              groups.map((g) => (
                <Link
                  className="group-link"
                  key={g.id}
                  href={"/groups/" + g.id}
                >
                  <Layers size={18} />
                  {g.name}
                </Link>
              ))
            ) : (
              <p className="muted">Edit this prompt to add it to a group.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
