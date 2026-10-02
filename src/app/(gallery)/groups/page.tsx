import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { getGroups } from "@/lib/data";
import { GroupCard } from "@/components/cards";
export default async function GroupsPage() {
  const groups = await getGroups();
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">IDEAS THAT BELONG TOGETHER</div>
          <h1>Groups</h1>
          <p>A home for every mood, project, and possibility.</p>
        </div>
        <Link className="button primary" href="/groups/new">
          <Plus size={18} />
          New group
        </Link>
      </header>
      {groups.length ? (
        <div className="card-grid">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Layers size={38} />
          <h2>Bring your ideas together.</h2>
          <p>
            Collect related prompts across models, and give each collection a
            visual identity.
          </p>
          <Link className="button primary" href="/groups/new">
            Create your first group
          </Link>
        </div>
      )}
    </>
  );
}
