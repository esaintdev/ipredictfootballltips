"use client";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const setup = /DATABASE_URL|ECONNREFUSED|ENOTFOUND|password authentication/i.test(error.message);
  return (
    <div className="s-card mx-auto max-w-xl p-8 text-center">
      <div className="text-3xl">⚠️</div>
      <h1 className="mt-3 text-xl font-bold text-fg">{setup ? "Database not connected" : "Something went wrong"}</h1>
      <p className="mt-2 text-sm text-subtle">
        {setup ? "Set DATABASE_URL to your Postgres / Supabase connection string and restart the app." : "Please try again in a moment."}
      </p>
      <button onClick={reset} className="s-btn s-btn-primary mt-6">Try again</button>
    </div>
  );
}
