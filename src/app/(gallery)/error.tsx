"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>We couldn’t open this page.</h1>
      <p>
        Please try again. If this continues, check that PostgreSQL is running
        and migrations have been applied.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
