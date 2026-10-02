"use client";
import { useLocale, useTranslations } from "@/components/preferences";
import { translateFeedback } from "@/lib/i18n";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Trash2, X } from "lucide-react";
import { useDialogMotion } from "@/components/use-dialog-motion";
import { deleteItem } from "@/lib/actions";
export function CopyButton({ body }: { body: string }) {
  const t = useTranslations();
  const [status, setStatus] = useState("");
  return (
    <div>
      <button
        className="button primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(body);
            setStatus(t("Copied to clipboard"));
          } catch {
            setStatus(
              t("Copy unavailable. Select the text and copy it manually."),
            );
          }
        }}
      >
        {status === t("Copied to clipboard") ? (
          <Check size={17} />
        ) : (
          <Copy size={17} />
        )}
        {t("Copy prompt")}
      </button>
      {status && (
        <small className="copy-status" role="status">
          {status}
        </small>
      )}
    </div>
  );
}
export function DeleteButton({
  kind,
  id,
  name,
}: {
  kind: "prompt" | "group" | "model";
  id: string;
  name: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const ref = useRef<HTMLDialogElement>(null),
    router = useRouter(),
    [pending, start] = useTransition(),
    [error, setError] = useState("");
  const motion = useDialogMotion(ref);
  return (
    <>
      <button
        className="button danger-quiet"
        aria-label={t("Delete {name}", { name })}
        onClick={(event) => motion.open(event.detail > 0)}
      >
        <Trash2 size={16} />
        <span>{t("Delete")}</span>
      </button>
      <dialog
        ref={ref}
        className="dialog motion-dialog"
        onCancel={motion.onCancel}
        onClose={motion.onClose}
        aria-labelledby={"delete-title-" + id}
      >
        <div className="dialog-heading">
          <h2 id={"delete-title-" + id}>
            {t("Delete {kind}?", { kind: t(kind) })}
          </h2>
          <button
            className="icon-button"
            aria-label={t("Close")}
            onClick={(event) => motion.close(event.detail > 0)}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          {t("“{name}” will be permanently removed.", { name })}
          {kind === "group"
            ? t(" Its prompts will stay in your library.")
            : kind === "prompt"
              ? t(" Its preview images will also be removed.")
              : t(" Models with prompts cannot be deleted.")}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {translateFeedback(locale, error)}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button"
            onClick={(event) => motion.close(event.detail > 0)}
          >
            {t("Keep {kind}", { kind: t(kind) })}
          </button>
          <button
            className="button danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await deleteItem(kind, id);
                if (result.error) setError(result.error);
                else {
                  motion.close(false);
                  router.push(
                    kind === "group"
                      ? "/groups"
                      : kind === "model"
                        ? "/settings"
                        : "/",
                  );
                  router.refresh();
                }
              })
            }
          >
            {pending ? t("Deleting…") : t("Delete {name}", { name: t(kind) })}
          </button>
        </div>
      </dialog>
    </>
  );
}
