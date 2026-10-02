import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/preferences";
import { normalizeLocale } from "@/lib/i18n";
import { normalizeTheme, normalizeMode } from "@/lib/preferences";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Open Prompt Gallery",
    template: "%s · Open Prompt Gallery",
  },
  description: "Your ideas, ready to reuse. A private home for your prompts.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const locale = normalizeLocale(store.get("gallery-locale")?.value);
  const theme = normalizeTheme(store.get("gallery-theme")?.value);
  const mode = normalizeMode(store.get("gallery-mode")?.value);
  return (
    <html lang={locale} data-theme={theme} data-mode={mode}>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
