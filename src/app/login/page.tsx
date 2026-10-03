import { getTranslations } from "@/lib/i18n/server";
import { LanguageSelect } from "@/components/preferences";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/forms";
import { getAdmin } from "@/lib/account";
import { authenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Login() {
  const t = await getTranslations();
  if (!(await getAdmin())) redirect("/setup");
  if (await authenticated()) redirect("/");
  return (
    <main className="login-page">
      <div className="login-card glass">
        <div className="auth-language">
          <LanguageSelect />
        </div>
        <BrandMark named />
        <h1>{t("Your ideas await.")}</h1>
        <p className="muted">{t("Sign in as admin.")}</p>
        <LoginForm />
      </div>
    </main>
  );
}
