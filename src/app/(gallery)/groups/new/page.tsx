import Link from "next/link";
import { GroupEditor } from "@/components/group-editor";
export default function NewGroup() {
  return (
    <>
      <Link className="back-link" href="/groups">
        ← Groups
      </Link>
      <header className="page-header">
        <div>
          <h1>New group</h1>
          <p>Make a collection of connected ideas.</p>
        </div>
      </header>
      <GroupEditor />
    </>
  );
}
