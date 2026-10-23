// Walk-forward backtest: the model is refitted every `stepDays` using only
// matches played before that point, then predicts the next window. No leakage.

import { makePicks, outcomeOf } from "./picks";
import { fitModel, knows, predictMatch, type HistMatch, type ModelParams, DEFAULT_PARAMS } from "./ratings";

export interface BtMatch extends HistMatch {
  group: string; // competition label used for per-competition breakdown
  season?: string;
}

export interface BacktestOptions {
  testFrom: number;
  testTo: number;
  stepDays?: number;
  params?: ModelParams;
  /** Skip predictions where a team has no history (warm-up gaps). */
  requireKnownTeams?: boolean;
  /** Only score these matches (the full set is still used for fitting). */
  testFilter?: (m: BtMatch) => boolean;
  onProgress?: (done: number, total: number) => void;
}

export interface MetricBlock {
  n: number;
  acc1x2: number;
  logLoss: number;
  brier: number;
  accOu25: number;
  accOu15: number;
  accOu35: number;
  accBtts: number;
  accScore: number;
  /** share of matches where the actual score was in the model's top-3 */
  accScoreTop3: number;
  baselineHome: number;
  avgGoals: number;
  predAvgGoals: number;
}

export interface ConfidenceBucket {
  minProb: number;
  n: number;
  coverage: number;
  accuracy: number;
}

export interface CalibrationBin {
  from: number;
  to: number;
  n: number;
  predicted: number;
  observed: number;
}

export interface BacktestReport {
  overall: MetricBlock;
  byGroup: Record<string, MetricBlock>;
  bySeason: Record<string, MetricBlock>;
  confidence1x2: ConfidenceBucket[];
  confidenceOu25: ConfidenceBucket[];
  calibration: CalibrationBin[];
  outcomeMix: { predicted: Record<string, number>; actual: Record<string, number> };
  params: ModelParams;
  testFrom: string;
  testTo: string;
}

interface Row {
  group: string;
  season: string;
  pH: number; pD: number; pA: number;
  pO15: number; pO25: number; pO35: number; pBtts: number;
  pick: string; actual: string;
  top3: string[]; score: string;
  hg: number; ag: number; expTotal: number;
}

const DAY = 86_400_000;

export function runBacktest(matches: BtMatch[], opts: BacktestOptions): BacktestReport {
  const params = opts.params ?? DEFAULT_PARAMS;
  const step = (opts.stepDays ?? 7) * DAY;
  const sorted = [...matches].sort((a, b) => a.date - b.date);
  const test = sorted.filter((m) => m.date >= opts.testFrom && m.date < opts.testTo && (!opts.testFilter || opts.testFilter(m)));
  const rows: Row[] = [];
  const windows = Math.max(1, Math.ceil((opts.testTo - opts.testFrom) / step));

  for (let w = 0, t = opts.testFrom; t < opts.testTo; t += step, w++) {
    const batch = test.filter((m) => m.date >= t && m.date < t + step);
    opts.onProgress?.(w, windows);
    if (!batch.length) continue;
    const model = fitModel(sorted, t, params);
    for (const m of batch) {
      if (opts.requireKnownTeams && (!knows(model, m.home) || !knows(model, m.away))) continue;
      const mk = predictMatch(model, m.home, m.away, m.neutral);
      const p = makePicks(mk);
      rows.push({
        group: m.group,
        season: m.season ?? "",
        pH: mk.home, pD: mk.draw, pA: mk.away,
        pO15: mk.over["1.5"], pO25: mk.over["2.5"], pO35: mk.over["3.5"], pBtts: mk.btts,
        pick: p.pick1x2, actual: outcomeOf(m.hg, m.ag),
        top3: mk.topScores.slice(0, 3).map((s) => s.score), score: `${m.hg}-${m.ag}`,
        hg: m.hg, ag: m.ag, expTotal: mk.expHome + mk.expAway,
      });
    }
  }
  opts.onProgress?.(windows, windows);

  const byGroup: Record<string, MetricBlock> = {};
  const bySeason: Record<string, MetricBlock> = {};
  for (const g of new Set(rows.map((r) => r.group))) byGroup[g] = metrics(rows.filter((r) => r.group === g));
  for (const s of new Set(rows.map((r) => r.season).filter(Boolean))) bySeason[s] = metrics(rows.filter((r) => r.season === s));

  const predicted: Record<string, number> = { "1": 0, X: 0, "2": 0 };
  const actual: Record<string, number> = { "1": 0, X: 0, "2": 0 };
  for (const r of rows) { predicted[r.pick]++; actual[r.actual]++; }

  return {
    overall: metrics(rows),
    byGroup,
    bySeason,
    confidence1x2: buckets(rows.map((r) => [Math.max(r.pH, r.pD, r.pA), r.pick === r.actual]), [0.4, 0.5, 0.6, 0.7, 0.8]),
    confidenceOu25: buckets(rows.map((r) => [Math.max(r.pO25, 1 - r.pO25), (r.pO25 >= 0.5) === (r.hg + r.ag > 2.5)]), [0.5, 0.55, 0.6, 0.65, 0.7]),
    calibration: calibration(rows),
    outcomeMix: { predicted, actual },
    params,
    testFrom: new Date(opts.testFrom).toISOString(),
    testTo: new Date(opts.testTo).toISOString(),
  };
}

function metrics(rows: Row[]): MetricBlock {
  const n = rows.length;
  if (!n) return { n: 0, acc1x2: 0, logLoss: 0, brier: 0, accOu25: 0, accOu15: 0, accOu35: 0, accBtts: 0, accScore: 0, accScoreTop3: 0, baselineHome: 0, avgGoals: 0, predAvgGoals: 0 };
  let c1x2 = 0, ll = 0, br = 0, o15 = 0, o25 = 0, o35 = 0, btts = 0, cs = 0, cs3 = 0, home = 0, goals = 0, pg = 0;
  for (const r of rows) {
    const tot = r.hg + r.ag;
    if (r.pick === r.actual) c1x2++;
    const pAct = r.actual === "1" ? r.pH : r.actual === "X" ? r.pD : r.pA;
    ll += -Math.log(Math.max(pAct, 1e-12));
    br += (r.pH - +(r.actual === "1")) ** 2 + (r.pD - +(r.actual === "X")) ** 2 + (r.pA - +(r.actual === "2")) ** 2;
    if ((r.pO15 >= 0.5) === tot > 1.5) o15++;
    if ((r.pO25 >= 0.5) === tot > 2.5) o25++;
    if ((r.pO35 >= 0.5) === tot > 3.5) o35++;
    if ((r.pBtts >= 0.5) === (r.hg > 0 && r.ag > 0)) btts++;
    if (r.top3[0] === r.score) cs++;
    if (r.top3.includes(r.score)) cs3++;
    if (r.actual === "1") home++;
    goals += tot; pg += r.expTotal;
  }
  return {
    n,
    acc1x2: c1x2 / n,
    logLoss: ll / n,
    brier: br / n,
    accOu25: o25 / n,
    accOu15: o15 / n,
    accOu35: o35 / n,
    accBtts: btts / n,
    accScore: cs / n,
    accScoreTop3: cs3 / n,
    baselineHome: home / n,
    avgGoals: goals / n,
    predAvgGoals: pg / n,
  };
}

function buckets(items: [number, boolean][], thresholds: number[]): ConfidenceBucket[] {
  return thresholds.map((t) => {
    const sel = items.filter(([p]) => p >= t);
    return {
      minProb: t,
      n: sel.length,
      coverage: items.length ? sel.length / items.length : 0,
      accuracy: sel.length ? sel.filter(([, ok]) => ok).length / sel.length : 0,
    };
  });
}

function calibration(rows: Row[]): CalibrationBin[] {
  const bins: CalibrationBin[] = [];
  for (let i = 0; i < 10; i++) bins.push({ from: i / 10, to: (i + 1) / 10, n: 0, predicted: 0, observed: 0 });
  for (const r of rows) {
    for (const [p, hit] of [[r.pH, r.actual === "1"], [r.pD, r.actual === "X"], [r.pA, r.actual === "2"]] as [number, boolean][]) {
      const b = bins[Math.min(9, Math.floor(p * 10))];
      b.n++; b.predicted += p; b.observed += hit ? 1 : 0;
    }
  }
  return bins.filter((b) => b.n > 0).map((b) => ({ ...b, predicted: b.predicted / b.n, observed: b.observed / b.n }));
}
