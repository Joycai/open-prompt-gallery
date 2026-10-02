"use client";
export default function RootError({ reset }: { reset: () => void }) {
  return (
    <main className="login-page">
      <section className="login-card glass">
        <h1>The library is unavailable.</h1>
        <p>
          Check the database connection and run pending migrations, then try
          again.
        </p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
