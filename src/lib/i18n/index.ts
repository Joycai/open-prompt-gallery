import { zhCN } from "./zh-CN";
export type Locale = "en" | "zh-CN";
export type Message = keyof typeof zhCN;
export function normalizeLocale(value?: string): Locale {
  return value === "zh-CN" ? "zh-CN" : "en";
}
export function translator(locale: Locale) {
  return (message: Message, values: Record<string, string | number> = {}) => {
    const template = locale === "zh-CN" ? zhCN[message] : message;
    return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => {
      const value = values[key];
      return value === undefined
        ? placeholder
        : typeof value === "number"
          ? new Intl.NumberFormat(locale).format(value)
          : value;
    });
  };
}
// Server responses use English message identifiers; never translate saved user content.
export function translateFeedback(locale: Locale, message: string) {
  return Object.hasOwn(zhCN, message)
    ? translator(locale)(message as Message)
    : message;
}
