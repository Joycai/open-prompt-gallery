import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>This page wandered off.</h1>
      <p>The item may have been removed.</p>
      <Link href="/" className="button primary">
        Back to your library
      </Link>
    </main>
  );
}
