import { cookies } from "next/headers";
import { GalleryLayout } from "@/components/gallery-layout";

export async function PromptCollection({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = await cookies();
  const columns = Number(preferences.get("gallery-columns")?.value);
  return (
    <GalleryLayout
      initialView={
        preferences.get("gallery-view")?.value === "list" ? "list" : "grid"
      }
      initialColumns={
        Number.isInteger(columns) && columns >= 1 && columns <= 6 ? columns : 3
      }
    >
      {children}
    </GalleryLayout>
  );
}
