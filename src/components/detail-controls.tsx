"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Trash2, X } from "lucide-react";
import { deleteItem } from "@/lib/actions";
export function CopyButton({ body }: { body: string }) {
  const [status, setStatus] = useState("");
  return (
    <div>
      <button
        className="button primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(body);
            setStatus("Copied to clipboard");
          } catch {
            setStatus(
              "Copy unavailable. Select the text and copy it manually.",
            );
          }
        }}
      >
        {status === "Copied to clipboard" ? (
          <Check size={17} />
        ) : (
          <Copy size={17} />
        )}
        Copy prompt
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
  const ref = useRef<HTMLDialogElement>(null),
    router = useRouter(),
    [pending, start] = useTransition(),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="button danger-quiet"
        aria-label={"Delete " + name}
        onClick={() => ref.current?.showModal()}
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
      <dialog
        ref={ref}
        className="dialog"
        aria-labelledby={"delete-title-" + id}
      >
        <div className="dialog-heading">
          <h2 id={"delete-title-" + id}>Delete {kind}?</h2>
          <button
            className="icon-button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          “{name}” will be permanently removed.
          {kind === "group"
            ? " Its prompts will stay in your library."
            : kind === "prompt"
              ? " Its preview images will also be removed."
              : " Models with prompts cannot be deleted."}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button" onClick={() => ref.current?.close()}>
            Keep {kind}
          </button>
          <button
            className="button danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await deleteItem(kind, id);
                if (result.error) setError(result.error);
                else {
                  ref.current?.close();
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
            {pending ? "Deleting…" : "Delete " + kind}
          </button>
        </div>
      </dialog>
    </>
  );
}
