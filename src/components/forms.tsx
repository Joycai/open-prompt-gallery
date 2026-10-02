"use client";
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  savePrompt,
  saveModel,
  saveGroup,
  login,
  setupAdmin,
} from "@/lib/actions";
import type { Model, Group, Prompt } from "@/lib/data";
function Feedback({ error }: { error?: string }) {
  return error ? (
    <p className="error-message" role="alert">
      {error}
    </p>
  ) : null;
}
export function PromptForm({
  models,
  groups,
  prompt,
  selectedGroups = [],
  defaultModel,
}: {
  models: Model[];
  groups: Group[];
  prompt?: Prompt;
  selectedGroups?: string[];
  defaultModel?: string;
}) {
  const [state, action, pending] = useActionState(savePrompt, {});
  return (
    <form action={action} className="editor-form">
      <input type="hidden" name="id" value={prompt?.id || ""} />
      <div className="form-section">
        <label>
          Title
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={prompt?.title}
            placeholder="Give your idea a name"
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            Model
            <select
              name="model_id"
              required
              defaultValue={prompt?.model_id || defaultModel || models[0]?.id}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prompt type
            <select name="kind" defaultValue={prompt?.kind || "full"}>
              <option value="full">Full prompt</option>
              <option value="piece">Reusable piece</option>
            </select>
          </label>
        </div>
        <label>
          Prompt
          <textarea
            className="prompt-input"
            name="body"
            required
            maxLength={50000}
            rows={10}
            defaultValue={prompt?.body}
            placeholder="Describe your vision. Or save a detail worth reusing…"
          />
        </label>
        <label>
          Tags
          <input
            name="tags"
            maxLength={2000}
            defaultValue={prompt?.tags.join(", ")}
            placeholder="Portrait, warm light, editorial"
          />
          <small>
            Separate tags with commas. Select tags in the library to find this
            prompt.
          </small>
        </label>
      </div>
      <fieldset className="form-section">
        <legend>Groups</legend>
        {groups.length ? (
          <div className="checkbox-grid">
            {groups.map((g) => (
              <label className="check-label" key={g.id}>
                <input
                  type="checkbox"
                  name="groups"
                  value={g.id}
                  defaultChecked={selectedGroups.includes(g.id)}
                />
                {g.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="muted">Create groups to collect related prompts.</p>
        )}
      </fieldset>
      <p className="form-note">
        {prompt
          ? "Manage preview images on the prompt detail page."
          : "Save your prompt first, then add preview images."}
      </p>
      <Feedback error={state.error} />
      <div className="form-actions">
        <Link className="button" href={prompt ? "/prompts/" + prompt.id : "/"}>
          Cancel
        </Link>
        <button className="button primary" disabled={pending}>
          {pending ? "Saving…" : "Save prompt"}
        </button>
      </div>
    </form>
  );
}
export function ModelForm({ model }: { model?: Model }) {
  const [state, action, pending] = useActionState(saveModel, {});
  const ref = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (pending) submitted.current = true;
    else if (submitted.current && !state.error && !model) {
      ref.current?.reset();
      submitted.current = false;
    }
  }, [pending, state, model]);
  return (
    <form action={action} ref={ref} className="model-form">
      <input type="hidden" name="id" value={model?.id || ""} />
      <label>
        Model name
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={model?.name}
          placeholder="e.g. GPT-image"
        />
      </label>
      <label>
        Description
        <input
          name="description"
          maxLength={1000}
          defaultValue={model?.description}
          placeholder="Optional description"
        />
      </label>
      <button className="button primary" disabled={pending}>
        {pending ? "Saving…" : model ? "Save changes" : "Add model"}
      </button>
      <Feedback error={state.error} />
    </form>
  );
}
export function GroupForm({
  group,
  prompts,
  selected = [],
}: {
  group?: Group;
  prompts: { id: string; title: string; model_name: string }[];
  selected?: string[];
}) {
  const [state, action, pending] = useActionState(saveGroup, {});
  return (
    <form action={action} className="editor-form">
      <input type="hidden" name="id" value={group?.id || ""} />
      <div className="form-section">
        <label>
          Group name
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={group?.name}
            placeholder="e.g. Soft summer light"
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            maxLength={5000}
            rows={3}
            defaultValue={group?.description}
            placeholder="What brings these ideas together?"
          />
        </label>
      </div>
      <fieldset className="form-section">
        <legend>Prompts in this group</legend>
        <p className="muted">Collect full prompts and pieces from any model.</p>
        <div className="membership-list">
          {prompts.map((p) => (
            <label className="check-label" key={p.id}>
              <input
                type="checkbox"
                name="prompts"
                value={p.id}
                defaultChecked={selected.includes(p.id)}
              />
              <span>
                {p.title}
                <small>{p.model_name}</small>
              </span>
            </label>
          ))}
          {!prompts.length && (
            <p className="muted">No prompts yet. You can add them later.</p>
          )}
        </div>
      </fieldset>
      <p className="form-note">
        Add this group’s own preview images after saving.
      </p>
      <Feedback error={state.error} />
      <div className="form-actions">
        <Link
          className="button"
          href={group ? "/groups/" + group.id : "/groups"}
        >
          Cancel
        </Link>
        <button className="button primary" disabled={pending}>
          {pending ? "Saving…" : "Save group"}
        </button>
      </div>
    </form>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action}>
      <label>
        Admin password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          autoFocus
        />
      </label>
      <Feedback error={state.error} />
      <button className="button primary" disabled={pending}>
        {pending ? "Opening…" : "Open your library"}
      </button>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAdmin, {});
  return (
    <form action={action}>
      <label>
        Username
        <input name="username" value="admin" readOnly autoComplete="username" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          required
          autoComplete="new-password"
          autoFocus
        />
      </label>
      <p className="form-note">Use at least 12 characters.</p>
      <label>
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          minLength={12}
          maxLength={128}
          required
          autoComplete="new-password"
        />
      </label>
      <Feedback error={state.error} />
      <button className="button primary" disabled={pending}>
        {pending ? "Creating account…" : "Create admin account"}
      </button>
    </form>
  );
}
