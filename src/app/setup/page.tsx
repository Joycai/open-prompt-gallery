import { getTranslations } from "@/lib/i18n/server";
import { LanguageSelect } from "@/components/preferences";
import { Sparkles } from "lucide-react";
import { SetupForm } from "@/components/forms";
import { getAdmin } from "@/lib/account";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Setup() {
  const t = await getTranslations();
  if (await getAdmin()) redirect("/login");
  return (
    <main className="login-page">
      <div className="login-card glass">
        <div className="auth-language">
          <LanguageSelect />
        </div>
        <span className="brand-mark">
          <Sparkles size={26} />
        </span>
        <h1>{t("Make this library yours.")}</h1>
        <p className="muted">
          {t(
            "Create your admin password to get started. Your account stays with your library when you upgrade.",
          )}
        </p>
        <SetupForm />
      </div>
    </main>
  );
}
