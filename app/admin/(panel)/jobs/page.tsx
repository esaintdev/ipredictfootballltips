import { q } from "@/lib/db";
import { apiKey } from "@/lib/api/football";
import { importHistoryAction, runJobAction } from "../../actions";
import { Flash } from "@/components/Flash";
import { JobTable, type JobRow } from "@/components/admin/JobTable";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const [jobs, comps] = await Promise.all([
    q<JobRow>("SELECT * FROM job_logs ORDER BY started_at DESC LIMIT 50"),
    q<{ id: number; name: string }>("SELECT id, name FROM competitions WHERE enabled ORDER BY priority"),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Sync & jobs</h1>
        <p className="text-sm text-muted">Pull data from API-Football and run the prediction pipeline.</p>
      </div>
      <Flash msg={sp.msg} error={sp.error} />
      {!apiKey() && <Flash error="API_FOOTBALL_KEY is not set – syncing is disabled until you add it to the environment." />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-white">Import history</h2>
          <p className="mt-1 text-sm text-muted">Loads full seasons (one API call per competition per season). Needed for the model and for backtests. Runs in the background.</p>
          <form action={importHistoryAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Seasons back</label>
              <select name="seasons" defaultValue="3" className="input">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} season{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Competition</label>
              <select name="competition_id" className="input" defaultValue="">
                <option value="">All enabled ({comps.length})</option>
                {comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary sm:col-span-2">Start import</button>
          </form>
          <p className="mt-3 text-xs text-muted">Tip: run “Refresh competition metadata” first so each competition knows its current season.</p>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-white">Pipeline steps</h2>
          <div className="mt-4 space-y-2">
            {[
              ["meta", "Refresh competition metadata", "Logos, flags and current season (1 call)."],
              ["window", "Sync fixtures & results", "Rolling window around today (1 call per day)."],
              ["settle", "Grade finished matches", "Marks published tips as won/lost."],
              ["predict", "Regenerate predictions", "Refits the model and predicts upcoming fixtures."],
              ["daily", "Run full daily pipeline", "Sync → grade → predict. Same as the cron."],
            ].map(([kind, label, desc]) => (
              <form key={kind} action={runJobAction} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div><div className="text-sm font-semibold text-white">{label}</div><div className="text-xs text-muted">{desc}</div></div>
                <input type="hidden" name="kind" value={kind} /><input type="hidden" name="return" value="/admin/jobs" />
                <button className={`btn ${kind === "daily" ? "btn-primary" : "btn-ghost"} shrink-0`}>Run</button>
              </form>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 text-sm text-muted">
        <h2 className="mb-2 font-bold text-white">Automation</h2>
        Vercel Cron calls <code className="text-slate-200">/api/cron</code> daily (see <code>vercel.json</code>). For more frequent updates point any scheduler
        (e.g. cron-job.org) at <code className="text-slate-200">/api/cron?secret=CRON_SECRET</code> every few hours.
        {!process.env.CRON_SECRET && <span className="text-loss"> CRON_SECRET is not set, so the cron endpoint is disabled.</span>}
      </div>

      <div className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-bold text-white">Job log</h2>
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}
