import Link from "next/link";
import { q, q1 } from "@/lib/db";
import { apiKey, quota } from "@/lib/api/football";
import { trackRecord } from "@/lib/queries";
import { runJobAction } from "../actions";
import { Flash } from "@/components/Flash";
import { Stat, pct } from "@/components/ui";
import { JobTable, type JobRow } from "@/components/admin/JobTable";
import { siteSettings } from "@/lib/settings";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const [counts, api, jobs, record, site] = await Promise.all([
    q1<{ comps: number; enabled: number; teams: number; fixtures: number; finished: number; upcoming: number; preds: number; drafts: number; settled: number }>(`
      SELECT (SELECT COUNT(*)::int FROM competitions) AS comps,
             (SELECT COUNT(*)::int FROM competitions WHERE enabled) AS enabled,
             (SELECT COUNT(*)::int FROM teams) AS teams,
             (SELECT COUNT(*)::int FROM fixtures) AS fixtures,
             (SELECT COUNT(*)::int FROM fixtures WHERE status IN ('FT','AET','PEN')) AS finished,
             (SELECT COUNT(*)::int FROM fixtures WHERE kickoff > NOW() AND status IN ('NS','TBD')) AS upcoming,
             (SELECT COUNT(*)::int FROM predictions p JOIN fixtures f ON f.id=p.fixture_id WHERE f.kickoff > NOW()) AS preds,
             (SELECT COUNT(*)::int FROM predictions p JOIN fixtures f ON f.id=p.fixture_id WHERE f.kickoff > NOW() AND NOT p.is_published) AS drafts,
             (SELECT COUNT(*)::int FROM predictions WHERE settled_at IS NOT NULL) AS settled`),
    quota(),
    q<JobRow>("SELECT * FROM job_logs ORDER BY started_at DESC LIMIT 8"),
    trackRecord(30),
    siteSettings(),
  ]);
  const c = counts!;
  const hasKey = Boolean(apiKey());
  const r = record.overall;

  const steps = [
    { done: hasKey, text: "Add API_FOOTBALL_KEY to the environment" },
    { done: c.fixtures > 0, text: "Refresh competition metadata, then import history (Sync & Jobs)" },
    { done: c.finished > 500, text: "Import at least 2–3 seasons so the model has data" },
    { done: c.preds > 0, text: "Run the daily pipeline to sync fixtures and generate predictions" },
    { done: Boolean(process.env.CRON_SECRET), text: "Set CRON_SECRET so the daily cron runs automatically" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-muted">Overview of data, predictions and automation.</p>
      </div>
      <Flash msg={sp.msg} error={sp.error} />

      {steps.some((s) => !s.done) && (
        <div className="card p-5">
          <h2 className="font-bold text-white">Getting started</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${s.done ? "bg-brand text-ink" : "bg-panel-2 text-muted"}`}>{s.done ? "✓" : i + 1}</span>
                <span className={s.done ? "text-muted line-through" : "text-slate-200"}>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Competitions" value={`${c.enabled}/${c.comps}`} sub="enabled / total" />
        <Stat label="Fixtures stored" value={c.fixtures.toLocaleString()} sub={`${c.finished.toLocaleString()} finished · ${c.teams.toLocaleString()} teams`} />
        <Stat label="Upcoming predictions" value={c.preds} sub={`${c.drafts} drafts awaiting review · ${c.upcoming} upcoming fixtures`} />
        <Stat label="API quota" value={api ? `${api.remaining}/${api.limit}` : hasKey ? "–" : "No key"} sub={api ? `as of ${new Date(api.at).toUTCString().slice(5, 22)}` : "requests remaining today"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Graded (30d)" value={r.n} sub={`${c.settled} all time`} />
        <Stat label="1X2 hit rate (30d)" value={pct(r.n ? r.w1x2 / r.n : 0, 1)} />
        <Stat label="O/U 2.5 hit rate (30d)" value={pct(r.n ? r.wou / r.n : 0, 1)} />
        <Stat label="Correct score (30d)" value={pct(r.n ? r.wscore / r.n : 0, 1)} />
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold text-white">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["daily", "▶ Run daily pipeline", "btn-primary"],
            ["window", "Sync fixtures & results", "btn-ghost"],
            ["settle", "Grade finished matches", "btn-ghost"],
            ["predict", "Regenerate predictions", "btn-ghost"],
            ["meta", "Refresh competition metadata", "btn-ghost"],
          ].map(([kind, label, cls]) => (
            <form key={kind} action={runJobAction}>
              <input type="hidden" name="kind" value={kind} />
              <button className={`btn ${cls}`}>{label}</button>
            </form>
          ))}
          <Link href="/admin/jobs" className="btn btn-ghost">Import history…</Link>
        </div>
        <p className="mt-3 text-xs text-muted">The daily pipeline syncs the last 2 days and the next {site.horizonDays} days (one API call per day), grades finished matches, then refits the model and predicts upcoming fixtures.</p>
      </div>

      <div className="card overflow-x-auto p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Recent jobs</h2><Link href="/admin/jobs" className="text-sm text-brand">All jobs →</Link></div>
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}
