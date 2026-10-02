"use client";
import { useTranslations } from "@/components/preferences";
export default function RootError({ reset }: { reset: () => void }) {
  const t = useTranslations();
  return (
    <main className="login-page">
      <section className="login-card glass">
        <h1>{t("The library is unavailable.")}</h1>
        <p>
          {t(
            "Check the database connection and run pending migrations, then try again.",
          )}
        </p>
        <button className="button primary" onClick={reset}>
          {t("Try again")}
        </button>
      </section>
    </main>
  );
}
