"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { translator, type Locale } from "@/lib/i18n";
import { themes, modes, type Theme, type Mode } from "@/lib/preferences";
const LocaleContext = createContext<Locale>("en");
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}
export function useLocale() {
  return useContext(LocaleContext);
}
export function useTranslations() {
  return translator(useLocale());
}
function persist(name: string, value: string) {
  document.cookie = `gallery-${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
export function LanguageSelect() {
  const locale = useLocale(),
    t = useTranslations(),
    router = useRouter();
  return (
    <label>
      {t("Language")}
      <select
        value={locale}
        onChange={(event) => {
          persist("locale", event.target.value);
          router.refresh();
        }}
      >
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </select>
    </label>
  );
}
export function Preferences({
  initialTheme,
  initialMode,
}: {
  initialTheme: Theme;
  initialMode: Mode;
}) {
  const [theme, setTheme] = useState(initialTheme),
    [mode, setMode] = useState(initialMode);
  const t = useTranslations();
  const labels = {
    ocean: "Ocean",
    forest: "Forest",
    violet: "Violet",
    system: "System",
    light: "Light",
    dark: "Dark",
  } as const;
  return (
    <section
      className="surface preferences"
      aria-labelledby="preferences-title"
    >
      <h2 id="preferences-title">{t("Appearance & language")}</h2>
      <p className="muted">
        {t("Personalize this browser. Your prompts stay as you wrote them.")}
      </p>
      <fieldset>
        <legend>{t("Theme")}</legend>
        <div className="theme-options">
          {themes.map((value) => (
            <button
              type="button"
              key={value}
              className="theme-option"
              aria-pressed={theme === value}
              onClick={() => {
                setTheme(value);
                persist("theme", value);
                document.documentElement.dataset.theme = value;
              }}
            >
              <span className={`theme-swatch ${value}`} aria-hidden="true" />
              {t(labels[value])}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("Mode")}</legend>
        <div className="segments">
          {modes.map((value) => (
            <button
              type="button"
              key={value}
              className={mode === value ? "active" : ""}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                persist("mode", value);
                document.documentElement.dataset.mode = value;
              }}
            >
              {t(labels[value])}
            </button>
          ))}
        </div>
        <p className="form-note">
          {t("System mode follows your device’s appearance automatically.")}
        </p>
      </fieldset>
      <LanguageSelect />
    </section>
  );
}
