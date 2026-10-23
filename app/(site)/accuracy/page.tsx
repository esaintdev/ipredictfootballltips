import type { Metadata } from "next";
import offline from "@/data/offline-backtest.json";
import { q } from "@/lib/db";
import { trackRecord, type RecordStats } from "@/lib/queries";
import { BacktestView } from "@/components/BacktestView";
import { Stat, pct } from "@/components/ui";
import type { BacktestReport } from "@/lib/model/backtest";

export const metadata: Metadata = { title: "Prediction Accuracy & Backtests" };

export default async function AccuracyPage() {
  const [all, last30] = await Promise.all([trackRecord(), trackRecord(30)]);
  const latest = await q<{ id: number; label: string; report: BacktestReport; finished_at: string }>(
    "SELECT id, label, report, finished_at FROM backtests WHERE status = 'done' AND is_public ORDER BY finished_at DESC LIMIT 1",
  );
  const off = offline as { generatedAt: string; tunedOn: string; report: BacktestReport };
  const bt = latest[0]?.report ?? off.report;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-black text-white">Accuracy & track record</h1>
        <p className="mt-1 max-w-3xl text-muted">
          We publish both our live, graded record and an out-of-sample backtest. In the backtest the model is refitted every week using
          only matches played <i>before</i> that week, exactly as it works live, so there&apos;s no hindsight.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">Live track record</h2>
        {all.overall.n === 0 ? (
          <div className="card p-6 text-sm text-muted">Live grading starts as soon as the first published predictions are played.</div>
        ) : (
          <div className="space-y-4">
            <RecordRow title="All time" r={all.overall} />
            <RecordRow title="Last 30 days" r={last30.overall} />
            {all.featured.n > 0 && <RecordRow title="Top tips (featured)" r={all.featured} />}
            <div className="card overflow-x-auto p-5">
              <table className="table min-w-[560px]">
                <thead><tr><th>Competition</th><th>Tips</th><th>1X2</th><th>O/U 2.5</th><th>BTTS</th><th>Correct score</th></tr></thead>
                <tbody>
                  {all.byComp.map((c) => (
                    <tr key={c.slug}>
                      <td className="font-semibold text-white">{c.name}</td><td>{c.n}</td>
                      <td className="font-semibold text-brand">{pct(c.w1x2 / c.n, 1)}</td><td>{pct(c.wou / c.n, 1)}</td>
                      <td>{pct(c.wbtts / c.n, 1)}</td><td>{pct(c.wscore / c.n, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold text-white">Backtest: recent seasons</h2>
        <p className="mb-4 text-sm text-muted">
          {latest[0]
            ? `${latest[0].label} · run ${new Date(latest[0].finished_at).toUTCString()}`
            : `Parameters tuned on ${off.tunedOn}, then tested out-of-sample on 2024-25 and 2025-26 results (source: ${(offline as { source: string }).source}).`}
        </p>
        <BacktestView report={bt} />
      </section>
    </div>
  );
}

function RecordRow({ title, r }: { title: string; r: RecordStats }) {
  return (
    <div>
      <div className="label">{title} · {r.n} graded tips</div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Match winner" value={pct(r.n ? r.w1x2 / r.n : 0, 1)} sub={`${r.w1x2} won`} />
        <Stat label="Over/Under 2.5" value={pct(r.n ? r.wou / r.n : 0, 1)} sub={`${r.wou} won`} />
        <Stat label="BTTS" value={pct(r.n ? r.wbtts / r.n : 0, 1)} sub={`${r.wbtts} won`} />
        <Stat label="Correct score" value={pct(r.n ? r.wscore / r.n : 0, 1)} sub={`${r.wscore} won`} />
      </div>
    </div>
  );
}
