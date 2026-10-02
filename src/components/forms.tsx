"use client";
import { useLocale, useTranslations } from "@/components/preferences";
import { translateFeedback } from "@/lib/i18n";
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  savePrompt,
  saveModel,
  saveGroup,
  login,
  setupAdmin,
} from "@/lib/actions";
import { TagInput } from "@/components/tag-input";
import type { Model, Group, Prompt } from "@/lib/data";
function Feedback({ error }: { error?: string }) {
  const locale = useLocale();
  return error ? (
    <p className="error-message" role="alert">
      {translateFeedback(locale, error)}
    </p>
  ) : null;
}
export function PromptForm({
  models,
  groups,
  prompt,
  selectedGroups = [],
  defaultModel,
  initialValues,
  existingTags = [],
}: {
  models: Model[];
  groups: Group[];
  prompt?: Prompt;
  selectedGroups?: string[];
  defaultModel?: string;
  initialValues?: Pick<Prompt, "title" | "body" | "model_id" | "kind" | "tags">;
  existingTags?: string[];
}) {
  const t = useTranslations();
  const values = prompt ?? initialValues;
  const [state, action, pending] = useActionState(savePrompt, {});
  return (
    <form action={action} className="editor-form">
      <input type="hidden" name="id" value={prompt?.id || ""} />
      <div className="form-section">
        <label>
          {t("Title")}
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={values?.title}
            placeholder={t("Give your idea a name")}
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            {t("Model")}
            <select
              name="model_id"
              required
              defaultValue={values?.model_id || defaultModel || models[0]?.id}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Prompt type")}
            <select name="kind" defaultValue={values?.kind || "full"}>
              <option value="full">{t("Full prompt")}</option>
              <option value="piece">{t("Reusable piece")}</option>
            </select>
          </label>
        </div>
        <label>
          {t("Prompt")}
          <textarea
            className="prompt-input"
            aria-label={t("Prompt")}
            name="body"
            required
            maxLength={50000}
            rows={10}
            defaultValue={values?.body}
            placeholder={t(
              "Describe your vision. Or save a detail worth reusing…",
            )}
          />
        </label>
        <small>{t("Markdown formatting is supported.")}</small>
        <label>
          {t("Tags")}
          <TagInput
            defaultValue={values?.tags.join(", ")}
            tags={existingTags}
          />
          <small>
            {t(
              "Separate tags with commas. Select tags in the library to find this prompt.",
            )}
          </small>
        </label>
      </div>
      <fieldset className="form-section">
        <legend>{t("Groups")}</legend>
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
          <p className="muted">
            {t("Create groups to collect related prompts.")}
          </p>
        )}
      </fieldset>
      <p className="form-note">
        {prompt
          ? t("Manage preview images on the prompt detail page.")
          : t("Save your prompt first, then add preview images.")}
      </p>
      <Feedback error={state.error} />
      <div className="form-actions">
        <Link className="button" href={prompt ? "/prompts/" + prompt.id : "/"}>
          {t("Cancel")}
        </Link>
        <button className="button primary" disabled={pending}>
          {pending ? t("Saving…") : t("Save prompt")}
        </button>
      </div>
    </form>
  );
}
export function ModelForm({ model }: { model?: Model }) {
  const t = useTranslations();
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
        {t("Model name")}
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={model?.name}
          placeholder={t("e.g. GPT-image")}
        />
      </label>
      <label>
        {t("Description")}
        <input
          name="description"
          maxLength={1000}
          defaultValue={model?.description}
          placeholder={t("Optional description")}
        />
      </label>
      <button className="button primary" disabled={pending}>
        {pending ? t("Saving…") : model ? t("Save changes") : t("Add model")}
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
  const t = useTranslations();
  const [state, action, pending] = useActionState(saveGroup, {});
  return (
    <form action={action} className="editor-form">
      <input type="hidden" name="id" value={group?.id || ""} />
      <div className="form-section">
        <label>
          {t("Group name")}
          <input
            name="name"
            required
            maxLength={160}
            defaultValue={group?.name}
            placeholder={t("e.g. Soft summer light")}
            autoFocus
          />
        </label>
        <label>
          {t("Description")}
          <textarea
            name="description"
            maxLength={5000}
            rows={3}
            defaultValue={group?.description}
            placeholder={t("What brings these ideas together?")}
          />
        </label>
      </div>
      <fieldset className="form-section">
        <legend>{t("Prompts in this group")}</legend>
        <p className="muted">
          {t("Collect full prompts and pieces from any model.")}
        </p>
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
            <p className="muted">
              {t("No prompts yet. You can add them later.")}
            </p>
          )}
        </div>
      </fieldset>
      <p className="form-note">
        {t("Add this group’s own preview images after saving.")}
      </p>
      <Feedback error={state.error} />
      <div className="form-actions">
        <Link
          className="button"
          href={group ? "/groups/" + group.id : "/groups"}
        >
          {t("Cancel")}
        </Link>
        <button className="button primary" disabled={pending}>
          {pending ? t("Saving…") : t("Save group")}
        </button>
      </div>
    </form>
  );
}
export function LoginForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action}>
      <label>
        {t("Admin password")}
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
        {pending ? t("Opening…") : t("Open your library")}
      </button>
    </form>
  );
}

export function SetupForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState(setupAdmin, {});
  return (
    <form action={action}>
      <label>
        {t("Username")}
        <input name="username" value="admin" readOnly autoComplete="username" />
      </label>
      <label>
        {t("Password")}
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
      <p className="form-note">{t("Use at least 12 characters.")}</p>
      <label>
        {t("Confirm password")}
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
        {pending ? t("Creating account…") : t("Create admin account")}
      </button>
    </form>
  );
}
