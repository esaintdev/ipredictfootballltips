import { q, q1 } from "../db";
import { runBacktest, type BacktestReport } from "../model/backtest";
import type { ModelParams } from "../model/ratings";
import { loadHistory } from "./predict";

export interface BacktestScope {
  from: string; // YYYY-MM-DD
  to: string;
  competitionIds: number[]; // empty = all
  stepDays: number;
}

export async function createBacktest(label: string, params: ModelParams, scope: BacktestScope) {
  const row = await q1<{ id: number }>(
    "INSERT INTO backtests(label, params, scope) VALUES ($1,$2,$3) RETURNING id",
    [label, JSON.stringify(params), JSON.stringify(scope)],
  );
  return row!.id;
}

/** Runs a walk-forward backtest over the fixtures stored in the database. */
export async function executeBacktest(id: number) {
  const bt = await q1<{ params: ModelParams; scope: BacktestScope }>("SELECT params, scope FROM backtests WHERE id=$1", [id]);
  if (!bt) return;
  try {
    const from = Date.parse(bt.scope.from), to = Date.parse(bt.scope.to);
    // Fit on everything (cross-competition links help), score only the selected scope.
    const history = (await loadHistory(bt.params.maxAgeDays + Math.ceil((Date.now() - from) / 86_400_000)))
      .map((m) => ({ ...m, group: m.competition, season: String(m.season) }));
    const ids = new Set(bt.scope.competitionIds);
    const report: BacktestReport = runBacktest(history, {
      testFrom: from,
      testTo: to,
      stepDays: bt.scope.stepDays,
      params: bt.params,
      testFilter: ids.size ? (m) => ids.has((m as unknown as { competitionId: number }).competitionId) : undefined,
    });
    if (!report.overall.n) throw new Error("No finished matches in the selected window. Import history for these competitions first.");
    await q("UPDATE backtests SET status='done', report=$2, finished_at=NOW() WHERE id=$1", [id, JSON.stringify(report)]);
  } catch (e) {
    await q("UPDATE backtests SET status='error', error=$2, finished_at=NOW() WHERE id=$1", [id, (e as Error).message]);
  }
}
