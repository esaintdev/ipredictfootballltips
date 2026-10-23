import type { BacktestReport, MetricBlock } from "@/lib/model/backtest";
import { Meter, Stat, pct } from "./ui";

export function BacktestView({ report }: { report: BacktestReport }) {
  const o = report.overall;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Matches tested" value={o.n.toLocaleString()} sub={`${report.testFrom.slice(0, 10)} → ${report.testTo.slice(0, 10)}`} />
        <Stat label="Match winner (1X2)" value={pct(o.acc1x2, 1)} sub={`Always-home baseline ${pct(o.baselineHome, 1)}`} />
        <Stat label="Over/Under 2.5" value={pct(o.accOu25, 1)} sub={`O/U 1.5 ${pct(o.accOu15, 1)} · 3.5 ${pct(o.accOu35, 1)}`} />
        <Stat label="Correct score" value={pct(o.accScore, 1)} sub={`Actual score in top 3: ${pct(o.accScoreTop3, 1)}`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="BTTS" value={pct(o.accBtts, 1)} />
        <Stat label="Log loss (1X2)" value={o.logLoss.toFixed(3)} sub="Lower is better · uniform guess = 1.099" />
        <Stat label="Brier score (1X2)" value={o.brier.toFixed(3)} sub="Lower is better · uniform guess = 0.667" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-bold text-white">Match-winner accuracy by confidence</h3>
          <p className="mb-4 text-xs text-muted">Higher-confidence tips win more often – the model knows when it knows.</p>
          <ConfidenceTable rows={report.confidence1x2} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-white">Over/Under 2.5 accuracy by confidence</h3>
          <p className="mb-4 text-xs text-muted">Share of matches covered and hit rate above each probability threshold.</p>
          <ConfidenceTable rows={report.confidenceOu25} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-white">Calibration</h3>
        <p className="mb-4 text-xs text-muted">When the model says 60%, does it happen ~60% of the time? Bars show predicted vs observed frequency for every 1X2 outcome.</p>
        <div className="space-y-2">
          {report.calibration.map((b) => (
            <div key={b.from} className="grid grid-cols-[5rem_1fr_6rem] items-center gap-3 text-xs">
              <span className="text-muted">{pct(b.from)}–{pct(b.to)}</span>
              <div className="space-y-1">
                <Meter value={b.predicted} color="bg-slate-500" />
                <Meter value={b.observed} />
              </div>
              <span className="text-right text-slate-300">{pct(b.observed, 1)} <span className="text-muted">n={b.n}</span></span>
            </div>
          ))}
          <div className="flex gap-4 pt-2 text-[11px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-slate-500" /> predicted</span>
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-brand" /> observed</span>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-5">
        <h3 className="mb-3 font-bold text-white">By competition</h3>
        <MetricTable rows={Object.entries(report.byGroup).sort((a, b) => b[1].n - a[1].n)} />
      </div>
      {Object.keys(report.bySeason).length > 0 && (
        <div className="card overflow-x-auto p-5">
          <h3 className="mb-3 font-bold text-white">By season</h3>
          <MetricTable rows={Object.entries(report.bySeason)} />
        </div>
      )}
    </div>
  );
}

function ConfidenceTable({ rows }: { rows: BacktestReport["confidence1x2"] }) {
  return (
    <table className="table">
      <thead><tr><th>Probability ≥</th><th>Tips</th><th>Coverage</th><th>Hit rate</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.minProb}>
            <td className="font-semibold">{pct(r.minProb)}</td>
            <td>{r.n.toLocaleString()}</td>
            <td className="text-muted">{pct(r.coverage, 1)}</td>
            <td><span className="font-bold text-brand">{pct(r.accuracy, 1)}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetricTable({ rows }: { rows: [string, MetricBlock][] }) {
  return (
    <table className="table min-w-[640px]">
      <thead><tr><th>Name</th><th>Matches</th><th>1X2</th><th>O/U 2.5</th><th>BTTS</th><th>Correct score</th><th>Log loss</th></tr></thead>
      <tbody>
        {rows.map(([k, m]) => (
          <tr key={k}>
            <td className="font-semibold text-white">{k}</td>
            <td>{m.n}</td>
            <td className="font-semibold text-brand">{pct(m.acc1x2, 1)}</td>
            <td>{pct(m.accOu25, 1)}</td>
            <td>{pct(m.accBtts, 1)}</td>
            <td>{pct(m.accScore, 1)}</td>
            <td className="text-muted">{m.logLoss.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
