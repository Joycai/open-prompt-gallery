import { Box, Plus, LogOut } from "lucide-react";
import { getModels } from "@/lib/data";
import { logout } from "@/lib/actions";
import { ModelForm } from "@/components/forms";
import { DeleteButton } from "@/components/detail-controls";
export default async function Settings() {
  const models = await getModels();
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h1>Settings</h1>
          <p>A little organization goes a long way.</p>
        </div>
        <form action={logout}>
          <button className="button">
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </header>
      <div className="settings-content">
        <section className="surface">
          <div className="section-heading">
            <div>
              <h2>Your models</h2>
              <p className="muted">Categories for the tools you create with.</p>
            </div>
            <Box size={23} />
          </div>
          {models.map((m) => (
            <div className="model-item" key={m.id}>
              <div className="model-summary">
                <div>
                  <h3>{m.name}</h3>
                  <small className="muted">
                    {m.count} {m.count === 1 ? "prompt" : "prompts"}
                  </small>
                </div>
                <DeleteButton kind="model" id={m.id} name={m.name} />
              </div>
              <details>
                <summary>Edit model</summary>
                <ModelForm model={m} />
              </details>
            </div>
          ))}
          {!models.length && (
            <p className="muted">
              No models yet. Add one below to start your library.
            </p>
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>Add a model</h2>
            <Plus size={21} />
          </div>
          <ModelForm />
        </section>
        <p className="form-note">
          Models organize your prompts. They don’t connect to AI providers or
          require API keys.
        </p>
      </div>
    </>
  );
}
