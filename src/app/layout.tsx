import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Open Prompt Gallery",
    template: "%s · Open Prompt Gallery",
  },
  description: "Your ideas, ready to reuse. A private home for your prompts.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
