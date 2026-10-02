"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type SyntheticEvent,
} from "react";

/** Keep native modality/focus while CSS finishes a pointer-triggered exit. */
export function useDialogMotion(ref: RefObject<HTMLDialogElement | null>) {
  const operation = useRef(0);
  const frames = useRef<number[]>([]);
  const cleanupExit = useRef<(() => void) | null>(null);
  const clear = useCallback(() => {
    operation.current++;
    frames.current.forEach(cancelAnimationFrame);
    frames.current = [];
    cleanupExit.current?.();
    cleanupExit.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  function open(animate: boolean) {
    const dialog = ref.current;
    if (!dialog) return;
    const alreadyOpen = dialog.open;
    clear();
    const ticket = operation.current;
    dialog.dataset.motion = animate ? "animated" : "instant";
    dialog.dataset.phase = animate && !alreadyOpen ? "entering" : "open";
    if (!alreadyOpen) dialog.showModal();
    if (animate && !alreadyOpen) {
      frames.current.push(
        requestAnimationFrame(() => {
          frames.current.push(
            requestAnimationFrame(() => {
              if (operation.current === ticket && dialog.open) {
                dialog.dataset.phase = "open";
              }
            }),
          );
        }),
      );
    }
  }

  function close(animate: boolean) {
    const dialog = ref.current;
    if (!dialog) return;
    const entering = dialog.dataset.phase === "entering";
    clear();
    if (!dialog.open) return;
    const ticket = operation.current;
    const finish = () => {
      if (operation.current !== ticket) return;
      clear();
      dialog.dataset.motion = "instant";
      dialog.close();
    };
    if (!animate || entering) {
      finish();
      return;
    }
    dialog.dataset.motion = "animated";
    dialog.dataset.phase = "closing";
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ended = (event: TransitionEvent) => {
      if (
        event.target === dialog &&
        !event.pseudoElement &&
        event.propertyName === "opacity"
      )
        finish();
    };
    const timeout = window.setTimeout(finish, preference.matches ? 100 : 200);
    dialog.addEventListener("transitionend", ended);
    // Settle an exit on a live preference change, even if CSS cancels its transition.
    preference.addEventListener("change", finish);
    cleanupExit.current = () => {
      window.clearTimeout(timeout);
      dialog.removeEventListener("transitionend", ended);
      preference.removeEventListener("change", finish);
    };
  }

  return {
    open,
    close,
    onCancel(event: SyntheticEvent<HTMLDialogElement>) {
      event.preventDefault();
      close(false);
    },
    onClose() {
      // Native close events are queued: an older close must not cancel a reopen.
      if (!ref.current?.open) clear();
    },
  };
}
