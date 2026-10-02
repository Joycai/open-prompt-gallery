import { Sparkles } from "lucide-react";
import { SetupForm } from "@/components/forms";
import { getAdmin } from "@/lib/account";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Setup() {
  if (await getAdmin()) redirect("/login");
  return (
    <main className="login-page">
      <div className="login-card glass">
        <span className="brand-mark">
          <Sparkles size={26} />
        </span>
        <h1>Make this library yours.</h1>
        <p className="muted">
          Create your admin password to get started. Your account stays with
          your library when you upgrade.
        </p>
        <SetupForm />
      </div>
    </main>
  );
}
