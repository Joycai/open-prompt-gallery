import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/forms";
export default function Login() {
  return (
    <main className="login-page">
      <div className="login-card glass">
        <span className="brand-mark">
          <Sparkles size={26} />
        </span>
        <h1>Your ideas await.</h1>
        <p className="muted">Welcome to Open Prompt Gallery.</p>
        <LoginForm />
      </div>
    </main>
  );
}
