import { getTranslations } from "@/lib/i18n/server";
import { cookies } from "next/headers";
import { Preferences } from "@/components/preferences";
import { normalizeTheme, normalizeMode } from "@/lib/preferences";
import { Box, Plus, LogOut } from "lucide-react";
import { getModels } from "@/lib/data";
import { logout } from "@/lib/actions";
import { ModelForm } from "@/components/forms";
import { DeleteButton } from "@/components/detail-controls";
export default async function Settings() {
  const t = await getTranslations();
  const store = await cookies();
  const models = await getModels();
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">{t("MAKE IT YOURS")}</div>
          <h1>{t("Settings")}</h1>
          <p>{t("A little organization goes a long way.")}</p>
        </div>
        <form action={logout}>
          <button className="button">
            <LogOut size={16} />
            {t("Sign out")}
          </button>
        </form>
      </header>
      <div className="settings-content">
        <Preferences
          initialTheme={normalizeTheme(store.get("gallery-theme")?.value)}
          initialMode={normalizeMode(store.get("gallery-mode")?.value)}
        />
        <section className="surface">
          <div className="section-heading">
            <div>
              <h2>{t("Your models")}</h2>
              <p className="muted">
                {t("Categories for the tools you create with.")}
              </p>
            </div>
            <Box size={23} />
          </div>
          {models.map((m) => (
            <div className="model-item" key={m.id}>
              <div className="model-summary">
                <div>
                  <h3>{m.name}</h3>
                  <small className="muted">
                    {t(m.count === 1 ? "{count} prompt" : "{count} prompts", {
                      count: m.count,
                    })}
                  </small>
                </div>
                <DeleteButton kind="model" id={m.id} name={m.name} />
              </div>
              <details>
                <summary>{t("Edit model")}</summary>
                <ModelForm model={m} />
              </details>
            </div>
          ))}
          {!models.length && (
            <p className="muted">
              {t("No models yet. Add one below to start your library.")}
            </p>
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>{t("Add a model")}</h2>
            <Plus size={21} />
          </div>
          <ModelForm />
        </section>
        <p className="form-note">
          {t(
            "Models organize your prompts. They don’t connect to AI providers or require API keys.",
          )}
        </p>
      </div>
    </>
  );
}
