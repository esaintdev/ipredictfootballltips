import Link from "next/link";
import { q } from "@/lib/db";
import { modelParams } from "@/lib/settings";
import type { BacktestReport } from "@/lib/model/backtest";
import { runBacktestAction } from "../../actions";
import { Flash } from "@/components/Flash";
import { LocalTime, pct } from "@/components/ui";

export default async function BacktestsAdmin({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const [list, comps, params, range] = await Promise.all([
    q<{ id: number; label: string; status: string; is_public: boolean; report: BacktestReport | null; error: string | null; created_at: string }>(
      "SELECT id, label, status, is_public, report, error, created_at FROM backtests ORDER BY created_at DESC LIMIT 50"),
    q<{ id: number; name: string; finished: number }>(`SELECT c.id, c.name, COUNT(f.id) FILTER (WHERE f.status IN ('FT','AET','PEN'))::int AS finished
      FROM competitions c LEFT JOIN fixtures f ON f.competition_id=c.id WHERE c.enabled GROUP BY c.id ORDER BY c.priority`),
    modelParams(),
    q<{ min: string | null; max: string | null }>("SELECT MIN(kickoff)::date::text AS min, MAX(kickoff) FILTER (WHERE status IN ('FT','AET','PEN'))::date::text AS max FROM fixtures"),
  ]);
  const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Backtests</h1>
        <p className="text-sm text-muted">
          Walk-forward test over stored results: the model is refitted every step using only earlier matches, then predicts the next window.
          {range[0]?.min && <> Data available: {range[0].min} → {range[0].max ?? "–"}.</>}
        </p>
      </div>
      <Flash msg={sp.msg} error={sp.error} />

      <form action={runBacktestAction} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2"><label className="label">Label</label><input name="label" className="input" placeholder="e.g. 2025-26 all competitions" /></div>
        <div><label className="label">Test from</label><input type="date" name="from" defaultValue={yearAgo} className="input" required /></div>
        <div><label className="label">Test to</label><input type="date" name="to" defaultValue={today} className="input" required /></div>
        <div><label className="label">Half-life (days)</label><input type="number" name="halfLifeDays" defaultValue={params.halfLifeDays} className="input" /></div>
        <div><label className="label">Shrinkage</label><input type="number" step="0.5" name="shrinkage" defaultValue={params.shrinkage} className="input" /></div>
        <div><label className="label">Max history (days)</label><input type="number" name="maxAgeDays" defaultValue={params.maxAgeDays} className="input" /></div>
        <div><label className="label">Refit every (days)</label><input type="number" name="stepDays" defaultValue={7} className="input" /></div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label">Competitions to score (none selected = all)</label>
          <div className="flex flex-wrap gap-2">
            {comps.map((c) => (
              <label key={c.id} className="chip cursor-pointer gap-2">
                <input type="checkbox" name="competition_ids" value={c.id} />{c.name} <span className="text-muted">({c.finished})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4"><button className="btn btn-primary">Run backtest</button></div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table min-w-[800px]">
          <thead><tr><th>Run</th><th>Status</th><th>Matches</th><th>1X2</th><th>O/U 2.5</th><th>Correct score</th><th>Log loss</th><th>Public</th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/admin/backtests/${b.id}`} className="font-semibold text-white hover:text-brand">{b.label}</Link><div className="text-xs text-muted"><LocalTime iso={b.created_at} mode="datetime" /></div></td>
                <td><span className={`chip ${b.status === "done" ? "chip-active" : b.status === "error" ? "border-loss text-loss" : "border-gold text-gold"}`}>{b.status}</span></td>
                <td>{b.report?.overall.n ?? "–"}</td>
                <td className="font-semibold text-brand">{b.report ? pct(b.report.overall.acc1x2, 1) : "–"}</td>
                <td>{b.report ? pct(b.report.overall.accOu25, 1) : "–"}</td>
                <td>{b.report ? pct(b.report.overall.accScore, 1) : "–"}</td>
                <td className="text-muted">{b.report ? b.report.overall.logLoss.toFixed(3) : b.error?.slice(0, 40) ?? "–"}</td>
                <td>{b.is_public ? "✓" : ""}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="p-6 text-center text-muted">No backtests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
