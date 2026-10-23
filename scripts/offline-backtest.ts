/**
 * Offline backtest on public openfootball data (no API key needed).
 *
 *   npm run backtest:offline
 *
 * 1. Downloads 2022-23 … 2025-26 results for the leagues openfootball covers.
 * 2. Tunes model parameters on 2023-24 (walk-forward, 2022-23 as warm-up).
 * 3. Reports out-of-sample accuracy on 2024-25 and 2025-26 (to date) with the
 *    chosen parameters. Writes data/offline-backtest.json for the website.
 */
import fs from "node:fs";
import path from "node:path";
import { runBacktest, type BtMatch } from "../lib/model/backtest";
import { DEFAULT_PARAMS, type ModelParams } from "../lib/model/ratings";

const SEASONS = ["2022-23", "2023-24", "2024-25", "2025-26"];
const FILES: Record<string, string> = {
  "en.1": "Premier League",
  "es.1": "La Liga",
  "de.1": "Bundesliga",
  "it.1": "Serie A",
  "fr.1": "Ligue 1",
  "nl.1": "Eredivisie",
  "pt.1": "Primeira Liga",
  "en.2": "Championship",
  "sco.1": "Scottish Premiership",
  "tr.1": "Süper Lig",
  "be.1": "Belgian Pro League",
  "uefa.cl": "Champions League",
};
const CACHE = path.join(process.cwd(), ".data", "openfootball");

async function load(season: string, file: string): Promise<unknown | null> {
  const local = path.join(CACHE, season, `${file}.json`);
  if (fs.existsSync(local)) return JSON.parse(fs.readFileSync(local, "utf8"));
  const res = await fetch(`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${file}.json`);
  if (!res.ok) return null;
  const json = await res.json();
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, JSON.stringify(json));
  return json;
}

const clean = (n: string) => n.replace(/\s*\([A-Z]{3}\)\s*$/, "").trim();

async function main() {
  const matches: BtMatch[] = [];
  for (const season of SEASONS) {
    for (const [file, name] of Object.entries(FILES)) {
      const data = (await load(season, file)) as { matches?: Record<string, unknown>[] } | null;
      if (!data?.matches) continue;
      let n = 0;
      for (const m of data.matches) {
        const sc = m.score as { ft?: number[] } | number[] | undefined;
        const ft = Array.isArray(sc) ? sc : sc?.ft;
        if (!ft || ft.length < 2 || typeof m.date !== "string") continue;
        matches.push({
          date: Date.parse(`${m.date}T${(m.time as string) ?? "15:00"}:00Z`),
          home: clean(m.team1 as string),
          away: clean(m.team2 as string),
          hg: ft[0], ag: ft[1],
          // CL final is at a neutral venue
          neutral: file === "uefa.cl" && /final/i.test(String(m.round ?? "")) && !/semi|quarter|1\/8/i.test(String(m.round)),
          group: name,
          season,
        });
        n++;
      }
      console.log(`${season} ${name}: ${n} matches`);
    }
  }
  console.log(`Total ${matches.length} matches\n`);

  const d = (s: string) => Date.parse(s);
  // --- tune on 2023-24 ---------------------------------------------------
  const grid: Partial<ModelParams>[] = [];
  for (const halfLifeDays of [120, 180, 240, 365]) for (const shrinkage of [2, 4, 8]) grid.push({ halfLifeDays, shrinkage });
  let best: { p: ModelParams; ll: number } | null = null;
  for (const g of grid) {
    const p = { ...DEFAULT_PARAMS, ...g };
    const r = runBacktest(matches, { testFrom: d("2023-08-01"), testTo: d("2024-07-01"), params: p, requireKnownTeams: false });
    console.log(`tune hl=${p.halfLifeDays} k=${p.shrinkage}  logloss=${r.overall.logLoss.toFixed(4)} acc=${pct(r.overall.acc1x2)}`);
    if (!best || r.overall.logLoss < best.ll) best = { p, ll: r.overall.logLoss };
  }
  console.log(`\nChosen params: halfLife=${best!.p.halfLifeDays}d shrinkage=${best!.p.shrinkage}\n`);

  // --- out-of-sample report ---------------------------------------------
  const report = runBacktest(matches, { testFrom: d("2024-07-01"), testTo: Date.now(), params: best!.p });
  const o = report.overall;
  console.log(`OUT-OF-SAMPLE (2024-25 + 2025-26 to date): n=${o.n}`);
  console.log(`  1X2 accuracy   ${pct(o.acc1x2)}  (always-home baseline ${pct(o.baselineHome)})`);
  console.log(`  log loss       ${o.logLoss.toFixed(4)}   brier ${o.brier.toFixed(4)}`);
  console.log(`  O/U 1.5 ${pct(o.accOu15)}   O/U 2.5 ${pct(o.accOu25)}   O/U 3.5 ${pct(o.accOu35)}   BTTS ${pct(o.accBtts)}`);
  console.log(`  Correct score ${pct(o.accScore)}   (in top-3: ${pct(o.accScoreTop3)})`);
  console.log(`\n  1X2 by confidence:`);
  for (const b of report.confidence1x2) console.log(`    p>=${b.minProb}  n=${b.n}  acc=${pct(b.accuracy)}  coverage=${pct(b.coverage)}`);
  console.log(`  O/U 2.5 by confidence:`);
  for (const b of report.confidenceOu25) console.log(`    p>=${b.minProb}  n=${b.n}  acc=${pct(b.accuracy)}  coverage=${pct(b.coverage)}`);
  console.log(`\n  By competition:`);
  for (const [g, m] of Object.entries(report.byGroup).sort((a, b) => b[1].n - a[1].n))
    console.log(`    ${g.padEnd(22)} n=${String(m.n).padStart(4)}  1X2 ${pct(m.acc1x2)}  O/U2.5 ${pct(m.accOu25)}  CS ${pct(m.accScore)}  BTTS ${pct(m.accBtts)}`);
  console.log(`\n  By season:`);
  for (const [s, m] of Object.entries(report.bySeason)) console.log(`    ${s}  n=${m.n}  1X2 ${pct(m.acc1x2)}  O/U2.5 ${pct(m.accOu25)}  CS ${pct(m.accScore)}`);

  const out = path.join(process.cwd(), "data", "offline-backtest.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), source: "openfootball/football.json", tunedOn: "2023-24", report }, null, 2));
  console.log(`\nSaved ${out}`);
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

main().catch((e) => { console.error(e); process.exit(1); });
