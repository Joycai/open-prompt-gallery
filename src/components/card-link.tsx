"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

export function CardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const [feedback, setFeedback] = useState({ pressed: false, motion: "idle" });
  function release() {
    setFeedback((current) =>
      current.pressed ? { ...current, pressed: false } : current,
    );
  }
  return (
    <Link
      href={href}
      className="prompt-card"
      data-pressed={feedback.pressed}
      data-press-motion={feedback.motion}
      onPointerDown={(event) => {
        if (event.isPrimary && event.button === 0) {
          setFeedback({ pressed: true, motion: "animated" });
        }
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onBlur={release}
      onKeyDown={() => setFeedback({ pressed: false, motion: "instant" })}
      onPointerEnter={(event) => {
        if (event.isPrimary) {
          setFeedback((current) =>
            current.motion === "instant" && !current.pressed
              ? { pressed: false, motion: "idle" }
              : current,
          );
        }
      }}
    >
      {children}
    </Link>
  );
}
