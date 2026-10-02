"use client";
import { useTranslations } from "@/components/preferences";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations();
  return (
    <div className="empty-state">
      <h1>{t("We couldn’t open this page.")}</h1>
      <p>
        {t(
          "Please try again. If this continues, check that PostgreSQL is running and migrations have been applied.",
        )}
      </p>
      <button className="button primary" onClick={reset}>
        {t("Try again")}
      </button>
    </div>
  );
}
