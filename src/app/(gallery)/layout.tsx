import { requireAuth } from "@/lib/auth";
import { getModels } from "@/lib/data";
import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const models = await getModels();
  return (
    <div className="workspace">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Sidebar models={models} />
      <main id="main">{children}</main>
    </div>
  );
}
