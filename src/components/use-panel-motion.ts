"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type PanelState = {
  open: boolean;
  present: boolean;
  phase: "entering" | "open" | "closing" | "closed";
  mode: "animated" | "instant";
  revision: number;
};

/** Logical visibility changes immediately; presence lasts only through the fade. */
export function usePanelMotion(
  panel: RefObject<HTMLDivElement | null>,
  trigger: RefObject<HTMLButtonElement | null>,
) {
  const desired = useRef(false);
  const operation = useRef(0);
  const cancel = useRef<(() => void) | null>(null);
  const [state, setState] = useState<PanelState>({
    open: false,
    present: false,
    phase: "closed",
    mode: "instant",
    revision: 0,
  });
  const clear = useCallback(() => {
    operation.current++;
    cancel.current?.();
    cancel.current = null;
  }, []);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return clear;
    const ticket = operation.current;
    if (state.phase === "entering") {
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => {
          if (ticket === operation.current) {
            setState((current) => ({ ...current, phase: "open" }));
          }
        });
      });
      cancel.current = () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    } else if (state.phase === "closing") {
      const finish = () => {
        if (ticket !== operation.current) return;
        clear();
        setState((current) => ({
          ...current,
          present: false,
          phase: "closed",
        }));
      };
      const ended = (event: TransitionEvent) => {
        if (
          event.target === element &&
          !event.pseudoElement &&
          event.propertyName === "opacity"
        )
          finish();
      };
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      const timeout = window.setTimeout(finish, preference.matches ? 100 : 150);
      element.addEventListener("transitionend", ended);
      preference.addEventListener("change", finish);
      cancel.current = () => {
        window.clearTimeout(timeout);
        element.removeEventListener("transitionend", ended);
        preference.removeEventListener("change", finish);
      };
    }
    return clear;
  }, [state.phase, state.revision, clear, panel]);

  function toggle(animate: boolean) {
    const open = !desired.current;
    desired.current = open;
    const element = panel.current;
    const entering = element?.dataset.phase === "entering";
    clear();
    if (!open && element?.contains(document.activeElement))
      trigger.current?.focus();
    const transition = animate && (open || (element && !entering));
    setState((current) => ({
      open,
      present: open || Boolean(transition),
      phase: open
        ? animate && !element
          ? "entering"
          : "open"
        : transition
          ? "closing"
          : "closed",
      mode: animate ? "animated" : "instant",
      revision: current.revision + 1,
    }));
  }

  return { ...state, toggle };
}
