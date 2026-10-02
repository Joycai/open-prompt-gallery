"use client";
import { useLocale, useTranslations } from "@/components/preferences";
import { translateFeedback } from "@/lib/i18n";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { GalleryImage } from "@/lib/data";
import { changeImage } from "@/lib/actions";
export function ImageGallery({
  images,
  owner,
  id,
  title,
}: {
  images: GalleryImage[];
  owner: "prompt" | "group";
  id: string;
  title: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [selected, setSelected] = useState(images[0]?.id),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false),
    [progress, setProgress] = useState(""),
    [pending, start] = useTransition(),
    [manage, setManage] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    abort = useRef<AbortController | null>(null),
    router = useRouter();
  const current = images.find((i) => i.id === selected) || images[0];
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    abort.current = new AbortController();
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        setProgress(
          t("Uploading {current} of {total}…", {
            current: count + 1,
            total: files.length,
          }),
        );
        const data = new FormData();
        data.set("file", file);
        data.set("owner", owner);
        data.set("id", id);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: data,
          signal: abort.current.signal,
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || t("Upload failed."));
        }
        count++;
      }
      setProgress(
        t(count === 1 ? "{count} image added." : "{count} images added.", {
          count,
        }),
      );
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? t("Upload cancelled. Images already uploaded are saved.")
          : (err as Error).message,
      );
      setProgress("");
    } finally {
      setUploading(false);
      router.refresh();
      if (input.current) input.current.value = "";
    }
  }
  function change(image: string, op: "remove" | "cover" | "earlier" | "later") {
    start(async () => {
      const result = await changeImage(image, op);
      setError(result.error || "");
      router.refresh();
    });
  }
  return (
    <section className="gallery-section" aria-label={t("Preview images")}>
      {current ? (
        <>
          <button
            className="hero-image"
            onClick={() => dialog.current?.showModal()}
            aria-label={t("Open full preview")}
          >
            <img src={"/api/images/" + current.id} alt={current.alt || title} />
            <span className="image-overlay">
              {images.findIndex((i) => i.id === current.id) + 1} /{" "}
              {images.length}
            </span>
          </button>
          <div className="thumbnail-strip">
            {images.map((img, n) => (
              <button
                key={img.id}
                className={
                  "thumbnail " + (img.id === current.id ? "active" : "")
                }
                onClick={() => setSelected(img.id)}
                aria-label={t("Preview image {number}", { number: n + 1 })}
                aria-pressed={img.id === current.id}
              >
                <img src={"/api/images/" + img.id} alt="" />
                {n === 0 && <span className="cover-dot" />}
              </button>
            ))}
          </div>
          <dialog
            className="lightbox"
            ref={dialog}
            aria-label={t("Full image preview")}
          >
            <button
              className="icon-button lightbox-close"
              onClick={() => dialog.current?.close()}
              aria-label={t("Close preview")}
            >
              <X />
            </button>
            <img src={"/api/images/" + current.id} alt={current.alt || title} />
          </dialog>
        </>
      ) : (
        <div className="image-empty">
          <ImagePlus size={38} />
          <h3>{t("A preview brings it to life.")}</h3>
          <p>{t("Add images that capture the idea.")}</p>
        </div>
      )}
      <div className="gallery-actions">
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="visually-hidden"
          id={"upload-" + id}
          disabled={uploading}
          onChange={(e) => upload(e.target.files)}
        />
        <button
          className="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <Upload size={16} />
          {uploading ? t("Uploading…") : t("Add images")}
        </button>
        {uploading ? (
          <button className="button" onClick={() => abort.current?.abort()}>
            {t("Cancel upload")}
          </button>
        ) : (
          images.length > 0 && (
            <button className="text-button" onClick={() => setManage(!manage)}>
              {manage ? t("Done") : t("Manage images")}
            </button>
          )
        )}
      </div>
      <small className="muted">
        {t("JPEG, PNG, WebP or AVIF · Up to 10 MB each")}
      </small>
      {progress && (
        <p className="muted" role="status">
          {progress}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {translateFeedback(locale, error)}
        </p>
      )}
      {manage && (
        <div className="image-manager">
          {images.map((img, n) => (
            <div key={img.id} className="image-manager-row">
              <img src={"/api/images/" + img.id} alt="" />
              <span>
                {n === 0 ? t("Cover") : t("Image {number}", { number: n + 1 })}
              </span>
              <button
                className="icon-button"
                title={t("Make cover")}
                aria-label={t("Make image {number} the cover", {
                  number: n + 1,
                })}
                disabled={pending || n === 0}
                onClick={() => change(img.id, "cover")}
              >
                <Star size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={t("Move image {number} earlier", { number: n + 1 })}
                disabled={pending || n === 0}
                onClick={() => change(img.id, "earlier")}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={t("Move image {number} later", { number: n + 1 })}
                disabled={pending || n === images.length - 1}
                onClick={() => change(img.id, "later")}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="icon-button danger-quiet"
                aria-label={t("Remove image {number}", { number: n + 1 })}
                disabled={pending}
                onClick={() => {
                  if (window.confirm(t("Permanently remove this image?")))
                    change(img.id, "remove");
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
