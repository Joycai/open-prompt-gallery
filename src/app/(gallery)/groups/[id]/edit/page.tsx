import Link from "next/link";
import { GroupEditor } from "@/components/group-editor";
export default async function EditGroup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Link className="back-link" href={"/groups/" + id}>
        ← Back to group
      </Link>
      <header className="page-header">
        <div>
          <h1>Edit group</h1>
          <p>Refine your collection.</p>
        </div>
      </header>
      <GroupEditor id={id} />
    </>
  );
}
